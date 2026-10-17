import { tmdb, normalizeMovie, fetchLogo, type TMDBPage, type TMDBMovie } from '@/lib/tmdb';

const HERO_COUNT = 6;

// Endpoint ini adalah yang paling kritikal untuk performa homepage (LCP
// candidate langsung tergantung padanya), tapi juga yang paling berat —
// 1 request trending + hingga 6 request logo paralel. `revalidate` di sini
// membuat Next.js App Router menganggap response route handler ini sendiri
// cacheable di edge/CDN selama jendela waktu ini, bukan hanya fetch call
// individual di dalamnya, supaya request berulang dalam periode ini tidak
// perlu menjalankan ulang 7 round-trip ke TMDB dari nol.
export const revalidate = 300;

export async function GET() {
  try {
    const data = await tmdb<TMDBPage<TMDBMovie>>('/trending/all/week');
    const candidates = data.results
      .filter(m => m.media_type !== 'person')
      .filter(m => m.backdrop_path) // hero butuh backdrop, skip yang tidak punya
      .slice(0, HERO_COUNT)
      .map(normalizeMovie);

    // Fetch logo untuk tiap item secara paralel — hanya dilakukan untuk
    // 6 item hero (bukan seluruh list trending), jadi tidak membebani.
    const withLogos = await Promise.all(
      candidates.map(async (m) => {
        const type = m.type === 'Series' ? 'tv' : 'movie';
        const titleLogo = m.tmdbId ? await fetchLogo(m.tmdbId, type) : null;
        return { ...m, titleLogo };
      })
    );

    return Response.json({ results: withLogos });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
