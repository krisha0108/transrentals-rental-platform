'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MessageSquare, Clock, ArrowLeft } from 'lucide-react';

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
  const fontSize = Math.round(size * 0.38);

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
      style={{ width: size, height: size, fontSize }}
    >
      {name.charAt(0).toUpperCase()}
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

  const handleClick = (convId: string) => {
    onSelect?.(convId);
    router.push(`/vendor/social/messages/${convId}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
            {conversations.reduce((s, c) => s + c.unreadCount, 0) > 0
              ? `${conversations.reduce((s, c) => s + c.unreadCount, 0)} new`
              : `${conversations.length} chats`}
          </span>
        </div>
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
              {search ? 'Try a different name' : 'Visit a vendor profile to start chatting'}
            </p>
            {!search && (
              <Link
                href="/vendor/social"
                className="mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Browse Vendor Network →
              </Link>
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
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-l-2 ${
                    isActive
                      ? 'bg-emerald-50 border-l-emerald-500'
                      : 'hover:bg-gray-50 border-l-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <VendorAvatar name={conv.other.businessName} logo={conv.other.logo} size={46} />
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
                      {hasUnread && (
                        <span className="flex-shrink-0 bg-emerald-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
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
    <div className="flex bg-white overflow-hidden" style={{ height: 'calc(100vh - 49px)' }}>
      {/* ── Left Panel: Conversation List ── */}
      <div
        className={`
          flex-shrink-0 border-r border-gray-200 bg-white flex flex-col
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
