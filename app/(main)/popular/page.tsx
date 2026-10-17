'use client';
import { useState } from 'react';
import BackButton from '@/components/ui/BackButton';
import MovieGrid from '@/components/ui/MovieGrid';
import { GENRES, genreIdForType } from '@/lib/genres';

export default function Page() {
  const [type, setType] = useState<'movie' | 'tv'>('movie');
  const [genreSlug, setGenreSlug] = useState<string>('all');

  // Cuma tampilkan genre yang memang valid untuk tab aktif (movie/tv) — genre
  // TV-only seperti Reality/Talk Show gak muncul di tab Film, dan sebaliknya.
  const visibleGenres = GENRES.filter(g => genreIdForType(g, type) !== undefined);
  const selectedGenre = visibleGenres.find(g => g.slug === genreSlug);
  const selectedGenreId = selectedGenre ? genreIdForType(selectedGenre, type) : undefined;
  // Tanpa filter genre: pakai endpoint /popular (list "populer" TMDB asli).
  // Dengan filter genre: /popular tidak mendukung parameter genre, jadi
  // pindah ke /discover yang diurutkan berdasarkan popularitas — hasilnya
  // setara "populer" tapi sudah disaring genre.
  const endpoint = selectedGenreId ? '/api/movies/discover' : '/api/movies/popular';
  const extraParams = selectedGenreId
    ? { type, genre: String(selectedGenreId), sort: 'popularity.desc' }
    : { type };

  return (
    <div className="py-4">
      <div className="flex items-center gap-3 px-4 mb-4">
        <BackButton />
        <h1 className="font-display font-bold text-lg">Film Populer</h1>
      </div>
      <div className="flex gap-2 px-4 mb-3">
        {(['movie', 'tv'] as const).map(t => (
          <button key={t} onClick={() => { setType(t); setGenreSlug('all'); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${type === t ? 'bg-gold text-ink' : 'bg-inke border border-line text-silver'}`}>
            {t === 'movie' ? 'Film' : 'Series'}
          </button>
        ))}
      </div>

      {/* Sub-filter genre — supaya bisa gabungkan "Populer" + genre tertentu */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 mb-5 pb-1">
        <button onClick={() => setGenreSlug('all')}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
            genreSlug === 'all' ? 'bg-gold text-ink border-gold' : 'bg-inke border-line text-silver'
          }`}>
          Semua Genre
        </button>
        {visibleGenres.map(g => (
          <button key={g.slug} onClick={() => setGenreSlug(g.slug)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors"
            style={
              genreSlug === g.slug
                ? { background: g.color, borderColor: g.color, color: '#080A0C' }
                : { background: g.color + '15', borderColor: g.color + '40', color: g.color }
            }>
            {g.label}
          </button>
        ))}
      </div>

      <MovieGrid endpoint={endpoint} extraParams={extraParams} />
    </div>
  );
}
