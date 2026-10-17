import { NextRequest, NextResponse } from 'next/server';
import { cookieOptions, createSession, exchangeGoogleCode, googleConfig, OAUTH_COOKIE, readOAuthState, SESSION_COOKIE } from '@/lib/mdflix-auth';

export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  const cfg = googleConfig();
  const fail = (reason: string) => {
    const response = NextResponse.redirect(new URL(`/login?error=${reason}`, req.url));
    response.cookies.set(OAUTH_COOKIE, '', cookieOptions(0));
    return response;
  };
  if (!cfg.ok) return fail('config');
  const saved = readOAuthState(req.cookies.get(OAUTH_COOKIE)?.value);
  if (!saved || saved.state !== req.nextUrl.searchParams.get('state')) return fail('state');
  const code = req.nextUrl.searchParams.get('code');
  if (!code || req.nextUrl.searchParams.has('error')) return fail('denied');
  try {
    const user = await exchangeGoogleCode(code, saved.verifier);
    if (!user) return fail('token');
    const response = NextResponse.redirect(new URL(saved.next || '/', req.url));
    response.cookies.set(SESSION_COOKIE, createSession(user), cookieOptions(30 * 24 * 60 * 60));
    response.cookies.set(OAUTH_COOKIE, '', cookieOptions(0));
    return response;
  } catch {
    return fail('server');
  }
}
