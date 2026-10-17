import { tmdb, type TMDBGenre } from '@/lib/tmdb';

export async function GET() {
  try {
    const [movies, tv] = await Promise.all([
      tmdb<{ genres: TMDBGenre[] }>('/genre/movie/list'),
      tmdb<{ genres: TMDBGenre[] }>('/genre/tv/list'),
    ]);
    // merge + dedupe
    const map = new Map<number, string>();
    [...movies.genres, ...tv.genres].forEach(g => map.set(g.id, g.name));
    const genres = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    return Response.json({ genres });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
