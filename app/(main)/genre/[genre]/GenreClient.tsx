'use client';
import { useState, useEffect, useMemo } from 'react';
import MovieGrid from '@/components/ui/MovieGrid';
import { findGenreBySlug, genreIdForType, type GenreDef } from '@/lib/genres';

export default function GenreClient({ genreSlug }: { genreSlug: string }) {
  const [genreDef, setGenreDef] = useState<GenreDef | null>(null);
  const [fallbackId, setFallbackId] = useState<number | null>(null);
  const [type, setType] = useState<'movie' | 'tv'>('movie');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek dulu daftar genre terpusat (ID resmi TMDB, sudah divalidasi —
    // lihat lib/genres.ts untuk catatan soal genre yang tidak valid seperti
    // "Biography" yang sebelumnya salah dipetakan ke ID Documentary).
    const direct = findGenreBySlug(genreSlug);
    if (direct) {
      setGenreDef(direct);
      // Genre TV-only (tanpa tmdbId movie, mis. Reality/Talk Show) langsung
      // dibuka di tab Series, bukan Film yang bakal kosong.
      if (!direct.tmdbId && direct.tmdbIdTv) setType('tv');
      setLoading(false);
      return;
    }

    // Fallback: fetch dari TMDB genres API untuk slug yang tidak ada
    // di daftar terpusat (mis. genre baru dari TMDB yang belum kita tambahkan manual).
    fetch('/api/movies/genres')
      .then(r => r.json())
      .then(d => {
        const found = (d.genres || []).find((g: { id: number; name: string }) =>
          g.name.toLowerCase().replace(/\s+/g, '-') === genreSlug.toLowerCase()
        );
        if (found) setFallbackId(found.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [genreSlug]);

  const activeGenreId = useMemo(() => {
    if (genreDef) return genreIdForType(genreDef, type);
    return fallbackId ?? undefined;
  }, [genreDef, fallbackId, type]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <i className="fa-solid fa-circle-notch fa-spin text-2xl text-gold" />
    </div>
  );

  if (!genreDef && !fallbackId) return (
    <p className="text-center text-dim py-16 text-sm">Genre tidak ditemukan</p>
  );

  // Genre terpusat yang cuma valid di salah satu tipe (mis. Reality = TV-only,
  // War = movie-only karena tidak ada tmdbIdTv) — sembunyikan tab yang gak relevan
  // biar user gak mentok ke grid kosong.
  const showMovieTab = genreDef ? !!genreDef.tmdbId    : true;
  const showTvTab    = genreDef ? !!genreDef.tmdbIdTv  : true;

  return (
    <div>
      {showMovieTab && showTvTab && (
        <div className="flex gap-2 px-4 mb-5">
          {(['movie', 'tv'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${type === t ? 'bg-gold text-ink' : 'bg-inke border border-line text-silver'}`}>
              {t === 'movie' ? 'Film' : 'Series'}
            </button>
          ))}
        </div>
      )}
      {activeGenreId && (
        <MovieGrid
          endpoint="/api/movies/discover"
          extraParams={{ genre: String(activeGenreId), type }}
        />
      )}
    </div>
  );
}
