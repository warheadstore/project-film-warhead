export interface CastMember {
  id: number;
  name: string;
  character?: string | null;
  photo?: string | null; // URL foto profil TMDB (w185), null kalau TMDB tidak punya fotonya
}

export interface WatchProvider {
  id: number;
  name: string;
  logo?: string | null;
}

export interface RecommendedItem {
  slug: string;
  title: string;
  poster?: string | null;
  year?: string | null;
  rating?: string | null;
  type: 'Movie' | 'Series';
}

export interface VideoItem {
  key: string;
  name: string;
  type: string; // 'Clip' | 'Featurette' | 'Behind the Scenes' | dst
  thumbnail: string; // thumbnail YouTube, dibangun dari `key`
}

export interface Movie {
  id?: number | string;
  tmdbId?: number;
  title: string;
  slug: string;           // format: movie-{id} | tv-{id}
  poster?: string | null;
  backdrop?: string | null;
  titleLogo?: string | null; // logo PNG transparan judul (gaya title-card Netflix/Disney+), null jika TMDB tidak punya
  year?: string | null;
  releaseDate?: string | null;
  genres?: string[];
  genreIds?: number[];
  rating?: string | null;
  voteCount?: number | null;
  duration?: string | null;
  quality?: string | null;
  type?: 'Movie' | 'Series';
  overview?: string | null;
  synopsis?: string | null;
  description?: string | null;
  director?: string | null;
  cast?: string[];
  castDetailed?: CastMember[];
  trailer?: string | null;
  tagline?: string | null;
  status?: string | null;
  imdbId?: string | null;
  numberOfSeasons?: number | null;
  numberOfEpisodes?: number | null;
  seasons?: TMDBSeason[];
  ageRating?: string | null;
  watchProviders?: WatchProvider[];
  recommendations?: RecommendedItem[];
  videoGallery?: VideoItem[];
  keywords?: string[];
  stream?: StreamData;
}

export interface TMDBSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path?: string | null;
  air_date?: string;
}

export interface Episode {
  episode: number;
  season: number;
  title: string;
  overview?: string | null;
  still?: string | null;
  airDate?: string | null;
  runtime?: string | null;
  servers?: StreamServer[];
}

export interface StreamData {
  primaryIframe?: string | null;
  servers?: StreamServer[];
}

export interface StreamServer {
  server: string;
  url?: string;
  streamIframe?: string;
  streamUrl?: string;
}
