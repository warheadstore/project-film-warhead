'use client';
import Link from 'next/link';
import MovieCard from './MovieCard';
import type { Movie } from '@/types/movie';

interface Props {
  title: string;
  movies: Movie[];
  moreHref?: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Eyebrow kecil di atas judul, mis. "Update Hari Ini" — memberi kesan
      konten dikurasi, bukan sekadar daftar acak (pola umum brand streaming). */
  eyebrow?: string;
  /** Class ikon Font Awesome untuk eyebrow, mis. "fa-solid fa-fire".
      Dipakai sebagai <i> asli, bukan emoji, sesuai preferensi desain. */
  eyebrowIcon?: string;
}

function SkeletonCard({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const w = size === 'sm' ? 'w-28' : size === 'lg' ? 'w-44' : 'w-36';
  return (
    <div className={`${w} flex-shrink-0`}>
      <div className="skeleton rounded-xl aspect-[2/3] mb-2" />
      <div className="skeleton h-3 rounded w-4/5 mb-1" />
      <div className="skeleton h-2.5 rounded w-2/5" />
    </div>
  );
}

export default function SectionRow({ title, movies, moreHref, loading, size = 'md', eyebrow, eyebrowIcon }: Props) {
  return (
    <section className="mb-7">
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          {eyebrow && (
            <p className="flex items-center gap-1.5 text-gold text-[10px] font-bold uppercase tracking-wider mb-0.5">
              {eyebrowIcon && <i className={`${eyebrowIcon} text-[10px]`} />}
              {eyebrow}
            </p>
          )}
          <h2 className="font-display font-semibold text-base tracking-tight">{title}</h2>
        </div>
        {moreHref && (
          <Link href={moreHref} className="flex items-center gap-1.5 text-gold text-xs font-medium flex-shrink-0">
            Semua <i className="fa-solid fa-chevron-right text-[10px]" />
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} size={size} />)
          : movies.length === 0
          ? <p className="text-dim text-sm py-6 text-center w-full">Tidak ada konten</p>
          : movies.map((m) => <MovieCard key={m.slug} movie={m} size={size} />)
        }
      </div>
    </section>
  );
}
