import { NextRequest, NextResponse, NextFetchEvent } from 'next/server';
import {
  storeEnabled, normIp, getState, getDcMode, isDatacenter, bump, sweepStore,
  banIp, localBan, rememberBan, sweepBans, type BanType, type BanCtx,
} from '@/lib/guard-store';

/**
 * ANTI-BOT MIDDLEWARE v10 (global rate limit + auto-ban + data center)
 * ---------------------------------------------------------------------------
 * Urutan lapisan:
 *   0. Bypass internal   — fetch SSR milik app sendiri (header rahasia).
 *   1. Honeypot          — path jebakan -> ban 24 jam (tipe `honeypot`).
 *   2. Ban list          — lokal + Redis bersama (diisi middleware & bot).
 *   3. Blocklist UA      — curl, python-requests, scrapy, headless, AI crawler.
 *   4. Data center       — IP DC: mode off | limit (batas ketat) | block.
 *   5. Rate limit        — GLOBAL lintas instance (Redis) untuk /api,
 *                          lokal untuk halaman.
 *   6. Auto-ban          — flood / rate-limit berulang / ditolak guard berulang.
 *   7. Guard API         — same-origin + token HMAC, atau kunci app (APK).
 *
 * APK (valid `x-mz-app-key` + UA `WARHEAD SHOPApp/`):
 *   - batas sendiri yang lebih longgar (banyak user APK satu IP / CGNAT),
 *   - TIDAK kena ban `auto` (user APK yang kebetulan satu IP dengan scraper
 *     tidak ikut terblokir), TIDAK kena aturan data center,
 *   - tetap kena ban `manual` / `honeypot` / `appkey`, dan kalau trafik
 *     ber-kunci melewati 3x batas app -> ban tipe `appkey` (kunci bocor).
 *
 * Env:
 *   ANTI_BOT_SECRET, MZ_APP_KEY            (sama seperti sebelumnya)
 *   UPSTASH_REDIS_REST_URL / _TOKEN        (kosong = mode lokal saja)
 *   DC_MODE_DEFAULT                        off | limit | block  (default limit)
 *   BAN_ON_RATE                            1 = ban juga karena rate-limit (default 0)
 *
 * Tanpa Redis semuanya tetap jalan (fail-open) dengan hitungan per-instance.
 */

const SECRET = process.env.ANTI_BOT_SECRET || '';
const APP_KEY = process.env.MZ_APP_KEY || '';

const TOKEN_COOKIE = 'mz_t';
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 jam
const INTERNAL_HEADER = 'x-mz-internal';

// ── Batas rate (per menit, per IP) ──────────────────────────────────────────
const LIMIT_API_PER_IP = 120;       // browser biasa
const LIMIT_API_APP_PER_IP = 300;   // APK (CGNAT: banyak user satu IP)
const LIMIT_API_DC_PER_IP = 30;     // IP data center (mode `limit`)
const LIMIT_API_PER_TOKEN = 60;
const LIMIT_PAGE_PER_IP = 240;
const WINDOW_MS = 60_000;
const SYNC_EVERY = 10;              // sinkron ke Redis tiap N hit (hemat kuota)

// ── Auto-ban ────────────────────────────────────────────────────────────────
const FLOOD_FACTOR = 3;             // > 3x batas dalam semenit = ban langsung
const STRIKE_BAN = 3;               // 3x kena 429 dalam 10 menit = ban
const STRIKE_TTL = 600;
const STRIKE_GAP_MS = 5_000;        // maks 1 strike / 5 dtk / IP / instance
const BAD_BAN = 40;                 // 40x ditolak guard dalam 5 menit = ban
const BAD_TTL = 300;
const HONEYPOT_BAN_SEC = 24 * 3600;
// Ban karena rate-limit/flood (bisa kena orang asli yang ngetes ramai dari satu
// IP). Default MATI: kelebihan request cuma dapat 429 sementara. Ban otomatis
// tetap jalan untuk scraper (UA scraper / ditolak guard berulang) dan honeypot.
// Set BAN_ON_RATE=1 di Vercel kalau mau ban juga berdasarkan rate-limit.
const BAN_ON_RATE = process.env.BAN_ON_RATE === '1';

