'use client';
import { useState, useEffect } from 'react';
import {
  getGuestSessionId,
  getLocalRating,
  setLocalRating,
  removeLocalRating,
} from '@/lib/guestSession';
import { hapticConfirm, hapticTap } from '@/lib/haptics';

interface Props {
  slug: string;
  tmdbRating: string | null;   // rating rata-rata TMDB, skala 10, mis. "8.7"
  voteCount?: number | null;   // jumlah rating TMDB, mis. 2431
  season?: number;             // opsional — kalau diisi bareng episode, rating masuk ke episode
  episode?: number;
}

/** "2431" -> "2.4K", "950" -> "950", "1200000" -> "1.2M" */
function formatVoteCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

export default function StarRating({ slug, tmdbRating, voteCount, season, episode }: Props) {
  const [userStars, setUserStars] = useState<number | null>(null);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  // Bintang yang baru saja "pop" saat rating tersimpan — dipakai untuk
  // memicu animasi scale sekali jalan, lalu dibersihkan setelah selesai.
  const [poppedStar, setPoppedStar] = useState<number | null>(null);

  // Key lokal unik per movie/tv ATAU per episode spesifik
  const ratingKey = season && episode ? `${slug}:s${season}e${episode}` : slug;

  useEffect(() => {
    setUserStars(getLocalRating(ratingKey));
  }, [ratingKey]);

  const submitRating = async (stars: number) => {
    setSubmitting(true);
    setStatus('idle');
    try {
      const guestSessionId = await getGuestSessionId();
      const params = new URLSearchParams({ guestSessionId });
      if (season && episode) {
        params.set('season', String(season));
        params.set('episode', String(episode));
      }
      // UI bintang 1-5 -> skala TMDB 2-10 (kelipatan 2, TMDB menerima kelipatan 0.5)
      const tmdbValue = stars * 2;

      const res = await fetch(`/api/movies/rate/${slug}?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: tmdbValue }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal mengirim rating');

      setLocalRating(ratingKey, stars);
      setUserStars(stars);
      setStatus('saved');
      hapticConfirm();
      setPoppedStar(stars);
      window.setTimeout(() => setPoppedStar(null), 350);
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const clearRating = async () => {
    setSubmitting(true);
    try {
      const guestSessionId = await getGuestSessionId();
      const params = new URLSearchParams({ guestSessionId });
      if (season && episode) {
        params.set('season', String(season));
        params.set('episode', String(episode));
      }
      await fetch(`/api/movies/rate/${slug}?${params.toString()}`, { method: 'DELETE' });
      removeLocalRating(ratingKey);
      setUserStars(null);
      setStatus('idle');
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClick = (stars: number) => {
    if (submitting) return;
    hapticTap();
    if (userStars === stars) {
      clearRating();
    } else {
      submitRating(stars);
    }
  };

  const displayStars = hoverStars ?? userStars ?? 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Skor agregat TMDB */}
      {tmdbRating && (
        <div className="flex items-center gap-1.5">
          <i className="fa-solid fa-star text-gold text-sm" />
          <span className="text-[#E8EDF2] font-bold text-base">{tmdbRating}</span>
          <span className="text-dim text-sm">/ 10</span>
          {typeof voteCount === 'number' && voteCount > 0 && (
            <span className="text-dim text-xs ml-1">
              · {formatVoteCount(voteCount)} ratings
            </span>
          )}
        </div>
      )}

      {/* Input rating bintang user (1-5), via TMDB guest session */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHoverStars(null)}
        >
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              disabled={submitting}
              onClick={() => handleClick(n)}
              onMouseEnter={() => setHoverStars(n)}
              className="p-0.5 disabled:opacity-50 transition-transform active:scale-90"
              aria-label={`Beri rating ${n} bintang`}
            >
              <i
                className={`fa-star text-lg transition-colors ${
                  n <= displayStars ? 'fa-solid text-gold' : 'fa-regular text-dim'
                } ${poppedStar !== null && n <= poppedStar ? 'star-pop' : ''}`}
                style={poppedStar !== null && n <= poppedStar ? { animationDelay: `${(n - 1) * 40}ms` } : undefined}
              />
            </button>
          ))}
        </div>

        {submitting && (
          <i className="fa-solid fa-circle-notch fa-spin text-dim text-xs" />
        )}
        {!submitting && status === 'saved' && userStars && (
          <span className="text-gold text-xs font-medium">Rating tersimpan</span>
        )}
        {!submitting && status === 'error' && (
          <span className="text-red-400 text-xs">Gagal, coba lagi</span>
        )}
      </div>

      {userStars && !submitting && status !== 'error' && (
        <p className="text-dim text-[11px]">
          Ketuk bintang yang sama untuk membatalkan rating.
        </p>
      )}
    </div>
  );
}
