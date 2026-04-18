// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users, MapPin, Clock, Check, X, Loader2, AlertCircle,
  User, Phone, ChevronRight, Compass, Calendar, Send,
  CheckCircle, UserPlus, Share2, Copy, RefreshCw,
  MessageCircle, ThumbsUp, LogOut, Trash2, Settings,
  ChevronDown, ChevronUp, Plus,
} from 'lucide-react';

function safeJson(val: any, fb: any = []) {
  if (Array.isArray(val) || (val && typeof val === 'object')) return val;
  if (!val) return fb;
  try { return JSON.parse(val); } catch { return fb; }
}

function fmtDate(str: string) {
  if (!str) return '—';
  try { return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return str; }
}

function timeAgo(str: string) {
  if (!str) return '';
  const diff = Date.now() - new Date(str).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const EMOJI_OPTIONS = ['🌏', '🏔️', '🏖️', '🗺️', '✈️', '🚂', '🌊', '🏕️', '🎒', '🌴', '🏜️', '❄️'];

export default function GroupInvitePage() {
  const { groupCode } = useParams();

  const [group, setGroup]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [copied, setCopied] = useState(false);

  // My identity
  const [myPhone, setMyPhone]       = useState('');
  const [myMemberId, setMyMemberId] = useState('');
  const [isAdmin, setIsAdmin]       = useState(false);
  const [isMember, setIsMember]     = useState(false);

  // UI toggles
  const [showMembers, setShowMembers]   = useState(false);
  const [activeTab, setActiveTab]       = useState<'trips' | 'chat'>('trips');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTourPicker, setShowAddTourPicker] = useState(false);

  // Join form
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [joining, setJoining]     = useState(false);
  const [joinError, setJoinError] = useState('');
  const [useOneClick, setUseOneClick] = useState(false);

  // Responding
  const [responding, setResponding] = useState(false);

  // Submit quote
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [submitError, setSubmitError]   = useState('');
  const [submitDate, setSubmitDate]     = useState('');
  const [submitGroupSize, setSubmitGroupSize] = useState('');
  const [submitPickup, setSubmitPickup] = useState('');
  const [submitReqs, setSubmitReqs]     = useState('');

  // Chat
  const [messages, setMessages]       = useState<any[]>([]);
  const [chatMsg, setChatMsg]         = useState('');
  const [sendingMsg, setSendingMsg]   = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Date voting
  const [newVoteDate, setNewVoteDate] = useState('');
  const [addingDate, setAddingDate]   = useState<string | null>(null); // tripId

  // Group edit
  const [editName, setEditName]   = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Leave / delete
  const [leaving, setLeaving] = useState(false);

  // New feature states
  const [memberReads, setMemberReads] = useState<any[]>([]);
  const [reactingTo, setReactingTo] = useState<string | null>(null);
  const [showMaxMembersInput, setShowMaxMembersInput] = useState(false);
  const [maxMembersValue, setMaxMembersValue] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Avatar upload ref
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Load group ─────────────────────────────────────────────────────────────
  const fetchGroup = async () => {
    try {
      const res  = await fetch(`/api/wander/groups/${groupCode}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      const g = data.group;
      setGroup(g);
      setEditName(g.name);

      // Auto-detect membership
      try {
        const custRaw   = localStorage.getItem('customer');
        const cust      = custRaw ? JSON.parse(custRaw) : null;
        const guestRaw  = localStorage.getItem(`wander_member_${groupCode}`);
        const guestData = guestRaw ? JSON.parse(guestRaw) : null;

        // Collect all identifiers to match against
        const custId  = cust?.id || null;
        const custPh  = cust?.phone || myPhone || guestData?.phone || '';
        const normalise = (p: string) => p?.replace(/^\+91/, '').replace(/\D/g, '');

        let me: any = null;
        if (g?.members) {
          // 1. Match by saved memberId (guest join)
          if (guestData?.memberId) me = g.members.find((m: any) => m.id === guestData.memberId);
          // 2. Match by customerId
          if (!me && custId) me = g.members.find((m: any) => m.customerId === custId);
          // 3. Match by phone (normalised)
          if (!me && custPh) me = g.members.find((m: any) => normalise(m.phone) === normalise(custPh));
        }

        if (me) {
          setMyMemberId(me.id);
          setMyPhone(custPh || me.phone);
          setIsMember(true);
          setIsAdmin(me.role === 'ADMIN');
          if (cust?.name) setName(cust.name);
          else if (guestData?.name) setName(guestData.name);
        }
      } catch {}
    } catch {
      setError('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async () => {
    setLoadingChat(true);
    try {
      const res  = await fetch(`/api/wander/groups/${groupCode}/chat`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
      if (data.memberReads) setMemberReads(data.memberReads);
    } catch {}
    finally { setLoadingChat(false); }
  };

  useEffect(() => {
    try {
      const raw  = localStorage.getItem('customer');
      const cust = raw ? JSON.parse(raw) : null;
      if (cust?.name && cust?.phone) {
        setName(cust.name);
        setPhone(cust.phone);
        setUseOneClick(true);
      }
    } catch {}
    fetchGroup();

    // Mobile deep-link: try to open TransRentals app if installed
    if (typeof navigator !== 'undefined' && typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      const isAndroid = /android/.test(ua);
      const isIOS = /iphone|ipad|ipod/.test(ua);
      if (isAndroid) {
        // Intent URL: opens app if installed, falls back to current page if not
        const fallback = encodeURIComponent(window.location.href);
        window.location.href = `intent://wander/group/${groupCode}#Intent;scheme=transrentals;package=com.transrentals.customer;S.browser_fallback_url=${fallback};end`;
      } else if (isIOS) {
        window.location.href = `transrentals://wander/group/${groupCode}`;
      }
    }
  }, [groupCode]);

  // Poll chat every 8s when on chat tab (also preload when becoming member)
  useEffect(() => {
    if (!isMember) return;
    if (activeTab !== 'chat') {
      // Prefetch once so chat tab loads instantly
      fetchChat();
      return;
    }
    fetchChat();
    const t = setInterval(fetchChat, 8000);
    return () => clearInterval(t);
  }, [activeTab, isMember, groupCode]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Join ───────────────────────────────────────────────────────────────────
  const handleJoin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setJoinError('');
    if (!name.trim() || !phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setJoinError('Please enter your name and a valid 10-digit phone number');
      return;
    }
    setJoining(true);
    try {
      let customerId = null;
      try { const raw = localStorage.getItem('customer'); if (raw) customerId = JSON.parse(raw)?.id || null; } catch {}

      const res  = await fetch(`/api/wander/groups/${groupCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), customerId, email: email.trim() || undefined, password: password || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join');

      setMyMemberId(data.memberId);
      setMyPhone(phone.trim());
      setIsMember(true);
      if (data.customer) {
        try { localStorage.setItem('customer', JSON.stringify(data.customer)); } catch {}
      }
      try {
        localStorage.setItem(`wander_member_${groupCode}`, JSON.stringify({ memberId: data.memberId, phone: phone.trim(), name: name.trim() }));
      } catch {}
      await fetchGroup();
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setJoining(false);
    }
  };

  // ── Respond ────────────────────────────────────────────────────────────────
  const handleRespond = async (tripId: string, isGoing: string, requirements: string) => {
    if (!myMemberId) return;
    setResponding(true);
    try {
      await fetch(`/api/wander/groups/${groupCode}/trips/${tripId}?action=respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId, isGoing, requirements }),
      });
      await fetchGroup();
    } catch {}
    finally { setResponding(false); }
  };

  // ── Submit quote ───────────────────────────────────────────────────────────
  const handleSubmit = async (tripId: string) => {
    if (!submitDate) { setSubmitError('Please select a travel date first'); return; }
    if (!confirm('Submit group quote request to vendors? All confirmed members will be included.')) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res  = await fetch(`/api/wander/groups/${groupCode}/trips/${tripId}?action=submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: myMemberId,
          travelDate: submitDate,
          groupSize: submitGroupSize ? parseInt(submitGroupSize) : undefined,
          pickupLocation: submitPickup.trim() || undefined,
          extraRequirements: submitReqs.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSubmitted(true);
      await fetchGroup();
      setTimeout(() => { window.location.href = '/customer/dashboard?tab=tour'; }, 1500);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Chat send ──────────────────────────────────────────────────────────────
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatMsg.trim() || !myMemberId) return;
    setSendingMsg(true);
    const msgText = chatMsg.trim();
    setChatMsg('');
    try {
      const res = await fetch(`/api/wander/groups/${groupCode}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId, message: msgText }),
      });
      const data = await res.json();
      if (data.message) setMessages(prev => [...prev, data.message]);
    } catch {}
    finally { setSendingMsg(false); }
  };

  // ── Date voting ────────────────────────────────────────────────────────────
  const handleAddDate = async (tripId: string) => {
    if (!newVoteDate || !myMemberId) return;
    // Check for duplicate date
    const trip = group?.trips?.find((t: any) => t.id === tripId);
    const alreadyExists = (trip?.dateOptions || []).some((opt: any) => {
      const optDate = new Date(opt.date).toISOString().slice(0, 10);
      const selDate = new Date(newVoteDate).toISOString().slice(0, 10);
      return optDate === selDate;
    });
    if (alreadyExists) {
      alert('This date has already been suggested. Please pick a different date.');
      return;
    }
    try {
      await fetch(`/api/wander/groups/${groupCode}/trips/${tripId}/dates?action=add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId, date: newVoteDate }),
      });
      setNewVoteDate('');
      setAddingDate(null);
      await fetchGroup();
    } catch {}
  };

  const handleVoteDate = async (tripId: string, optionId: string) => {
    if (!myMemberId) return;
    try {
      await fetch(`/api/wander/groups/${groupCode}/trips/${tripId}/dates?action=vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId, optionId }),
      });
      await fetchGroup();
    } catch {}
  };

  // ── WhatsApp Share ─────────────────────────────────────────────────────────
  const getInviteLink = () => `${window.location.origin}/wander/group/${groupCode}`;

  const handleWhatsAppShare = () => {
    const url  = getInviteLink();
    const text = `Join our group trip *"${group?.name}"*! 🌏\n\nClick the link to join & plan together:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    const text = getInviteLink();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    } else {
      const el = document.createElement('textarea');
      el.value = text; document.body.appendChild(el);
      el.select(); document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Leave / Delete group ───────────────────────────────────────────────────
  const handleLeave = async () => {
    const msg = isAdmin
      ? 'Delete this group? This will remove all trips and member data permanently.'
      : 'Leave this group?';
    if (!confirm(msg)) return;
    setLeaving(true);
    try {
      await fetch(`/api/wander/groups/${groupCode}/leave`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId }),
      });
      try { localStorage.removeItem(`wander_member_${groupCode}`); } catch {}
      window.location.href = '/customer/dashboard?tab=tour';
    } catch {}
    finally { setLeaving(false); }
  };

  // ── Update group ───────────────────────────────────────────────────────────
  const handleUpdateGroup = async (newEmoji?: string) => {
    if (!myMemberId || !isAdmin) return;
    setSavingEdit(true);
    try {
      await fetch(`/api/wander/groups/${groupCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId, name: editName, emoji: newEmoji || group.emoji }),
      });
      await fetchGroup();
      setShowSettings(false);
      setShowEmojiPicker(false);
    } catch {}
    finally { setSavingEdit(false); }
  };

  // ── Mark chat read when opening chat tab ──────────────────────────────────
  useEffect(() => {
    if (activeTab === 'chat' && isMember && myMemberId) {
      fetch(`/api/wander/groups/${groupCode}/chat/read`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId }),
      }).catch(() => {});
    }
  }, [activeTab, isMember, myMemberId]);

  // ── Feature 1: Remove member ───────────────────────────────────────────────
  const handleRemoveMember = async (targetMemberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the group?`)) return;
    try {
      await fetch(`/api/wander/groups/${groupCode}/members/${targetMemberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminMemberId: myMemberId }),
      });
      await fetchGroup();
    } catch {}
  };

  // ── Feature 2: Pin date ───────────────────────────────────────────────────
  const handlePinDate = async (tripId: string, optionId: string) => {
    try {
      await fetch(`/api/wander/groups/${groupCode}/trips/${tripId}/manage?action=pin-date`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId, optionId }),
      });
      await fetchGroup();
      alert('Date pinned as official travel date!');
    } catch {}
  };

  // ── Feature 3: Nudge MAYBE members ───────────────────────────────────────
  const handleNudge = async () => {
    try {
      const res = await fetch(`/api/wander/groups/${groupCode}/nudge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminMemberId: myMemberId }),
      });
      const d = await res.json();
      alert(`Nudged ${d.nudgedCount || 0} members!`);
    } catch {}
  };

  // ── Delete trip ───────────────────────────────────────────────────────────
  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Remove this cancelled trip from the group?')) return;
    try {
      await fetch(`/api/wander/groups/${groupCode}/trips/${tripId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId }),
      });
      await fetchGroup();
    } catch {}
  };

  // ── Feature 4: Cancel trip ────────────────────────────────────────────────
  const handleCancelTrip = async (tripId: string) => {
    if (!confirm('Cancel this trip?')) return;
    try {
      await fetch(`/api/wander/groups/${groupCode}/trips/${tripId}/manage?action=cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId }),
      });
      await fetchGroup();
    } catch {}
  };

  // ── Feature 5: Change tour ────────────────────────────────────────────────
  const handleChangeTour = async (tripId: string, listingId: string, listingTitle: string) => {
    if (!listingId) return;
    try {
      await fetch(`/api/wander/groups/${groupCode}/trips/${tripId}/manage?action=change-tour`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId, listingId, listingTitle }),
      });
      await fetchGroup();
    } catch {}
  };

  // ── Add Tour (propose new trip) ───────────────────────────────────────────
  const handleAddTour = async (listingId: string) => {
    if (!listingId || !myMemberId) return;
    try {
      await fetch(`/api/wander/groups/${groupCode}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, proposedByMemberId: myMemberId }),
      });
      await fetchGroup();
    } catch {}
  };

  // ── Feature 6: Message reaction ───────────────────────────────────────────
  const handleReact = async (messageId: string, emoji: string) => {
    if (!myMemberId) return;
    setReactingTo(messageId);
    try {
      await fetch(`/api/wander/groups/${groupCode}/chat/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId, messageId, emoji }),
      });
      await fetchChat();
    } catch {}
    finally { setReactingTo(null); }
  };

  // ── Feature 7: Group avatar upload ───────────────────────────────────────
  const handleAvatarUpload = async (file: File) => {
    if (!file || !isAdmin) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('memberId', myMemberId);
      await fetch(`/api/wander/groups/${groupCode}/avatar`, {
        method: 'POST',
        body: formData,
      });
      await fetchGroup();
    } catch {}
    finally { setAvatarUploading(false); }
  };

  // ── Feature 9: Max members ────────────────────────────────────────────────
  const handleSaveMaxMembers = async () => {
    if (!maxMembersValue || !myMemberId || !isAdmin) return;
    try {
      await fetch(`/api/wander/groups/${groupCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId, maxMembers: parseInt(maxMembersValue) }),
      });
      await fetchGroup();
      setShowMaxMembersInput(false);
      setMaxMembersValue('');
    } catch {}
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-700 mb-2">Group not found</h2>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Link href="/wander" className="text-emerald-600 hover:underline text-sm">← Browse Tours</Link>
        </div>
      </div>
    );
  }

  const trips   = group?.trips   || [];
  const members = group?.members || [];
  const planningTrips  = trips.filter((t: any) => t.status === 'PLANNING');
  const historicTrips  = trips.filter((t: any) => t.status !== 'PLANNING');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center mb-4">
            {/* Avatar / Emoji + name */}
            <div className="relative inline-block mb-3">
              {/* Hidden file input for avatar upload */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }}
              />

              {group?.avatarUrl ? (
                <div className="relative">
                  <img
                    src={group.avatarUrl}
                    alt="Group"
                    className={`w-16 h-16 rounded-2xl object-cover mx-auto ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''} transition`}
                    onClick={() => isAdmin && setShowEmojiPicker(v => !v)}
                  />
                  {avatarUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </div>
                  )}
                  {isAdmin && <span className="absolute -bottom-1 -right-1 bg-white/30 rounded-full text-[9px] px-1 py-0.5 font-bold">edit</span>}
                </div>
              ) : (
                <button
                  onClick={() => isAdmin && setShowEmojiPicker(v => !v)}
                  className={`w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto text-3xl ${isAdmin ? 'cursor-pointer hover:bg-white/30' : ''} transition`}
                >
                  {avatarUploading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : (group?.emoji || '🌏')}
                </button>
              )}
              {isAdmin && !group?.avatarUrl && <span className="absolute -bottom-1 -right-1 bg-white/30 rounded-full text-[9px] px-1 py-0.5 font-bold">edit</span>}

              {/* Emoji picker (with Upload Photo option) */}
              {showEmojiPicker && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-xl p-3 z-20 w-56">
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {EMOJI_OPTIONS.map(e => (
                      <button key={e} onClick={() => handleUpdateGroup(e)}
                        className={`text-xl hover:bg-emerald-50 rounded-lg p-1 transition ${group?.emoji === e ? 'bg-emerald-100 ring-2 ring-emerald-400' : ''}`}
                      >{e}</button>
                    ))}
                  </div>
                  <button
                    onClick={() => { setShowEmojiPicker(false); avatarInputRef.current?.click(); }}
                    className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
                  >
                    📷 Upload Photo
                  </button>
                </div>
              )}
            </div>

            <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Group Trip</p>
            <h1 className="text-2xl font-black mb-2">{group?.name}</h1>
            <div className="flex items-center justify-center gap-4 text-sm text-emerald-100">
              <button onClick={() => setShowMembers(v => !v)}
                className="flex items-center gap-1.5 hover:text-white transition">
                <Users className="w-3.5 h-3.5" />
                {members.length} member{members.length !== 1 ? 's' : ''}
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{showMembers ? '▲' : '▼'}</span>
              </button>
              <span className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> {trips.length} trip{trips.length !== 1 ? 's' : ''}</span>
              {isAdmin && (
                <button onClick={() => { setEditName(group?.name || ''); setShowSettings(v => !v); }}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition text-xs font-semibold">
                  <Settings className="w-3 h-3" /> Settings
                </button>
              )}
            </div>

            {/* Members dropdown */}
            {showMembers && (
              <div className="mt-3 bg-white/15 rounded-2xl overflow-hidden">
                {members.map((m: any, i: number) => (
                  <div key={m.id} className={`flex items-center gap-3 px-4 py-2.5 ${i !== 0 ? 'border-t border-white/10' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${m.role === 'ADMIN' ? 'bg-white text-emerald-700' : 'bg-white/30 text-white'}`}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm text-white font-semibold flex-1">{m.name}</p>
                    {m.role === 'ADMIN' && <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Admin</span>}
                    {m.id === myMemberId && <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">You</span>}
                    {isAdmin && m.role !== 'ADMIN' && m.id !== myMemberId && (
                      <button
                        onClick={() => handleRemoveMember(m.id, m.name)}
                        className="w-5 h-5 flex items-center justify-center bg-red-400/30 hover:bg-red-400/60 rounded-full text-white text-xs transition flex-shrink-0"
                        title="Remove member"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Settings panel (admin) */}
            {showSettings && isAdmin && (
              <div className="mt-3 bg-white/15 rounded-2xl p-4 space-y-3 text-left">
                <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">⚙️ Group Settings</p>

                {/* Change photo */}
                <button
                  onClick={() => { setShowSettings(false); setTimeout(() => avatarInputRef.current?.click(), 200); }}
                  className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2.5 transition text-left">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
                    {group?.avatarUrl
                      ? <img src={group.avatarUrl} className="w-9 h-9 object-cover" />
                      : <span className="text-lg">{group?.emoji || '🌏'}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white">Change Group Photo</p>
                    <p className="text-[10px] text-emerald-200">Tap to upload from device</p>
                  </div>
                  <span className="text-emerald-200 text-xs">→</span>
                </button>

                {/* Group name */}
                <div className="flex gap-2">
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/20 text-white placeholder-emerald-200 text-sm focus:outline-none"
                    placeholder="Group name"
                  />
                  <button onClick={() => handleUpdateGroup()} disabled={savingEdit}
                    className="px-3 py-2 bg-white text-emerald-700 font-bold rounded-xl text-xs disabled:opacity-60">
                    {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                  </button>
                </div>
                {/* Max members */}
                <div>
                  <button
                    onClick={() => setShowMaxMembersInput(v => !v)}
                    className="text-xs text-emerald-200 hover:text-white font-medium flex items-center gap-1 transition"
                  >
                    <Users className="w-3 h-3" />
                    Max Members {group?.maxMembers ? `(currently ${group.maxMembers})` : '(no limit)'}
                    {showMaxMembersInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {showMaxMembersInput && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="number"
                        min="2"
                        value={maxMembersValue}
                        onChange={e => setMaxMembersValue(e.target.value)}
                        placeholder="e.g. 20"
                        className="flex-1 px-3 py-2 rounded-xl bg-white/20 text-white placeholder-emerald-200 text-sm focus:outline-none"
                      />
                      <button
                        onClick={handleSaveMaxMembers}
                        disabled={!maxMembersValue}
                        className="px-3 py-2 bg-white text-emerald-700 font-bold rounded-xl text-xs disabled:opacity-60"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Invite section */}
          <div className="bg-white/15 rounded-2xl p-4 space-y-3">
            <p className="text-xs text-emerald-100 font-semibold text-center uppercase tracking-wider">Invite Friends</p>
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-emerald-200 mb-0.5">Invite Link</p>
                <a
                  href={typeof window !== 'undefined' ? `${window.location.origin}/wander/group/${groupCode}` : `/wander/group/${groupCode}`}
                  className="text-xs text-white font-medium truncate block underline underline-offset-2 decoration-white/40 hover:decoration-white"
                >
                  {typeof window !== 'undefined' ? `${window.location.origin}/wander/group/${groupCode}` : `/wander/group/${groupCode}`}
                </a>
              </div>
              <button onClick={handleCopyLink}
                className="shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm py-2.5 rounded-xl transition">
                <Copy className="w-3.5 h-3.5" /> Copy Link
              </button>
              {/* WhatsApp */}
              <button onClick={handleWhatsAppShare}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm py-2.5 rounded-xl transition">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </button>
            </div>
          </div>

          {/* Member + leave */}
          {isMember && (
            <div className="mt-3 flex items-center justify-between bg-white/15 rounded-xl px-4 py-2">
              <p className="text-xs text-emerald-100">
                {isAdmin ? '👑 You are the group admin' : '✅ You are a member'}
              </p>
              <button onClick={handleLeave} disabled={leaving}
                className="flex items-center gap-1 text-xs text-red-300 hover:text-red-200 transition">
                {leaving ? <Loader2 className="w-3 h-3 animate-spin" /> : isAdmin ? <Trash2 className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                {isAdmin ? 'Delete Group' : 'Leave'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs (only for members) */}
      {isMember && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="flex bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {[
              { key: 'trips', label: 'Trips', icon: Compass, count: trips.length },
              { key: 'chat', label: 'Chat', icon: MessageCircle, count: messages.length },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition ${
                  activeTab === tab.key
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* ── CHAT TAB ── */}
        {isMember && activeTab === 'chat' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Group Chat
              </p>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {loadingChat && messages.length === 0 && (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-emerald-400" /></div>
              )}
              {messages.length === 0 && !loadingChat && (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No messages yet. Say hi!</p>
                </div>
              )}
              {messages.map((msg: any, idx: number) => {
                const isMe = msg.member?.id === myMemberId;
                const isLast = idx === messages.length - 1;
                const REACTION_EMOJIS = ['👍', '❤️', '😄', '😮', '😢'];

                // Build reaction counts and my reactions
                const reactionMap: Record<string, { count: number; mine: boolean }> = {};
                (msg.reactions || []).forEach((r: any) => {
                  if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { count: 0, mine: false };
                  reactionMap[r.emoji].count++;
                  if (r.memberId === myMemberId) reactionMap[r.emoji].mine = true;
                });

                // Read receipts for last message
                const seenBy = isLast
                  ? (memberReads || []).filter((mr: any) => {
                      if (mr.memberId === msg.member?.id) return false;
                      if (mr.memberId === myMemberId) return false;
                      return mr.lastReadAt && new Date(mr.lastReadAt) >= new Date(msg.createdAt);
                    })
                  : [];

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2 w-full`}>
                      {!isMe && (
                        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                          {(msg.member?.name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isMe && (
                          <p className="text-[10px] text-gray-400 mb-0.5 ml-1 font-medium">{msg.member?.name}</p>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-tr-sm'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                        }`}>
                          {msg.message}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5 mx-1">{timeAgo(msg.createdAt)}</p>

                        {/* Existing reactions display */}
                        {Object.keys(reactionMap).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 mx-1">
                            {Object.entries(reactionMap).map(([emoji, data]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReact(msg.id, emoji)}
                                className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition ${
                                  data.mine
                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {emoji} <span className="text-[10px] font-semibold">{data.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Reaction picker */}
                        {isMember && (
                          <div className="flex gap-0.5 mt-1 mx-1">
                            {['👍', '❤️', '😄', '😮', '😢'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleReact(msg.id, emoji)}
                                disabled={reactingTo === msg.id}
                                className="text-sm opacity-30 hover:opacity-100 transition-opacity hover:scale-125 transform"
                                title={`React with ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Feature 8: Read receipts on last message */}
                    {isLast && seenBy.length > 0 && (
                      <p className={`text-[9px] text-gray-400 mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-9'}`}>
                        Seen by: {seenBy.map((mr: any) => mr.member?.name || mr.memberId).join(', ')}
                      </p>
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2 p-3 border-t border-gray-100 bg-white">
              <input
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button type="submit" disabled={sendingMsg || !chatMsg.trim()}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition">
                {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}

        {/* ── TRIPS TAB ── */}
        {(!isMember || activeTab === 'trips') && (
          <>
            {/* Planning trips */}
            {planningTrips.map((trip: any) => (
              <TripCard
                key={trip.id}
                trip={trip}
                members={members}
                myMemberId={myMemberId}
                isAdmin={isAdmin}
                isMember={isMember}
                groupCode={String(groupCode)}
                onRespond={handleRespond}
                responding={responding}
                onSubmit={handleSubmit}
                submitting={submitting}
                submitted={submitted}
                submitError={submitError}
                submitDate={submitDate}
                setSubmitDate={setSubmitDate}
                submitGroupSize={submitGroupSize}
                setSubmitGroupSize={setSubmitGroupSize}
                submitPickup={submitPickup}
                setSubmitPickup={setSubmitPickup}
                submitReqs={submitReqs}
                setSubmitReqs={setSubmitReqs}
                setSubmitError={setSubmitError}
                onAddDate={handleAddDate}
                onVoteDate={handleVoteDate}
                newVoteDate={newVoteDate}
                setNewVoteDate={setNewVoteDate}
                addingDate={addingDate}
                setAddingDate={setAddingDate}
                onNudge={handleNudge}
                onCancel={handleCancelTrip}
                onDelete={handleDeleteTrip}
                onChangeTour={handleChangeTour}
                onPinDate={handlePinDate}
              />
            ))}

            {/* Historic trips */}
            {historicTrips.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">Past Trips</p>
                {historicTrips.map((trip: any) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    members={members}
                    myMemberId={myMemberId}
                    isAdmin={isAdmin}
                    isMember={isMember}
                    groupCode={String(groupCode)}
                    onRespond={handleRespond}
                    responding={responding}
                    onSubmit={handleSubmit}
                    submitting={false}
                    submitted={false}
                    submitError=""
                    submitDate={submitDate}
                    setSubmitDate={setSubmitDate}
                    submitGroupSize={submitGroupSize}
                    setSubmitGroupSize={setSubmitGroupSize}
                    submitPickup={submitPickup}
                    setSubmitPickup={setSubmitPickup}
                    submitReqs={submitReqs}
                    setSubmitReqs={setSubmitReqs}
                    setSubmitError={setSubmitError}
                    onAddDate={handleAddDate}
                    onVoteDate={handleVoteDate}
                    newVoteDate={newVoteDate}
                    setNewVoteDate={setNewVoteDate}
                    addingDate={addingDate}
                    setAddingDate={setAddingDate}
                    onNudge={handleNudge}
                    onCancel={handleCancelTrip}
                    onChangeTour={handleChangeTour}
                    onPinDate={handlePinDate}
                  />
                ))}
              </div>
            )}

            {/* Admin: Add Tour button */}
            {isAdmin && isMember && (
              <button
                onClick={() => setShowAddTourPicker(true)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-300 text-emerald-700 font-bold text-sm py-3 rounded-2xl transition"
              >
                <Plus className="w-4 h-4" /> Add Tour to Group
              </button>
            )}

            {trips.length === 0 && !isAdmin && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <Compass className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No trips proposed yet</p>
                <p className="text-xs text-gray-400 mt-1">Browse a tour and click "Plan with Friends"</p>
              </div>
            )}

            {/* Tour Picker Modal for Add Tour */}
            {showAddTourPicker && (
              <TourPickerModal
                title="Add Tour to Group"
                onSelect={(id, title) => { handleAddTour(id); setShowAddTourPicker(false); }}
                onClose={() => setShowAddTourPicker(false)}
              />
            )}

            {/* Join section (non-members) */}
            {!isMember && (
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Join this Group Trip
                  </h2>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    {name ? `Joining as ${name}` : 'Add your details to join the planning'}
                  </p>
                </div>
                <div className="p-5">
                  {useOneClick ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                        <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{name}</p>
                          <p className="text-xs text-gray-500">{phone}</p>
                        </div>
                      </div>
                      {joinError && <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {joinError}</p>}
                      <button onClick={handleJoin as any} disabled={joining}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                        {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {joining ? 'Joining...' : 'Join Group'}
                      </button>
                      <p className="text-center text-xs text-gray-400">
                        Not you?{' '}
                        <button onClick={() => { setName(''); setPhone(''); setUseOneClick(false); }} className="text-emerald-600 underline">
                          Join with different details
                        </button>
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleJoin} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name"
                            className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email *</label>
                        <input value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="your@email.com" type="email" required
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Phone Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input value={phone}
                            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            required placeholder="10-digit mobile" type="text" inputMode="numeric"
                            className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Password *</label>
                        <div className="relative">
                          <input value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="Min 8 characters" type={showPass ? 'text' : 'password'} required
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-14" />
                          <button type="button" onClick={() => setShowPass(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium">
                            {showPass ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                      {joinError && <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {joinError}</p>}
                      <button type="submit" disabled={joining}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                        {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {joining ? 'Joining...' : 'Join Group'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <button onClick={() => { setLoading(true); fetchGroup(); }}
          className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 py-2 transition">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
        <p className="text-center text-xs text-gray-400 pb-4">
          <Link href="/wander" className="text-emerald-500 hover:underline">← Browse all tours</Link>
        </p>
      </div>
    </div>
  );
}

/* ── Tour Picker Modal ────────────────────────────────────────────────────── */
function TourPickerModal({ title, onSelect, onClose }: { title: string; onSelect: (id: string, title: string) => void; onClose: () => void }) {
  const [listings, setListings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    fetch('/api/wander/listings')
      .then(r => r.json())
      .then(d => setListings(Array.isArray(d) ? d : (d?.listings || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = listings.filter(l =>
    !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-bold text-gray-900">{title}</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tours..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        {/* List */}
        <div className="overflow-y-auto flex-1 py-2">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">No tours found</p>
          )}
          {!loading && filtered.map((l: any) => {
            const images = (() => { try { return JSON.parse(l.images || '[]'); } catch { return []; } })();
            const cover = images[0];
            return (
              <button key={l.id} onClick={() => onSelect(l.id, l.title)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition text-left">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  {cover
                    ? <img src={cover} alt={l.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xl opacity-30">{l.category?.icon || '🗺️'}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{l.title}</p>
                  <p className="text-xs text-gray-400 truncate">{l.category?.name || ''} {l.duration ? `· ${l.duration}` : ''}</p>
                </div>
                {l.basePrice && (
                  <p className="text-xs font-bold text-emerald-700 flex-shrink-0">₹{Number(l.basePrice).toLocaleString('en-IN')}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Trip Card ─────────────────────────────────────────────────────────────── */
function TripCard({
  trip, members, myMemberId, isAdmin, isMember, groupCode,
  onRespond, responding,
  onSubmit, submitting, submitted, submitError,
  submitDate, setSubmitDate, submitGroupSize, setSubmitGroupSize,
  submitPickup, setSubmitPickup, submitReqs, setSubmitReqs, setSubmitError,
  onAddDate, onVoteDate, newVoteDate, setNewVoteDate, addingDate, setAddingDate,
  onNudge, onCancel, onDelete, onChangeTour, onPinDate,
}: any) {
  const images       = safeJson(trip.listing?.images, []);
  const cover        = images[0];
  const goingMembers = trip.tripMembers?.filter((m: any) => m.isGoing === 'YES') || [];
  const maybeCount   = trip.tripMembers?.filter((m: any) => m.isGoing === 'MAYBE').length || 0;
  const noCount      = trip.tripMembers?.filter((m: any) => m.isGoing === 'NO').length || 0;
  const myResponse   = trip.tripMembers?.find((m: any) => m.groupMemberId === myMemberId);
  const canSubmit    = isAdmin && trip.status === 'PLANNING' && goingMembers.length > 0;
  const isHistoric   = trip.status !== 'PLANNING';

  // Local group size — always starts from confirmed going count, admin can override
  const [localGroupSize, setLocalGroupSize] = React.useState(String(goingMembers.length || 1));
  React.useEffect(() => {
    setLocalGroupSize(String(goingMembers.length));
    setSubmitGroupSize(String(goingMembers.length));
  }, [goingMembers.length]);

  // Local travel date — auto-fills from pinned date, admin can override
  const pinnedDateStr = trip.travelDate ? new Date(trip.travelDate).toISOString().split('T')[0] : '';
  const [localDate, setLocalDate] = React.useState(pinnedDateStr);
  React.useEffect(() => {
    if (pinnedDateStr) {
      setLocalDate(pinnedDateStr);
      setSubmitDate(pinnedDateStr);
    }
  }, [pinnedDateStr]);

  // Change tour state
  const [showChangeTourPicker, setShowChangeTourPicker] = React.useState(false);

  // 48hr reminder indicator
  const hoursSinceCreated = (Date.now() - new Date(trip.createdAt).getTime()) / 3600000;
  const showReminder = isMember && !isAdmin && myResponse?.isGoing === 'MAYBE' && hoursSinceCreated >= 24 && trip.status === 'PLANNING';

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${isHistoric ? 'border-gray-100 opacity-80' : 'border-gray-100'}`}>
      {cover && (
        <div className="h-40 overflow-hidden relative">
          <img src={cover} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className={`absolute top-3 right-3 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
            trip.status === 'SUBMITTED' ? 'bg-violet-500' : trip.status === 'CANCELLED' ? 'bg-red-500' : 'bg-emerald-500'
          }`}>
            {trip.status === 'PLANNING' ? '🗓 Planning' : trip.status === 'SUBMITTED' ? '✅ Submitted' : '❌ Cancelled'}
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {showReminder && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <span className="text-base">⏰</span>
            <p className="text-xs text-amber-700 font-medium">The group is waiting for your response!</p>
          </div>
        )}

        {trip.listing ? (
          <div>
            <h3 className="font-bold text-gray-900 text-base">{trip.listing.title}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {trip.listing.mainLocation?.name && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-500" /> {trip.listing.mainLocation.name}
                </span>
              )}
              {trip.listing.duration && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-500" /> {trip.listing.duration}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Tour not selected yet</p>
        )}

        {trip.travelDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            Planned: <span className="font-semibold">{fmtDate(trip.travelDate)}</span>
          </div>
        )}

        {trip.note && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 italic">"{trip.note}"</p>
        )}

        {/* Response counts */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" /> {goingMembers.length} Going
          </span>
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> {maybeCount} Maybe
          </span>
          {noCount > 0 && (
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1.5 rounded-full flex items-center gap-1">
              <X className="w-3 h-3" /> {noCount} No
            </span>
          )}
        </div>

        {/* Admin actions: Nudge, Cancel, Change Tour */}
        {isAdmin && trip.status === 'PLANNING' && (
          <div className="flex flex-wrap gap-2">
            {maybeCount > 0 && onNudge && (
              <button
                onClick={onNudge}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-full transition"
              >
                Nudge 🔔 ({maybeCount} maybe)
              </button>
            )}
            {onCancel && trip.status === 'PLANNING' && (
              <button
                onClick={() => onCancel(trip.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-full transition"
              >
                <X className="w-3 h-3" /> Cancel Trip
              </button>
            )}
            {onDelete && trip.status === 'CANCELLED' && (
              <button
                onClick={() => onDelete(trip.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full transition"
              >
                <Trash2 className="w-3 h-3" /> Remove from Group
              </button>
            )}
            {onChangeTour && (
              <button
                onClick={() => setShowChangeTourPicker(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full transition"
              >
                <RefreshCw className="w-3 h-3" /> Change Tour
              </button>
            )}
          </div>
        )}

        {/* Change Tour Picker Modal */}
        {showChangeTourPicker && (
          <TourPickerModal
            title="Change Tour"
            onSelect={(id, title) => { onChangeTour(trip.id, id, title); setShowChangeTourPicker(false); }}
            onClose={() => setShowChangeTourPicker(false)}
          />
        )}

        {/* Date Voting (PLANNING trips only) */}
        {trip.status === 'PLANNING' && isMember && (
          <DateVotingSection
            trip={trip}
            myMemberId={myMemberId}
            isAdmin={isAdmin}
            onAddDate={onAddDate}
            onVoteDate={onVoteDate}
            onPinDate={onPinDate}
            newVoteDate={newVoteDate}
            setNewVoteDate={setNewVoteDate}
            addingDate={addingDate}
            setAddingDate={setAddingDate}
          />
        )}

        {/* Admin: member responses */}
        {isAdmin && trip.tripMembers?.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Member Responses</p>
            {trip.tripMembers.map((tm: any) => {
              const memberName = members.find((m: any) => m.id === tm.groupMemberId)?.name || 'Unknown';
              const cfg = tm.isGoing === 'YES'
                ? { emoji: '✅', color: 'text-emerald-700' }
                : tm.isGoing === 'NO'
                ? { emoji: '❌', color: 'text-red-600' }
                : { emoji: '🤔', color: 'text-amber-600' };
              return (
                <div key={tm.id} className="flex items-start gap-2">
                  <span className="text-sm">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${cfg.color}`}>{memberName}</p>
                    {tm.requirements && <p className="text-[11px] text-gray-400 mt-0.5">"{tm.requirements}"</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* My response widget (members, not admin) */}
        {isMember && !isAdmin && myMemberId && myResponse && trip.status === 'PLANNING' && (
          <TripResponseWidget
            tripId={trip.id}
            currentResponse={myResponse.isGoing}
            currentRequirements={myResponse.requirements || ''}
            onRespond={onRespond}
            responding={responding}
          />
        )}

        {/* Submitted trip: quote details */}
        {trip.status === 'SUBMITTED' && trip.quoteRequest && (
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5 space-y-1">
            <p className="text-xs font-bold text-violet-700">Quote Request #{trip.quoteRequest.requestId}</p>
            <div className="flex items-center gap-3 text-xs text-violet-600">
              <span>👥 {trip.quoteRequest.groupSize} members</span>
              {trip.quoteRequest.travelDate && <span>📅 {fmtDate(trip.quoteRequest.travelDate)}</span>}
              <span className={`font-bold px-2 py-0.5 rounded-full ${
                trip.quoteRequest.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                trip.quoteRequest.status === 'QUOTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
              }`}>{trip.quoteRequest.status}</span>
            </div>
          </div>
        )}

        {/* Vendor Quotes — visible to ALL members */}
        {trip.status === 'SUBMITTED' && trip.quotes && trip.quotes.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">💼 Vendor Quotes ({trip.quotes.length})</p>
            {trip.quotes.map((q: any, idx: number) => {
              const inclusions: string[] = (() => { try { return JSON.parse(q.customInclusions || '[]'); } catch { return []; } })();
              const exclusions: string[] = (() => { try { return JSON.parse(q.customExclusions || '[]'); } catch { return []; } })();
              const isAccepted = q.status === 'ACCEPTED';
              const isRejected = q.status === 'REJECTED';
              return (
                <div key={q.id} className={`rounded-2xl border-2 p-4 ${isAccepted ? 'border-emerald-300 bg-emerald-50' : isRejected ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-800 truncate">{q.vendor?.businessName || `Vendor ${idx + 1}`}</p>
                    {isAccepted && <span className="text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full">✓ Accepted</span>}
                    {isRejected && <span className="text-[10px] font-bold bg-gray-200 text-gray-500 px-2.5 py-1 rounded-full">Rejected</span>}
                  </div>

                  <div className="mb-2">
                    <span className="text-2xl font-black text-gray-900">₹{Number(q.amount).toLocaleString('en-IN')}</span>
                    <span className="text-xs text-gray-400 ml-1">total</span>
                    {q.perPersonAmount && (
                      <span className="ml-3 text-sm text-gray-500">₹{Number(q.perPersonAmount).toLocaleString('en-IN')}/person</span>
                    )}
                  </div>

                  {q.validUntil && (
                    <p className="text-xs text-gray-400 mb-2">Valid till: {fmtDate(q.validUntil)}</p>
                  )}

                  {inclusions.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[11px] font-semibold text-emerald-700 mb-1">✅ Includes</p>
                      {inclusions.map((inc: string, i: number) => (
                        <p key={i} className="text-xs text-gray-600">• {inc}</p>
                      ))}
                    </div>
                  )}
                  {exclusions.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[11px] font-semibold text-red-600 mb-1">❌ Excludes</p>
                      {exclusions.map((exc: string, i: number) => (
                        <p key={i} className="text-xs text-gray-600">• {exc}</p>
                      ))}
                    </div>
                  )}
                  {q.notes && (
                    <p className="text-xs text-gray-400 italic mt-2">"{q.notes}"</p>
                  )}

                  {/* Accept button — admin only, PENDING quotes only */}
                  {isAdmin && q.status === 'PENDING' && trip.quoteRequestId && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/customer/wander-quote-requests/${trip.quoteRequestId}/accept`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ quoteId: q.id }),
                          });
                          if (res.ok) {
                            window.location.href = `/customer/wander-quotes/${trip.quoteRequestId}`;
                          } else alert('Failed to accept quote');
                        } catch { alert('Error accepting quote'); }
                      }}
                      className="mt-3 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Accept & Proceed to Payment
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Admin: submit form */}
        {canSubmit && (
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">Submit Group Quote</p>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Travel Date *</label>
              <input type="date" value={localDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => { setLocalDate(e.target.value); setSubmitDate(e.target.value); setSubmitError(''); }}
                className="w-full px-3 py-2 border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600">Group Size</label>
                <span className="text-xs text-emerald-600 font-semibold">✅ {goingMembers.length} confirmed going</span>
              </div>
              <input type="number" min="1" value={localGroupSize}
                onChange={e => { setLocalGroupSize(e.target.value); setSubmitGroupSize(e.target.value); }}
                className="w-full px-3 py-2 border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Pickup Location</label>
              <input type="text" value={submitPickup}
                onChange={e => setSubmitPickup(e.target.value)}
                placeholder="Hotel name / area"
                className="w-full px-3 py-2 border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Additional Requirements</label>
              <textarea value={submitReqs}
                onChange={e => setSubmitReqs(e.target.value)}
                placeholder="Any group-level special requests..."
                rows={2}
                className="w-full px-3 py-2 border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white resize-none"
              />
            </div>
            {submitError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {submitError}
              </p>
            )}
            {submitted && (
              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Quote submitted! Redirecting...
              </p>
            )}
            <button onClick={() => onSubmit(trip.id)}
              disabled={submitting || !submitDate}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Submitting...' : `Submit Quote Request (${goingMembers.length} going)`}
            </button>
            <p className="text-[10px] text-gray-400 text-center">Vendors will receive a group booking request</p>
          </div>
        )}

        {trip.listing && (
          <Link href={`/wander/${trip.listing.slug || trip.listing.id}`}
            className="flex items-center justify-between text-sm text-emerald-600 hover:text-emerald-700 font-medium pt-1">
            View full tour details <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Date Voting Section ───────────────────────────────────────────────────── */
function DateVotingSection({ trip, myMemberId, isAdmin, onAddDate, onVoteDate, onPinDate, newVoteDate, setNewVoteDate, addingDate, setAddingDate }: any) {
  const options = trip.dateOptions || [];
  const [expanded, setExpanded] = useState(false);

  if (options.length === 0 && addingDate !== trip.id) {
    return (
      <button onClick={() => { setExpanded(true); setAddingDate(trip.id); }}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
        <Plus className="w-3.5 h-3.5" /> Suggest a date
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 text-xs font-bold text-blue-700">
        <Calendar className="w-3.5 h-3.5" /> Date Poll ({options.length} option{options.length !== 1 ? 's' : ''})
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="bg-blue-50 rounded-xl p-3 space-y-3">
          {options.map((opt: any) => {
            const myVote = opt.votes?.some((v: any) => v.memberId === myMemberId);
            const voterNames = (opt.votes || []).map((v: any) => v.member?.name || 'Someone');
            const isPinned = opt.isPinned;
            return (
              <div key={opt.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <button onClick={() => onVoteDate(trip.id, opt.id)}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                      isPinned
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : myVote ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-100'
                    }`}>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-bold flex items-center gap-1">
                        {isPinned && <span>📌</span>}
                        {fmtDate(opt.date)}
                      </span>
                      {opt.addedBy?.name && (
                        <span className={`text-[10px] font-normal ${(myVote || isPinned) ? 'text-blue-200' : 'text-gray-400'}`}>
                          suggested by {opt.addedBy.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{opt.votes?.length || 0}</span>
                    </div>
                  </button>
                  {isAdmin && onPinDate && !isPinned && (
                    <button
                      onClick={() => onPinDate(trip.id, opt.id)}
                      className="flex-shrink-0 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1.5 rounded-lg transition flex items-center gap-0.5"
                      title="Pin as official date"
                    >
                      📌 Pin
                    </button>
                  )}
                </div>
                {voterNames.length > 0 && (
                  <p className="text-[10px] text-blue-500 px-1">
                    👍 {voterNames.join(', ')}
                  </p>
                )}
              </div>
            );
          })}

          {addingDate === trip.id ? (
            <div className="flex gap-2">
              <input type="date" value={newVoteDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setNewVoteDate(e.target.value)}
                className="flex-1 px-2 py-1.5 border border-blue-200 rounded-lg text-xs focus:outline-none bg-white"
              />
              <button onClick={() => onAddDate(trip.id)}
                disabled={!newVoteDate}
                className="px-3 py-1.5 bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg">
                Add
              </button>
              <button onClick={() => setAddingDate(null)} className="px-2 py-1.5 text-gray-400 hover:text-gray-600 text-xs">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setAddingDate(trip.id)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <Plus className="w-3 h-3" /> Suggest another date
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Trip Response Widget ──────────────────────────────────────────────────── */
function TripResponseWidget({ tripId, currentResponse, currentRequirements, onRespond, responding }: {
  tripId: string; currentResponse: string; currentRequirements: string;
  onRespond: (tripId: string, isGoing: string, requirements: string) => void;
  responding: boolean;
}) {
  const [editing, setEditing]           = useState(false);
  const [isGoing, setIsGoing]           = useState(currentResponse);
  const [requirements, setRequirements] = useState(currentRequirements);

  useEffect(() => { setIsGoing(currentResponse); setRequirements(currentRequirements); }, [currentResponse, currentRequirements]);

  const handleSave = async () => {
    await onRespond(tripId, isGoing, requirements);
    setEditing(false);
  };

  const cfg = currentResponse === 'YES'
    ? { emoji: '✅', label: 'Going', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' }
    : currentResponse === 'NO'
    ? { emoji: '❌', label: 'Not going', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' }
    : { emoji: '🤔', label: 'Maybe', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' };

  if (!editing) {
    return (
      <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${cfg.bg} ${cfg.border}`}>
        <span className={`text-xs font-bold ${cfg.text}`}>{cfg.emoji} Your response: {cfg.label}</span>
        <button onClick={() => setEditing(true)}
          className="text-xs text-gray-500 hover:text-gray-700 underline font-medium">
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-600">Update your response</p>
        <button onClick={() => { setEditing(false); setIsGoing(currentResponse); setRequirements(currentRequirements); }}
          className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
      <div className="flex gap-2 mb-3">
        {[
          { val: 'YES', label: '✅ Yes', cls: 'emerald' },
          { val: 'MAYBE', label: '🤔 Maybe', cls: 'amber' },
          { val: 'NO', label: '❌ No', cls: 'red' },
        ].map(opt => (
          <button key={opt.val} type="button" onClick={() => setIsGoing(opt.val)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isGoing === opt.val
                ? opt.cls === 'emerald' ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                  : opt.cls === 'amber'   ? 'bg-amber-100 border-amber-400 text-amber-700'
                  : 'bg-red-100 border-red-400 text-red-700'
                : 'bg-white border-gray-200 text-gray-600'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
      {isGoing === 'YES' && (
        <textarea value={requirements} onChange={e => setRequirements(e.target.value)} rows={2}
          placeholder="Any special requirements? (dietary, room type, etc.)"
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
        />
      )}
      <button type="button" onClick={handleSave} disabled={responding}
        className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-60">
        {responding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        Save
      </button>
    </div>
  );
}
