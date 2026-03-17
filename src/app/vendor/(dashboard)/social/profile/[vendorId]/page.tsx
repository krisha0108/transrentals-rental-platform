'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  MapPin,
  FileText,
  Truck,
  Heart,
  MessageCircle,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Clock,
  Loader2,
} from 'lucide-react';

interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  logo?: string;
  city?: string;
  state?: string;
  description?: string;
  createdAt: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  fleetsCount: number;
  isMe: boolean;
  isFollowing: boolean;
  vendor_fleets: any[];
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  vendor: { id: string; businessName: string; ownerName: string; logo?: string; city?: string };
  category: { id: string; name: string; isSOS: boolean };
  likedByMe: boolean;
  savedByMe: boolean;
  likesCount: number;
  commentsCount: number;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function VendorAvatar({ vendor, size = 40 }: { vendor: { businessName: string; logo?: string }; size?: number }) {
  const [err, setErr] = useState(false);
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-600', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-emerald-500'];
  const color = colors[vendor.businessName.charCodeAt(0) % colors.length];

  if (vendor.logo && !err) {
    return (
      <img
        src={vendor.logo}
        alt={vendor.businessName}
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
      {vendor.businessName.charAt(0).toUpperCase()}
    </div>
  );
}

export default function VendorSocialProfilePage({
  params,
}: {
  params: Promise<{ vendorId: string }> | { vendorId: string };
}) {
  const resolvedParams = 'then' in params ? use(params as Promise<{ vendorId: string }>) : params;
  const { vendorId } = resolvedParams;
  const { data: session } = useSession();
  const currentVendorId = session?.user?.id;
  const router = useRouter();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'fleet'>('posts');

  useEffect(() => {
    fetch(`/api/vendor/social/profile/${vendorId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.vendor) {
          setVendor(d.vendor);
          setFollowing(d.vendor.isFollowing);
          setFollowersCount(d.vendor.followersCount);
          setPosts(d.posts || []);
        }
        setLoading(false);
      });
  }, [vendorId]);

  const handleMessage = async () => {
    if (!vendor || msgLoading) return;
    setMsgLoading(true);
    const res = await fetch('/api/vendor/social/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otherVendorId: vendor.id }),
    });
    const data = await res.json();
    if (res.ok) router.push(`/vendor/social/messages/${data.conversationId}`);
    setMsgLoading(false);
  };

  const handleFollow = async () => {
    if (!vendor || vendor.isMe || followLoading) return;
    setFollowLoading(true);
    const res = await fetch('/api/vendor/social/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followingId: vendor.id }),
    });
    const data = await res.json();
    if (res.ok) { setFollowing(data.following); setFollowersCount(data.followersCount); }
    setFollowLoading(false);
  };

  const handleLike = async (postId: string) => {
    const res = await fetch(`/api/vendor/social/posts/${postId}/like`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, likedByMe: data.liked, likesCount: data.likesCount } : p
      ));
    }
  };

  const handleSave = async (postId: string) => {
    const res = await fetch(`/api/vendor/social/posts/${postId}/save`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, savedByMe: data.saved } : p));
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    const res = await fetch(`/api/vendor/social/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-gray-500 font-medium">Vendor not found</p>
        <Link href="/vendor/social" className="text-blue-600 text-sm hover:underline">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <div className="mb-4">
          <Link href="/vendor/social" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to feed
          </Link>
        </div>

        {/* Profile card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4 shadow-sm">
          {/* Cover gradient */}
          <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600" />
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="ring-4 ring-white rounded-full">
                <VendorAvatar vendor={vendor} size={72} />
              </div>
              {!vendor.isMe && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      following
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-60`}
                  >
                    {followLoading ? '...' : following ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={handleMessage}
                    disabled={msgLoading}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {msgLoading ? '...' : 'Message'}
                  </button>
                </div>
              )}
              {vendor.isMe && (
                <Link
                  href="/vendor/profile"
                  className="px-5 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Edit Profile
                </Link>
              )}
            </div>

            <h1 className="text-xl font-bold text-gray-900">{vendor.businessName}</h1>
            <p className="text-sm text-gray-500">{vendor.ownerName}</p>
            {(vendor.city || vendor.state) && (
              <p className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {[vendor.city, vendor.state].filter(Boolean).join(', ')}
              </p>
            )}
            {vendor.description && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{vendor.description}</p>
            )}

            {/* Stats */}
            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center flex-1">
                <p className="text-lg font-bold text-gray-900">{vendor.postsCount}</p>
                <p className="text-xs text-gray-500">Posts</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-lg font-bold text-gray-900">{followersCount}</p>
                <p className="text-xs text-gray-500">Followers</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-lg font-bold text-gray-900">{vendor.followingCount}</p>
                <p className="text-xs text-gray-500">Following</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-lg font-bold text-gray-900">{vendor.fleetsCount ?? vendor.vendor_fleets.length}</p>
                <p className="text-xs text-gray-500">Fleets</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-4">
          {(['posts', 'fleet'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'fleet' ? `Fleet (${vendor.fleetsCount ?? vendor.vendor_fleets.length})` : 'Posts'}
            </button>
          ))}
        </div>

        {/* Posts tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 pb-3">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        post.category.isSOS ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {post.category.isSOS && '⚡ '}{post.category.name}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Clock className="h-3 w-3" /> {timeAgo(post.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-1">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                        post.likedByMe ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-current' : ''}`} />
                      {post.likesCount > 0 && post.likesCount}
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100">
                      <MessageCircle className="h-4 w-4" />
                      {post.commentsCount > 0 && post.commentsCount}
                    </button>
                    <button
                      onClick={() => handleSave(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
                        post.savedByMe ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {post.savedByMe ? <BookmarkCheck className="h-4 w-4 fill-current" /> : <Bookmark className="h-4 w-4" />}
                    </button>
                    {vendor.isMe && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="ml-auto p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Fleet tab */}
        {activeTab === 'fleet' && (
          <div>
            {vendor.vendor_fleets.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <Truck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No fleet listed</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {vendor.vendor_fleets.map((v: any) => {
                  // Build the best display name: prefer brand+model, fallback to vehicleName
                  const brand = v.brands?.name;
                  const model = v.vehicle_models?.name;
                  const displayName = brand && model ? `${brand} ${model}` : model || brand || v.vehicleName || 'Vehicle';
                  const subName = (brand && model && v.vehicleName && v.vehicleName !== displayName) ? v.vehicleName : null;
                  const service = v.services?.name;
                  const meta = [v.fuelType, v.transmission, v.yearOfManufacture].filter(Boolean).join(' · ');
                  const seats = v.seatingCapacity;

                  return (
                    <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-3.5 hover:border-blue-200 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">{displayName}</div>
                          {subName && <div className="text-xs text-gray-500 truncate">{subName}</div>}
                        </div>
                        {seats && (
                          <span className="flex-shrink-0 text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                            {seats}s
                          </span>
                        )}
                      </div>
                      {service && (
                        <div className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full inline-block mb-1.5">
                          {service}
                        </div>
                      )}
                      {meta && <div className="text-xs text-gray-400">{meta}</div>}
                      {v.registrationNumber && (
                        <div className="text-[10px] text-gray-400 mt-1 font-mono bg-gray-50 px-2 py-0.5 rounded">
                          {v.registrationNumber}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
