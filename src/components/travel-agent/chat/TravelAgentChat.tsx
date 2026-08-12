'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, MessageSquare, AlertCircle, Check, CheckCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  senderType: 'agent' | 'customer';
  senderName?: string | null;
  content: string;
  status?: string;
  createdAt: string;
}

interface TravelAgentChatProps {
  /** Existing conversation id (if known). If absent, props below are used to create one. */
  conversationId?: string;

  /** Side of the chat. */
  senderType: 'agent' | 'customer';

  /** Identity of the sender (used in API calls + message labels). */
  senderId?: string;
  senderName?: string;

  /**
   * Phone of the customer — required for the customer side to authorize against the
   * conversation. Ignored on the agent side (auth via session).
   */
  customerPhone?: string;

  /** Conversation seed values — only used when conversationId is missing. */
  travelAgentId?: string;
  customerName?: string;
  customerEmail?: string;
  leadId?: string;
  tourId?: string;
  subject?: string;

  /** Optional UI tweaks */
  heightClass?: string; // default 'h-96'
  className?: string;
  hideHeader?: boolean;
  title?: string;
  description?: string;
}

// Auto-init a conversation when missing — used by the customer-side chat trigger.
async function ensureConversation(props: TravelAgentChatProps): Promise<string | null> {
  if (props.conversationId) return props.conversationId;
  if (!props.travelAgentId || !props.customerName || !props.customerPhone) return null;

  const res = await fetch('/api/travel-agent-chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      travelAgentId: props.travelAgentId,
      customerName: props.customerName,
      customerPhone: props.customerPhone,
      customerEmail: props.customerEmail,
      leadId: props.leadId,
      tourId: props.tourId,
      subject: props.subject,
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.conversation?.id || null;
}

export default function TravelAgentChat(props: TravelAgentChatProps) {
  const {
    senderType,
    senderId,
    senderName,
    customerPhone,
    heightClass = 'h-96',
    className = '',
    hideHeader = false,
    title,
    description,
  } = props;

  const [conversationId, setConversationId] = useState<string | null>(props.conversationId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [counterpartyName, setCounterpartyName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);
  const lastMsgCountRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Build URL with auth-or-phone query suffix
  const buildUrl = useCallback(
    (path: string) => {
      const sep = path.includes('?') ? '&' : '?';
      return senderType === 'customer' && customerPhone
        ? `${path}${sep}phone=${encodeURIComponent(customerPhone)}`
        : path;
    },
    [senderType, customerPhone],
  );

  const fetchMessages = useCallback(
    async (convId: string) => {
      try {
        const res = await fetch(buildUrl(`/api/travel-agent-chat/conversations/${convId}`));
        if (!res.ok) {
          const j = await res.json();
          setError(j.error || 'Could not load chat');
          return;
        }
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages || []);
          setCounterpartyName((c) => c || data.conversation?.customerName || '');
          if ((data.messages?.length || 0) !== lastMsgCountRef.current) {
            lastMsgCountRef.current = data.messages?.length || 0;
            setTimeout(scrollToBottom, 80);
          }
        }
      } catch {
        setError('Network error');
      }
    },
    [buildUrl, scrollToBottom],
  );

  // Init: ensure we have a conversationId, then load messages
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let convId = conversationId;
      if (!convId) {
        convId = await ensureConversation(props);
        if (!convId) {
          setError('Could not start chat');
          setLoading(false);
          return;
        }
        if (!cancelled) setConversationId(convId);
      }
      await fetchMessages(convId);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll every 5s
  useEffect(() => {
    if (!conversationId) return;
    pollRef.current = setInterval(() => fetchMessages(conversationId), 5000);
    return () => clearInterval(pollRef.current);
  }, [conversationId, fetchMessages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId,
      senderType,
      senderName: senderName || null,
      content: text,
      status: 'SENDING',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch(buildUrl(`/api/travel-agent-chat/conversations/${conversationId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType,
          senderId: senderId || null,
          senderName: senderName || null,
          content: text,
          messageType: 'TEXT',
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInput(text);
        setError(j.error || 'Failed to send');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
      setError('Network error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col ${className}`}>
      {!hideHeader && (
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">
              {title || (senderType === 'agent' ? counterpartyName || 'Customer' : 'Travel Agent')}
            </p>
            <p className="text-xs text-gray-500 truncate">{description || 'Direct messaging'}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className={`${heightClass} overflow-y-auto px-4 py-3 space-y-2 bg-gray-50`}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : error && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-300 mx-auto mb-2" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-sm text-gray-400">No messages yet</p>
            <p className="text-xs text-gray-300 mt-1">Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMe = msg.senderType === senderType;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 flex items-center gap-1 ${
                        isMe ? 'text-emerald-200 justify-end' : 'text-gray-300'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {msg.status === 'SENDING' && ' · sending…'}
                      {/* Read receipt — WhatsApp-style ticks, shown only on my
                          own sent messages (mirrors the app's Bubble component). */}
                      {isMe && msg.status !== 'SENDING' && (
                        msg.status === 'READ' ? (
                          <CheckCheck className="w-3 h-3 text-sky-300" aria-label="Read" />
                        ) : (
                          <Check className="w-3 h-3 text-emerald-200" aria-label="Sent" />
                        )
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-3 py-2 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            disabled={!conversationId || loading}
            className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 max-h-24 bg-gray-50 disabled:opacity-50"
            style={{ minHeight: '38px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || !conversationId}
            className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white flex items-center justify-center transition flex-shrink-0"
            aria-label="Send"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
