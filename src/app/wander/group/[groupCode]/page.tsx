// Server component — generates OG meta tags for rich link previews
import { Metadata } from 'next';
import GroupInviteClient from './GroupInviteClient';

interface Props {
  params: { groupCode: string };
}

// Fetch group data server-side for OG tags
async function fetchGroupData(groupCode: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/wander/groups/${groupCode}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.group || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const group = await fetchGroupData(params.groupCode);

  if (!group) {
    return {
      title: 'Group Trip Invite | TransRentals Wander',
      description: 'Join a group trip on TransRentals Wander',
    };
  }

  const memberCount = group.members?.length || 0;
  const tripCount   = group.trips?.length || 0;
  const firstTrip   = group.trips?.[0];
  const tourName    = firstTrip?.listing?.title || '';

  const title       = `${group.name} — Group Trip Invite`;
  const description = tourName
    ? `Join "${group.name}" for ${tourName}! ${memberCount} member${memberCount !== 1 ? 's' : ''} are planning this trip. Click to join.`
    : `You're invited to join "${group.name}" group trip! ${memberCount} member${memberCount !== 1 ? 's' : ''} planning. Click to join.`;

  // Use tour cover image if available
  const images = (() => {
    try { return JSON.parse(firstTrip?.listing?.images || '[]'); } catch { return []; }
  })();
  const ogImage = images[0] || null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: group.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default function GroupInvitePage({ params }: Props) {
  return <GroupInviteClient />;
}
