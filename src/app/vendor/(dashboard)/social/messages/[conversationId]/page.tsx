'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Building2, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; businessName: string; logo?: string };
}

interface OtherVendor {
  id: string;
  businessName: string;
  ownerName: string;
  logo?: string;
  city?: string;
}

/* ── Post Card helpers ── */
interface PostCardData {
  __type: 'post_card';
  vendorName: string;
  ownerName: string;
  category: string;
  isSOS: boolean;
  content: string;
}

function parsePostCard(content: string): PostCardData | null {
  if (!content.startsWith('{')) return null;
  try {
    const d = JSON.parse(content);
    if (d.__type === 'post_card') return d as PostCardData;
  } catch {}
  return null;
}

function PostCardBubble({ card, isMine }: { card: PostCardData; isMine: boolean }) {
  const sos = card.isSOS;
  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm border w-64 sm:w-72 ${
      isMine ? 'border-emerald-200' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className={`px-3 py-2 flex items-center gap-2 ${
        sos ? 'bg-red-500' : isMine ? 'bg-emerald-600' : 'bg-violet-600'
      }`}>
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          {card.vendorName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-xs truncate">{card.vendorName}</p>
          <p className="text-white/70 text-[10px] truncate">{card.ownerName}</p>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
          sos ? 'bg-white/20 text-white' : 'bg-white/20 text-white'
        }`}>
          {sos && <Zap className="h-2.5 w-2.5 inline mr-0.5" />}{card.category}
        </span>
      </div>
      {/* Content */}
      <div className={`px-3 py-2.5 ${isMine ? 'bg-emerald-50' : 'bg-white'}`}>
        <p className="text-gray-800 text-xs leading-relaxed line-clamp-4 whitespace-pre-wrap">{card.content}</p>
      </div>
      {/* Footer */}
      <div className={`px-3 py-1.5 flex items-center gap-1 border-t ${
        isMine ? 'border-emerald-100 bg-emerald-50/80' : 'border-gray-100 bg-gray-50/80'
      }`}>
        <span className="text-[10px] text-gray-400 font-medium">📌 Shared post · TransRentals</span>
      </div>
    </div>
  );
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

function VendorAvatar({
  name,
  logo,
  size = 38,
}: {
  name: string;
  logo?: string;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  const colors = [
    'bg-emerald-500', 'bg-teal-500', 'bg-green-600',
    'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  if (logo && !err) {
    return (
      <img
        src={logo}
        alt={name}
        onError={() => setErr(true)}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ChatWindowPage({
  params,
}: {
  params: Promise<{ conversationId: string }> | { conversationId: string };
}) {
  const { conversationId } = 'then' in params
    ? use(params as Promise<{ conversationId: string }>)
    : params;

  const { data: session } = useSession();
  const myVendorId = session?.user?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<OtherVendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastMsgCountRef = useRef(0);

  const fetchMessages = useCallback(async (initial = false) => {
    const res = await fetch(`/api/vendor/social/chat/conversations/${conversationId}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    const msgs: Message[] = data.messages || [];
    setMessages(msgs);
    if (initial) {
      setOther(data.other || null);
      setLoading(false);
    }
    return msgs;
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetchMessages(true);
    inputRef.current?.focus();
  }, [conversationId]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length !== lastMsgCountRef.current) {
      lastMsgCountRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Poll every 3 seconds
  useEffect(() => {
    const t = setInterval(() => fetchMessages(false), 3000);
    return () => clearInterval(t);
  }, [fetchMessages]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || sending || !myVendorId) return;
    setSending(true);
    const content = text.trim();
    setText('');

    // Optimistic add
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, content, senderId: myVendorId, isRead: false,
      createdAt: new Date().toISOString(),
      sender: { id: myVendorId, businessName: 'You' },
    }]);

    const res = await fetch(`/api/vendor/social/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
    } else {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
    setSending(false);
    inputRef.current?.focus();
  };

  // Group messages by date
  const grouped: { date: string; messages: Message[] }[] = [];
  for (const msg of messages) {
    const key = new Date(msg.createdAt).toDateString();
    const last = grouped[grouped.length - 1];
    if (last?.date === key) last.messages.push(msg);
    else grouped.push({ date: key, messages: [msg] });
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#f0fdf4]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #d1fae5 1px, transparent 0)', backgroundSize: '24px 24px' }}>

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm z-10">
        {/* Back button — only on mobile */}
        <Link
          href="/vendor/social/messages"
          className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {other ? (
          <>
            <VendorAvatar name={other.businessName} logo={other.logo} size={42} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                {other.businessName}
              </p>
              <p className="text-xs text-emerald-500 font-medium">
                {other.city || other.ownerName}
              </p>
            </div>
            <Link
              href={`/vendor/social/profile/${other.id}`}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="View Profile"
            >
              <Building2 className="h-5 w-5" />
            </Link>
          </>
        ) : (
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-full w-32 animate-pulse" />
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="text-3xl mb-3">👋</div>
            <p className="text-gray-500 text-sm font-medium">
              Start the conversation with {other?.businessName}
            </p>
            <p className="text-gray-400 text-xs mt-1">Say hi!</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {grouped.map(group => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-emerald-100" />
                  <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex-shrink-0">
                    {formatDateLabel(group.messages[0].createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-emerald-100" />
                </div>

                {group.messages.map((msg, i) => {
                  const isMine = msg.senderId === myVendorId;
                  const prev = group.messages[i - 1];
                  const next = group.messages[i + 1];
                  const isFirstInRun = !prev || prev.senderId !== msg.senderId;
                  const isLastInRun = !next || next.senderId !== msg.senderId;
                  const isTemp = msg.id.startsWith('temp-');

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isFirstInRun ? 'mt-3' : 'mt-0.5'}`}
                    >
                      {/* Avatar for received messages */}
                      {!isMine && (
                        <div className="mr-2 flex-shrink-0 self-end mb-0.5">
                          {isLastInRun ? (
                            <VendorAvatar
                              name={other?.businessName ?? '?'}
                              logo={other?.logo}
                              size={28}
                            />
                          ) : (
                            <div style={{ width: 28 }} />
                          )}
                        </div>
                      )}

                      <div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'} ${isTemp ? 'opacity-60' : ''}`}>
                        {(() => {
                          const card = parsePostCard(msg.content);
                          if (card) {
                            return <PostCardBubble card={card} isMine={isMine} />;
                          }
                          return (
                            <div
                              className={`
                                px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap
                                ${isMine
                                  ? `bg-emerald-500 text-white shadow-sm ${
                                      isFirstInRun ? 'rounded-t-2xl' : 'rounded-tl-2xl'
                                    } rounded-bl-2xl ${
                                      isLastInRun ? 'rounded-br-sm rounded-tl-2xl' : 'rounded-br-2xl rounded-tr-2xl'
                                    }`
                                  : `bg-white text-gray-800 border border-gray-100 shadow-sm ${
                                      isFirstInRun ? 'rounded-t-2xl' : 'rounded-tr-2xl'
                                    } rounded-br-2xl ${
                                      isLastInRun ? 'rounded-bl-sm' : 'rounded-bl-2xl rounded-tl-2xl'
                                    }`
                                }
                              `}
                            >
                              {msg.content}
                            </div>
                          );
                        })()}
                        {isLastInRun && (
                          <span className="text-[10px] text-gray-400 mt-1 px-1 flex items-center gap-1">
                            {formatTime(msg.createdAt)}
                            {isMine && (
                              <span className={msg.isRead ? 'text-emerald-500' : 'text-gray-300'}>
                                {msg.isRead ? '✓✓' : '✓'}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* ── Input Bar ── */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0 shadow-[0_-1px_4px_rgba(0,0,0,0.04)]">
        <form onSubmit={sendMessage} className="flex items-end gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-200 transition-all">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => {
                setText(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`Message ${other?.businessName ?? ''}...`}
              rows={1}
              className="w-full bg-transparent text-sm focus:outline-none text-gray-800 placeholder-gray-400 resize-none overflow-hidden leading-relaxed"
              style={{ minHeight: 24, maxHeight: 120 }}
            />
          </div>
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0 active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="text-[10px] text-gray-300 text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