// Path jebakan: dilarang di robots.txt + ada link tersembunyi di layout.
const HONEYPOT_PATH = '/api/catalog-export';

// ── User-Agent yang diblokir ────────────────────────────────────────────────
const BAD_UA = new RegExp(
  [
    // library HTTP / CLI
    'curl', 'wget', 'python-requests', 'python-urllib', 'python/', 'aiohttp', 'httpx',
    'libwww', 'go-http-client', 'java/', 'apache-httpclient', 'axios', 'node-fetch',
    'undici', 'got/', 'superagent', 'needle', 'form-data', 'cheerio', 'php/', 'ruby', 'perl', 'restsharp', 'postmanruntime',
    'insomnia', 'httpie', 'guzzle', 'scrapy', 'mechanize', 'jsoup', 'colly',
    // browser otomatis
    'headlesschrome', 'phantomjs', 'puppeteer', 'playwright', 'selenium', 'webdriver',
    'nightmare',
    // scraper / SEO crawler / AI crawler
    'httrack', 'nutch', 'mj12bot', 'ahrefsbot', 'semrushbot', 'dotbot', 'petalbot',
    'bytespider', 'dataforseo', 'blexbot', 'screaming frog', 'gptbot', 'chatgpt-user',
    'ccbot', 'claudebot', 'anthropic-ai', 'perplexitybot', 'amazonbot', 'omgili',
    'diffbot', 'imagesiftbot', 'meta-externalagent', 'cohere-ai',
  ].join('|'),
  'i'
);

// Search engine yang boleh index halaman (bukan API). UA bisa dipalsukan, jadi
// mereka tetap kena rate-limit dan tidak pernah boleh akses /api/*.
const GOOD_BOT = /googlebot|bingbot|duckduckbot|yandexbot|baiduspider|applebot|facebookexternalhit|twitterbot|whatsapp|telegrambot|slackbot|linkedinbot|discordbot/i;

// ── Penyimpanan lokal (per instance) — hanya untuk halaman & cadangan ───────
type Bucket = { count: number; resetAt: number };
const pageBuckets = new Map<string, Bucket>();
const lastStrike = new Map<string, number>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 30_000) return;
  lastSweep = now;
  pageBuckets.forEach((b, k) => { if (b.resetAt <= now) pageBuckets.delete(k); });
  lastStrike.forEach((t, k) => { if (now - t > 60_000) lastStrike.delete(k); });
  if (pageBuckets.size > 20_000) pageBuckets.clear();
  sweepStore(now);
  sweepBans(now);
}

function hitLocal(key: string, limit: number, now: number): { ok: boolean; retryAfter: number } {
  const b = pageBuckets.get(key);
  if (!b || b.resetAt <= now) {
    pageBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }
  b.count++;
  return { ok: b.count <= limit, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
}

// ── Token HMAC (Web Crypto — jalan di Edge runtime) ─────────────────────────
const enc = new TextEncoder();

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function signToken(ua: string, now: number): Promise<string> {
  const ts = now.toString(36);
  return `${ts}.${await hmacHex(`${ts}|${ua}`)}`;
}

async function verifyToken(token: string | undefined, ua: string, now: number): Promise<boolean> {
  if (!token) return false;
  const [ts, sig] = token.split('.');
  if (!ts || !sig) return false;
  const issued = parseInt(ts, 36);
  if (!Number.isFinite(issued) || now - issued > TOKEN_TTL_MS || issued > now + 60_000) return false;
  return safeEqual(sig, await hmacHex(`${ts}|${ua}`));
}

// ── Helper ──────────────────────────────────────────────────────────────────
function clientIp(req: NextRequest): string {
  const raw =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown';
  return normIp(raw);
}

function deny(status: number, message: string, extra?: Record<string, string>) {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      ...extra,
    },
  });
}

