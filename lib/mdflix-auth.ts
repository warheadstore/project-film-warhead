import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'mdflix_session';
export const OAUTH_COOKIE = 'mdflix_oauth';
const SESSION_TTL = 30 * 24 * 60 * 60;
const OAUTH_TTL = 10 * 60;
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export type AuthUser = { id: string; name: string; email: string; picture: string };

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || '';
  return { clientId, clientSecret, redirectUri, ok: !!(clientId && clientSecret && redirectUri) };
}
const nowS = () => Math.floor(Date.now() / 1000);
const sign = (payload: string, secret: string) =>
  crypto.createHmac('sha256', `mdflix-cookie-v1|${secret}`).update(payload).digest('base64url');
function seal(value: object, secret: string) {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}
function unseal<T>(token: string | undefined, secret: string): T | null {
  if (!token || !secret) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return value && value.exp > nowS() ? value as T : null;
  } catch { return null; }
}
export function safeNext(value: string | null) {
  return value && /^\/(?!\/)[\w\-./?=&%]*$/.test(value) && !value.includes('//') && !/(^|\/)\.\.(\/|\?|$)/.test(value) ? value : '/';
}
export function cookieOptions(maxAge: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge };
}
export function getSessionUser(): AuthUser | null {
  const cfg = googleConfig();
  if (!cfg.ok) return null;
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = unseal<{ user: AuthUser; exp: number }>(token, cfg.clientSecret);
  return session?.user || null;
}
export function createSession(user: AuthUser) {
  const cfg = googleConfig();
  return seal({ user, exp: nowS() + SESSION_TTL }, cfg.clientSecret);
}
export function createOAuthState(state: string, verifier: string, next: string) {
  const cfg = googleConfig();
  return seal({ state, verifier, next, exp: nowS() + OAUTH_TTL }, cfg.clientSecret);
}
export function readOAuthState(token: string | undefined) {
  const cfg = googleConfig();
  return unseal<{ state: string; verifier: string; next: string; exp: number }>(token, cfg.clientSecret);
}
export function buildGoogleUrl(state: string, challenge: string) {
  const cfg = googleConfig();
  const params = new URLSearchParams({
    client_id: cfg.clientId, redirect_uri: cfg.redirectUri, response_type: 'code',
    scope: 'openid email profile', state, code_challenge: challenge,
    code_challenge_method: 'S256', prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}
export async function exchangeGoogleCode(code: string, verifier: string): Promise<AuthUser | null> {
  const cfg = googleConfig();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: cfg.clientId, client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri, grant_type: 'authorization_code', code_verifier: verifier,
    }),
    cache: 'no-store',
  });
  const tokens = await res.json().catch(() => ({}));
  if (!res.ok || !tokens.id_token) return null;
  try {
    // Verifikasi token lewat endpoint resmi Google, bukan sekadar decode JWT.
    const verify = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(String(tokens.id_token))}`, { cache: 'no-store' });
    const claims = await verify.json().catch(() => ({}));
    const issuerOk = claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com';
    if (!verify.ok || !issuerOk || claims.aud !== cfg.clientId || !claims.sub || Number(claims.exp) <= nowS() || claims.email_verified === 'false' || claims.email_verified === false) return null;
    return {
      id: String(claims.sub),
      name: String(claims.name || String(claims.email || '').split('@')[0] || 'Pengguna WARHEAD SHOP').slice(0, 80),
      email: String(claims.email || '').slice(0, 120),
      picture: /^https:\/\//.test(claims.picture || '') ? String(claims.picture).slice(0, 500) : '',
    };
  } catch { return null; }
}
