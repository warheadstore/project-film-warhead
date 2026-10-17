import { tmdb, normalizeMovie, type TMDBPage, type TMDBMovie } from '@/lib/tmdb';

export async function GET() {
  try {
    const data = await tmdb<TMDBPage<TMDBMovie>>('/trending/all/week');
    const results = data.results
      .filter(m => m.media_type !== 'person')
      .map(normalizeMovie);
    return Response.json({ results, total_pages: data.total_pages });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
