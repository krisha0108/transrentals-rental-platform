'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, X, Send, Bot, User, RotateCcw, ArrowUpRight, Languages } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type Language = 'auto' | 'english' | 'hindi' | 'hinglish';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'हिंदी' },
  { value: 'hinglish', label: 'Hinglish' },
];

const SUGGESTIONS = [
  'How do I register?',
  'How do I get verified?',
  'Booking kaise manage karu?',
  'Lead kaise add karu?',
  'How do I add a property?',
];

// Slash-command palette — typing "/" in the input shows this list, filtered
// as the user keeps typing, so frequent questions are one keystroke away
// instead of hunting through the suggestion chips. Each command's displayed
// question (and the one actually sent) follows the currently selected reply
// language — "auto" falls back to the English phrasing.
const COMMANDS: { command: string; question: Record<Language, string> }[] = [
  {
    command: 'register',
    question: { auto: 'How do I register?', english: 'How do I register?', hindi: 'मैं रजिस्टर कैसे करूं?', hinglish: 'Register kaise karu?' },
  },
  {
    command: 'login',
    question: { auto: 'How do I log in?', english: 'How do I log in?', hindi: 'मैं लॉग इन कैसे करूं?', hinglish: 'Login kaise karu?' },
  },
  {
    command: 'verify',
    question: { auto: 'How do I get verified?', english: 'How do I get verified?', hindi: 'मैं वेरिफाई कैसे होऊं?', hinglish: 'Verify kaise hou?' },
  },
  {
    command: 'leads',
    question: { auto: 'How do I manage my leads?', english: 'How do I manage my leads?', hindi: 'मैं अपनी लीड्स कैसे मैनेज करूं?', hinglish: 'Apni leads kaise manage karu?' },
  },
  {
    command: 'addlead',
    question: { auto: 'How do I add a new lead?', english: 'How do I add a new lead?', hindi: 'मैं नई लीड कैसे जोड़ूं?', hinglish: 'Nayi lead kaise add karu?' },
  },
  {
    command: 'followups',
    question: { auto: 'How do I check my follow-ups?', english: 'How do I check my follow-ups?', hindi: 'मैं अपने फॉलो-अप्स कैसे देखूं?', hinglish: 'Apne follow-ups kaise dekhu?' },
  },
  {
    command: 'capturelinks',
    question: { auto: 'How do capture links work?', english: 'How do capture links work?', hindi: 'कैप्चर लिंक्स कैसे काम करते हैं?', hinglish: 'Capture links kaise kaam karte hain?' },
  },
  {
    command: 'bookings',
    question: { auto: 'How do I manage my bookings?', english: 'How do I manage my bookings?', hindi: 'मैं अपनी बुकिंग्स कैसे मैनेज करूं?', hinglish: 'Apni bookings kaise manage karu?' },
  },
  {
    command: 'addbooking',
    question: { auto: 'How do I add a booking manually?', english: 'How do I add a booking manually?', hindi: 'मैं बुकिंग मैन्युअली कैसे जोड़ूं?', hinglish: 'Booking manually kaise add karu?' },
  },
  {
    command: 'payments',
    question: { auto: 'How do I manage payments?', english: 'How do I manage payments?', hindi: 'मैं पेमेंट्स कैसे मैनेज करूं?', hinglish: 'Payments kaise manage karu?' },
  },
  {
    command: 'earnings',
    question: { auto: 'How do I check my earnings?', english: 'How do I check my earnings?', hindi: 'मैं अपनी अर्निंग्स कैसे देखूं?', hinglish: 'Apni earnings kaise dekhu?' },
  },
  {
    command: 'tours',
    question: { auto: 'How do I manage my tours?', english: 'How do I manage my tours?', hindi: 'मैं अपने टूर्स कैसे मैनेज करूं?', hinglish: 'Apne tours kaise manage karu?' },
  },
  {
    command: 'addtour',
    question: { auto: 'How do I add a new tour?', english: 'How do I add a new tour?', hindi: 'मैं नया टूर कैसे जोड़ूं?', hinglish: 'Naya tour kaise add karu?' },
  },
  {
    command: 'properties',
    question: { auto: 'How do I add a property?', english: 'How do I add a property?', hindi: 'मैं प्रॉपर्टी कैसे जोड़ूं?', hinglish: 'Property kaise add karu?' },
  },
  {
    command: 'fleet',
    question: { auto: 'How do I manage my vehicle fleet?', english: 'How do I manage my vehicle fleet?', hindi: 'मैं अपनी व्हीकल फ्लीट कैसे मैनेज करूं?', hinglish: 'Apni vehicle fleet kaise manage karu?' },
  },
  {
    command: 'chats',
    question: { auto: 'How do I talk to customers?', english: 'How do I talk to customers?', hindi: 'मैं कस्टमर्स से बात कैसे करूं?', hinglish: 'Customers se baat kaise karu?' },
  },
  {
    command: 'support',
    question: { auto: 'How do I get more help?', english: 'How do I get more help?', hindi: 'मुझे और मदद कैसे मिलेगी?', hinglish: 'Mujhe aur help kaise milegi?' },
  },
];

