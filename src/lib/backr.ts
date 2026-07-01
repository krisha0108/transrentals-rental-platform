/**
 * BACKR external API client — server-side only.
 * API key is read from process.env and never sent to the client bundle.
 */

const BASE_URL = (process.env.BACKR_BASE_URL ?? 'https://backrcoin.org').replace(/\/$/, '');
const EXT      = `${BASE_URL}/api/v1/external`.replace(/([^:])\/\//g, '$1/');

async function call<T>(path: string, method: 'GET' | 'POST', body?: object): Promise<T> {
  const apiKey = process.env.BACKR_API_KEY;
  if (!apiKey) throw new Error('[BACKR] BACKR_API_KEY is not set');

  const res = await fetch(`${EXT}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[BACKR] ${method} ${path} → HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.data as T;
}

/** Grant tokens + XP to a user on booking completion. Idempotent by idempotencyKey. */
export async function reward(params: {
  externalUserId: string;
  amount: number;
  reason: string;
  idempotencyKey: string;
  xp?: number;
}): Promise<void> {
  await call('/rewards/grant', 'POST', params);
}

/** Start SSO link flow — email + name help BACKR pre-fill the registration form. */
export async function initiateLink(params: {
  externalUserId: string;
  redirectUri: string;
  email?: string;
  name?: string;
  state?: string;
}): Promise<{ ssoUrl: string }> {
  return call('/auth/sso/initiate', 'POST', params);
}

export interface BackrIdentity {
  linked: boolean;
  wallet?: string;
  backrEmail?: string;
  xp?: number;
  level?: number;
}

/** Get linked status, wallet, XP and level for a user by their externalUserId. */
export async function getIdentity(externalUserId: string): Promise<BackrIdentity> {
  return call(`/identity/${encodeURIComponent(externalUserId)}`, 'GET');
}
