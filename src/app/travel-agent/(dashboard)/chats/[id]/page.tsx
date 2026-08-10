'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Phone,
  MessageSquare as WhatsAppIcon,
  Mail,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import TravelAgentChat from '@/components/travel-agent/chat/TravelAgentChat';

// Strips an existing 91/+91 country-code prefix before re-adding it, so a
// number already saved as "+919876543210" doesn't become "919919876543210".
const waLink = (phone: string) => `https://wa.me/91${phone.replace(/^\+?91/, '')}`;

interface ConversationMeta {
  id: string;
  subject: string | null;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  leadId: string | null;
  tourId: string | null;
  createdAt: string;
  travelAgentId: string;
}

export default function ChatDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [conv, setConv] = useState<ConversationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/travel-agent-chat/conversations/${params.id}`);
        if (res.ok) {
          const json = await res.json();
          setConv(json.conversation);
        } else {
          const j = await res.json();
          setError(j.error || 'Could not load conversation');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !conv) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-gray-600">{error || 'Conversation not found'}</p>
        <Link
          href="/travel-agent/chats"
          className="inline-block mt-3 text-sm font-semibold text-emerald-600 hover:underline"
        >
          ← All chats
        </Link>
      </div>
    );
  }

  const agentName = (session?.user as any)?.name || 'Agent';
  const agentId = (session?.user as any)?.id || conv.travelAgentId;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Link
        href="/travel-agent/chats"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600"
      >
        <ArrowLeft className="w-4 h-4" /> All chats
      </Link>

      {/* Customer info card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shrink-0">
          {conv.customerName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900">{conv.customerName}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {conv.customerPhone}
            </span>
            {conv.customerEmail && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="w-3 h-3" /> {conv.customerEmail}
              </span>
            )}
          </div>
          {conv.subject && (
            <p className="text-xs text-emerald-700 font-semibold mt-1.5">{conv.subject}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`tel:${conv.customerPhone}`}
            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            <Phone className="w-3 h-3" /> Call
          </a>
          <a
            href={waLink(conv.customerPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            <WhatsAppIcon className="w-3 h-3" /> WA
          </a>
          {conv.leadId && (
            <Link
              href={`/travel-agent/leads/${conv.leadId}`}
              className="inline-flex items-center gap-1 bg-white border border-gray-200 hover:border-emerald-300 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              <ExternalLink className="w-3 h-3" /> Lead
            </Link>
          )}
        </div>
      </div>

      {/* Chat */}
      <TravelAgentChat
        conversationId={conv.id}
        senderType="agent"
        senderId={agentId}
        senderName={agentName}
        title={conv.customerName}
        description={`Conversation since ${new Date(conv.createdAt).toLocaleDateString()}`}
        heightClass="h-[60vh]"
      />
    </div>
  );
}
