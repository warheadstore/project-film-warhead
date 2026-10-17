import type { Movie } from '@/types/movie';

const STORAGE_KEY = 'mz_continue_watching';
const MAX_ITEMS = 20;

export interface ContinueWatchingItem {
  slug: string;
  title: string;
  poster: string | null;
  type: 'Movie' | 'Series';
  year?: string | null;
  rating?: string | null;
  season?: number;
  episode?: number;
  lastWatchedAt: number; // epoch ms
}

function readAll(): ContinueWatchingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: ContinueWatchingItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage unavailable — silently no-op
  }
}

/** Record/update a title as being watched "now". Call this from the watch page. */
export function recordWatch(movie: Movie, opts?: { season?: number; episode?: number }) {
  if (!movie?.slug) return;
  const items = readAll().filter((i) => i.slug !== movie.slug);
  items.unshift({
    slug: movie.slug,
    title: movie.title,
    poster: movie.poster || null,
    type: movie.type === 'Series' ? 'Series' : 'Movie',
    year: movie.year || null,
    rating: movie.rating || null,
    season: opts?.season,
    episode: opts?.episode,
    lastWatchedAt: Date.now(),
  });
  writeAll(items.slice(0, MAX_ITEMS));
}

/** Get the continue-watching list, most recent first. */
export function getContinueWatching(): ContinueWatchingItem[] {
  return readAll().sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
}

/** Remove a single title from the list (e.g. user dismisses it). */
export function removeFromContinueWatching(slug: string) {
  writeAll(readAll().filter((i) => i.slug !== slug));
}
