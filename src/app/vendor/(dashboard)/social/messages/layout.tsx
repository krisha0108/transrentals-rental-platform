'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MessageSquare, Clock, ArrowLeft, ChevronRight, PenSquare, X, Loader2 } from 'lucide-react';

interface OtherVendor {
  id: string;
  businessName: string;
  ownerName: string;
  logo?: string;
  city?: string;
}

interface Conversation {
  id: string;
  other: OtherVendor;
  lastMessage: { content: string; createdAt: string; isMine: boolean } | null;
  unreadCount: number;
  lastMessageAt: string;
}

function previewMessage(content: string): string {
  if (content.startsWith('{')) {
    try {
      const d = JSON.parse(content);
      if (d.__type === 'post_card') return '📌 Shared a post';
    } catch {}
  }
  return content;
}

function timeShort(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function VendorAvatar({
  name,
  logo,
  size = 46,
  ring = false,
}: {
  name: string;
  logo?: string;
  size?: number;
  ring?: boolean;
}) {
  const [err, setErr] = useState(false);
  const colors = [
    'bg-emerald-500', 'bg-teal-500', 'bg-green-600',
    'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  const fontSize = Math.round(size * 0.38);
  const ringClass = ring ? 'ring-2 ring-emerald-400 ring-offset-1' : '';

  if (logo && !err) {
    return (
      <img
        src={logo}
        alt={name}
        onError={() => setErr(true)}
        className={`rounded-full object-cover flex-shrink-0 ${ringClass}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none ${ringClass}`}
      style={{ width: size, height: size, fontSize }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   New Chat Modal — search vendors + agents, click to open conversation
────────────────────────────────────────────────────────────────────────── */
interface SearchResult {
  type: 'vendor' | 'agent';
  id: string;
  businessName: string;
  ownerName: string | null;
  logo?: string | null;
  city?: string | null;
}

function NewChatModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/social/search?q=${encodeURIComponent(term)}`);
        if (!res.ok) return;
        const d = await res.json();
        if (!cancelled) setResults(d.results || []);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  const openChat = async (r: SearchResult) => {
    if (opening) return;
    setOpening(`${r.type}:${r.id}`);
    const res = await fetch('/api/social/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otherType: r.type, otherId: r.id }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/vendor/social/messages/${data.conversationId}`);
      onClose();
      return;
    }
    setOpening(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80dvh]"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <PenSquare className="h-4 w-4 text-emerald-600" /> New Chat
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-200 transition-all">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search by name, owner, or city..."
              className="flex-1 bg-transparent text-sm focus:outline-none text-gray-800 placeholder-gray-400" />
            {searching && <Loader2 className="h-3.5 w-3.5 text-emerald-500 animate-spin flex-shrink-0" />}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {q.trim().length < 2 ? (
            <div className="py-10 text-center px-6">
              <p className="text-sm text-gray-400 font-medium">Start typing to search</p>
              <p className="text-xs text-gray-300 mt-1">At least 2 characters</p>
            </div>
          ) : !searching && results.length === 0 ? (
            <div className="py-10 text-center px-6">
              <p className="text-sm text-gray-400 font-medium">No results for "{q}"</p>
              <p className="text-xs text-gray-300 mt-1">Try a different name or city</p>
            </div>
          ) : (
            <div className="py-1">
              {results.map(r => {
                const key = `${r.type}:${r.id}`;
                const isOpening = opening === key;
                return (
                  <button key={key} onClick={() => openChat(r)} disabled={!!opening}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left disabled:opacity-60">
                    <VendorAvatar name={r.businessName} logo={r.logo || undefined} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">{r.businessName}</p>
                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${
                          r.type === 'agent' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {r.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {[r.city, r.ownerName].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    {isOpening
                      ? <Loader2 className="h-4 w-4 text-emerald-500 animate-spin flex-shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationList({
  activeId,
  onSelect,
}: {
  activeId?: string;
  onSelect?: (id: string) => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const router = useRouter();

  const fetch_ = useCallback(async (initial = false) => {
    const res = await fetch('/api/vendor/social/chat/conversations');
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations || []);
    if (initial) setLoading(false);
  }, []);

  useEffect(() => { fetch_(true); }, []);

  // Poll every 5s for new messages/conversations
  useEffect(() => {
    const t = setInterval(() => fetch_(false), 5000);
    return () => clearInterval(t);
  }, [fetch_]);

  const filtered = conversations.filter(c =>
    c.other.businessName.toLowerCase().includes(search.toLowerCase()) ||
    c.other.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  const handleClick = (convId: string) => {
    onSelect?.(convId);
    router.push(`/vendor/social/messages/${convId}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Emerald alive header */}
      <div className="relative bg-emerald-600 py-4 px-4 flex-shrink-0 overflow-hidden">
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
        {/* Shimmer sweep */}
        <div className="shimmer-sweep absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {/* Floating ring outlines */}
        <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full border border-white/10 animate-[float-slow_4s_ease-in-out_infinite]" />
        <div className="absolute -bottom-2 -left-4 w-12 h-12 rounded-full border border-white/10 animate-[float-rev_5s_ease-in-out_infinite]" />
        {/* Sparkle dots */}
        <div className="absolute top-2 right-8 w-1 h-1 bg-white/30 rounded-full animate-[sparkle_3s_ease-in-out_infinite]" />
        <div className="absolute bottom-3 right-16 w-1.5 h-1.5 bg-white/20 rounded-full animate-[sparkle_4s_ease-in-out_infinite_0.5s]" />

        <div className="relative flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-white tracking-tight">Messages</h2>
          <div className="flex items-center gap-2">
            {totalUnread > 0 ? (
              <span className="text-xs text-white bg-white/20 px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-sm">
                {totalUnread} new
              </span>
            ) : (
              <span className="text-xs text-white/70 bg-white/10 px-2.5 py-0.5 rounded-full font-medium backdrop-blur-sm">
                {conversations.length} chats
              </span>
            )}
            <button onClick={() => setNewChatOpen(true)} title="New chat"
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-all backdrop-blur-sm active:scale-95">
              <PenSquare className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search bar in white area */}
      <div className="px-4 pt-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-200 transition-all">
          <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendors..."
            className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded-full w-2/5" />
                  <div className="h-2.5 bg-gray-100 rounded-full w-3/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
              <MessageSquare className="h-7 w-7 text-emerald-400" />
            </div>
            <p className="font-semibold text-gray-700 text-sm">
              {search ? 'No results' : 'No conversations yet'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? 'Try a different name' : 'Tap "New chat" or visit a profile to start chatting'}
            </p>
            {!search && (
              <button onClick={() => setNewChatOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200/50">
                <PenSquare className="h-3.5 w-3.5" /> Start a New Chat
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map(conv => {
              const isActive = conv.id === activeId;
              const hasUnread = conv.unreadCount > 0;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleClick(conv.id)}
                  className={`group w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 text-left border-l-2 ${
                    isActive
                      ? 'bg-emerald-50 border-l-emerald-500'
                      : hasUnread
                        ? 'bg-emerald-50/40 border-l-emerald-400 hover:bg-emerald-50/70'
                        : 'hover:bg-gray-50 hover:-translate-y-[1px] hover:shadow-sm border-l-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <VendorAvatar name={conv.other.businessName} logo={conv.other.logo} size={46} ring={hasUnread && !isActive} />
                    {hasUnread && !isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                        {conv.other.businessName}
                      </span>
                      <span className={`text-[10px] flex-shrink-0 ${hasUnread ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                        {timeShort(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      {conv.lastMessage ? (
                        <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                          {conv.lastMessage.isMine ? 'You: ' : ''}{previewMessage(conv.lastMessage.content)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-300 italic">Start chatting</p>
                      )}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {hasUnread && (
                          <span className="bg-emerald-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-rev {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        .shimmer-sweep {
          animation: shimmer-sweep 3s ease-in-out infinite;
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          50%, 100% { transform: translateX(100%); }
        }
      `}</style>

      {newChatOpen && <NewChatModal onClose={() => setNewChatOpen(false)} />}
    </div>
  );
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Detect if we're inside a specific conversation
  const convMatch = pathname.match(/\/vendor\/social\/messages\/([^/]+)/);
  const activeConvId = convMatch?.[1];
  const isInConversation = !!activeConvId;

  return (
    <div className="flex bg-white overflow-hidden" style={{ height: 'calc(100dvh - 49px)' }}>
      {/* ── Left Panel: Conversation List ── */}
      <div
        className={`
          flex-shrink-0 border-r border-gray-200 bg-white flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.04)]
          w-full lg:w-80 xl:w-96
          ${isInConversation ? 'hidden lg:flex' : 'flex'}
        `}
      >
        <ConversationList activeId={activeConvId} />
      </div>

      {/* ── Right Panel: Chat or Empty State ── */}
      <div
        className={`
          flex-1 flex flex-col min-w-0 bg-gray-50
          ${isInConversation ? 'flex' : 'hidden lg:flex'}
        `}
      >
        {children}
      </div>
    </div>
  );
}
