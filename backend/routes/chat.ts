import { Router, Request, Response } from 'express';
import { getApiKey, MODEL_NAME, BASE_URL, MAX_TOKENS, TEMPERATURE, SYSTEM_PROMPT } from '../lib/aiConfig.js';
import { websiteMetadata } from '../src/tools/websiteMetadata.js';

const router = Router();

// Helper to stream Gemini content and detect if it requests a tool call
async function runGeminiStream(
  contents: any[],
  res: Response,
  controller: AbortController
): Promise<{ text: string; functionCall: any | null }> {
  const apiKey = getApiKey();
  const geminiUrl = `${BASE_URL}/models/${MODEL_NAME}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const requestBody = {
    contents,
    tools: [{
      functionDeclarations: [websiteMetadata.geminiDeclaration]
    }],
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    generationConfig: {
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_TOKENS
    }
  };

  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody),
    signal: controller.signal
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    let errorJson;
    try {
      errorJson = JSON.parse(errorText);
    } catch {
      errorJson = null;
    }
    const message = errorJson?.error?.message || errorJson?.error || `HTTP error! Status: ${response.status} - ${errorText}`;
    const err = new Error(message) as any;
    err.status = response.status;
    throw err;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('ReadableStream is not supported on Gemini response.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let accumulatedText = '';
  let detectedFunctionCall: any = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine.startsWith('data: ')) continue;

      const rawData = cleanLine.substring(6);
      if (rawData === '[DONE]') continue;

      try {
        const parsed = JSON.parse(rawData);
        
        if (parsed.error) {
          throw new Error(parsed.error.message || 'Stream error from Gemini API.');
        }

        const candidate = parsed.candidates?.[0];
        if (candidate?.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
          if (candidate.finishReason === 'SAFETY') {
            throw new Error('Response generation blocked due to safety settings.');
          } else if (candidate.finishReason === 'RECITATION') {
            throw new Error('Response generation blocked due to recitation check.');
          } else {
            throw new Error(`Response generation stopped (Reason: ${candidate.finishReason}).`);
          }
        }

        const part = candidate?.content?.parts?.[0];
        if (part) {
          if (part.text) {
            accumulatedText += part.text;
            res.write(`data: ${JSON.stringify({ text: part.text })}\n\n`);
          }
          if (part.functionCall) {
            detectedFunctionCall = part.functionCall;
          }
        }
      } catch (jsonErr: any) {
        if (jsonErr.message && (
          jsonErr.message.includes('safety') || 
          jsonErr.message.includes('stopped') || 
          jsonErr.message.includes('Stream error') || 
          jsonErr.message.includes('recitation')
        )) {
          throw jsonErr;
        }
        console.error('[Error] Failed to parse Gemini SSE line:', jsonErr, 'Raw line:', cleanLine);
      }
    }
  }

  return { text: accumulatedText, functionCall: detectedFunctionCall };
}

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { messages } = req.body;

  // Basic validation
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Invalid or empty messages array provided.' });
    return;
  }

  // Filter, validate, and format messages for Google Gemini
  // We format both text messages and tool calls/responses
  const formattedContents: any[] = [];
  for (const m of messages) {
    if (m.role === 'user') {
      formattedContents.push({
        role: 'user',
        parts: [{ text: m.content }]
      });
    } else if (m.role === 'assistant') {
      const parts: any[] = [];
      if (m.content) {
        parts.push({ text: m.content });
      }
      if (m.toolCalls && m.toolCalls.length > 0) {
        for (const tc of m.toolCalls) {
          parts.push({
            functionCall: {
              name: tc.name,
              args: tc.args
            }
          });
        }
      }

      if (parts.length > 0) {
        formattedContents.push({
          role: 'model',
          parts
        });
      }

      // Appending tool responses immediately following model message
      if (m.toolCalls && m.toolCalls.length > 0) {
        for (const tc of m.toolCalls) {
          if (tc.state === 'output-available') {
            formattedContents.push({
              role: 'user',
              parts: [{
                functionResponse: {
                  name: tc.name,
                  response: { output: tc.output }
                }
              }]
            });
          } else if (tc.state === 'output-error') {
            formattedContents.push({
              role: 'user',
              parts: [{
                functionResponse: {
                  name: tc.name,
                  response: { error: tc.error }
                }
              }]
            });
          }
        }
      }
    }
  }

  if (formattedContents.length === 0 || formattedContents[0].role !== 'user') {
    res.status(400).json({ error: 'Chat history must start with a user message.' });
    return;
  }

  // Configure SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Turn off buffering on Nginx/Vercel proxies

  const controller = new AbortController();

  // Handle client disconnect (aborting the connection via AbortController on client)
  res.on('close', () => {
    if (!res.writableEnded && !controller.signal.aborted) {
      controller.abort();
      console.log('[SSE] Gemini API streaming request aborted due to client disconnect.');
    }
  });

  try {
    let currentContents = [...formattedContents];
    let loopCount = 0;
    const maxLoops = 5; // safety limit to prevent infinite loops

    while (loopCount < maxLoops) {
      loopCount++;
      const { text, functionCall } = await runGeminiStream(currentContents, res, controller);

      if (functionCall) {
        const toolName = functionCall.name;
        const toolArgs = functionCall.args;

        if (toolName === 'websiteMetadata') {
          // 1. Stream input-streaming state
          res.write(`data: ${JSON.stringify({
            toolCall: {
              name: 'websiteMetadata',
              state: 'input-streaming',
              args: {}
            }
          })}\n\n`);

          // 2. Stream input-available state
          res.write(`data: ${JSON.stringify({
            toolCall: {
              name: 'websiteMetadata',
              state: 'input-available',
              args: toolArgs
            }
          })}\n\n`);

          // 3. Execute the tool
          try {
            const result = await websiteMetadata.execute(toolArgs);

            // 4. Stream output-available state
            res.write(`data: ${JSON.stringify({
              toolCall: {
                name: 'websiteMetadata',
                state: 'output-available',
                args: toolArgs,
                output: result
              }
            })}\n\n`);

            // Append model functionCall and functionResponse to feed back to Gemini
            currentContents.push({
              role: 'model',
              parts: [{ functionCall }]
            });
            currentContents.push({
              role: 'user',
              parts: [{
                functionResponse: {
                  name: 'websiteMetadata',
                  response: { output: result }
                }
              }]
            });

            // Loop again so Gemini continues generating based on the tool result
            continue;
          } catch (err: any) {
            console.error('[Tool Error] Failed to execute tool:', err);

            // Stream output-error state
            res.write(`data: ${JSON.stringify({
              toolCall: {
                name: 'websiteMetadata',
                state: 'output-error',
                args: toolArgs,
                error: err.message || 'An error occurred during tool execution.'
              }
            })}\n\n`);

            // Append model functionCall and functionResponse (with error)
            currentContents.push({
              role: 'model',
              parts: [{ functionCall }]
            });
            currentContents.push({
              role: 'user',
              parts: [{
                functionResponse: {
                  name: 'websiteMetadata',
                  response: { error: err.message }
                }
              }]
            });

            continue;
          }
        }
      }

      // If no tool call was returned, the assistant has generated its final response text
      break;
    }

    // Send closing tag to signal client that streaming is complete
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('[SSE] Gemini stream aborted successfully.');
      if (!res.writableEnded) {
        res.end();
      }
      return;
    }

    console.error('[Error] Error generating stream response:', err);

    // If headers have not been sent yet, send a clean JSON error response
    if (!res.headersSent) {
      const statusCode = err.status === 429 ? 429 : 500;
      const clientMessage = err.status === 429 
        ? "You're sending requests too quickly. Please wait a moment and try again." 
        : (err.message || 'An error occurred while communicating with the Gemini service.');
      
      res.status(statusCode).json({
        error: clientMessage
      });
    } else {
      // If we are already streaming, send the error in SSE format and close connection
      const clientMessage = err.status === 429
        ? "You're sending requests too quickly. Please wait a moment and try again."
        : (err.message || 'An error occurred during streaming.');
      res.write(`data: ${JSON.stringify({ error: clientMessage })}\n\n`);
      res.end();
    }
  }
});

export default router;
