import { NextRequest } from 'next/server';
import { tmdb, normalizeMovie, type TMDBPage, type TMDBMovie } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get('page') || '1';
  const type = req.nextUrl.searchParams.get('type') || 'movie'; // movie | tv | all
  try {
    if (type === 'all') {
      const [movies, tv] = await Promise.all([
        tmdb<TMDBPage<TMDBMovie>>('/movie/popular', { page }),
        tmdb<TMDBPage<TMDBMovie>>('/tv/popular', { page }),
      ]);
      const results = [
        ...movies.results.map(m => normalizeMovie({ ...m, media_type: 'movie' })),
        ...tv.results.map(m => normalizeMovie({ ...m, media_type: 'tv' })),
      ].sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'));
      return Response.json({
        results,
        total_pages: Math.max(movies.total_pages, tv.total_pages),
        total_results: (movies.total_results || 0) + (tv.total_results || 0),
      });
    }
    const endpoint = type === 'tv' ? '/tv/popular' : '/movie/popular';
    const data = await tmdb<TMDBPage<TMDBMovie>>(endpoint, { page });
    const results = data.results.map(m => normalizeMovie({ ...m, media_type: type as 'movie' | 'tv' }));
    return Response.json({ results, total_pages: data.total_pages, total_results: data.total_results });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
