'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SectionRow from '@/components/ui/SectionRow';
import ContinueWatchingSection from '@/components/ui/ContinueWatchingSection';
import SpotlightSection from '@/components/ui/SpotlightSection';
import Top10Section from '@/components/ui/Top10Section';
import ComingSoonSection from '@/components/ui/ComingSoonSection';
import { checkDueReminders } from '@/lib/releaseReminders';
import { GENRES } from '@/lib/genres';
import type { Movie } from '@/types/movie';

const AUTO_INTERVAL = 6000;

function HeroCarousel({ movies }: { movies: Movie[] }) {
  const [current, setCurrent] = useState(0);
  const [imgLoaded, setImgLoaded] = useState<boolean[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressKey, setProgressKey] = useState(0); // remount progress bar tiap ganti slide
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const paused = useRef(false);

  const goTo = useCallback((idx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(idx);
      setIsTransitioning(false);
      setProgressKey((k) => k + 1);
    }, 350);
  }, [isTransitioning]);

  const next = useCallback(() => {
    goTo((current + 1) % movies.length);
  }, [current, movies.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + movies.length) % movies.length);
  }, [current, movies.length, goTo]);

  // Auto slide
  useEffect(() => {
    if (movies.length <= 1) return;
    const start = () => {
      timerRef.current = setTimeout(() => {
        if (!paused.current) next();
        start();
      }, AUTO_INTERVAL);
    };
    start();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [next, movies.length]);

  // Preload images
  useEffect(() => {
    setImgLoaded(Array(movies.length).fill(false));
  }, [movies.length]);

  const markLoaded = (i: number) => {
    setImgLoaded(prev => { const n = [...prev]; n[i] = true; return n; });
  };

  // Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    paused.current = true;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    paused.current = false;
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 40 && dy < 60) {
      if (dx < 0) next(); else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!movies.length) return null;
  const hero = movies[current];

  return (
    <div className="relative w-full mb-6">
      {/* Progress bar auto-slide (gaya Netflix) — ditaruh di STRIP TERPISAH
          di luar area gambar (bukan overlay di atasnya), supaya progress bar
          benar-benar tidak pernah menutupi/menghalangi banner/backdrop film
          sedikit pun, walau cuma beberapa piksel. */}
      {movies.length > 1 && (
        <div className="relative z-20 h-1 flex gap-0.5 bg-ink">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className="flex-1 h-full overflow-hidden"
            >
              {i === current && (
                <div
                  key={progressKey}
                  className="h-full bg-gold"
                  style={{ animation: `heroProgress ${AUTO_INTERVAL}ms linear forwards` }}
                />
              )}
              {i < current && <div className="h-full bg-gold/70 w-full" />}
            </button>
          ))}
        </div>
      )}

      <section
        className="relative w-full overflow-hidden"
        style={{ height: '78vw', maxHeight: 460, minHeight: 320 }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Slides */}
        {movies.map((m, i) => (
          <div
            key={m.slug}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
          >
            {(m.backdrop || m.poster) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.backdrop || m.poster || ''}
                alt={m.title}
                className="absolute inset-0 w-full h-full object-cover"
                // Slide pertama (i === 0) adalah kandidat LCP utama homepage —
                // ini section paling besar (hingga 460px tinggi) dan paling
                // atas. Sebelumnya SEMUA slide di-render dengan <img src>
                // sekaligus (cuma disembunyikan via opacity), jadi browser
                // men-download banyak gambar besar berbarengan dan berebut
                // bandwidth dengan slide pertama yang seharusnya prioritas.
                // Sekarang slide selain yang pertama diberi loading="lazy"
                // supaya browser menunda fetch-nya sampai benar-benar
                // dibutuhkan (idle time), bukan langsung ikut antre di awal.
                fetchPriority={i === 0 ? 'high' : 'auto'}
                loading={i === 0 ? 'eager' : 'lazy'}
                style={{
                  opacity: imgLoaded[i] ? 1 : 0,
                  transition: 'opacity 0.6s, transform 8s ease-out',
                  // Parallax halus: backdrop membesar sangat pelan selama slide aktif,
                  // memberi kesan "hidup" tanpa terasa seperti animasi berulang yang murah.
                  transform: i === current && !isTransitioning ? 'scale(1.06)' : 'scale(1)',
                }}
                onLoad={() => markLoaded(i)}
              />
            )}
            {/* Gradient diperdalam & diperluas supaya menyatu mulus ke background
                body (#080A0C) tanpa "garis potong" yang kentara saat masuk ke section berikutnya */}
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
          </div>
        ))}

        {/* Content overlay (always shows current) */}
        <div
          className="absolute bottom-0 left-0 p-5 max-w-[85%] z-10"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(6px)' : 'translateY(0)',
            transition: 'opacity 0.3s, transform 0.3s',
          }}
        >
          {hero.type && (
            <span className="inline-block px-2 py-0.5 rounded-md bg-gold text-ink text-[10px] font-bold mb-3 uppercase tracking-wide">{hero.type}</span>
          )}

          {/* Logo judul PNG (title-card ala Netflix/Disney+) kalau TMDB punya,
              fallback ke teks judul biasa kalau tidak tersedia. */}
          {hero.titleLogo ? (
            <div className="relative w-full max-w-[260px] h-16 mb-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              <Image
                src={hero.titleLogo}
                alt={hero.title}
                fill
                className="object-contain object-left"
                unoptimized
              />
            </div>
          ) : (
            <h1 className="font-display font-bold text-2xl leading-tight mb-2 line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              {hero.title}
            </h1>
          )}

          <div className="flex items-center gap-2 mb-4">
            {hero.rating && (
              <div className="flex items-center gap-1">
                <i className="fa-solid fa-star text-[11px] text-gold" />
                <span className="text-gold text-xs font-semibold">{hero.rating}</span>
              </div>
            )}
            {hero.year && <span className="text-silver text-xs">{hero.year}</span>}
          </div>
          <div className="flex gap-2">
            <Link href={`/movie/${hero.slug}`}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gold text-ink text-sm font-bold shadow-lg shadow-gold/20 active:scale-95 transition-transform">
              <i className="fa-solid fa-play text-[11px]" /> Tonton
            </Link>
            <Link href={`/movie/${hero.slug}`}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white text-sm font-medium active:scale-95 transition-transform">
              <i className="fa-solid fa-circle-info text-[11px]" /> Detail
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HomeClient() {
  const [heroes, setHeroes]         = useState<Movie[]>([]);
  const [trending, setTrending]     = useState<Movie[]>([]);
  const [popular, setPopular]       = useState<Movie[]>([]);
  const [topRated, setTopRated]     = useState<Movie[]>([]);
  const [latest, setLatest]         = useState<Movie[]>([]);
  const [upcoming, setUpcoming]     = useState<Movie[]>([]);
  const [loadingHero, setLoadingHero]     = useState(true);
  const [loadingTrend, setLoadingTrend]   = useState(true);
  const [loadingPop, setLoadingPop]       = useState(true);
  const [loadingTop, setLoadingTop]       = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  useEffect(() => {
    // Hero carousel: endpoint khusus yang sudah menyertakan logo judul TMDB
    // (title-card ala Netflix/Disney+), terpisah dari /trending biasa supaya
    // fetch logo (lebih berat, per-item) tidak membebani list trending umum.
    fetch('/api/movies/hero')
      .then(r => r.json())
      .then(d => setHeroes(d.results || []))
      .catch(() => {})
      .finally(() => setLoadingHero(false));

    fetch('/api/movies/trending')
      .then(r => r.json()).then(d => setTrending(d.results || []))
      .catch(() => {}).finally(() => setLoadingTrend(false));

    fetch('/api/movies/popular?type=all')
      .then(r => r.json()).then(d => setPopular(d.results || []))
      .catch(() => {}).finally(() => setLoadingPop(false));

    fetch('/api/movies/top-rated?type=movie')
      .then(r => r.json()).then(d => setTopRated(d.results || []))
      .catch(() => {}).finally(() => setLoadingTop(false));

    fetch('/api/movies/latest?type=all')
      .then(r => r.json()).then(d => setLatest(d.results || []))
      .catch(() => {}).finally(() => setLoadingLatest(false));

    fetch('/api/movies/upcoming')
      .then(r => r.json()).then(d => setUpcoming(d.results || []))
      .catch(() => {}).finally(() => setLoadingUpcoming(false));

    // Catch up on any release-day reminders that came due since last visit
    checkDueReminders();
  }, []);

  // Spotlight: highest-rated title from trending with a backdrop, so it
  // feels editorially picked rather than just "another row".
  const spotlight = [...trending]
    .filter((m) => m.backdrop && m.overview)
    .sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'))[0] || null;

  return (
    <div>
      {/* HERO CAROUSEL */}
      {loadingHero ? (
        <div className="skeleton mb-6" style={{ height: '78vw', maxHeight: 460, minHeight: 320 }} />
      ) : (
        <HeroCarousel movies={heroes} />
      )}

      {/* CONTINUE WATCHING (personal, only shows if history exists) */}
      <ContinueWatchingSection />

      {/* GENRE CHIPS — running/marquee tak terbatas, tetap bisa diklik */}
      <section className="mb-7">
        <div className="flex items-center justify-between mb-3 px-4">
          <div>
            <p className="flex items-center gap-1.5 text-gold text-[10px] font-extrabold tracking-wide mb-0.5">
              <i className="fa-solid fa-layer-group text-[10px]" /> JELAJAHI KATEGORI
            </p>
            <h2 className="font-display font-semibold text-base tracking-tight">Genre</h2>
          </div>
          <Link href="/genre" className="flex items-center gap-1.5 text-gold text-xs font-medium">
            Semua <i className="fa-solid fa-chevron-right text-[10px]" />
          </Link>
        </div>
        {/* overflow-hidden (bukan overflow-x-auto) karena posisi chip digerakkan
            otomatis oleh animasi CSS, bukan oleh scroll manual user */}
        <div className="overflow-hidden px-4">
          <div className="genre-marquee-track gap-2">
            {/* Genre digandakan 2x berurutan supaya animasi geser -50% terlihat
                menyambung mulus tanpa jeda/patah (loop tak terbatas). translateX(-50%)
                relatif ke lebar elemen itu sendiri (2 set digabung), jadi otomatis
                presisi separuh berapa pun lebar per-chip — bukan di sini sumber
                patahannya. Klik tetap berfungsi normal karena ini transform CSS
                biasa, bukan sesuatu yang menonaktifkan pointer events; animasi
                juga TIDAK dihentikan atau dijeda saat salah satu chip diklik. */}
            {[...GENRES, ...GENRES].map((g, i) => (
              <Link key={`${g.slug}-${i}`} href={`/genre/${g.slug}`}
                className="genre-chip flex-shrink-0 flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-2xl text-xs font-semibold"
                style={{ ['--g1' as string]: g.color, ['--g2' as string]: g.color2, color: '#E8EDF2' }}>
                <span className="genre-icon-dot w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className={`${g.icon} text-[10px] text-[#080A0C]`} />
                </span>
                {g.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SectionRow title="Trending Minggu Ini" eyebrow="Lagi Ramai Ditonton" eyebrowIcon="fa-solid fa-fire" movies={trending}  loading={loadingTrend}   moreHref="/popular"    size="md" />

      {/* SPOTLIGHT — one big featured title, breaks up the row pattern */}
      <SpotlightSection movie={spotlight} loading={loadingTrend} isLCPCandidate={false} />

      <SectionRow title="Sedang Tayang" eyebrow="Update Terbaru" eyebrowIcon="fa-solid fa-clapperboard" movies={latest}   loading={loadingLatest}  moreHref="/latest"     size="md" />

      {/* TOP 10 — Netflix-style big-number ranking, same data as popular */}
      <Top10Section title="Top 10 Populer Hari Ini" eyebrow="Paling Dicari" eyebrowIcon="fa-solid fa-ranking-star" movies={popular} loading={loadingPop} />

      <SectionRow title="Rating Tertinggi" eyebrow="Pilihan Kritikus" eyebrowIcon="fa-solid fa-star" movies={topRated} loading={loadingTop}     moreHref="/top-rated"  size="md" />

      {/* COMING SOON — countdown + reminder */}
      <ComingSoonSection movies={upcoming} loading={loadingUpcoming} />
    </div>
  );
}
