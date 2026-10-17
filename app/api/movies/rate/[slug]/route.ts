import { NextRequest } from 'next/server';

const TMDB_BASE = 'https://api.themoviedb.org/3';

function apiKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error('TMDB_API_KEY tidak ditemukan di environment variables');
  return key;
}

interface Props { params: { slug: string } }

/**
 * Menentukan endpoint TMDB yang tepat untuk rating berdasarkan slug dan,
 * untuk series, query param season/episode opsional (kalau tidak ada,
 * rating diberikan ke level series/tv, bukan episode tertentu).
 */
function resolveRateEndpoint(slug: string, season: string | null, episode: string | null) {
  const match = slug.match(/^(movie|tv)-(\d+)$/);
  if (!match) return null;
  const type = match[1] as 'movie' | 'tv';
  const id = match[2];

  if (type === 'movie') return `/movie/${id}/rating`;
  if (season && episode) return `/tv/${id}/season/${season}/episode/${episode}/rating`;
  return `/tv/${id}/rating`;
}

/**
 * POST /api/movies/rate/{slug}?guestSessionId=xxx[&season=1&episode=2]
 * Body: { rating: number } — skala TMDB 2-10 (dikonversi dari bintang 1-5 di client)
 */
export async function POST(req: NextRequest, { params }: Props) {
  const { slug } = params;
  const guestSessionId = req.nextUrl.searchParams.get('guestSessionId');
  const season = req.nextUrl.searchParams.get('season');
  const episode = req.nextUrl.searchParams.get('episode');

  if (!guestSessionId) {
    return Response.json({ error: 'guestSessionId wajib diisi' }, { status: 400 });
  }

  const endpoint = resolveRateEndpoint(slug, season, episode);
  if (!endpoint) {
    return Response.json({ error: 'Format slug tidak valid. Gunakan movie-{id} atau tv-{id}' }, { status: 400 });
  }

  let body: { rating?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Body request tidak valid' }, { status: 400 });
  }

  const rating = body.rating;
  if (typeof rating !== 'number' || rating < 0.5 || rating > 10) {
    return Response.json({ error: 'Rating harus di antara 0.5 dan 10' }, { status: 400 });
  }

  try {
    const url = new URL(`${TMDB_BASE}${endpoint}`);
    url.searchParams.set('api_key', apiKey());
    url.searchParams.set('guest_session_id', guestSessionId);

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify({ value: rating }),
      cache: 'no-store',
    });

    const data = await res.json() as { success?: boolean; status_message?: string };

    if (!res.ok || !data.success) {
      return Response.json(
        { error: data.status_message || `TMDB ${res.status} ${res.statusText}` },
        { status: res.status === 401 ? 401 : 502 }
      );
    }

    return Response.json({ success: true });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/movies/rate/{slug}?guestSessionId=xxx[&season=1&episode=2]
 * Menghapus rating yang sudah diberikan.
 */
export async function DELETE(req: NextRequest, { params }: Props) {
  const { slug } = params;
  const guestSessionId = req.nextUrl.searchParams.get('guestSessionId');
  const season = req.nextUrl.searchParams.get('season');
  const episode = req.nextUrl.searchParams.get('episode');

  if (!guestSessionId) {
    return Response.json({ error: 'guestSessionId wajib diisi' }, { status: 400 });
  }

  const endpoint = resolveRateEndpoint(slug, season, episode);
  if (!endpoint) {
    return Response.json({ error: 'Format slug tidak valid. Gunakan movie-{id} atau tv-{id}' }, { status: 400 });
  }

  try {
    const url = new URL(`${TMDB_BASE}${endpoint}`);
    url.searchParams.set('api_key', apiKey());
    url.searchParams.set('guest_session_id', guestSessionId);

    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      cache: 'no-store',
    });

    const data = await res.json() as { success?: boolean; status_message?: string };

    if (!res.ok || !data.success) {
      return Response.json(
        { error: data.status_message || `TMDB ${res.status} ${res.statusText}` },
        { status: res.status === 401 ? 401 : 502 }
      );
    }

    return Response.json({ success: true });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
