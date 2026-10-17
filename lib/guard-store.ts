/**
 * GUARD STORE — penyimpanan bersama (Upstash Redis REST) untuk middleware.
 * ---------------------------------------------------------------------------
 * Dipakai bersama oleh middleware.ts (Edge) dan bot Telegram di VPS.
 * Edge runtime tidak bisa TCP, jadi pakai REST (fetch).
 *
 * PRINSIP: FAIL-OPEN. Kalau Redis mati / lambat / env kosong, semua fungsi
 * di sini mengembalikan "tidak tahu" dan middleware lanjut dengan logika
 * in-memory. Situs tidak pernah ikut mati gara-gara store.
 *
 * Key yang dipakai (harus sama dengan bot/src/store.js):
 *   mz:ban:{ip}          JSON BanRec, TTL = durasi ban
 *   mz:wl:{ip}           "1" = whitelist
 *   mz:rep:{ip}          jumlah ban sebelumnya (eskalasi), TTL 30 hari
 *   mz:strike:{ip}       pelanggaran rate-limit (jendela 10 menit)
 *   mz:bad:{ip}          request ditolak guard (jendela 5 menit)
 *   mz:rl:{ns}:{ip}:{m}  counter rate-limit global per menit
 *   mz:events            antrean notifikasi untuk bot (LPUSH, bot RPOP)
 *   mz:dc:v4             ZSET range data center: score=start, member="end|label"
 *   mz:cfg:dcmode        "off" | "limit" | "block"
 */

export type BanType = 'auto' | 'manual' | 'honeypot' | 'appkey';

export interface BanRec {
  t: BanType;
  r: string;     // alasan
  at: number;    // epoch ms
  until: number; // epoch ms
  n: number;     // ban ke-berapa untuk IP ini
  c?: string;    // negara (x-vercel-ip-country)
}

const URL_ = process.env.UPSTASH_REDIS_REST_URL || '';
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
export const storeEnabled = !!(URL_ && TOKEN);

let downUntil = 0; // circuit breaker

type Cmd = (string | number)[];

