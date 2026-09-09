// Thin wrapper around the Meta Graph API for the admin "Social Media
// Performance" feature — connecting a Facebook Page (and its linked
// Instagram Business account) via OAuth, then pulling posts + insights.
//
// Docs:
//   OAuth:              https://developers.facebook.com/docs/facebook-login/guides/access-tokens
//   Pages:               https://developers.facebook.com/docs/graph-api/reference/page
//   Page posts/insights:  https://developers.facebook.com/docs/graph-api/reference/page-post/insights
//   Instagram Graph API:  https://developers.facebook.com/docs/instagram-api

const GRAPH_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export function getMetaAppId() {
  return process.env.FACEBOOK_APP_ID || '';
}

function getMetaAppSecret() {
  return process.env.FACEBOOK_APP_SECRET || '';
}

export function isMetaAppConfigured() {
  return !!(getMetaAppId() && getMetaAppSecret());
}

// The canonical app origin — deliberately NOT derived from the incoming
// request. This dev server binds to 0.0.0.0 (accessible as both
// localhost:3000 and 0.0.0.0:3000), but the NextAuth session cookie is only
// valid for whichever host the admin actually logged in on. Building
// redirects from request.url would bounce the browser back to whatever host
// it happened to hit the API on — if that's the "wrong" one for the cookie,
// the next request looks logged out. Always redirecting through this fixed
// base keeps the whole OAuth round-trip on one consistent origin.
export function getAppBaseUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return base.replace(/\/$/, '');
}

export function getOAuthRedirectUri() {
  return `${getAppBaseUrl()}/api/admin/social/facebook/callback`;
}

// The permissions we ask for. `pages_show_list`/`pages_read_engagement` cover
// Facebook Page posts + insights; the `instagram_*` ones only resolve to real
// data when the Page has a linked Instagram Business/Creator account.
const OAUTH_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_read_user_content', // comments.summary() on a post needs this specifically — pages_read_engagement alone 400s
  'read_insights',
  'instagram_basic',
  'instagram_manage_insights',
].join(',');

export function buildFacebookOAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: getMetaAppId(),
    redirect_uri: getOAuthRedirectUri(),
    state,
    scope: OAUTH_SCOPES,
    response_type: 'code',
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

class GraphApiError extends Error {
  constructor(message: string, public status: number, public body: any) {
    super(message);
    this.name = 'GraphApiError';
  }
}

async function graphGet<T = any>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GraphApiError(json?.error?.message || `Graph API request failed (${res.status})`, res.status, json);
  }
  return json as T;
}

// Step 1 of the token dance: the OAuth `code` from the callback redirect
// exchanges for a short-lived user access token.
export async function exchangeCodeForUserToken(code: string): Promise<{ access_token: string; expires_in?: number }> {
  return graphGet('/oauth/access_token', {
    client_id: getMetaAppId(),
    client_secret: getMetaAppSecret(),
    redirect_uri: getOAuthRedirectUri(),
    code,
  });
}

// Step 2: exchange the short-lived user token for a long-lived one (~60 days).
// Page access tokens minted from a long-lived user token don't expire on
// their own as long as the Page/user connection stays active.
export async function exchangeForLongLivedUserToken(shortLivedToken: string): Promise<{ access_token: string; expires_in?: number }> {
  return graphGet('/oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: getMetaAppId(),
    client_secret: getMetaAppSecret(),
    fb_exchange_token: shortLivedToken,
  });
}

export interface FacebookPageSummary {
  id: string;
  name: string;
  access_token: string;
  picture?: { data?: { url?: string } };
  instagram_business_account?: { id: string };
}

// "Facebook Login for Business" (the asset-picker consent flow — pick
// specific Pages/IG accounts rather than a blanket grant) issues a *limited*
// user token scoped to just those assets. /me/accounts, which lists every
// Page the classic Page-roles system says the user administers, reliably
// comes back empty for these tokens even when the picker's own review step
// showed the right Page — Meta's own docs point at inspecting the token's
// granular_scopes instead. This debugs the token with an app access token
// (app_id|app_secret, distinct from the user's token) and pulls the
// pages_show_list scope's target_ids: the Page ids actually granted.
async function getGrantedPageIds(userAccessToken: string): Promise<string[]> {
  const data = await graphGet<{ data?: { granular_scopes?: { scope: string; target_ids?: string[] }[] } }>('/debug_token', {
    input_token: userAccessToken,
    access_token: `${getMetaAppId()}|${getMetaAppSecret()}`,
  }).catch(() => ({ data: undefined }));

  const scopes = data.data?.granular_scopes || [];
  const pagesScope = scopes.find((s) => s.scope === 'pages_show_list' || s.scope === 'pages_read_engagement');
  return pagesScope?.target_ids || [];
}

