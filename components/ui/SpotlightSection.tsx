'use client';
import Link from 'next/link';
import type { Movie } from '@/types/movie';

interface Props {
  movie: Movie | null;
  loading?: boolean;
  eyebrow?: string; // e.g. "Pilihan Editor"
  /** True kalau ini instance Spotlight PERTAMA yang dirender di halaman
      (biasanya homepage) — dipakai untuk memberi hint prioritas tinggi ke
      gambarnya karena elemen ini adalah kandidat LCP (Largest Contentful
      Paint) paling mungkin di halaman. Default true supaya perilaku lama
      (semua Spotlight dianggap prioritas) tetap konsisten kecuali sengaja
      dimatikan oleh caller. */
  isLCPCandidate?: boolean;
}

export default function SpotlightSection({ movie, loading, eyebrow = 'Pilihan Editor', isLCPCandidate = true }: Props) {
  if (loading) {
    return (
      <section className="mb-7 px-4">
        <div className="skeleton rounded-2xl w-full" style={{ aspectRatio: '3/2' }} />
      </section>
    );
  }

  if (!movie) return null;

  return (
    <section className="mb-7 px-4">
      <Link
        href={`/movie/${movie.slug}`}
        className="relative block w-full rounded-2xl overflow-hidden group"
        style={{ aspectRatio: '3/2' }}
      >
        {(movie.backdrop || movie.poster) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.backdrop || movie.poster || ''}
            alt={movie.title}
            // fetchPriority + loading="eager" memberi tahu browser untuk
            // mengambil gambar ini secepat mungkin, bukan menunggu giliran
            // seperti gambar biasa — penting karena ini kandidat LCP utama
            // di homepage (elemen visual terbesar yang dirender pertama).
            fetchPriority={isLCPCandidate ? 'high' : 'auto'}
            loading={isLCPCandidate ? 'eager' : 'lazy'}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/40 via-transparent to-transparent" />

        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold text-ink text-[10px] font-bold uppercase tracking-wide">
            <i className="fa-solid fa-star text-[9px]" /> {eyebrow}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          {movie.type && (
            <span className="inline-block px-2 py-0.5 rounded-md bg-ghost border border-line text-silver text-[9px] font-bold mb-2 uppercase">
              {movie.type}
            </span>
          )}
          <h3 className="font-display font-bold text-lg leading-tight mb-1.5 line-clamp-2">{movie.title}</h3>

          <div className="flex items-center gap-3 mb-2">
            {movie.rating && (
              <div className="flex items-center gap-1">
                <i className="fa-solid fa-star text-[10px] text-gold" />
                <span className="text-gold text-xs font-semibold">{movie.rating}</span>
              </div>
            )}
            {movie.year && <span className="text-silver text-xs">{movie.year}</span>}
          </div>

          {movie.overview && (
            <p className="text-silver/90 text-xs leading-relaxed line-clamp-2 mb-3 max-w-md">
              {movie.overview}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-gold text-xs font-semibold">
            <i className="fa-solid fa-play text-[10px]" /> Tonton Sekarang
          </div>
        </div>
      </Link>
    </section>
  );
}
