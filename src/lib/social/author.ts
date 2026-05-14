// @ts-nocheck
//
// Author serializer for social_* rows.
//
// Each row carries EITHER `vendor` or `agent` (never both). The UI needs
// a single uniform shape, so we project both to `author: { type, id, name, ... }`.
// We also keep the original `vendor` / `agent` fields on the response for
// backwards compatibility with the existing vendor UI.

type AnyAuthored = {
  vendor?: {
    id: string;
    businessName: string;
    ownerName: string | null;
    logo: string | null;
    city?: string | null;
  } | null;
  agent?: {
    id: string;
    agencyName: string;
    ownerName: string | null;
    logo: string | null;
    city?: string | null;
  } | null;
};

export type SerializedAuthor =
  | {
      type: 'vendor';
      id: string;
      name: string;
      ownerName: string | null;
      logo: string | null;
      city: string | null;
    }
  | {
      type: 'agent';
      id: string;
      name: string;
      ownerName: string | null;
      logo: string | null;
      city: string | null;
    }
  | null;

export function formatAuthor(row: AnyAuthored): SerializedAuthor {
  if (row.vendor) {
    return {
      type: 'vendor',
      id: row.vendor.id,
      name: row.vendor.businessName,
      ownerName: row.vendor.ownerName ?? null,
      logo: row.vendor.logo ?? null,
      city: row.vendor.city ?? null,
    };
  }
  if (row.agent) {
    return {
      type: 'agent',
      id: row.agent.id,
      name: row.agent.agencyName,
      ownerName: row.agent.ownerName ?? null,
      logo: row.agent.logo ?? null,
      city: row.agent.city ?? null,
    };
  }
  return null;
}

// For backwards compat with the existing vendor UI which renders `post.vendor`,
// project agent authors into the same shape (so the avatar/name still render).
// The UI can branch on `post.author.type` for type-specific behavior.
export function vendorShapedAuthor(row: AnyAuthored) {
  if (row.vendor) return row.vendor;
  if (row.agent) {
    return {
      id: row.agent.id,
      businessName: row.agent.agencyName,
      ownerName: row.agent.ownerName ?? null,
      logo: row.agent.logo ?? null,
      city: row.agent.city ?? null,
    };
  }
  return null;
}

// Standard include block for fetching the polymorphic author. Use this
// everywhere we select social_posts / social_post_comments to keep the
// projected shape consistent.
export const authorInclude = {
  vendor: { select: { id: true, businessName: true, ownerName: true, logo: true, city: true } },
  agent: { select: { id: true, agencyName: true, ownerName: true, logo: true, city: true } },
} as const;
