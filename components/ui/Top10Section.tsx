'use client';
import Link from 'next/link';
import type { Movie } from '@/types/movie';

interface Props {
  title: string;
  movies: Movie[];
  loading?: boolean;
  eyebrow?: string;
  eyebrowIcon?: string;
}

function RankCard({ movie, rank }: { movie: Movie; rank: number }) {
  return (
    <Link href={`/movie/${movie.slug}`} className="flex-shrink-0 flex items-end group" style={{ width: 108 }}>
      {/* Big rank number, half-overlapping the poster */}
      <span
        className="font-display font-black text-transparent flex-shrink-0 leading-none select-none"
        style={{
          fontSize: 74,
          WebkitTextStroke: '2px #2A2A30',
          marginRight: -20,
          marginBottom: -6,
        }}
      >
        {rank}
      </span>
      <div className="w-20 flex-shrink-0">
        <div className="poster-card relative rounded-lg overflow-hidden bg-inkl aspect-[2/3] mb-2">
          {movie.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.poster}
              alt={movie.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-inke">
              <i className="fa-solid fa-film text-lg text-dim" />
            </div>
          )}
        </div>
        <p className="text-[11px] font-medium text-[#E8EDF2] line-clamp-2 leading-tight group-hover:text-gold transition-colors">
          {movie.title}
        </p>
      </div>
    </Link>
  );
}

function SkeletonRank({ rank }: { rank: number }) {
  return (
    <div className="flex-shrink-0 flex items-end" style={{ width: 108 }}>
      <span
        className="font-display font-black text-transparent flex-shrink-0 leading-none"
        style={{ fontSize: 74, WebkitTextStroke: '2px #2A2A30', marginRight: -20, marginBottom: -6 }}
      >
        {rank}
      </span>
      <div className="w-20 flex-shrink-0">
        <div className="skeleton rounded-lg aspect-[2/3] mb-2" />
      </div>
    </div>
  );
}

export default function Top10Section({ title, movies, loading, eyebrow, eyebrowIcon }: Props) {
  const top10 = movies.slice(0, 10);
  if (!loading && top10.length === 0) return null;

  return (
    <section className="mb-7">
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          {eyebrow && (
            <p className="flex items-center gap-1.5 text-gold text-[10px] font-extrabold tracking-wide mb-0.5">
              {eyebrowIcon && <i className={`${eyebrowIcon} text-[10px]`} />} {eyebrow.toUpperCase()}
            </p>
          )}
          <h2 className="font-display font-semibold text-base tracking-tight">{title}</h2>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar px-4 pb-1">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRank key={i} rank={i + 1} />)
          : top10.map((m, i) => <RankCard key={m.slug} movie={m} rank={i + 1} />)}
      </div>
    </section>
  );
}
