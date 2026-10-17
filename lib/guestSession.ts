'use client';

/**
 * Guest Session TMDB — memungkinkan user memberi rating film/TV/episode
 * TANPA login akun TMDB. Session dibuat via endpoint publik
 * `/authentication/guest_session/new` (butuh api_key saja, tidak butuh
 * auth token), lalu id-nya disimpan di localStorage browser.
 *
 * Guest session TMDB kadaluarsa ±24 jam sejak dibuat (kebijakan TMDB).
 * Kita simpan `expiresAt` sendiri dan auto-renew begitu lewat, supaya user
 * tidak pernah melihat request rating gagal karena session basi.
 *
 * Catatan: guest session TIDAK bisa dipakai untuk menyimpan teks review,
 * hanya rating numerik (1–10 di sisi TMDB). WARHEAD SHOP memetakan UI bintang
 * 1–5 ke skala TMDB dengan mengalikan 2 (mis. 4 bintang → rating 8).
 */

const STORAGE_KEY = 'mz_guest_session';
const SESSION_TTL_MS = 23 * 60 * 60 * 1000; // 23 jam — renew sedikit lebih awal dari batas 24 jam TMDB

interface StoredGuestSession {
  guestSessionId: string;
  createdAt: number;
  expiresAt: number;
}

function readStored(): StoredGuestSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredGuestSession;
    if (!parsed.guestSessionId || !parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(session: StoredGuestSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage penuh/diblokir (mode private, dsb) — guest session tetap
    // berfungsi untuk request saat ini, hanya tidak persist ke sesi berikutnya.
  }
}

/**
 * Mengembalikan guest session id yang valid, membuat baru lewat API route
 * internal kalau belum ada atau sudah kadaluarsa.
 */
export async function getGuestSessionId(): Promise<string> {
  const existing = readStored();
  if (existing && existing.expiresAt > Date.now()) {
    return existing.guestSessionId;
  }

  const res = await fetch('/api/session/guest', { method: 'POST' });
  if (!res.ok) {
    throw new Error('Gagal membuat guest session TMDB');
  }
  const data = await res.json() as { guestSessionId?: string; success?: boolean };
  if (!data.success || !data.guestSessionId) {
    throw new Error('Guest session tidak valid');
  }

  const session: StoredGuestSession = {
    guestSessionId: data.guestSessionId,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  writeStored(session);
  return session.guestSessionId;
}

/** Cek cepat tanpa membuat session baru — dipakai untuk keperluan UI (mis. badge status). */
export function hasActiveGuestSession(): boolean {
  const existing = readStored();
  return !!existing && existing.expiresAt > Date.now();
}

export function clearGuestSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

// ─── LOCAL RATING CACHE ──────────────────────────────────────────────────────
// TMDB tidak punya endpoint "get my guest ratings" per item (guest session
// tidak seperti akun biasa), jadi rating yang sudah diberikan user disimpan
// juga secara lokal supaya UI bisa langsung menampilkan bintang yang sudah
// dipilih tanpa perlu menebak-nebak status dari TMDB.

const RATINGS_KEY = 'mz_guest_ratings';

type LocalRatings = Record<string, number>; // slug -> bintang (1-5)

function readLocalRatings(): LocalRatings {
  try {
    return JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getLocalRating(slug: string): number | null {
  const ratings = readLocalRatings();
  return ratings[slug] ?? null;
}

export function setLocalRating(slug: string, stars: number) {
  try {
    const ratings = readLocalRatings();
    ratings[slug] = stars;
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  } catch {
    // no-op
  }
}

export function removeLocalRating(slug: string) {
  try {
    const ratings = readLocalRatings();
    delete ratings[slug];
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  } catch {
    // no-op
  }
}
