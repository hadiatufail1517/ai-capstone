import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Square, 
  Sparkles, 
  AlertCircle, 
  Bot, 
  Trash2, 
  Clipboard, 
  Check, 
  RefreshCw,
  Plus,
  Menu,
  X,
  Paperclip,
  ArrowDown,
  MessageSquare
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

const CHARACTER_LIMIT = 2000;
const API_URL = import.meta.env.VITE_API_URL || 'https://chatbot-production-fea9.up.railway.app/api/chat';

// Realistic pre-loaded chat histories
const MOCK_CHATS: ChatSession[] = [
  {
    id: 'mock-1',
    title: 'React useMemo vs useCallback',
    messages: [
      {
        id: 'm1-1',
        role: 'user',
        content: 'What is the difference between useMemo and useCallback hooks in React with simple code examples?'
      },
      {
        id: 'm1-2',
        role: 'assistant',
        content: 'Here is the key difference between the two hooks:\n\n- `useMemo` memoizes the **result** of a function calculation.\n- `useCallback` memoizes the **function definition** itself.\n\nBoth hooks are used for optimization to prevent unnecessary re-renders on child components that rely on reference equality.\n\n### 1. useMemo Example\nUse this when you want to avoid expensive calculations on every render:\n```javascript\n// Memoizes the calculated array result\nconst sortedList = useMemo(() => {\n  console.log("Sorting expensive list...");\n  return [...items].sort((a, b) => b.value - a.value);\n}, [items]); // Only re-runs when items change\n```\n\n### 2. useCallback Example\nUse this when passing callbacks to optimized child components to keep the function reference identical:\n```javascript\n// Memoizes the function callback reference\nconst handleToggle = useCallback((id) => {\n  setToggledId(id);\n}, []); // Never recreated because dependency list is empty\n```'
      }
    ]
  },
  {
    id: 'mock-2',
    title: 'Capstone Extension Request',
    messages: [
      {
        id: 'm2-1',
        role: 'user',
        content: 'Write a polite email asking for a capstone project extension.'
      },
      {
        id: 'm2-2',
        role: 'assistant',
        content: 'Subject: Capstone Project Draft Extension Request - [Your Name]\n\nDear Professor [Professor\'s Last Name],\n\nI hope this email finds you well.\n\nI am writing to respectfully request a one-week extension on the draft submission for our capstone project, originally due on [Original Date].\n\nOver the past week, I encountered some unforeseen integration challenges with the API streaming endpoints. While the core features are now functional, I would appreciate the additional time to thoroughly test the SSE connections, optimize the auto-scrolling hook, and polish the user interface to ensure a production-grade submission.\n\nIf granted, I will submit the completed draft by [New Proposed Date]. I would be happy to share my current progress with you in the meantime if you\'d like.\n\nThank you for your time, support, and understanding.\n\nBest regards,\n\n[Your Name]\n[Your Student ID]\n[Capstone Project Title]'
      }
    ]
  },
  {
    id: 'mock-3',
    title: 'Clean Folder Architecture',
    messages: [
      {
        id: 'm3-1',
        role: 'user',
        content: 'Help me design a clean folder structure for a full-stack React and Express app.'
      },
      {
        id: 'm3-2',
        role: 'assistant',
        content: 'Here is a clean and modular folder structure for a full-stack web application. It separates concerns nicely, placing the frontend client and the backend server in their own subdirectories:\n\n```\nproject/\n  ├── backend/                 # Express API Server\n  │   ├── src/                 # TS source files\n  │   │   ├── controllers/     # Route logic controllers\n  │   │   ├── routes/          # Express API route declarations\n  │   │   ├── services/        # Third-party integrations (AI, database)\n  │   │   ├── config/          # Configurations & env loaders\n  │   │   └── server.ts        # Express bootstrapping\n  │   ├── tsconfig.json\n  │   └── package.json\n  │\n  ├── frontend/                # React Vite Frontend\n  │   ├── src/\n  │   │   ├── components/      # Shared reusable UI elements\n  │   │   ├── hooks/           # Custom React hooks\n  │   │   ├── pages/           # Page containers\n  │   │   └── main.tsx         # Frontend mount point\n  │   ├── vite.config.ts\n  │   └── package.json\n  │\n  └── package.json             # Root monorepo script coordinator\n```'
      }
    ]
  }
];

