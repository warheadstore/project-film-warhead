import { NextRequest } from 'next/server';
import { tmdb, normalizeMovie, type TMDBPage, type TMDBMovie } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get('page') || '1';

  try {
    // TMDB /movie/upcoming can include titles already released in other
    // regions/dates close to today; filter to strictly future release
    // dates and sort by soonest first so the countdown UI makes sense.
    const data = await tmdb<TMDBPage<TMDBMovie>>('/movie/upcoming', { page, region: 'ID' });
    const today = new Date().toISOString().slice(0, 10);

    const results = data.results
      .filter((m) => m.release_date && m.release_date > today)
      .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))
      .map((m) => normalizeMovie({ ...m, media_type: 'movie' }));

    return Response.json({ results, total_pages: data.total_pages });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
