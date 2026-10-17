import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { buildGoogleUrl, createOAuthState, cookieOptions, googleConfig, OAUTH_COOKIE, safeNext } from '@/lib/mdflix-auth';

export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  const cfg = googleConfig();
  if (!cfg.ok) return NextResponse.redirect(new URL('/login?error=config', req.url));
  const state = crypto.randomBytes(24).toString('base64url');
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const next = safeNext(req.nextUrl.searchParams.get('next'));
  const response = NextResponse.redirect(buildGoogleUrl(state, challenge));
  response.cookies.set(OAUTH_COOKIE, createOAuthState(state, verifier, next), cookieOptions(600));
  return response;
}
