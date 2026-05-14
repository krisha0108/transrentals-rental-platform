// @ts-nocheck
//
// Network chat service — polymorphic conversations between vendors and/or
// travel agents. Both /api/social/chat/* and /api/vendor/social/chat/* go
// through these functions so the rules are identical.
//
// Conversation slots (vendor_conversations):
//   * vendor↔vendor → uses (vendor1Id, vendor2Id) — IDs normalized so the
//     lexicographically smaller one is always slot 1
//   * vendor↔agent  → vendor in slot 1 (vendor1Id), agent in slot 2 (agent2Id)
//   * agent↔agent   → uses (agent1Id, agent2Id) normalized like vendor↔vendor
//
// Message sender (vendor_messages):
//   * senderType = 'vendor' → senderId set, senderAgentId null
//   * senderType = 'agent'  → senderId null,  senderAgentId set

import { prisma } from '@/lib/db/prisma';
import { SocialActor } from '@/lib/auth/social-auth';
import { notifyTravelAgent } from '@/lib/notifications/travel-agent-notify';

export type OtherRef =
  | { type: 'vendor'; id: string }
  | { type: 'agent'; id: string };

export class ChatError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

// Compute the slot mapping for a (me, other) pair so we can upsert / find by
// the right composite unique key. Returns null kind when both sides are the
// same identity (used for self-chat guard).
function slotMapping(me: SocialActor, other: OtherRef) {
  if (me.type === 'vendor' && other.type === 'vendor') {
    if (me.id === other.id) return null;
    const [a, b] = me.id < other.id ? [me.id, other.id] : [other.id, me.id];
    return {
      kind: 'vv' as const,
      where: { vendor1Id_vendor2Id: { vendor1Id: a, vendor2Id: b } },
      data: { vendor1Id: a, vendor2Id: b, agent1Id: null, agent2Id: null },
    };
  }
  if (me.type === 'agent' && other.type === 'agent') {
    if (me.id === other.id) return null;
    const [a, b] = me.id < other.id ? [me.id, other.id] : [other.id, me.id];
    return {
      kind: 'aa' as const,
      where: { agent1Id_agent2Id: { agent1Id: a, agent2Id: b } },
      data: { vendor1Id: null, vendor2Id: null, agent1Id: a, agent2Id: b },
    };
  }
  // mixed: vendor in slot 1, agent in slot 2 (so a vendor and agent always
  // share the same row regardless of who initiated the chat)
  const vendorId = me.type === 'vendor' ? me.id : other.id;
  const agentId  = me.type === 'agent'  ? me.id : other.id;
  return {
    kind: 'va' as const,
    where: { vendor1Id_agent2Id: { vendor1Id: vendorId, agent2Id: agentId } },
    data: { vendor1Id: vendorId, vendor2Id: null, agent1Id: null, agent2Id: agentId },
  };
}

// True if `actor` is a participant in this conversation row.
function isParticipant(actor: SocialActor, conv: any): boolean {
  if (actor.type === 'vendor') return conv.vendor1Id === actor.id || conv.vendor2Id === actor.id;
  return conv.agent1Id === actor.id || conv.agent2Id === actor.id;
}

// Given a conv row + the viewing actor, return the "other side" identity.
function resolveOther(actor: SocialActor, conv: any): OtherRef | null {
  if (actor.type === 'vendor') {
    if (conv.vendor1Id === actor.id && conv.vendor2Id) return { type: 'vendor', id: conv.vendor2Id };
    if (conv.vendor2Id === actor.id && conv.vendor1Id) return { type: 'vendor', id: conv.vendor1Id };
    if (conv.vendor1Id === actor.id && conv.agent2Id) return { type: 'agent', id: conv.agent2Id };
    if (conv.vendor2Id === actor.id && conv.agent1Id) return { type: 'agent', id: conv.agent1Id };
  } else {
    if (conv.agent1Id === actor.id && conv.agent2Id) return { type: 'agent', id: conv.agent2Id };
    if (conv.agent2Id === actor.id && conv.agent1Id) return { type: 'agent', id: conv.agent1Id };
    if (conv.agent1Id === actor.id && conv.vendor2Id) return { type: 'vendor', id: conv.vendor2Id };
    if (conv.agent2Id === actor.id && conv.vendor1Id) return { type: 'vendor', id: conv.vendor1Id };
  }
  return null;
}

