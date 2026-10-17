import { NextRequest } from 'next/server';
import { tmdb, normalizeMovie, type TMDBPage, type TMDBMovie } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get('page') || '1';
  const type = req.nextUrl.searchParams.get('type') || 'movie';
  try {
    const endpoint = type === 'tv' ? '/tv/top_rated' : '/movie/top_rated';
    const data = await tmdb<TMDBPage<TMDBMovie>>(endpoint, { page });
    const results = data.results.map(m => normalizeMovie({ ...m, media_type: type as 'movie' | 'tv' }));
    return Response.json({ results, total_pages: data.total_pages });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
