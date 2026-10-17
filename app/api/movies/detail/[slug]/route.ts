import { NextRequest } from 'next/server';
import { tmdb, IMG, getEmbedServers, type TMDBDetail } from '@/lib/tmdb';

interface Props { params: { slug: string } }

export async function GET(_req: NextRequest, { params }: Props) {
  const { slug } = params;
  const match = slug.match(/^(movie|tv)-(\d+)$/);
  if (!match) return Response.json({ error: 'Format slug tidak valid. Gunakan movie-{id} atau tv-{id}' }, { status: 400 });

  const type = match[1] as 'movie' | 'tv';
  const id   = match[2];

  // release_dates (movie) / content_ratings (tv) = rating usia.
  // recommendations = film/series serupa untuk section "Mungkin Kamu Suka".
  // watch/providers = platform legal (Netflix, dst) tempat judul ini tayang.
  // keywords = tag TMDB untuk chip pencarian yang lebih spesifik dari genre.
  const ratingsField = type === 'movie' ? 'release_dates' : 'content_ratings';

  try {
    const detail = await tmdb<TMDBDetail>(
      `/${type}/${id}`,
      { append_to_response: `credits,videos,external_ids,recommendations,${ratingsField},watch/providers,keywords` }
    );

    // TMDB sering belum punya terjemahan Bahasa Indonesia untuk `overview`
    // pada film/series yang lebih kecil atau baru rilis — field-nya balik
    // sebagai string kosong (bukan null), jadi sinopsis tampak "hilang" di
    // UI padahal datanya ada, cuma belum diterjemahkan. Kalau itu terjadi,
    // fallback ambil overview versi Inggris (en-US) yang hampir selalu
    // tersedia di TMDB, supaya sinopsis tetap tampil daripada kosong.
    let overview = detail.overview?.trim() || '';
    if (!overview) {
      try {
        const en = await tmdb<{ overview?: string }>(`/${type}/${id}`, { language: 'en-US' });
        overview = en.overview?.trim() || '';
      } catch {
        // fallback gagal — sinopsis tetap kosong, UI akan tampilkan pesan default
      }
    }

    const title    = detail.title || detail.name || 'Untitled';
    const poster   = IMG.poster(detail.poster_path || null);
    const backdrop = IMG.backdrop(detail.backdrop_path || null);
    const rating    = detail.vote_average ? detail.vote_average.toFixed(1) : null;
    const voteCount = detail.vote_count ?? null;
    const year     = (detail.release_date || detail.first_air_date || '').slice(0, 4);
    const director = detail.credits?.crew?.find(c => c.job === 'Director')?.name || null;
    // `cast` (string[]) dipertahankan untuk kompatibilitas mundur, dan
    // `castDetailed` baru berisi foto profil TMDB + nama karakter untuk
    // ditampilkan sebagai avatar dan di modal "Lihat Semua Pemeran".
    // Diambil 24 orang (bukan cuma 15) supaya modal punya cukup isi.
    const castRaw      = (detail.credits?.cast || []).slice(0, 24);
    const cast         = castRaw.map(c => c.name);
    const castDetailed = castRaw.map(c => ({
      id: c.id,
      name: c.name,
      character: c.character || null,
      photo: IMG.profile(c.profile_path || null),
    }));
    const genres   = (detail.genres || []).map(g => g.name);
    // TMDB sering tidak menandai video sebagai `official: true` untuk film
    // non-Hollywood/lebih kecil, padahal videonya tetap trailer resmi yang
    // valid. Kalau tidak ketemu yang official, fallback ke Trailer/Teaser
    // YouTube manapun (urutan: Trailer dulu, baru Teaser) supaya tombol
    // trailer tetap muncul untuk lebih banyak film.
    const ytVideos = detail.videos?.results?.filter(v => v.site === 'YouTube') || [];
    const trailer =
      ytVideos.find(v => v.type === 'Trailer' && v.official) ||
      ytVideos.find(v => v.type === 'Teaser' && v.official) ||
      ytVideos.find(v => v.type === 'Trailer') ||
      ytVideos.find(v => v.type === 'Teaser');
    const embedServers = getEmbedServers(detail.id, type, undefined, undefined, detail.external_ids?.imdb_id || null);
    const seasons  = type === 'tv' ? (detail.seasons || []).filter(s => s.season_number > 0) : [];

    // Rating usia untuk region Indonesia (ID); fallback ke US kalau ID tidak
    // punya data sertifikasi (umum untuk film non-Hollywood di TMDB).
    let ageRating: string | null = null;
    if (type === 'movie') {
      const results = detail.release_dates?.results || [];
      const region = results.find(r => r.iso_3166_1 === 'ID') || results.find(r => r.iso_3166_1 === 'US');
      ageRating = region?.release_dates?.find(d => d.certification)?.certification || null;
    } else {
      const results = detail.content_ratings?.results || [];
      const region = results.find(r => r.iso_3166_1 === 'ID') || results.find(r => r.iso_3166_1 === 'US');
      ageRating = region?.rating || null;
    }

    // Platform streaming legal (region ID) — hanya ambil `flatrate`
    // (langganan), bukan rent/buy, karena itu yang paling relevan sebagai
    // badge "juga tersedia di...". Dibatasi 5 logo biar tidak penuh di UI.
    const providersRaw = detail['watch/providers']?.results?.['ID']?.flatrate || [];
    const watchProviders = providersRaw.slice(0, 5).map(p => ({
      id: p.provider_id,
      name: p.provider_name,
      logo: IMG.thumb(p.logo_path),
    }));

    // Galeri video tambahan (Clip, Featurette, Behind the Scenes, Bloopers)
    // — beda dari `trailer` di atas, yang cuma ambil satu video utama untuk
    // tombol "Tonton Trailer". Ini semua video pendukung lain untuk galeri
    // thumbnail. Trailer/Teaser tidak diulang di sini supaya tidak duplikat
    // dengan tombol trailer utama. Dibatasi 10 biar grid tidak kepanjangan.
    const galleryTypes = new Set(['Clip', 'Featurette', 'Behind the Scenes', 'Bloopers']);
    const videoGallery = ytVideos
      .filter(v => galleryTypes.has(v.type))
      .slice(0, 10)
      .map(v => ({
        key: v.key,
        name: v.name || v.type,
        type: v.type,
        thumbnail: `https://img.youtube.com/vi/${v.key}/mqdefault.jpg`,
      }));

    // Keywords TMDB — movie pakai `keywords.keywords`, tv pakai `keywords.results`.
    // Dipakai sebagai chip tag yang lebih spesifik dari genre (mis. "time travel",
    // "based on novel") untuk membantu penemuan konten serupa via pencarian.
    const keywordsRaw = detail.keywords?.keywords || detail.keywords?.results || [];
    const keywords = keywordsRaw.slice(0, 8).map(k => k.name);

    // Rekomendasi/film serupa — TMDB kadang menyelipkan hasil tanpa poster
    // atau overview kosong, disaring supaya kartu di UI tidak tampil aneh.
    const recommendations = (detail.recommendations?.results || [])
      .filter(r => r.poster_path)
      .slice(0, 12)
      .map(r => ({
        slug: `${type}-${r.id}`,
        title: r.title || r.name || 'Untitled',
        poster: IMG.poster(r.poster_path || null),
        year: (r.release_date || r.first_air_date || '').slice(0, 4) || null,
        rating: r.vote_average ? r.vote_average.toFixed(1) : null,
        type: type === 'tv' ? 'Series' as const : 'Movie' as const,
      }));

    return Response.json({
      id: detail.id,
      slug,
      type: type === 'tv' ? 'Series' : 'Movie',
      title, poster, backdrop, rating, voteCount, year,
      releaseDate: detail.release_date || detail.first_air_date || null,
      synopsis: overview || null,
      tagline: detail.tagline || null,
      duration: type === 'movie'
        ? detail.runtime ? `${detail.runtime} menit` : null
        : detail.episode_run_time?.[0] ? `~${detail.episode_run_time[0]} menit/ep` : null,
      status: detail.status || null,
      genres, director, cast, castDetailed,
      trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      imdbId: detail.external_ids?.imdb_id || null,
      numberOfSeasons:  detail.number_of_seasons  || null,
      numberOfEpisodes: detail.number_of_episodes || null,
      seasons,
      ageRating,
      watchProviders,
      recommendations,
      videoGallery,
      keywords,
      stream: {
        primaryIframe: embedServers[0]?.url || null,
        servers: embedServers,
      },
    });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
