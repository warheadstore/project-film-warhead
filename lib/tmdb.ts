const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG  = 'https://image.tmdb.org/t/p';

export const IMG = {
  poster:   (path: string | null) => path ? `${TMDB_IMG}/w500${path}`  : null,
  // Backdrop dipakai di card kecil (Spotlight ~350-400px CSS width) dan hero
  // detail (maxHeight 280px) — w1280 (lebar asli TMDB) jauh lebih besar dari
  // yang pernah dibutuhkan di layar manapun, dan terbukti jadi kontributor
  // utama LCP lambat (payload gambar besar untuk elemen yang menjadi Largest
  // Contentful Paint di homepage). w780 tetap tajam di layar retina/HiDPI
  // pada ukuran tampil ini, dengan payload jauh lebih kecil.
  backdrop: (path: string | null) => path ? `${TMDB_IMG}/w780${path}` : null,
  thumb:    (path: string | null) => path ? `${TMDB_IMG}/w185${path}`  : null,
  // Foto profil pemeran/kru — w185 cukup tajam untuk avatar kecil maupun
  // grid "Lihat Semua Pemeran" tanpa file terlalu besar.
  profile:  (path: string | null) => path ? `${TMDB_IMG}/w185${path}`  : null,
};

function apiKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error('TMDB_API_KEY tidak ditemukan di environment variables');
  return key;
}

