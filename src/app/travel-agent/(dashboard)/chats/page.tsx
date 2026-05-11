'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  MessageSquare,
  Phone,
  Inbox,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface Conversation {
  id: string;
  subject: string | null;
  status: string;
  lastMessageAt: string | null;
  unreadCount: number;
  lastMessage: { content: string; senderType: string; createdAt: string } | null;
  participant: { name: string; phone: string; email: string | null };
  leadId: string | null;
  tourId: string | null;
  createdAt: string;
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ChatsListPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/travel-agent-chat/conversations');
        if (res.ok) {
          const json = await res.json();
          setConversations(json.conversations || []);
          setTotalUnread(json.totalUnread || 0);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 15000); // refresh every 15s for new messages
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Chats</h1>
          <p className="text-sm text-gray-500">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            {totalUnread > 0 && ` • ${totalUnread} unread`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No conversations yet</p>
          <p className="text-sm text-gray-400">
            When customers message you from your tours / leads, they&apos;ll show up here
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/travel-agent/chats/${c.id}`}
              className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {c.participant.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p
                    className={`font-bold text-sm truncate ${
                      c.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {c.participant.name}
                  </p>
                  <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(c.lastMessageAt || c.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> {c.participant.phone}
                  {c.subject && <span className="text-gray-400">• {c.subject}</span>}
                </p>
                {c.lastMessage && (
                  <p
                    className={`text-xs truncate mt-1.5 ${
                      c.unreadCount > 0
                        ? 'text-gray-900 font-semibold'
                        : 'text-gray-500'
                    }`}
                  >
                    {c.lastMessage.senderType === 'agent' && (
                      <span className="text-gray-400">You: </span>
                    )}
                    {c.lastMessage.content}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {c.unreadCount > 0 ? (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {c.unreadCount > 9 ? '9+' : c.unreadCount}
                  </span>
                ) : (
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
