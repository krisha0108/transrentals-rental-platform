'use client';

// Right-panel empty state when no conversation is selected — same visual
// treatment as the vendor messages empty state.

import { MessageSquare, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AgentMessagesIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white text-center px-8 select-none relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-emerald-200 rounded-full animate-[sparkle_3s_ease-in-out_infinite]" />
        <div className="absolute top-32 right-1/3 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-[sparkle_4s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-32 left-1/3 w-1.5 h-1.5 bg-emerald-200 rounded-full animate-[sparkle_3.5s_ease-in-out_infinite_1s]" />
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-emerald-100 rounded-full animate-[sparkle_4.5s_ease-in-out_infinite_0.3s]" />
        <div className="absolute bottom-40 right-1/4 w-1 h-1 bg-emerald-300 rounded-full animate-[sparkle_3s_ease-in-out_infinite_1.5s]" />
      </div>

      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-full border-2 border-emerald-200/40 animate-[float-slow_4s_ease-in-out_infinite]" />
        <div className="absolute -inset-8 rounded-full border border-emerald-100/30 animate-[float-rev_5s_ease-in-out_infinite]" />
        <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200/60 animate-[float-slow_3s_ease-in-out_infinite]">
          <MessageSquare className="h-10 w-10 text-white" strokeWidth={1.5} />
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2 animate-[fade-up_0.5s_ease-out_both]">Network Messages</h2>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed animate-[fade-up_0.7s_ease-out_both]">
        Select a conversation from the list to start chatting, or visit an agent / vendor profile to send your first message.
      </p>

      <Link href="/travel-agent/social"
        className="group mt-6 relative inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-semibold hover:bg-emerald-700 transition-all duration-300 shadow-lg shadow-emerald-200/50 active:scale-[0.97] animate-[fade-up_0.9s_ease-out_both] overflow-hidden">
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
        <Sparkles className="h-4 w-4 relative" />
        <span className="relative">Browse Travel Network</span>
      </Link>

      <p className="mt-10 text-[11px] text-gray-300 animate-[fade-up_1.1s_ease-out_both]">
        Messages are only visible to the two participants in the conversation
      </p>

      <style jsx>{`
        @keyframes float-slow { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        @keyframes float-rev { 0%,100% { transform:translateY(0); } 50% { transform:translateY(6px); } }
        @keyframes sparkle { 0%,100% { opacity:0.3; transform:scale(0.8); } 50% { opacity:1; transform:scale(1.2); } }
        @keyframes fade-up { 0% { opacity:0; transform:translateY(12px); } 100% { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