/** Request ke /api harus berasal dari halaman milik kita sendiri. */
function isSameOrigin(req: NextRequest): boolean {
  const site = req.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin';

  // Browser lama tanpa Fetch Metadata → cek Origin / Referer
  const host = req.headers.get('host');
  const src = req.headers.get('origin') || req.headers.get('referer');
  if (!host || !src) return false;
  try { return new URL(src).host === host; } catch { return false; }
}

// ── Middleware utama ────────────────────────────────────────────────────────
export async function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');
  const now = Date.now();
  const ua = req.headers.get('user-agent') || '';
  const ip = clientIp(req);
  const ctx: BanCtx = {
    path: pathname, method: req.method, ua,
    country: req.headers.get('x-vercel-ip-country') || '',
  };
  sweep(now);

  const bg = (p: Promise<unknown>) => event.waitUntil(p.catch(() => {}));
  const ban = (type: BanType, reason: string, durSec?: number) =>
    bg(banIp(ip, type, reason, ctx, now, durSec));

  // 0. Bypass untuk fetch internal (SSR / generateMetadata)
  if (SECRET) {
    const internal = req.headers.get(INTERNAL_HEADER);
    if (internal && safeEqual(internal, SECRET)) return NextResponse.next();
  }

  // Identitas APK: kunci cocok + UA app. (Kunci bisa diekstrak dari APK,
  // makanya APK tetap punya batas & bisa kena ban `appkey`.)
  const isApp =
    !!APP_KEY &&
    safeEqual(req.headers.get('x-mz-app-key') || '', APP_KEY) &&
    ua.startsWith('WARHEAD SHOPApp/');

  // 1. Honeypot
  if (pathname === HONEYPOT_PATH) {
    ban('honeypot', `Akses honeypot ${HONEYPOT_PATH}`, HONEYPOT_BAN_SEC);
    return deny(403, 'Forbidden');
  }

  // 2. Ban list — lokal dulu (nol biaya), lalu Redis bersama (hanya /api)
  const blocks = (b: { t: BanType; until: number } | null | undefined) =>
    !!b && b.until > now && (!isApp || b.t !== 'auto');

  const lb = localBan(ip, now);
  if (blocks(lb)) return deny(403, 'Forbidden');

  let whitelisted = false;
  if (isApi) {
    const st = await getState(ip, now);
    if (st?.wl) whitelisted = true;
    else if (st?.ban && st.ban.until > now) {
      rememberBan(ip, st.ban, now);
      if (blocks(st.ban)) return deny(403, 'Forbidden');
    } else if (!st && blocks(localBan(ip, now, true))) {
      return deny(403, 'Forbidden'); // Redis tak terjangkau: pakai catatan lokal
    }
  }

  // 3. Blocklist User-Agent (scraper kena hitungan "bad" -> bisa di-ban)
  const goodBot = GOOD_BOT.test(ua);
  if (!whitelisted && !isApp && !goodBot && (!ua || BAD_UA.test(ua))) {
    if (isApi) bg(noteBad(ip, ban, now));
    return deny(403, 'Forbidden');
  }

  // 4. Data center (hanya /api, bukan APK, bukan whitelist, bukan crawler)
  let dcLimited = false;
  if (isApi && !isApp && !whitelisted && !goodBot && storeEnabled) {
    const mode = await getDcMode(now);
    if (mode !== 'off' && (await isDatacenter(ip, now))) {
      if (mode === 'block') return deny(403, 'Forbidden');
      dcLimited = true;
    }
  }

  // 5. Rate limit
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!whitelisted) {
    if (isApi) {
      const minute = Math.floor(now / WINDOW_MS);
      const ns = isApp ? 'A' : dcLimited ? 'D' : 'a';
      const limit = isApp ? LIMIT_API_APP_PER_IP : dcLimited ? LIMIT_API_DC_PER_IP : LIMIT_API_PER_IP;
      const count = await bump(`mz:rl:${ns}:${ip}:${minute}`, 120, SYNC_EVERY, now);
      if (count > limit) {
        const retry = Math.max(1, Math.ceil(((minute + 1) * WINDOW_MS - now) / 1000));
        bg(onViolation(ip, count, limit, isApp, ban, now));
        return deny(429, 'Terlalu banyak request, coba lagi sebentar.', { 'Retry-After': String(retry) });
      }
      if (token) {
        const tc = await bump(`t:${token}:${minute}`, 120, Infinity, now);
        if (tc > LIMIT_API_PER_TOKEN) {
          return deny(429, 'Terlalu banyak request, coba lagi sebentar.', { 'Retry-After': '30' });
        }
      }
    } else {
      const pl = hitLocal(`p:${ip}`, LIMIT_PAGE_PER_IP, now);
      if (!pl.ok) {
        return deny(429, 'Terlalu banyak request, coba lagi sebentar.', { 'Retry-After': String(pl.retryAfter) });
      }
    }
  }

  // 7a. Guard /api/*
  if (isApi) {
    if (isApp) {
      const res = NextResponse.next();
      res.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return res;
    }

    // Crawler (walau UA-nya "baik") tidak punya urusan ke API.
    if (goodBot) return deny(403, 'Forbidden');

    if (!isSameOrigin(req)) {
      if (!whitelisted) bg(noteBad(ip, ban, now));
      return deny(403, 'Forbidden');
    }

    if (SECRET && !(await verifyToken(token, ua, now))) {
      if (!whitelisted) bg(noteBad(ip, ban, now));
      return deny(403, 'Sesi tidak valid, muat ulang halaman.');
    }

    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // 7b. Halaman: berikan/refresh token ke browser
  const res = NextResponse.next();
  if (SECRET && !goodBot && req.method === 'GET') {
    // Refresh kalau belum punya / sudah lewat setengah masa berlaku
    let needsToken = !(await verifyToken(token, ua, now));
    if (!needsToken && token) {
      const issued = parseInt(token.split('.')[0], 36);
      if (now - issued > TOKEN_TTL_MS / 2) needsToken = true;
    }
    if (needsToken) {
      res.cookies.set(TOKEN_COOKIE, await signToken(ua, now), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: TOKEN_TTL_MS / 1000,
      });
    }
  }
  return res;
}