const GREETINGS: Record<Language, string> = {
  auto: 'Hi! Ask me how to register, log in, get verified, or manage your leads, bookings, tours and properties — in English, Hindi or Hinglish, jaise bhi aapko comfortable ho.',
  english: 'Hi! Ask me how to register, log in, get verified, or manage your leads, bookings, tours and properties.',
  hindi: 'नमस्ते! मुझसे पूछें कि रजिस्टर कैसे करें, लॉग इन कैसे करें, वेरिफाई कैसे हों, या अपनी लीड्स, बुकिंग्स, टूर्स और प्रॉपर्टीज़ कैसे मैनेज करें।',
  hinglish: 'Hi! Mujhse poochho ki register kaise karein, login kaise karein, verify kaise hon, ya apni leads, bookings, tours aur properties kaise manage karein.',
};

// Floating help assistant for the travel-agent portal — answers "how do I
// register/login/manage bookings/leads/properties/tours" questions. Mounted
// on both the (auth) pages (register/login, no session yet) and the
// (dashboard) layout, so it works whether the agent is logged in or not —
// see TravelAgentLayout.tsx and travel-agent/(auth)/layout.tsx.
export function HelpBotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('auto');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [commandIndex, setCommandIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      inputRef.current?.focus();
    }
  }, [messages, open]);

  const showCommandMenu = input.startsWith('/');
  const filteredCommands = showCommandMenu
    ? COMMANDS.filter((c) => c.command.includes(input.slice(1).trim().toLowerCase()))
    : [];

  useEffect(() => {
    setCommandIndex(0);
  }, [input]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/travel-agent/help-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, language }),
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

  const selectCommand = (index: number) => {
    const cmd = filteredCommands[Math.min(index, filteredCommands.length - 1)];
    if (cmd) send(cmd.question[language]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCommandMenu && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCommandIndex((i) => (i + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCommandIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectCommand(commandIndex);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setInput('');
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 w-[360px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{ maxHeight: '520px' }}
          onClick={() => showLanguageMenu && setShowLanguageMenu(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span className="font-semibold text-sm">Help Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowLanguageMenu((v) => !v); }}
                  className="flex items-center gap-1 hover:bg-white/20 rounded-lg px-1.5 py-1.5 transition text-[11px] font-semibold"
                  title="Reply language"
                >
                  <Languages className="w-3.5 h-3.5" />
                  {LANGUAGES.find((l) => l.value === language)?.label}
                </button>
                {showLanguageMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1 w-32 z-20">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => { setLanguage(l.value); setShowLanguageMenu(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium transition ${
                          language === l.value ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="hover:bg-white/20 rounded-lg p-1.5 transition"
                  title="Clear chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="hover:bg-white/20 rounded-lg p-1.5 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2.5 text-sm text-gray-700 leading-relaxed">
                    {GREETINGS[language]}
                  </div>
                </div>
                <div className="pl-9 flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      m.role === 'user' ? 'bg-teal-100' : 'bg-emerald-100'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <User className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div
                    className={`max-w-[270px] rounded-2xl px-3 py-2.5 text-sm leading-relaxed break-words ${
                      m.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-sm whitespace-pre-wrap'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}
                  >
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li>{children}</li>,
                          code: ({ children }) => <code className="bg-gray-200 px-1 rounded text-xs font-mono">{children}</code>,
                          // Internal page references (e.g. [All Bookings](/travel-agent/bookings))
                          // render as tappable pill buttons that navigate client-side —
                          // this is what makes the bot's "go here" answers actionable.
                          a: ({ href, children }) => {
                            const isInternal = href?.startsWith('/');
                            const linkCls = 'inline-flex items-center gap-1 mt-1 mr-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full hover:bg-emerald-100 transition';
                            if (isInternal) {
                              return (
                                <Link href={href!} className={linkCls} onClick={() => setOpen(false)}>
                                  {children} <ArrowUpRight className="w-3 h-3" />
                                </Link>
                              );
                            }
                            return (
                              <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>
                                {children} <ArrowUpRight className="w-3 h-3" />
                              </a>
                            );
                          },
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="relative border-t border-gray-200 flex-shrink-0 bg-white">
            {/* Slash-command palette */}
            {showCommandMenu && filteredCommands.length > 0 && (
              <div className="absolute bottom-full left-3 right-3 mb-1.5 bg-white rounded-xl shadow-lg border border-gray-200 max-h-48 overflow-y-auto py-1 z-10">
                {filteredCommands.map((c, i) => (
                  <button
                    key={c.command}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectCommand(i)}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 text-xs transition ${
                      i === commandIndex ? 'bg-emerald-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-mono font-bold text-emerald-600 shrink-0">/{c.command}</span>
                    <span className="text-gray-500 truncate">{c.question[language]}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="p-3 flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask how to do something... (try /)"
                className="flex-1 text-sm border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                disabled={loading}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-3 py-2 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-50 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ width: '52px', height: '52px' }}
        title="Help Assistant"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </>
  );
}
