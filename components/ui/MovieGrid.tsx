'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import MovieCard from './MovieCard';
import type { Movie } from '@/types/movie';

interface Props {
  endpoint: string;
  extraParams?: Record<string, string>;
  /** Label opsional ditampilkan di atas grid, mis. "128 hasil ditemukan" */
  showCount?: boolean;
}

function SkeletonCard() {
  return (
    <div>
      <div className="skeleton rounded-xl aspect-[2/3] mb-2" />
      <div className="skeleton h-3 rounded w-4/5 mb-1" />
      <div className="skeleton h-2.5 rounded w-2/5" />
    </div>
  );
}

export default function MovieGrid({ endpoint, extraParams = {}, showCount = true }: Props) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const load = useCallback(async (pg: number, isSwitch = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    if (isSwitch) setSwitching(true);
    setError('');
    try {
      const url = new URL(endpoint, 'http://x');
      url.searchParams.set('page', String(pg));
      Object.entries(extraParams).forEach(([k, v]) => url.searchParams.set(k, v));
      const res = await fetch(`${url.pathname}${url.search}`);
      if (!res.ok) throw new Error('Gagal');
      const data = await res.json();
      const results: Movie[] = data.results || [];
      if (pg === 1) setMovies(results);
      else setMovies(prev => [...prev, ...results]);
      setTotalPages(data.total_pages || 1);
      setTotalResults(typeof data.total_results === 'number' ? data.total_results : null);
    } catch {
      setError('Gagal memuat konten. Coba lagi.');
    } finally {
      setLoading(false);
      setSwitching(false);
      loadingRef.current = false;
    }
  }, [endpoint, JSON.stringify(extraParams)]);

  // Saat endpoint/filter berganti: JANGAN langsung kosongkan grid (itu
  // menyebabkan "flash" grid kosong sebelum skeleton muncul). Tandai
  // `switching` dulu supaya skeleton langsung tampil menimpa grid lama,
  // baru grid lama diganti setelah data baru datang.
  useEffect(() => {
    setPage(1);
    setSwitching(true);
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(extraParams)]);

  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    setPage(prev => {
      const next = prev + 1;
      load(next);
      return next;
    });
  }, [load]);

  // Infinite scroll — auto-load saat sentinel di bawah grid terlihat.
  // Tombol "Muat lebih banyak" tetap ada sebagai fallback/aksesibilitas
  // kalau observer tidak didukung atau untuk kontrol manual.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && page < totalPages && movies.length > 0) {
          loadMore();
        }
      },
      { rootMargin: '400px' } // mulai load sebelum sentinel benar-benar kelihatan
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, page, totalPages, movies.length, loadMore]);

  if (error && movies.length === 0 && !switching) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <i className="fa-solid fa-circle-exclamation text-3xl text-dim" />
        <p className="text-dim text-sm">{error}</p>
        <button onClick={() => load(1)} className="px-4 py-2 rounded-xl bg-gold text-ink text-sm font-semibold">
          Coba Lagi
        </button>
      </div>
    );
  }

  // Saat berganti filter, tampilkan skeleton dulu di atas data lama yang
  // masih ada (bukan grid kosong) supaya transisi terasa lebih halus.
  const showSkeletonOnly = switching && movies.length === 0;

  return (
    <div>
      {showCount && totalResults !== null && !showSkeletonOnly && (
        <p className="text-dim text-xs px-4 mb-3">
          {totalResults.toLocaleString('id-ID')} hasil ditemukan
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 px-4">
        {!switching && movies.map(m => <MovieCard key={m.slug} movie={m} size="sm" />)}
        {(loading || switching) && Array.from({ length: switching ? 9 : 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>

      {/* Sentinel tak terlihat untuk memicu infinite scroll */}
      {!switching && page < totalPages && movies.length > 0 && (
        <div ref={sentinelRef} className="h-1" />
      )}

      {!switching && !loading && page < totalPages && movies.length > 0 && (
        <div className="flex justify-center mt-2 mb-4">
          <button onClick={loadMore}
            className="px-6 py-2.5 rounded-xl border border-line text-silver text-sm font-medium hover:border-gold hover:text-gold transition-colors">
            Muat lebih banyak
          </button>
        </div>
      )}

      {!switching && !loading && page >= totalPages && movies.length > 0 && (
        <p className="text-center text-dim text-xs py-6">Semua konten sudah ditampilkan</p>
      )}

      {!switching && !loading && movies.length === 0 && !error && (
        <p className="text-center text-dim text-sm py-16">Tidak ada konten untuk ditampilkan</p>
      )}
    </div>
  );
}