// Project a vendor row / agent row to a unified "OtherVendor"-shaped object
// that the existing UI consumes (the vendor messages UI expects `businessName`).
function projectParticipant(row: any, type: 'vendor' | 'agent') {
  if (!row) return null;
  if (type === 'vendor') {
    return {
      id: row.id,
      type: 'vendor' as const,
      businessName: row.businessName,
      ownerName: row.ownerName,
      logo: row.logo ?? null,
      city: row.city ?? null,
    };
  }
  return {
    id: row.id,
    type: 'agent' as const,
    businessName: row.agencyName,
    ownerName: row.ownerName,
    logo: row.logo ?? null,
    city: row.city ?? null,
  };
}

async function resolveOtherProjected(actor: SocialActor, conv: any) {
  const other = resolveOther(actor, conv);
  if (!other) return null;
  if (other.type === 'vendor') {
    const v = await prisma.vendors.findUnique({
      where: { id: other.id },
      select: { id: true, businessName: true, ownerName: true, logo: true, city: true },
    });
    return projectParticipant(v, 'vendor');
  }
  const a = await prisma.travel_agents.findUnique({
    where: { id: other.id },
    select: { id: true, agencyName: true, ownerName: true, logo: true, city: true },
  });
  return projectParticipant(a, 'agent');
}

// Did *this actor* send this message? Polymorphic check.
function isMine(actor: SocialActor, msg: any): boolean {
  if (actor.type === 'vendor') return msg.senderType === 'vendor' && msg.senderId === actor.id;
  return msg.senderType === 'agent' && msg.senderAgentId === actor.id;
}

function actorOpposite(actor: SocialActor) {
  // Predicate for "incoming" messages (not sent by me)
  if (actor.type === 'vendor') {
    return { OR: [{ senderType: 'agent' }, { senderId: { not: actor.id } }] };
  }
  return { OR: [{ senderType: 'vendor' }, { senderAgentId: { not: actor.id } }] };
}

// ── List my conversations (vendor + agent) ───────────────────────────────────
export async function listConversations(actor: SocialActor) {
  const where = actor.type === 'vendor'
    ? { OR: [{ vendor1Id: actor.id }, { vendor2Id: actor.id }] }
    : { OR: [{ agent1Id: actor.id }, { agent2Id: actor.id }] };

  const conversations = await prisma.vendor_conversations.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    include: {
      vendor1: { select: { id: true, businessName: true, ownerName: true, logo: true, city: true } },
      vendor2: { select: { id: true, businessName: true, ownerName: true, logo: true, city: true } },
      agent1:  { select: { id: true, agencyName: true,  ownerName: true, logo: true, city: true } },
      agent2:  { select: { id: true, agencyName: true,  ownerName: true, logo: true, city: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, createdAt: true, senderId: true, senderAgentId: true, senderType: true, isRead: true },
      },
    },
  });

  // Per-conversation unread count
  const unreadCounts = await Promise.all(conversations.map(c =>
    prisma.vendor_messages.count({
      where: {
        conversationId: c.id,
        isRead: false,
        ...actorOpposite(actor),
      },
    })
  ));

  const result = conversations.map((c: any, i: number) => {
    // Pick "other" side
    let other: any = null;
    if (actor.type === 'vendor') {
      if (c.vendor1Id === actor.id) other = projectParticipant(c.vendor2 || c.agent2, c.vendor2 ? 'vendor' : 'agent');
      else if (c.vendor2Id === actor.id) other = projectParticipant(c.vendor1 || c.agent1, c.vendor1 ? 'vendor' : 'agent');
    } else {
      if (c.agent1Id === actor.id) other = projectParticipant(c.agent2 || c.vendor2, c.agent2 ? 'agent' : 'vendor');
      else if (c.agent2Id === actor.id) other = projectParticipant(c.agent1 || c.vendor1, c.agent1 ? 'agent' : 'vendor');
    }
    const lastMsg = c.messages[0] ?? null;
    return {
      id: c.id,
      other,
      lastMessage: lastMsg
        ? { content: lastMsg.content, createdAt: lastMsg.createdAt, isMine: isMine(actor, lastMsg) }
        : null,
      unreadCount: unreadCounts[i],
      lastMessageAt: c.lastMessageAt,
    };
  });

  return { conversations: result };
}

// ── Get or create a conversation with someone ────────────────────────────────
export async function getOrCreateConversation(actor: SocialActor, other: OtherRef) {
  if (!other?.id) throw new ChatError('other participant required', 400);
  const slot = slotMapping(actor, other);
  if (!slot) throw new ChatError('Cannot chat with yourself', 400);

  // Verify the other participant actually exists
  if (other.type === 'vendor') {
    const v = await prisma.vendors.findUnique({ where: { id: other.id }, select: { id: true } });
    if (!v) throw new ChatError('Vendor not found', 404);
  } else {
    const a = await prisma.travel_agents.findUnique({ where: { id: other.id }, select: { id: true } });
    if (!a) throw new ChatError('Agent not found', 404);
  }

  const conv = await prisma.vendor_conversations.upsert({
    where: slot.where as any,
    update: {},
    create: slot.data,
  });
  return { conversationId: conv.id };
}

