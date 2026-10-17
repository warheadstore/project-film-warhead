'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Movie } from '@/types/movie';
import { getEmbedServers } from '@/lib/tmdb';
import { recordWatch } from '@/lib/continueWatching';
import ShareSheet from '@/components/ui/ShareSheet';

interface Props { slug: string }
type Server = { server: string; url: string };

export default function WatchClient({ slug }: Props) {
  const [movie, setMovie]         = useState<Movie | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [servers, setServers]     = useState<Server[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  // Index server yang MAU dipindah ke — dipisah dari activeIdx supaya
  // dialog konfirmasi (lihat pendingServerIdx di bawah) bisa menyimpan
  // "niat pindah" sebelum benar-benar dieksekusi, sama seperti pola
  // _confirmSwitchServer di app native: tap server lain tidak langsung
  // pindah, cuma membuka dialog; activeIdx baru berubah setelah user
  // menekan tombol "Ganti Server" di dialog itu.
  const [pendingServerIdx, setPendingServerIdx] = useState<number | null>(null);
  const [isLocked, setIsLocked]   = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);

  // Double-tap di layar (khusus saat locked di landscape) untuk buka kunci
  const handleLockOverlayTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      setIsLocked(false);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, []);
  const router    = useRouter();
  const params    = useSearchParams();
  const season    = parseInt(params.get('season') || '1');
  const episode   = parseInt(params.get('episode') || '1');

  useEffect(() => {
    fetch(`/api/movies/detail/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        // Belum-rilis check beda antara movie & series di TMDB:
        // - Movie: status "Released" begitu tayang, jadi selain itu = belum rilis.
        // - Series: status TMDB TIDAK PERNAH "Released" — nilainya "Returning
        //   Series" / "Ended" / "Canceled" / "In Production" / "Planned" / "Pilot".
        //   Kalau dicek pakai aturan movie, redirect ini selalu ke-trigger untuk
        //   SEMUA series (bug yang bikin klik episode selalu balik ke halaman
        //   detail). Untuk series, hanya anggap belum rilis kalau statusnya
        //   "Planned" atau "In Production" (belum ada episode yang tayang).
        const status = (d.status || '').toLowerCase();
        const isUnreleased = d.type === 'Series'
          ? status === 'planned' || status === 'in production'
          : !!status && status !== 'released';
        if (isUnreleased) {
          router.replace(`/movie/${slug}`);
          return;
        }
        setMovie(d);
        const type   = d.type === 'Series' ? 'tv' : 'movie';
        const tmdbId = d.id as number;
        const raw    = getEmbedServers(tmdbId, type, season, episode, d.imdbId as string | null | undefined);
        setServers(raw);
        setActiveIdx(0);
        recordWatch(d, type === 'tv' ? { season, episode } : undefined);
      })
      .catch(e => setError(e.message || 'Gagal memuat'))
      .finally(() => setLoading(false));
  }, [slug, season, episode]);

  // Cleanup orientation on unmount
  useEffect(() => {
    return () => {
      try { screen.orientation?.unlock(); } catch {}
    };
  }, []);

  // Block iframe navigation hijack
  useEffect(() => {
    const origOpen = window.open.bind(window);
    window.open = (url, target, features) => {
      if (url && typeof url === 'string' &&
        (url.startsWith('/') || url.includes(window.location.hostname))) {
        return origOpen(url, target, features);
      }
      if (url) origOpen(url, '_blank', 'noopener,noreferrer');
      return null;
    };
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (anchor?.href && !anchor.href.startsWith(window.location.origin) && !anchor.href.startsWith('/')) {
        e.preventDefault();
        e.stopPropagation();
        window.open(anchor.href, '_blank', 'noopener,noreferrer');
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => {
      window.open = origOpen;
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  // Alert konfirmasi ganti server — SAMA style & teks dengan dialog
  // "Ganti Server?" di app native (AlertDialog inkl background, tombol
  // Batal + tombol aksi warna gold), karena berpindah server berarti
  // iframe di-remount dari 0 (lihat `key={active.url}` pada <iframe>),
  // jadi progres tontonan di server saat ini hilang.
  const requestServerSwitch = useCallback((idx: number) => {
    if (idx === activeIdx) return;
    setPendingServerIdx(idx);
  }, [activeIdx]);

  const confirmServerSwitch = useCallback(() => {
    if (pendingServerIdx === null) return;
    setActiveIdx(pendingServerIdx);
    setPendingServerIdx(null);
  }, [pendingServerIdx]);

  const cancelServerSwitch = useCallback(() => setPendingServerIdx(null), []);

  // Landscape toggle
  const toggleLandscape = useCallback(async () => {
    if (!isLandscape) {
      try {
        if (playerRef.current?.requestFullscreen) {
          await playerRef.current.requestFullscreen();
        }
        await screen.orientation?.lock('landscape');
        setIsLandscape(true);
      } catch {
        setIsLandscape(true);
      }
    } else {
      try {
        screen.orientation?.unlock();
        if (document.fullscreenElement) await document.exitFullscreen();
      } catch {}
      setIsLandscape(false);
    }
  }, [isLandscape]);

  // Auto-detect rotate back to portrait
  useEffect(() => {
    const handler = () => {
      const isPort = window.screen.orientation?.type?.includes('portrait')
        || window.innerHeight > window.innerWidth;
      if (isPort && isLandscape) {
        setIsLandscape(false);
        try { screen.orientation?.unlock(); } catch {}
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }
    };
    window.addEventListener('orientationchange', handler);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('orientationchange', handler);
      window.removeEventListener('resize', handler);
    };
  }, [isLandscape]);

  // Fullscreen exit listener
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement && isLandscape) {
        setIsLandscape(false);
        try { screen.orientation?.unlock(); } catch {}
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [isLandscape]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <i className="fa-solid fa-circle-notch fa-spin text-3xl text-gold" />
    </div>
  );

  if (error || !movie) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
      <i className="fa-solid fa-circle-exclamation text-4xl text-dim" />
      <p className="text-silver text-sm text-center">{error || 'Konten tidak tersedia'}</p>
      <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-inke border border-line text-silver text-sm">Kembali</button>
    </div>
  );

  const isSeries = movie.type === 'Series';
  const active   = servers[activeIdx];

  return (
    <div className="min-h-screen bg-ink">
      {/* Top bar */}
      {!isLandscape && (
        <div className="flex items-center gap-3 px-4 h-14 border-b border-line sticky top-0 z-40 bg-ink">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-xl bg-ghost flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-arrow-left text-sm text-silver" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm truncate">{movie.title}</h1>
            {isSeries && <p className="text-[10px] text-dim">Season {season} · Episode {episode}</p>}
          </div>
          <button onClick={() => setShowShareSheet(true)} aria-label="Bagikan"
            className="w-8 h-8 rounded-xl bg-ghost flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-share-nodes text-sm text-silver" />
          </button>
        </div>
      )}

      {/* Player */}
      <div
        ref={playerRef}
        style={isLandscape ? {
          position: 'fixed', inset: 0, zIndex: 9999,
          width: '100vw', height: '100vh', background: '#000',
        } : {
          width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative',
        }}
      >
        {active ? (
          <>
            <iframe
              key={active.url}
              src={active.url}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              allow="fullscreen; autoplay; encrypted-media; picture-in-picture; web-share"
              referrerPolicy="no-referrer"
              title={movie.title}
            />
            {/* overlay dihapus — cross-origin iframe tidak bisa diakses via JS, justru block play */}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center gap-3 flex-col">
            <i className="fa-solid fa-circle-exclamation text-3xl text-dim" />
            <p className="text-dim text-sm">Pilih server di bawah</p>
          </div>
        )}

        {/* Lock overlay — blokir klik ke player, double-tap untuk buka kunci */}
        {isLocked && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 100, background: 'transparent', cursor: 'not-allowed' }}
            onTouchStart={(e) => { e.stopPropagation(); handleLockOverlayTap(); }}
            onClick={(e) => { e.stopPropagation(); handleLockOverlayTap(); }}
          />
        )}

        {/* Landscape: tombol kembali portrait — pojok kiri atas, sembunyi saat terkunci */}
        {isLandscape && !isLocked && (
          <button
            onClick={toggleLandscape}
            className="absolute top-3 left-3 z-[99999] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          >
            <i className="fa-solid fa-rotate-left text-[11px]" /> Portrait
          </button>
        )}

        {/* Landscape: tombol kunci layar — pojok kanan atas, hilang begitu terkunci */}
        {isLandscape && !isLocked && (
          <button
            onClick={() => setIsLocked(true)}
            className="absolute top-3 right-3 z-[99999] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          >
            <i className="fa-solid fa-lock-open text-[11px]" /> Kunci
          </button>
        )}
      </div>

      {/* Control bar di LUAR iframe — tidak ganggu player sama sekali */}
      {!isLandscape && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-line bg-inkl">
          {/* Lock screen toggle */}
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              isLocked
                ? 'bg-gold/20 border-gold/50 text-gold'
                : 'bg-ghost border-line text-silver hover:border-gold/40 hover:text-gold'
            }`}
          >
            <i className={`fa-solid ${isLocked ? 'fa-lock' : 'fa-lock-open'} text-[11px]`} />
            {isLocked ? 'Terkunci' : 'Kunci Layar'}
          </button>

          <div className="flex-1" />

          {/* Landscape / horizontal button */}
          <button
            onClick={toggleLandscape}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-ghost border border-line text-silver hover:border-gold/40 hover:text-gold transition-colors"
          >
            <i className="fa-solid fa-expand text-[11px]" /> Horizontal
          </button>
        </div>
      )}

      {/* Content bawah */}
      {!isLandscape && (
        <>
          {/* Server picker */}
          <div className="px-4 py-4 border-b border-line">
            <div className="flex items-center gap-2 mb-3">
              <i className="fa-solid fa-server text-sm text-gold" />
              <p className="text-sm font-semibold">Pilih Server</p>
            </div>
            {/* Grid 3 kolom, versi flat & ringkas: satu baris teks per server,
                tanpa badge menempel/warna blok besar. Status aktif ditandai
                titik gold kecil + teks, bukan seluruh kotak diwarnai. */}
            <div className="grid grid-cols-3 gap-2">
              {servers.map((s, idx) => {
                const num = s.server === 'VidSrcWiki' ? 1
                  : s.server === 'SuperEmbed' ? 2
                  : s.server === 'VidSrc' ? 3
                  : s.server === 'VidLink' ? 4
                  : s.server === '2Embed' ? 5
                  : s.server === 'VSEmbed' ? 6
                  : idx + 1;
                const isRecommended = num === 1;
                const isActive = activeIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => requestServerSwitch(idx)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-center border transition-colors duration-150 ${
                      isActive
                        ? 'bg-goldf border-gold/50 text-gold'
                        : 'bg-inke border-line text-silver hover:border-line active:scale-[0.98]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isActive ? 'bg-gold' : 'bg-dim'
                      }`}
                    />
                    <span className="text-[12px] font-medium leading-none">
                      Server {num}
                    </span>
                    {isRecommended && (
                      <i className={`fa-solid fa-star text-[8px] ${isActive ? 'text-gold' : 'text-dim'}`} />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-dim mt-3">
              <i className="fa-solid fa-circle-info mr-1" />
              Jika tidak bisa putar, coba server lain.
            </p>
          </div>

          {/* Movie info */}
          <div className="px-4 py-4 pb-8">
            <h2 className="font-display font-bold text-lg mb-1">{movie.title}</h2>
            <div className="flex items-center gap-3 text-dim text-xs mb-3">
              {movie.type && <span className="text-gold font-semibold">{movie.type}</span>}
              {movie.year && <span>{movie.year}</span>}
              {movie.rating && (
                <div className="flex items-center gap-1">
                  <i className="fa-solid fa-star text-[10px] text-gold" />
                  <span className="text-gold">{movie.rating}</span>
                </div>
              )}
            </div>
            {movie.synopsis && (
              <p className="text-silver text-sm leading-relaxed line-clamp-3">{movie.synopsis}</p>
            )}
            <button onClick={() => router.push(`/movie/${slug}`)}
              className="flex items-center gap-2 mt-4 text-silver text-xs hover:text-gold transition-colors">
              <i className="fa-solid fa-circle-info text-[11px]" /> Lihat detail lengkap
            </button>
          </div>
        </>
      )}

      {/* Modal bagikan — arahkan ke halaman detail (bukan /watch) karena link
          detail lebih stabil untuk dibagikan; info season/episode yang sedang
          ditonton disertakan di teks pesan lewat title-nya. */}
      {showShareSheet && movie && (
        <ShareSheet
          title={isSeries ? `${movie.title} S${season}E${episode}` : movie.title}
          url={`${process.env.NEXT_PUBLIC_APP_URL || 'https://mdflix.web.id'}/movie/${slug}`}
          onClose={() => setShowShareSheet(false)}
        />
      )}

      {/* Dialog konfirmasi ganti server — sama persis gaya & teks
          dengan app native (lihat _confirmSwitchServer di
          watch_screen.dart): backdrop gelap, kartu bg-inkl, judul
          "Ganti Server?", teks peringatan progres hilang, tombol Batal
          (abu/dim) + tombol aksi warna gold. Dirender sebagai overlay
          fixed penuh layar dengan z-index tinggi supaya selalu di atas
          player & control bar. */}
      {pendingServerIdx !== null && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={cancelServerSwitch}
        >
          <div
            className="bg-inkl border border-line rounded-2xl p-5 w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-bold text-base mb-2 text-[#E8EDF2]">Ganti Server?</h3>
            <p className="text-silver text-sm leading-relaxed mb-5">
              Berpindah server akan memuat ulang video dari awal (0:00). Progres tontonan di server saat ini tidak tersimpan.
            </p>
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={cancelServerSwitch}
                className="text-dim text-sm font-medium px-2 py-1"
              >
                Batal
              </button>
              <button
                onClick={confirmServerSwitch}
                className="text-gold text-sm font-bold px-2 py-1"
              >
                Ganti Server
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