// Every Page the connected user manages/admins, each with its own
// (already long-lived, given a long-lived user token) Page access token,
// plus the linked Instagram Business account id if one exists.
export async function listManagedPages(userAccessToken: string): Promise<FacebookPageSummary[]> {
  const data = await graphGet<{ data: FacebookPageSummary[] }>('/me/accounts', {
    fields: 'id,name,access_token,picture,instagram_business_account',
    access_token: userAccessToken,
  });
  if (data.data?.length) return data.data;

  // /me/accounts came back empty — fall back to the granular-scopes Page
  // ids and fetch each one directly (still using the user token; Meta
  // mints a Page access token in the response as long as that token has
  // the right permission on that specific Page).
  const pageIds = await getGrantedPageIds(userAccessToken);
  const pages = await Promise.all(
    pageIds.map((id) =>
      graphGet<FacebookPageSummary>(`/${id}`, {
        fields: 'id,name,access_token,picture,instagram_business_account',
        access_token: userAccessToken,
      }).catch(() => null)
    )
  );
  return pages.filter((p): p is FacebookPageSummary => p !== null);
}

export async function getInstagramAccountInfo(igBusinessAccountId: string, pageAccessToken: string) {
  return graphGet<{ id: string; username?: string; followers_count?: number; profile_picture_url?: string }>(
    `/${igBusinessAccountId}`,
    { fields: 'username,followers_count,profile_picture_url', access_token: pageAccessToken },
  );
}

export async function getFacebookPageFollowerCount(pageId: string, pageAccessToken: string) {
  const data = await graphGet<{ followers_count?: number; fan_count?: number }>(`/${pageId}`, {
    fields: 'followers_count,fan_count',
    access_token: pageAccessToken,
  });
  return data.followers_count ?? data.fan_count ?? null;
}

export interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  full_picture?: string;
  likes?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
  shares?: { count?: number };
}

// likes.summary()/comments.summary() on a Page's own posts intermittently
// 400 with error code 10 ("requires pages_read_engagement... or Page Public
// Content Access") even when the token genuinely carries
// pages_read_engagement / pages_read_user_content — a known, currently
// unresolved Meta platform issue (reported on their community forums), not
// something a permission grant on our end can fix. `shares` has no such
// restriction. Rather than let one flaky edge fail the whole sync, fall
// back to the fields that work — likes/comments read back as 0 until Meta's
// side is sorted out, instead of blocking every post from syncing at all.
const POST_FIELDS_FULL = 'id,message,created_time,permalink_url,full_picture,likes.summary(true),comments.summary(true),shares';
const POST_FIELDS_SAFE = 'id,message,created_time,permalink_url,full_picture,shares';

export async function listFacebookPagePosts(pageId: string, pageAccessToken: string, limit = 25): Promise<FacebookPost[]> {
  try {
    const data = await graphGet<{ data: FacebookPost[] }>(`/${pageId}/posts`, {
      fields: POST_FIELDS_FULL,
      limit: String(limit),
      access_token: pageAccessToken,
    });
    return data.data || [];
  } catch (err) {
    if (!(err instanceof GraphApiError) || err.body?.error?.code !== 10) throw err;
    const data = await graphGet<{ data: FacebookPost[] }>(`/${pageId}/posts`, {
      fields: POST_FIELDS_SAFE,
      limit: String(limit),
      access_token: pageAccessToken,
    });
    return data.data || [];
  }
}

// post_impressions/post_engaged_users aren't available for every post type,
// so this is best-effort — callers should tolerate a null/empty result.
export async function getFacebookPostInsights(postId: string, pageAccessToken: string) {
  try {
    const data = await graphGet<{ data: { name: string; values: { value: number }[] }[] }>(`/${postId}/insights`, {
      metric: 'post_impressions,post_engaged_users',
      access_token: pageAccessToken,
    });
    const byName: Record<string, number> = {};
    (data.data || []).forEach((m) => { byName[m.name] = m.values?.[0]?.value ?? 0; });
    return { impressions: byName.post_impressions ?? null, engagement: byName.post_engaged_users ?? null };
  } catch {
    return { impressions: null, engagement: null };
  }
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

export async function listInstagramMedia(igBusinessAccountId: string, pageAccessToken: string, limit = 25): Promise<InstagramMedia[]> {
  const data = await graphGet<{ data: InstagramMedia[] }>(`/${igBusinessAccountId}/media`, {
    fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
    limit: String(limit),
    access_token: pageAccessToken,
  });
  return data.data || [];
}

// Video/carousel posts support a `saved` metric that image posts don't —
// request the broadest set and let missing metrics fall back to null rather
// than failing the whole insights call.
export async function getInstagramMediaInsights(mediaId: string, mediaType: InstagramMedia['media_type'], pageAccessToken: string) {
  const metrics = mediaType === 'VIDEO' ? 'impressions,reach,saved' : 'impressions,reach,saved,engagement';
  try {
    const data = await graphGet<{ data: { name: string; values: { value: number }[] }[] }>(`/${mediaId}/insights`, {
      metric: metrics,
      access_token: pageAccessToken,
    });
    const byName: Record<string, number> = {};
    (data.data || []).forEach((m) => { byName[m.name] = m.values?.[0]?.value ?? 0; });
    return {
      impressions: byName.impressions ?? null,
      reach: byName.reach ?? null,
      saved: byName.saved ?? null,
      engagement: byName.engagement ?? null,
    };
  } catch {
    return { impressions: null, reach: null, saved: null, engagement: null };
  }
}