export async function tmdb<T = unknown>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set('api_key', apiKey());
  url.searchParams.set('language', 'id-ID');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 },
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`TMDB ${endpoint} → ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Ambil URL logo judul (PNG transparan, gaya "title card" Netflix/Disney+)
 * untuk satu film/series. TMDB paling sering punya logo berbahasa Inggris
 * atau tanpa teks ('null'), jarang berbahasa Indonesia — jadi endpoint
 * /images sengaja TIDAK pakai parameter `language: 'id-ID'` seperti
 * `tmdb()` biasa, dan `include_image_language` diset eksplisit supaya
 * hasil logo tidak kosong.
 *
 * Return null kalau TMDB tidak punya logo untuk item ini — pemanggil
 * harus fallback ke judul teks biasa.
 */
export async function fetchLogo(id: number, type: 'movie' | 'tv'): Promise<string | null> {
  try {
    const url = new URL(`${TMDB_BASE}/${type}/${id}/images`);
    url.searchParams.set('api_key', apiKey());
    url.searchParams.set('include_image_language', 'en,null');
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json() as { logos?: { file_path: string; iso_639_1: string | null }[] };
    const logos = data.logos || [];
    // Prioritaskan logo bahasa Inggris (biasanya lebih lengkap/resmi),
    // fallback ke logo tanpa bahasa (iso_639_1 null, biasanya simbol/wordmark generik)
    const best = logos.find(l => l.iso_639_1 === 'en') || logos.find(l => l.iso_639_1 === null) || logos[0];
    return best ? `${TMDB_IMG}/w500${best.file_path}` : null;
  } catch {
    return null;
  }
}

// ─── TYPE DEFINITIONS ────────────────────────────────────────────────────────

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  media_type?: 'movie' | 'tv' | 'person';
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  tagline?: string;
  origin_country?: string[];
}

export interface TMDBDetail extends TMDBMovie {
  credits?: {
    cast: { id: number; name: string; character: string; profile_path?: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
  videos?: {
    results: { key: string; site: string; type: string; official: boolean; name?: string }[];
  };
  seasons?: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    poster_path?: string | null;
    air_date?: string;
  }[];
  external_ids?: { imdb_id?: string };
  // append_to_response=recommendations — film/series serupa untuk section
  // "Mungkin Kamu Suka" di halaman detail.
  recommendations?: { results: TMDBMovie[] };
  // append_to_response=release_dates (movie) — rating usia per negara (mis. R, PG-13).
  release_dates?: {
    results: { iso_3166_1: string; release_dates: { certification: string }[] }[];
  };
  // append_to_response=content_ratings (tv) — rating usia per negara (mis. TV-MA).
  content_ratings?: {
    results: { iso_3166_1: string; rating: string }[];
  };
  // append_to_response=watch/providers — daftar platform legal per negara.
  'watch/providers'?: {
    results: Record<string, {
      link?: string;
      flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
    }>;
  };
  // append_to_response=keywords — tag TMDB (movie: `keywords.keywords`, tv: `keywords.results`)
  keywords?: {
    keywords?: { id: number; name: string }[];
    results?: { id: number; name: string }[];
  };
}

export interface TMDBEpisode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  overview?: string;
  still_path?: string | null;
  air_date?: string;
  runtime?: number;
}

export interface TMDBPage<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

// ─── NORMALIZE ───────────────────────────────────────────────────────────────

export function normalizeMovie(item: TMDBMovie) {
  const isTV = item.media_type === 'tv' || !!item.name;
  const id   = item.id;
  const slug = isTV ? `tv-${id}` : `movie-${id}`;

  return {
    id,
    slug,
    tmdbId: id,
    title:       item.title || item.name || 'Untitled',
    type:        isTV ? 'Series' : 'Movie' as 'Series' | 'Movie',
    poster:      IMG.poster(item.poster_path || null),
    backdrop:    IMG.backdrop(item.backdrop_path || null),
    rating:      item.vote_average ? item.vote_average.toFixed(1) : null,
    voteCount:   item.vote_count ?? null,
    year:        (item.release_date || item.first_air_date || '').slice(0, 4) || null,
    releaseDate: item.release_date || item.first_air_date || null,
    overview:    item.overview || null,
    genreIds:    item.genre_ids || [],
  };
}

// ─── EMBED SERVERS ───────────────────────────────────────────────────────────

export function getEmbedServers(tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number, imdbId?: string | null) {
  // VidSrcWiki = Server Utama (Server 1)
  // 2Embed (bekas Server Utama) dipindahkan ke Server Alternatif (Server 5)
  // VSEmbed (Server 6) menggantikan VidSrcCC yang sudah tidak berfungsi.
  // Provider ini menerima IMDB ID atau TMDB ID di path yang sama — pakai
  // IMDB ID kalau tersedia (lebih konsisten di sisi provider), fallback
  // ke TMDB ID kalau IMDB ID belum didapat.
  if (type === 'movie') {
    return [
      { server: 'VidSrcWiki',url: `https://vidsrc.wiki/embed/movie/${tmdbId}` },
      { server: 'SuperEmbed',url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1` },
      { server: 'VidSrc',    url: `https://vidsrc.to/embed/movie/${tmdbId}` },
      { server: 'VidLink',   url: `https://vidlink.pro/movie/${tmdbId}` },
      { server: '2Embed',    url: `https://www.2embed.cc/embed/${tmdbId}` },
      { server: 'VSEmbed',   url: `https://vsembed.ru/embed/movie/${imdbId || tmdbId}` },
      { server: 'VidFast',   url: `https://vidfast.vc/movie/${imdbId || tmdbId}` },
    ];
  }
  const s = season || 1;
  const e = episode || 1;
  return [
    { server: 'VidSrcWiki',url: `https://vidsrc.wiki/embed/tv/${tmdbId}/${s}/${e}` },
    { server: 'SuperEmbed',url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}` },
    { server: 'VidSrc',    url: `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${e}` },
    { server: 'VidLink',   url: `https://vidlink.pro/tv/${tmdbId}/${s}/${e}` },
    { server: '2Embed',    url: `https://www.2embed.cc/embedtv/${tmdbId}&s=${s}&e=${e}` },
    { server: 'VSEmbed',   url: `https://vsembed.ru/embed/tv/${imdbId || tmdbId}/${s}/${e}` },
    { server: 'VidFast',   url: `https://vidfast.vc/tv/${imdbId || tmdbId}/${s}/${e}` },
  ];
}
