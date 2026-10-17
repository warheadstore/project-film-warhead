import { NextRequest } from 'next/server';
import { tmdb, normalizeMovie, type TMDBPage, type TMDBMovie } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get('page') || '1';
  const type = req.nextUrl.searchParams.get('type') || 'movie';
  try {
    if (type === 'all') {
      const [movies, tv] = await Promise.all([
        tmdb<TMDBPage<TMDBMovie>>('/movie/now_playing', { page }),
        tmdb<TMDBPage<TMDBMovie>>('/tv/on_the_air', { page }),
      ]);
      const results = [
        ...movies.results.map(m => normalizeMovie({ ...m, media_type: 'movie' })),
        ...tv.results.map(m => normalizeMovie({ ...m, media_type: 'tv' })),
      ];
      return Response.json({ results, total_pages: Math.max(movies.total_pages, tv.total_pages) });
    }
    const endpoint = type === 'tv' ? '/tv/on_the_air' : '/movie/now_playing';
    const data = await tmdb<TMDBPage<TMDBMovie>>(endpoint, { page });
    const results = data.results.map(m => normalizeMovie({ ...m, media_type: type as 'movie' | 'tv' }));
    return Response.json({ results, total_pages: data.total_pages });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
