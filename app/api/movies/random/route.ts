import { tmdb, normalizeMovie, type TMDBPage, type TMDBMovie } from '@/lib/tmdb';

export async function GET() {
  try {
    const data = await tmdb<TMDBPage<TMDBMovie>>('/trending/all/week');
    const list = data.results.filter(m => m.media_type !== 'person' && m.backdrop_path);
    const movie = list[Math.floor(Math.random() * Math.min(list.length, 10))];
    return Response.json({ movie: movie ? normalizeMovie(movie) : null });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
