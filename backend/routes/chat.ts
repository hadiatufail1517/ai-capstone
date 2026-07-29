import { Router, Request, Response } from 'express';
import { getApiKey, MODEL_NAME, BASE_URL, MAX_TOKENS, TEMPERATURE, SYSTEM_PROMPT } from '../lib/aiConfig.js';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { messages } = req.body;

  // Basic validation
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Invalid or empty messages array provided.' });
    return;
  }

  // Filter, validate, and format messages for Google Gemini
  // Gemini's contents API expects roles to be either 'user' or 'model'
  const formattedContents = messages
    .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

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
    // Retrieve the Gemini API Key
    const apiKey = getApiKey();

    // Stream content endpoint from Gemini REST API
    const geminiUrl = `${BASE_URL}/models/${MODEL_NAME}:streamGenerateContent?alt=sse&key=${apiKey}`;

    // Call Gemini API with streaming enabled
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: formattedContents,
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
          temperature: TEMPERATURE,
          maxOutputTokens: MAX_TOKENS
        }
      }),
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
      throw new Error(errorJson?.error?.message || errorJson?.error || `HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream is not supported on Gemini response.');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    // Stream the data chunks to the client
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Append decoded string to buffer
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the final potentially incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine.startsWith('data: ')) continue;
        
        const rawData = cleanLine.substring(6);

        try {
          const parsed = JSON.parse(rawData);
          const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (textChunk) {
            // Stream the text token to the client in standard format
            res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
          }
        } catch (jsonErr) {
          console.error('[Error] Failed to parse Gemini SSE line:', jsonErr, 'Raw line:', cleanLine);
        }
      }
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
      res.status(500).json({ 
        error: err.message || 'An error occurred while communicating with the Gemini service.' 
      });
    } else {
      // If we are already streaming, send the error in SSE format and close connection
      res.write(`data: ${JSON.stringify({ error: err.message || 'An error occurred during streaming.' })}\n\n`);
      res.end();
    }
  }
});

export default router;