/** Dipanggil saat IP kena 429: flood = ban langsung, selain itu hitung strike. */
async function onViolation(
  ip: string, count: number, limit: number, isApp: boolean,
  ban: (t: BanType, r: string, d?: number) => void, now: number,
) {
  const type: BanType = isApp ? 'appkey' : 'auto';
  if (!isApp && !BAN_ON_RATE) return; // hanya 429, tanpa ban
  if (count > limit * FLOOD_FACTOR) {
    ban(type, `Flood API: ${count} req/menit (batas ${limit})`);
    return;
  }
  const last = lastStrike.get(ip) || 0;
  if (now - last < STRIKE_GAP_MS) return;
  lastStrike.set(ip, now);
  const strikes = await bump(`mz:strike:${ip}`, STRIKE_TTL, 1, now);
  if (strikes >= STRIKE_BAN) {
    ban(type, `Kena rate-limit berulang (${strikes}x dalam 10 menit, batas ${limit}/menit)`);
  }
}

/** Dipanggil saat request ditolak guard/UA: banyak penolakan = scraper. */
async function noteBad(ip: string, ban: (t: BanType, r: string, d?: number) => void, now: number) {
  const n = await bump(`mz:bad:${ip}`, BAD_TTL, 5, now);
  if (n >= BAD_BAN) ban('auto', `Request ditolak guard berulang (${n}x dalam 5 menit) — pola scraper`);
}

export const config = {
  // Lewati aset statis & file publik supaya tidak membebani middleware
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon|apple-touch-icon|og\\.png|join-channel-banner|robots\\.txt|sitemap\\.xml|manifest\\.json|sw\\.js|js/).*)',
  ],
};