/** Jalankan beberapa perintah sekaligus (pipeline). null = gagal/mati. */
export async function rcmd(cmds: Cmd[], timeoutMs = 700): Promise<any[] | null> {
  if (!storeEnabled) return null;
  const now = Date.now();
  if (now < downUntil) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${URL_}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmds),
      signal: ctl.signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`redis ${res.status}`);
    const arr = (await res.json()) as Array<{ result?: any; error?: string }>;
    return arr.map(x => (x && x.error ? null : x?.result ?? null));
  } catch {
    downUntil = Date.now() + 30_000; // istirahat 30 dtk sebelum coba lagi
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── IP helper ───────────────────────────────────────────────────────────────

/** IPv6 dinormalisasi ke /64 (penyerang bebas ganti-ganti 2^64 alamat). */
export function normIp(raw: string): string {
  const ip = (raw || '').trim().toLowerCase();
  if (!ip.includes(':')) return ip;
  if (ip.startsWith('::ffff:') && ip.includes('.')) return ip.slice(7); // v4-mapped
  let [head, tail] = ip.split('::');
  const h = head ? head.split(':') : [];
  const t = tail !== undefined && tail ? tail.split(':') : [];
  const missing = tail === undefined ? 0 : Math.max(0, 8 - h.length - t.length);
  const groups = [...h, ...Array(missing).fill('0'), ...t].slice(0, 8);
  while (groups.length < 8) groups.push('0');
  return groups.slice(0, 4).map(g => g.padStart(4, '0')).join(':') + '::/64';
}

export function ipv4ToNum(ip: string): number | null {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const p = m.slice(1).map(Number);
  if (p.some(x => x > 255)) return null;
  return ((p[0] * 256 + p[1]) * 256 + p[2]) * 256 + p[3];
}

// ── Cache lokal per instance ────────────────────────────────────────────────
interface StateEntry { exp: number; ban: BanRec | null; wl: boolean }
const stateCache = new Map<string, StateEntry>();
const STATE_TTL = 20_000;

/** Status ban + whitelist untuk satu IP (1 perintah Redis, di-cache 20 dtk). */
export async function getState(ip: string, now: number): Promise<StateEntry | null> {
  const c = stateCache.get(ip);
  if (c && c.exp > now) return c;
  const r = await rcmd([['MGET', `mz:ban:${ip}`, `mz:wl:${ip}`]]);
  if (!r || !Array.isArray(r[0])) return null;
  let ban: BanRec | null = null;
  try { ban = r[0][0] ? (JSON.parse(r[0][0]) as BanRec) : null; } catch { ban = null; }
  const e: StateEntry = { exp: now + STATE_TTL, ban, wl: !!r[0][1] };
  if (stateCache.size > 20_000) stateCache.clear();
  stateCache.set(ip, e);
  return e;
}

export function dropStateCache(ip: string) { stateCache.delete(ip); }

// ── Mode data center ────────────────────────────────────────────────────────
export type DcMode = 'off' | 'limit' | 'block';
let dcModeCache: { v: DcMode; exp: number } = { v: 'limit', exp: 0 };

export async function getDcMode(now: number): Promise<DcMode> {
  if (dcModeCache.exp > now) return dcModeCache.v;
  const r = await rcmd([['GET', 'mz:cfg:dcmode']]);
  const raw = r && typeof r[0] === 'string' ? r[0] : null;
  const fallback = (process.env.DC_MODE_DEFAULT as DcMode) || 'limit';
  const v: DcMode = raw === 'off' || raw === 'limit' || raw === 'block' ? raw : fallback;
  dcModeCache = { v, exp: now + 60_000 };
  return v;
}

const dcCache = new Map<string, { exp: number; v: boolean }>();

/** Apakah IPv4 ini milik data center? (1 perintah Redis, cache 10 menit). */
export async function isDatacenter(ip: string, now: number): Promise<boolean> {
  const n = ipv4ToNum(ip);
  if (n === null) return false; // IPv6: tidak dicek
  const c = dcCache.get(ip);
  if (c && c.exp > now) return c.v;
  const r = await rcmd([['ZREVRANGEBYSCORE', 'mz:dc:v4', n, '-inf', 'LIMIT', 0, 1]]);
  let v = false;
  let ttl = 30_000; // gagal -> cek ulang cepat
  if (r && Array.isArray(r[0])) {
    ttl = 10 * 60_000;
    const member = r[0][0];
    if (typeof member === 'string') v = n <= Number(member.split('|')[0]);
  }
  if (dcCache.size > 20_000) dcCache.clear();
  dcCache.set(ip, { exp: now + ttl, v });
  return v;
}

// ── Counter hybrid (lokal + sinkron berkala ke Redis) ───────────────────────
interface Counter { n: number; synced: number; total: number; exp: number }
const counters = new Map<string, Counter>();

/**
 * Tambah counter dan kembalikan estimasi total GLOBAL.
 * Lokal dulu (murah); tiap `syncEvery` hit baru dikirim ke Redis supaya
 * kuota perintah Redis hemat. Redis mati -> jatuh ke hitungan lokal.
 */
export async function bump(
  key: string, ttlSec: number, syncEvery: number, now: number, delta = 1,
): Promise<number> {
  let c = counters.get(key);
  if (!c || c.exp <= now) {
    c = { n: 0, synced: 0, total: 0, exp: now + ttlSec * 1000 };
    counters.set(key, c);
  }
  c.n += delta;
  if (storeEnabled && c.n - c.synced >= syncEvery) {
    const d = c.n - c.synced;
    const r = await rcmd([['INCRBY', key, d], ['EXPIRE', key, ttlSec]]);
    if (r && typeof r[0] === 'number') { c.total = r[0]; c.synced = c.n; }
  }
  return c.total + (c.n - c.synced);
}

export function sweepStore(now: number) {
  counters.forEach((c, k) => { if (c.exp <= now) counters.delete(k); });
  stateCache.forEach((e, k) => { if (e.exp <= now) stateCache.delete(k); });
  dcCache.forEach((e, k) => { if (e.exp <= now) dcCache.delete(k); });
  if (counters.size > 50_000) counters.clear();
}

// ── Ban ─────────────────────────────────────────────────────────────────────
/** Durasi ban berjenjang (detik): pelanggar berulang makin lama. */
export const BAN_STEPS = [3600, 6 * 3600, 24 * 3600, 7 * 24 * 3600];

export interface BanCtx { path: string; method: string; ua: string; country: string }

// Ban lokal hanya CACHE (20 dtk) supaya unban dari bot cepat berlaku di semua
// instance. Kalau Redis tak terjangkau, entri kedaluwarsa tetap dihormati
// sampai `until` (stale=true) — proteksi tidak hilang saat Redis mati.
const LOCAL_BAN_TTL = 20_000;
const localBans = new Map<string, { rec: BanRec; exp: number }>();
const localRep = new Map<string, number>();
const pendingBan = new Set<string>();

export function localBan(ip: string, now: number, stale = false): BanRec | null {
  const e = localBans.get(ip);
  if (!e) return null;
  if (e.rec.until <= now) { localBans.delete(ip); return null; }
  if (e.exp <= now && !stale) return null;
  return e.rec;
}

export function rememberBan(ip: string, rec: BanRec, now: number) {
  localBans.set(ip, { rec, exp: now + LOCAL_BAN_TTL });
}

export function sweepBans(now: number) {
  localBans.forEach((e, k) => { if (e.rec.until <= now) localBans.delete(k); });
  if (localBans.size > 20_000) localBans.clear();
  if (localRep.size > 20_000) localRep.clear();
}

/**
 * Ban sebuah IP: simpan lokal seketika, lalu tulis ke Redis + antrean event
 * untuk bot. Aman dipanggil di dalam event.waitUntil().
 */
export async function banIp(
  ip: string, type: BanType, reason: string, ctx: BanCtx, now: number, durSec?: number,
): Promise<void> {
  const cur = localBan(ip, now);
  if (cur && cur.t === type) return;
  if (pendingBan.has(ip)) return;
  pendingBan.add(ip);
  try {
    // Ban sementara supaya request berikutnya langsung ditolak
    const first = durSec ?? BAN_STEPS[0];
    rememberBan(ip, { t: type, r: reason, at: now, until: now + first * 1000, n: 1, c: ctx.country }, now);

    let n = 1;
    const r = await rcmd([['INCR', `mz:rep:${ip}`], ['EXPIRE', `mz:rep:${ip}`, 30 * 86400]]);
    if (r && typeof r[0] === 'number') n = r[0];
    else { n = (localRep.get(ip) || 0) + 1; localRep.set(ip, n); }

    const dur = durSec ?? BAN_STEPS[Math.min(n - 1, BAN_STEPS.length - 1)];
    const rec: BanRec = { t: type, r: reason, at: now, until: now + dur * 1000, n, c: ctx.country };
    rememberBan(ip, rec, now);
    stateCache.delete(ip);

    const event = { ip, ...rec, p: ctx.path.slice(0, 120), m: ctx.method, ua: ctx.ua.slice(0, 160) };
    await rcmd([
      ['SET', `mz:ban:${ip}`, JSON.stringify(rec), 'EX', dur],
      ['LPUSH', 'mz:events', JSON.stringify(event)],
      ['LTRIM', 'mz:events', 0, 499],
    ]);
  } finally {
    pendingBan.delete(ip);
  }
}
