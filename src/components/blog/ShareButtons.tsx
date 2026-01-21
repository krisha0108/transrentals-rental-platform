'use client';

import { Facebook, Twitter, Linkedin, Link as LinkIcon, Mail } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  showLabel?: boolean;
}

export function ShareButtons({ url, title, description, showLabel = true }: ShareButtonsProps) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : url;

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      shareUrl
    )}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareUrl
    )}`,
    email: `mailto:?subject=${encodeURIComponent(
      title
    )}&body=${encodeURIComponent(description || title + '\n\n' + shareUrl)}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform: string) => {
    const link = shareLinks[platform as keyof typeof shareLinks];
    if (platform === 'email') {
      window.location.href = link;
    } else {
      window.open(link, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="flex items-center gap-4">
      {showLabel && <span className="text-sm font-semibold text-gray-700">Share:</span>}
      <div className="flex gap-2">
        <button
          onClick={() => handleShare('facebook')}
          className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
          aria-label="Share on Facebook"
        >
          <Facebook size={18} />
        </button>
        <button
          onClick={() => handleShare('twitter')}
          className="p-2 rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200 transition-colors"
          aria-label="Share on Twitter"
        >
          <Twitter size={18} />
        </button>
        <button
          onClick={() => handleShare('linkedin')}
          className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          aria-label="Share on LinkedIn"
        >
          <Linkedin size={18} />
        </button>
        <button
          onClick={() => handleShare('email')}
          className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="Share via Email"
        >
          <Mail size={18} />
        </button>
        <button
          onClick={copyToClipboard}
          className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="Copy link"
        >
          <LinkIcon size={18} />
        </button>
      </div>
    </div>
  );
}
