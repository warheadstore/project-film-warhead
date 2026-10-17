'use client';
import { useState } from 'react';
import BackButton from '@/components/ui/BackButton';
import MovieGrid from '@/components/ui/MovieGrid';

export default function Page() {
  const [type, setType] = useState<'movie' | 'tv'>('movie');
  return (
    <div className="py-4">
      <div className="flex items-center gap-3 px-4 mb-4">
        <BackButton />
        <h1 className="font-display font-bold text-lg">Sedang Tayang</h1>
      </div>
      <div className="flex gap-2 px-4 mb-5">
        {(['movie', 'tv'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${type === t ? 'bg-gold text-ink' : 'bg-inke border border-line text-silver'}`}>
            {t === 'movie' ? 'Film' : 'Series'}
          </button>
        ))}
      </div>
      <MovieGrid endpoint="/api/movies/latest" extraParams={{ type }} />
    </div>
  );
}