export default function Chat() {
  const [chats, setChats] = useState<ChatSession[]>(() => {
    // Attempt to load from localStorage, else fallback to MOCK_CHATS
    try {
      const saved = localStorage.getItem('capstone_chats');
      return saved ? JSON.parse(saved) : MOCK_CHATS;
    } catch {
      return MOCK_CHATS;
    }
  });

  const [activeChatId, setActiveChatId] = useState<string>(() => {
    return chats.length > 0 ? chats[0].id : 'mock-1';
  });

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const shouldAutoScrollRef = useRef(true);

  // Derive the active chat and messages
  const activeChat = chats.find(c => c.id === activeChatId);
  const currentMessages = activeChat ? activeChat.messages : [];

  // Persist chats to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('capstone_chats', JSON.stringify(chats));
    } catch (e) {
      console.error('Failed to save chats to localStorage', e);
    }
  }, [chats]);

  // Handle auto-scroll to bottom of the chat container
  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (container && shouldAutoScrollRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // User is near bottom if within 150px
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    shouldAutoScrollRef.current = isNearBottom;
    setShowScrollButton(!isNearBottom);
  };

  const forceScrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (container) {
      shouldAutoScrollRef.current = true;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
      setShowScrollButton(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, activeChatId, isThinking]);

  // Adjust textarea size automatically
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  const handleSend = async (textToSend = input) => {
    const trimmedInput = textToSend.trim();
    if (!trimmedInput) return;
    if (trimmedInput.length > CHARACTER_LIMIT) {
      setError(`Message exceeds character limit.`);
      return;
    }
    if (isGenerating) return;

    setError(null);
    setIsGenerating(true);
    setIsThinking(true);
    setInput('');
    shouldAutoScrollRef.current = true;

    // Create unique message IDs
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: trimmedInput,
    };

    // Calculate updated messages list
    const updatedMessages = [...currentMessages, userMessage];

    // If we are sending in a fresh chat or mock chat, add user message
    // Update the chats array
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        // If this was an empty chat, we can rename the title based on first query
        const title = c.title === 'New Chat' || c.messages.length === 0
          ? (trimmedInput.length > 24 ? trimmedInput.substring(0, 24) + '...' : trimmedInput)
          : c.title;

        return {
          ...c,
          title,
          messages: [...c.messages, userMessage, { id: assistantMessageId, role: 'assistant', content: '' }]
        };
      }
      return c;
    }));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        throw new Error('ReadableStream not supported.');
      }

      let buffer = '';
      let hasReceivedFirstToken = false;
      let assistantResponseContent = '';

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
              throw new Error(parsed.error);
            }

            if (parsed.text) {
              if (!hasReceivedFirstToken) {
                setIsThinking(false);
                hasReceivedFirstToken = true;
              }
              assistantResponseContent += parsed.text;

              // Stream update directly into chats state
              setChats(prev => prev.map(c => {
                if (c.id === activeChatId) {
                  return {
                    ...c,
                    messages: c.messages.map(m => {
                      if (m.id === assistantMessageId) {
                        return { ...m, content: assistantResponseContent };
                      }
                      return m;
                    })
                  };
                }
                return c;
              }));
            }
          } catch (jsonErr) {
            console.error('Failed to parse chunk:', jsonErr);
          }
        }
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted.');
      } else {
        console.error('Stream failed:', err);
        setError(err.message || 'A connection error occurred. Please verify your backend server.');
        
        // Tag assistant response with error state
        setChats(prev => prev.map(c => {
          if (c.id === activeChatId) {
            return {
              ...c,
              messages: c.messages.map(m => {
                if (m.id === assistantMessageId) {
                  return {
                    ...m,
                    content: m.content || 'An error occurred during response generation.',
                    isError: true
                  };
                }
                return m;
              })
            };
          }
          return c;
        }));
      }
    } finally {
      setIsGenerating(false);
      setIsThinking(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
    setIsThinking(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    handleStop();
    const newChatId = crypto.randomUUID();
    const newChat: ChatSession = {
      id: newChatId,
      title: 'New Chat',
      messages: []
    };
    
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
    setError(null);
    setInput('');
    if (window.innerWidth < 768) {
      setSidebarOpen(false); // Close sidebar on mobile new chat
    }
  };

  const handleDeleteChat = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      if (idToDelete === activeChatId) {
        handleStop();
      }
      const filtered = chats.filter(c => c.id !== idToDelete);
      setChats(filtered);

      // If we deleted the active chat, select the next available one or create a new one
      if (idToDelete === activeChatId) {
        if (filtered.length > 0) {
          setActiveChatId(filtered[0].id);
        } else {
          const newChatId = crypto.randomUUID();
          setChats([{ id: newChatId, title: 'New Chat', messages: [] }]);
          setActiveChatId(newChatId);
        }
      }
    }
  };

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Custom premium inline Markdown / Code Block parser for realistic ChatGPT display
  const parseMarkdown = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : 'code';
        const code = match ? match[2] : part.slice(3, -3);

        return (
          <div key={index} className="my-3 rounded-lg border border-zinc-800 bg-[#0d0d0d] overflow-hidden font-mono text-[13px] text-zinc-300 shadow-lg">
            {/* Code Block Header */}
            <div className="flex justify-between items-center px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400 font-sans select-none">
              <span>{language || 'code'}</span>
              <button 
                onClick={() => handleCopyToClipboard(code, `code-${index}`)}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
              >
                {copiedId === `code-${index}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-500 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Copy code</span>
                  </>
                )}
              </button>
            </div>
            {/* Code Block Content */}
            <pre className="p-4 overflow-x-auto custom-scrollbar leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Normal text parser supporting headers, lists, and bold text
      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-2.5">
          {lines.map((line, lineIdx) => {
            const cleanLine = line;

            // Render headers
            if (cleanLine.startsWith('### ')) {
              return <h4 key={lineIdx} className="text-base font-bold text-white mt-4 mb-1 tracking-tight">{cleanLine.substring(4)}</h4>;
            }
            if (cleanLine.startsWith('## ')) {
              return <h3 key={lineIdx} className="text-lg font-bold text-white mt-5 mb-1.5 tracking-tight">{cleanLine.substring(3)}</h3>;
            }
            if (cleanLine.startsWith('# ')) {
              return <h2 key={lineIdx} className="text-xl font-extrabold text-white mt-6 mb-2 tracking-tight">{cleanLine.substring(2)}</h2>;
            }

            // Render bullet points
            if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
              return (
                <ul key={lineIdx} className="list-disc pl-6 space-y-1 text-zinc-300">
                  <li>{parseInlineFormatting(cleanLine.substring(2))}</li>
                </ul>
              );
            }

            // Render numbered list items
            if (/^\d+\.\s/.test(cleanLine)) {
              const dotIdx = cleanLine.indexOf('.');
              return (
                <ol key={lineIdx} className="list-decimal pl-6 space-y-1 text-zinc-300">
                  <li>{parseInlineFormatting(cleanLine.substring(dotIdx + 2))}</li>
                </ol>
              );
            }

            // Handle empty spacing lines
            if (!cleanLine.trim()) {
              return <div key={lineIdx} className="h-2" />;
            }

            // Standard paragraph
            return <p key={lineIdx} className="text-zinc-300 leading-relaxed">{parseInlineFormatting(cleanLine)}</p>;
          })}
        </div>
      );
    });
  };

  // Helper parser for bold **text** and inline `code`
  const parseInlineFormatting = (text: string) => {
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith('**') && bPart.endsWith('**')) {
        return <strong key={bIdx} className="font-semibold text-white">{bPart.slice(2, -2)}</strong>;
      }
      
      const codeParts = bPart.split(/(`.*?`)/g);
      return codeParts.map((cPart, cIdx) => {
        if (cPart.startsWith('`') && cPart.endsWith('`')) {
          return (
            <code key={cIdx} className="px-1.5 py-0.5 rounded bg-zinc-800 font-mono text-[12.5px] text-zinc-200 border border-zinc-700/40">
              {cPart.slice(1, -1)}
            </code>
          );
        }
        return cPart;
      });
    });
  };

  return (
    <div className="flex h-full w-full bg-[#212121] text-zinc-200 font-sans overflow-hidden">
      
      {/* Sidebar - Collapsible chat history list */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0'
        } shrink-0 bg-[#171717] h-full border-r border-zinc-800/40 flex flex-col transition-all duration-300 overflow-hidden z-20 absolute md:relative`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 flex items-center justify-between border-b border-zinc-800/30">
          <button 
            onClick={handleNewChat}
            className="flex-1 flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white rounded-lg text-sm font-medium transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>New chat</span>
          </button>
          
          {/* Close Sidebar Button (Mobile/Tablet View) */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 ml-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 md:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* History Chat List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar select-none">
          <div className="text-[10px] text-zinc-500 font-semibold px-2 uppercase tracking-wider mb-2">Recent Chats</div>
          
          {chats.map((session) => {
            const isActive = session.id === activeChatId;
            return (
              <button
                key={session.id}
                onClick={() => {
                  setActiveChatId(session.id);
                  setError(null);
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false); // Auto-close sidebar on mobile item tap
                  }
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-all group cursor-pointer ${
                  isActive 
                    ? 'bg-zinc-800/80 text-white font-medium shadow-inner' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                  <span className="truncate pr-1">{session.title}</span>
                </div>
                
                {/* Delete history button */}
                <button
                  onClick={(e) => handleDeleteChat(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer User Section */}
        <div className="p-3 bg-zinc-950/20 border-t border-zinc-800/30 flex items-center justify-between gap-3 shrink-0 select-none">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-xs shrink-0">
              U
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">Capstone Developer</p>
              <p className="text-[10px] text-zinc-500 truncate">v1.2.0 (Gemini API)</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#212121]">
        
        {/* Header Ribbon */}
        <header className="flex items-center justify-between px-4 py-3 bg-[#212121] border-b border-zinc-800/50 shadow-sm shrink-0 z-10 select-none">
          <div className="flex items-center gap-2">
            {/* Sidebar toggle */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 cursor-pointer transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 ml-1">
              <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
              <span className="font-semibold text-sm tracking-tight text-white">Capstone Chat AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">Gemini 3.5 Flash</span>
            </div>
          </div>
          
          <button 
            onClick={handleNewChat}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 font-medium transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            New Chat
          </button>
        </header>

        {/* Scrollable Conversation Workspace */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 custom-scrollbar bg-[#212121]"
        >
          {currentMessages.length === 0 ? (
            /* Elegant Empty State */
            <div className="flex flex-col items-center justify-center max-w-xl mx-auto h-full text-center space-y-8 py-12">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/60 shadow-xl flex items-center justify-center ring-4 ring-blue-500/5 select-none">
                <Bot className="w-10 h-10 text-blue-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">What can I help you build?</h2>
                <p className="text-zinc-400 mt-2 text-sm max-w-md mx-auto leading-relaxed">
                  Start a new query or continue a previous conversation from the history sidebar on the left.
                </p>
              </div>
              
              {/* Starter Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl text-left select-none">
                {MOCK_CHATS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.messages[0].content)}
                    className="p-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 transition-all text-left flex flex-col group cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <span className="font-medium text-sm text-blue-400 group-hover:text-blue-300 flex items-center gap-1.5">
                      {item.title} 
                      <Send className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="text-xs text-zinc-500 mt-1 line-clamp-1">{item.messages[0].content}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversational Flow */
            <div className="max-w-[760px] mx-auto space-y-6">
              {currentMessages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div 
                    key={message.id} 
                    className={`flex gap-4 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Bot Profile Avatar (Left aligned) */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500 shadow-md shrink-0 select-none">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    {/* Text block container */}
                    <div className={`relative group max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start flex-1'}`}>
                      {isUser ? (
                        /* User message pill (Cobalt Gray background) */
                        <div className="px-5 py-2.5 rounded-3xl bg-[#2f2f2f] text-white text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
                          {message.content}
                        </div>
                      ) : (
                        /* Assistant Markdown Text Block */
                        <div className={`w-full text-zinc-200 text-sm space-y-2 leading-relaxed ${
                          message.isError 
                            ? 'px-4 py-3 rounded-2xl bg-red-950/20 text-red-200 border border-red-900/40' 
                            : ''
                        } ${
                          isGenerating && currentMessages[currentMessages.length - 1].id === message.id 
                            ? 'streaming-cursor' 
                            : ''
                        }`}>
                          {parseMarkdown(message.content)}
                        </div>
                      )}

                      {/* Assistant Bubble Actions */}
                      {!isUser && message.content && (
                        <div className="flex items-center gap-3 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                          <button
                            onClick={() => handleCopyToClipboard(message.content, message.id)}
                            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                            title="Copy reply"
                          >
                            {copiedId === message.id ? (
                              <>
                                <Check className="w-3 h-3 text-green-500" />
                                <span className="text-green-500 font-medium font-sans">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Clipboard className="w-3 h-3" />
                                <span className="font-sans">Copy reply</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* User profile avatar (Right aligned) */}
                    {isUser && (
                      <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-md shrink-0 font-semibold text-xs select-none">
                        U
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Gemini Server-Sent Event (SSE) Thinking state */}
              {isThinking && (
                <div className="flex gap-4 items-start justify-start">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500 shadow-md shrink-0 select-none">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 shadow-sm text-sm py-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    <span className="font-sans select-none">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating action button to snap scroll container to bottom */}
        {showScrollButton && (
          <button 
            onClick={forceScrollToBottom}
            className="absolute bottom-28 right-6 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white shadow-xl hover:scale-105 active:scale-95 transition-all animate-bounce cursor-pointer z-10"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* Floating System-Level Error Notifications */}
        {error && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 max-w-md w-full px-4 z-20 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950 text-red-200 border border-red-900 shadow-lg text-sm">
              <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold font-sans">Connection Error</p>
                <p className="text-xs text-red-300/90 mt-0.5 font-sans">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)} 
                className="text-red-400 hover:text-red-200 text-xs font-semibold cursor-pointer font-sans"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Bottom Form Text Entry Area */}
        <footer className="p-4 bg-[#212121] border-t border-zinc-800/40 shadow-lg shrink-0">
          <div className="max-w-[760px] mx-auto relative">
            
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex flex-col rounded-3xl bg-[#2f2f2f] px-4 py-3 shadow-md focus-within:ring-1 focus-within:ring-zinc-700 transition-all"
            >
              <div className="flex items-start gap-3 w-full">
                
                {/* Non-functional attach clip button (for realistic design aesthetics) */}
                <button
                  type="button"
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 transition-all shrink-0 cursor-pointer"
                  title="Attach file"
                >
                  <Paperclip className="w-4.5 h-4.5" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={isGenerating ? "Gemini is writing..." : "Message Gemini..."}
                  disabled={isGenerating}
                  className="flex-1 bg-transparent border-0 outline-none text-zinc-100 text-sm placeholder-zinc-500 resize-none max-h-[200px] min-h-[24px] focus:ring-0 leading-relaxed font-sans pr-1"
                  rows={1}
                />

                {/* Submit Send / Stop square toggle button */}
                <div className="shrink-0 flex items-center self-end pl-2">
                  {isGenerating ? (
                    <button
                      type="button"
                      onClick={handleStop}
                      className="flex items-center justify-center w-8 h-8 bg-white text-black hover:bg-zinc-200 hover:scale-102 rounded-full transition-all shadow-sm cursor-pointer"
                      title="Stop response"
                    >
                      <Square className="w-3 h-3 fill-current text-black" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim() || input.length > CHARACTER_LIMIT}
                      className="flex items-center justify-center w-8 h-8 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black rounded-full transition-all shadow-md hover:scale-102 active:scale-98 disabled:scale-100 cursor-pointer"
                      title="Send message"
                      aria-label="Send message"
                    >
                      <Send className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>
              </div>
            </form>
            
            {/* Disclaimer & character tracker row */}
            <div className="flex items-center justify-between px-3 mt-2 text-[10px] text-zinc-500 select-none tracking-wide">
              <span>Gemini can make mistakes. Verify important info.</span>
              <div className="font-sans">
                <span className={input.length > CHARACTER_LIMIT ? 'text-red-400 font-bold' : ''}>
                  {input.length}
                </span>
                <span> / {CHARACTER_LIMIT}</span>
              </div>
            </div>
            
          </div>
        </footer>
      </main>
    </div>
  );
}
