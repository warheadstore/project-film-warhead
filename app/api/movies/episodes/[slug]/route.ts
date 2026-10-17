import { NextRequest } from 'next/server';
import { tmdb, IMG, getEmbedServers, type TMDBEpisode } from '@/lib/tmdb';

interface Props { params: { slug: string } }

export async function GET(req: NextRequest, { params }: Props) {
  const { slug } = params;
  const match = slug.match(/^tv-(\d+)$/);
  if (!match) return Response.json({ error: 'Slug harus format tv-{id}' }, { status: 400 });

  const id     = match[1];
  const season = req.nextUrl.searchParams.get('season') || '1';

  try {
    const [data, series] = await Promise.all([
      tmdb<{ episodes: TMDBEpisode[] }>(`/tv/${id}/season/${season}`),
      tmdb<{ external_ids?: { imdb_id?: string } }>(`/tv/${id}/external_ids`).catch(() => null),
    ]);
    const imdbId = series?.external_ids?.imdb_id || null;

    // TMDB sering belum menerjemahkan sinopsis per-episode ke Bahasa
    // Indonesia (lebih jarang lagi dibanding sinopsis film/series utama),
    // jadi banyak episode tampil tanpa overview. Kalau ADA episode yang
    // overview-nya kosong, ambil satu kali data season dalam en-US (bukan
    // per-episode, supaya tetap 1 request tambahan) lalu pakai sebagai
    // fallback per episode yang kosong.
    const needsFallback = (data.episodes || []).some(ep => !ep.overview?.trim());
    let enEpisodesByNumber: Record<number, string> = {};
    if (needsFallback) {
      try {
        const enData = await tmdb<{ episodes: TMDBEpisode[] }>(`/tv/${id}/season/${season}`, { language: 'en-US' });
        enEpisodesByNumber = Object.fromEntries(
          (enData.episodes || []).map(ep => [ep.episode_number, ep.overview?.trim() || ''])
        );
      } catch {
        // fallback gagal — episode yang kosong tetap kosong, ditangani di UI
      }
    }

    const episodes = (data.episodes || []).map(ep => ({
      episode: ep.episode_number,
      season:  ep.season_number,
      title:   ep.name,
      overview: ep.overview?.trim() || enEpisodesByNumber[ep.episode_number] || null,
      still:   IMG.thumb(ep.still_path || null),
      airDate: ep.air_date || null,
      runtime: ep.runtime ? `${ep.runtime} menit` : null,
      servers: getEmbedServers(parseInt(id), 'tv', ep.season_number, ep.episode_number, imdbId),
    }));
    return Response.json({ episodes });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
