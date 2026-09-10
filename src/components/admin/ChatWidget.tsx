'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, RotateCcw, Copy, Check, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Show platform overview',
  'How many pending vendors?',
  'Car booking stats today',
  'How many active drivers?',
  'Recent inquiry count',
];

export function AdminChatWidget() {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      inputRef.current?.focus();
    }
  }, [messages, open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || data.error || 'Something went wrong.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const markdownComponents = {
    p: ({ children }: any) => <p className="mb-1.5 last:mb-0">{children}</p>,
    strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
    ul: ({ children }: any) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
    li: ({ children }: any) => <li>{children}</li>,
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-1.5">
        <table className="text-xs border-collapse w-full">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-gray-200">{children}</thead>,
    th: ({ children }: any) => <th className="border border-gray-300 px-2 py-1 text-left font-semibold">{children}</th>,
    td: ({ children }: any) => <td className="border border-gray-300 px-2 py-1">{children}</td>,
    code: ({ children }: any) => <code className="bg-gray-200 px-1 rounded text-xs font-mono">{children}</code>,
    h1: ({ children }: any) => <p className="font-bold text-base mb-1">{children}</p>,
    h2: ({ children }: any) => <p className="font-bold mb-1">{children}</p>,
    h3: ({ children }: any) => <p className="font-semibold mb-1">{children}</p>,
  };

  const typingDots = (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );

  if (open && fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">Admin Assistant</span>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">AI</span>
              </div>
              <p className="text-xs text-slate-400">Live queries against your platform database</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 transition"
                title="Clear chat"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <button
              onClick={() => setFullscreen(false)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 transition"
              title="Exit full page"
            >
              <Minimize2 className="w-3.5 h-3.5" /> Minimize
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1.5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 -mt-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-600/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1.5">How can I help you today?</h2>
              <p className="text-sm text-slate-500 mb-8 text-center max-w-sm">
                Ask about bookings, vendors, drivers, revenue, manager performance, payment failures, or system health — I query your live data.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-sm bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:shadow-sm transition text-slate-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-7">
              {messages.map((m, i) => (
                <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    m.role === 'user' ? 'bg-indigo-100' : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                  }`}>
                    {m.role === 'user'
                      ? <User className="w-4 h-4 text-indigo-600" />
                      : <Bot className="w-4 h-4 text-white" />
                    }
                  </div>
                  <div className={`flex flex-col gap-1.5 max-w-[75%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed break-words shadow-sm ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm whitespace-pre-wrap'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
                    }`}>
                      {m.role === 'user' ? m.content : <ReactMarkdown components={markdownComponents}>{m.content}</ReactMarkdown>}
                    </div>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => copyMessage(m.content, i)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 px-1 transition"
                      >
                        {copiedIdx === i
                          ? <><Check className="w-3 h-3 text-green-500" /><span className="text-green-500">Copied</span></>
                          : <><Copy className="w-3 h-3" /><span>Copy</span></>
                        }
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm">{typingDots}</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-6 pb-5 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl shadow-md px-2 py-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your data..."
                className="flex-1 text-sm px-3 py-2 focus:outline-none disabled:opacity-50"
                disabled={loading}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-3.5 py-2.5 transition flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-400 mt-2.5">AI can make mistakes — verify important numbers before acting on them.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[360px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{ maxHeight: '520px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-sm">Admin Assistant</span>
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">AI</span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="hover:bg-white/20 rounded-lg p-1.5 transition"
                  title="Clear chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setFullscreen(true)}
                className="hover:bg-white/20 rounded-lg p-1.5 transition"
                title="Open full page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="hover:bg-white/20 rounded-lg p-1.5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2.5 text-sm text-gray-700 leading-relaxed">
                    Hi! I can query your live platform data — bookings, vendors, drivers, customers, revenue, and more. What would you like to know?
                  </div>
                </div>
                <div className="pl-9 flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    m.role === 'user' ? 'bg-indigo-100' : 'bg-blue-100'
                  }`}>
                    {m.role === 'user'
                      ? <User className="w-4 h-4 text-indigo-600" />
                      : <Bot className="w-4 h-4 text-blue-600" />
                    }
                  </div>
                  <div className="flex flex-col gap-1 max-w-[270px]">
                    <div className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed break-words ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm whitespace-pre-wrap'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}>
                      {m.role === 'user' ? m.content : <ReactMarkdown components={markdownComponents}>{m.content}</ReactMarkdown>}
                    </div>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => copyMessage(m.content, i)}
                        className="self-start flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-1 transition"
                      >
                        {copiedIdx === i
                          ? <><Check className="w-3 h-3 text-green-500" /><span className="text-green-500">Copied</span></>
                          : <><Copy className="w-3 h-3" /><span>Copy</span></>
                        }
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">{typingDots}</div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 flex gap-2 flex-shrink-0 bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your data..."
              className="flex-1 text-sm border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-3 py-2 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-50 w-13 h-13 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ width: '52px', height: '52px' }}
        title="Admin Assistant"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </>
  );
}
