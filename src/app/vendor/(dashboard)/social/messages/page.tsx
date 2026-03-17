import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

// Desktop right-panel empty state when no conversation is selected
export default function MessagesIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-center px-8 select-none">
      {/* Icon */}
      <div className="w-24 h-24 bg-emerald-50 border-2 border-emerald-100 rounded-full flex items-center justify-center mb-5">
        <MessageSquare className="h-10 w-10 text-emerald-400" strokeWidth={1.5} />
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2">Vendor Messages</h2>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
        Select a conversation from the list to start chatting, or visit a vendor&apos;s profile to send your first message.
      </p>

      <Link
        href="/vendor/social"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm"
      >
        Browse Vendor Network
      </Link>

      <p className="mt-10 text-[11px] text-gray-300">
        Messages are only visible to the two vendors in the conversation
      </p>
    </div>
  );
}