// ── Load messages + the other side meta, mark incoming as read ───────────────
export async function getConversationMessages(actor: SocialActor, conversationId: string) {
  const conv = await prisma.vendor_conversations.findUnique({ where: { id: conversationId } });
  if (!conv) throw new ChatError('Conversation not found', 404);
  if (!isParticipant(actor, conv)) throw new ChatError('Conversation not found', 404);

  // Mark unread incoming messages as read
  await prisma.vendor_messages.updateMany({
    where: { conversationId, isRead: false, ...actorOpposite(actor) },
    data: { isRead: true },
  });

  const messages = await prisma.vendor_messages.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender:      { select: { id: true, businessName: true, logo: true } },
      senderAgent: { select: { id: true, agencyName: true,  logo: true } },
    },
  });

  // Surface a uniform shape the existing chat UI consumes (`senderId` +
  // `sender.businessName`). For agent senders we project agencyName as
  // businessName so the bubble renders identically.
  const projected = messages.map((m: any) => {
    const isAgent = m.senderType === 'agent';
    const stableSenderId = isAgent ? m.senderAgentId : m.senderId;
    const senderRow = isAgent
      ? (m.senderAgent ? { id: m.senderAgent.id, businessName: m.senderAgent.agencyName, logo: m.senderAgent.logo } : null)
      : (m.sender ? { id: m.sender.id, businessName: m.sender.businessName, logo: m.sender.logo } : null);
    return {
      id: m.id,
      content: m.content,
      senderId: stableSenderId,        // legacy field used by vendor UI
      senderType: m.senderType,
      isRead: m.isRead,
      createdAt: m.createdAt,
      isMine: isMine(actor, m),
      sender: senderRow,
    };
  });

  const other = await resolveOtherProjected(actor, conv);

  return { messages: projected, other };
}

// ── Send a message ───────────────────────────────────────────────────────────
export async function sendMessage(actor: SocialActor, conversationId: string, content: string) {
  if (!content?.trim()) throw new ChatError('Message cannot be empty', 400);
  const conv = await prisma.vendor_conversations.findUnique({ where: { id: conversationId } });
  if (!conv) throw new ChatError('Conversation not found', 404);
  if (!isParticipant(actor, conv)) throw new ChatError('Conversation not found', 404);

  const data: any = {
    conversationId,
    senderType: actor.type,
    content: content.trim(),
  };
  if (actor.type === 'vendor') data.senderId = actor.id;
  else data.senderAgentId = actor.id;

  const [msg] = await prisma.$transaction([
    prisma.vendor_messages.create({
      data,
      include: {
        sender:      { select: { id: true, businessName: true, logo: true } },
        senderAgent: { select: { id: true, agencyName: true,  logo: true } },
      },
    }),
    prisma.vendor_conversations.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  const m: any = msg;
  const isAgent = m.senderType === 'agent';
  const senderRow = isAgent
    ? (m.senderAgent ? { id: m.senderAgent.id, businessName: m.senderAgent.agencyName, logo: m.senderAgent.logo } : null)
    : (m.sender ? { id: m.sender.id, businessName: m.sender.businessName, logo: m.sender.logo } : null);

  // Notify the recipient agent (if any). Vendor recipients are not handled
  // here yet — vendor notifications still use the legacy settings hack.
  try {
    const other = resolveOther(actor, conv);
    if (other && other.type === 'agent') {
      const senderName = senderRow?.businessName || (actor.type === 'agent' ? actor.displayName : actor.displayName);
      await notifyTravelAgent(other.id, {
        type: 'CHAT',
        title: `Message from ${senderName}`,
        body: content.trim().slice(0, 140),
        link: `/travel-agent/social/messages/${conversationId}`,
        metadata: { conversationId, messageId: m.id, senderType: actor.type, senderId: actor.id },
      });
    }
  } catch { /* notifications are auxiliary, never block send */ }

  return {
    message: {
      id: m.id,
      content: m.content,
      senderId: isAgent ? m.senderAgentId : m.senderId,
      senderType: m.senderType,
      isRead: m.isRead,
      createdAt: m.createdAt,
      isMine: true,
      sender: senderRow,
    },
  };
}
