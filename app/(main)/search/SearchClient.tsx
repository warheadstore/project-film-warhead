'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import MovieCard from '@/components/ui/MovieCard';
import type { Movie } from '@/types/movie';

const HISTORY_KEY = 'mz_search_history';
const MAX_HISTORY = 8;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function getHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(q: string) {
  const prev = getHistory().filter(h => h.toLowerCase() !== q.toLowerCase());
  const next = [q, ...prev].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function removeHistory(q: string) {
  const next = getHistory().filter(h => h !== q);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export default function SearchClient() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState<'all' | 'Movie' | 'Series'>('all');
  const searchParams = useSearchParams();

  // Prefill query dari URL (?q=...) — dipakai saat masuk ke halaman ini
  // lewat link eksternal, mis. chip keyword di halaman detail film.
  // Hanya jalan sekali saat mount; setelah itu ketikan user yang berlaku.
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.trim()) setQuery(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(query, 350);
  const sugDebounced = useDebounce(query, 250);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
    inputRef.current?.focus();
  }, []);

  // Fetch suggestions (lightweight, only titles)
  useEffect(() => {
    if (!sugDebounced.trim()) {
      setSuggestions([]);
      return;
    }
    setSugLoading(true);
    fetch(`/api/movies/search?q=${encodeURIComponent(sugDebounced)}&page=1`)
      .then(r => r.json())
      .then(data => {
        setSuggestions((data.results || []).slice(0, 8));
      })
      .catch(() => setSuggestions([]))
      .finally(() => setSugLoading(false));
  }, [sugDebounced]);

  // Catatan: doSearch HANYA melakukan pencarian, tidak pernah menyimpan riwayat.
  // Riwayat baru ditulis lewat commitToHistory(), yang secara eksplisit dipanggil
  // hanya saat user menekan Enter atau mengklik item di dropdown (lihat di bawah) —
  // supaya riwayat tidak membengkak tiap kali user sekadar mengetik/mengetik-ulang.
  const doSearch = useCallback(async (q: string, pg = 1) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setError('');
    setShowDropdown(false);
    if (pg === 1) setTypeFilter('all');
    try {
      const res = await fetch(`/api/movies/search?q=${encodeURIComponent(q)}&page=${pg}`);
      const data = await res.json();
      const r: Movie[] = data.results || [];
      if (pg === 1) setResults(r);
      else setResults(prev => [...prev, ...r]);
      setTotalPages(data.total_pages || 1);
      setSearched(true);
    } catch {
      setError('Pencarian gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Dipanggil hanya pada aksi eksplisit user: submit via Enter, atau klik
  // salah satu item dropdown (riwayat/saran).
  const commitToHistory = (q: string) => {
    if (!q.trim()) return;
    saveHistory(q.trim());
    setHistory(getHistory());
  };

  // Live search saat mengetik (debounced) — tampilkan hasil, tapi JANGAN
  // simpan ke riwayat di sini.
  useEffect(() => { setPage(1); doSearch(debounced, 1); }, [debounced, doSearch]);

  // Infinite scroll — auto muat halaman berikutnya saat sentinel terlihat.
  // Tombol "Muat lebih banyak" tetap ada sebagai fallback/aksesibilitas.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !searched) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && page < totalPages) {
          const n = page + 1;
          setPage(n);
          doSearch(debounced, n);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, page, totalPages, searched, debounced, doSearch]);

  // Show dropdown when focused and there's a query
  useEffect(() => {
    if (focused && query.trim()) {
      setShowDropdown(true);
    } else if (!query.trim() && focused) {
      setShowDropdown(history.length > 0);
    }
  }, [focused, query, history]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setSuggestions([]);
    setShowDropdown(history.length > 0);
    inputRef.current?.focus();
  };

  const pickSuggestion = (title: string) => {
    setQuery(title);
    setShowDropdown(false);
    setFocused(false);
    inputRef.current?.blur();
    setPage(1);
    doSearch(title, 1);
    commitToHistory(title);
  };

  const deleteHistory = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    removeHistory(item);
    setHistory(getHistory());
  };

  const showHistory = !query.trim() && history.length > 0;
  const showSuggestions = !!query.trim() && (suggestions.length > 0 || sugLoading);

  const filteredResults = useMemo(() => {
    if (typeFilter === 'all') return results;
    return results.filter(m => m.type === typeFilter);
  }, [results, typeFilter]);

  return (
    <div className="py-4 px-4">
      {/* Search bar */}
      <div className="relative flex items-center mb-0">
        <i className="fa-solid fa-magnifying-glass absolute left-3.5 text-dim text-sm pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => { setQuery(e.target.value); }}
          onFocus={() => {
            setFocused(true);
            setShowDropdown(true);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) {
              setShowDropdown(false);
              setFocused(false);
              inputRef.current?.blur();
              setPage(1);
              doSearch(query.trim(), 1);
              commitToHistory(query.trim());
            }
            if (e.key === 'Escape') setShowDropdown(false);
          }}
          placeholder="Cari film atau series..."
          autoComplete="off"
          className={`w-full h-11 pl-10 pr-10 bg-inke border border-line text-sm text-[#E8EDF2] placeholder-dim focus:outline-none focus:border-gold/50 transition-colors ${showDropdown ? 'rounded-t-2xl rounded-b-none border-b-transparent' : 'rounded-2xl'}`}
        />
        {query && (
          <button onClick={clear} className="absolute right-3 text-dim hover:text-silver z-10">
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        )}

        {/* Dropdown */}
        {showDropdown && (focused) && (showHistory || showSuggestions) && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 bg-inke border border-line border-t-0 rounded-b-2xl z-50 overflow-hidden"
          >
            {/* History mode (no query) */}
            {showHistory && (
              <>
                <div className="px-4 pt-2.5 pb-1 flex items-center justify-between">
                  <span className="text-dim text-[11px] uppercase tracking-wider font-medium">Riwayat</span>
                  <button
                    onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]); setShowDropdown(false); }}
                    className="text-dim text-[11px] hover:text-gold transition-colors"
                  >
                    Hapus semua
                  </button>
                </div>
                {history.map((item) => (
                  <button
                    key={item}
                    onClick={() => pickSuggestion(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group"
                  >
                    <i className="fa-solid fa-clock-rotate-left text-dim text-xs w-4 flex-shrink-0" />
                    <span className="text-silver text-sm flex-1 text-left truncate">{item}</span>
                    <button
                      onClick={(e) => deleteHistory(e, item)}
                      className="text-dim opacity-0 group-hover:opacity-100 hover:text-silver transition-all"
                    >
                      <i className="fa-solid fa-xmark text-xs" />
                    </button>
                  </button>
                ))}
              </>
            )}

            {/* Suggestions mode (has query) */}
            {showSuggestions && (
              <>
                {sugLoading && suggestions.length === 0 && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <i className="fa-solid fa-circle-notch fa-spin text-gold text-xs" />
                    <span className="text-dim text-sm">Mencari...</span>
                  </div>
                )}
                {suggestions.map((movie) => (
                  <button
                    key={movie.slug}
                    onClick={() => pickSuggestion(movie.title)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                  >
                    <i className="fa-solid fa-magnifying-glass text-dim text-xs w-4 flex-shrink-0" />
                    <span className="text-silver text-sm flex-1 text-left truncate">{movie.title}</span>
                    <i className="fa-solid fa-arrow-up-left text-dim text-xs flex-shrink-0 rotate-90" />
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-5">
        {/* Loading */}
        {loading && results.length === 0 && (
          <div className="flex justify-center py-16">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl text-gold" />
          </div>
        )}

        {/* Error */}
        {error && <p className="text-center text-dim text-sm py-8">{error}</p>}

        {/* Empty state */}
        {!loading && searched && results.length === 0 && !error && (
          <div className="text-center py-16">
            <p className="text-silver text-sm mb-1">Tidak ada hasil untuk</p>
            <p className="text-gold font-semibold">&quot;{query}&quot;</p>
          </div>
        )}

        {/* Placeholder */}
        {!searched && !loading && (
          <div className="text-center py-16">
            <i className="fa-solid fa-magnifying-glass text-4xl text-dim mb-3 block" />
            <p className="text-silver text-sm">Ketik judul film atau series</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <>
            {/* Filter tipe — Film / Series */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-dim text-xs">{filteredResults.length} hasil ditemukan</p>
              <div className="flex gap-1.5">
                {([
                  { key: 'all', label: 'Semua' },
                  { key: 'Movie', label: 'Film' },
                  { key: 'Series', label: 'Series' },
                ] as const).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setTypeFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                      typeFilter === f.key ? 'bg-gold text-ink' : 'bg-inke border border-line text-silver'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredResults.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-silver text-sm">
                  Tidak ada {typeFilter === 'Movie' ? 'film' : 'series'} yang cocok
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filteredResults.map(m => <MovieCard key={m.slug} movie={m} size="sm" />)}
              </div>
            )}

            {/* Sentinel untuk infinite scroll */}
            {page < totalPages && !loading && <div ref={sentinelRef} className="h-1" />}

            {page < totalPages && !loading && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => { const n = page + 1; setPage(n); doSearch(debounced, n); }}
                  className="px-6 py-2.5 rounded-xl border border-line text-silver text-sm hover:border-gold hover:text-gold transition-colors"
                >
                  Muat lebih banyak
                </button>
              </div>
            )}

            {loading && results.length > 0 && (
              <div className="flex justify-center py-4">
                <i className="fa-solid fa-circle-notch fa-spin text-xl text-gold" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
