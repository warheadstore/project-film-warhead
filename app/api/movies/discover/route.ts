import { NextRequest } from 'next/server';
import { tmdb, normalizeMovie, type TMDBPage, type TMDBMovie } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const page       = req.nextUrl.searchParams.get('page') || '1';
  const genre      = req.nextUrl.searchParams.get('genre') || '';
  const year       = req.nextUrl.searchParams.get('year') || '';
  const country    = req.nextUrl.searchParams.get('country') || '';
  const type       = req.nextUrl.searchParams.get('type') || 'movie';
  const sort       = req.nextUrl.searchParams.get('sort') || 'popularity.desc';

  const params: Record<string, string> = { page, sort_by: sort };
  if (genre)   params['with_genres']           = genre;
  if (year)    params['primary_release_year']  = year;
  if (country) params['with_origin_country']   = country.toUpperCase();

  try {
    const endpoint = type === 'tv' ? '/discover/tv' : '/discover/movie';
    const data = await tmdb<TMDBPage<TMDBMovie>>(endpoint, params);
    const results = data.results.map(m => normalizeMovie({ ...m, media_type: type as 'movie' | 'tv' }));
    return Response.json({ results, total_pages: data.total_pages, total_results: data.total_results });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
