'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Movie, TMDBSeason, Episode } from '@/types/movie';
import { isReminderSet, setReminder, removeReminder } from '@/lib/releaseReminders';
import { extractDominantColor } from '@/lib/dominantColor';
import { hapticTap } from '@/lib/haptics';
import CastModal from '@/components/ui/CastModal';
import ShareSheet from '@/components/ui/ShareSheet';
import VideoModal from '@/components/ui/VideoModal';
import StarRating from '@/components/ui/StarRating';
import FavoriteButton from '@/components/ui/FavoriteButton';
import SectionRow from '@/components/ui/SectionRow';
import type { VideoItem } from '@/types/movie';

interface Props { slug: string }

export default function MovieDetailClient({ slug }: Props) {
  const [movie, setMovie]     = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [synopsisExp, setSynopsisExp] = useState(false);
  const [imgLoaded, setImgLoaded]     = useState(false);
  const [activeSeason, setActiveSeason] = useState(1);
  const [episodes, setEpisodes]         = useState<Episode[]>([]);
  const [epLoading, setEpLoading]       = useState(false);
  const [reminded, setReminded]         = useState(false);
  const [reminderStatus, setReminderStatus] = useState<'idle' | 'requesting' | 'denied' | 'unsupported'>('idle');
  const [showCastModal, setShowCastModal] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  // Video yang sedang diputar di VideoModal — null berarti modal tertutup.
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  // Warna dominan dari poster/backdrop, dipakai sebagai gradient latar
  // dinamis (mirip Spotify). Null = belum ada / gagal ekstrak -> fallback ke
  // warna solid biasa via CSS, jadi tidak pernah ada state "rusak".
  const [ambientColor, setAmbientColor] = useState<string | null>(null);
  // Parallax hero: offset scroll dipakai untuk translateY halus pada gambar
  // backdrop. Disimpan di ref (bukan state) untuk update per-frame tanpa
  // memicu re-render React di setiap event scroll.
  const heroImgRef = useRef<HTMLImageElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/movies/detail/${slug}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setMovie(d); })
      .catch(e => setError(e.message || 'Gagal memuat'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    setReminded(isReminderSet(slug));
  }, [slug]);

  // Ekstrak warna dominan begitu poster/backdrop tersedia.
  useEffect(() => {
    const src = movie?.backdrop || movie?.poster;
    if (!src) return;
    let cancelled = false;
    extractDominantColor(src).then((color) => {
      if (!cancelled) setAmbientColor(color);
    });
    return () => { cancelled = true; };
  }, [movie?.backdrop, movie?.poster]);

  // Parallax ringan pada backdrop: translateY sekitar 30% dari jarak scroll,
  // dibatasi ke area hero saja (efek berhenti begitu hero sudah discroll
  // lewat, supaya tidak "menempel" aneh saat konten di bawahnya discroll).
  useEffect(() => {
    const heroHeight = 280;
    const onScroll = () => {
      const img = heroImgRef.current;
      if (!img) return;
      const y = Math.min(window.scrollY, heroHeight);
      img.style.transform = `translateY(${y * 0.3}px) scale(1.08)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!movie || movie.type !== 'Series') return;
    setEpLoading(true);
    fetch(`/api/movies/episodes/${slug}?season=${activeSeason}`)
      .then(r => r.json())
      .then(d => setEpisodes(d.episodes || []))
      .catch(() => {})
      .finally(() => setEpLoading(false));
  }, [slug, movie, activeSeason]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <i className="fa-solid fa-circle-notch fa-spin text-3xl text-gold" />
    </div>
  );

  if (error || !movie) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
      <i className="fa-solid fa-triangle-exclamation text-4xl text-dim" />
      <p className="text-silver text-sm text-center">{error || 'Film tidak ditemukan'}</p>
      <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-inke border border-line text-silver text-sm">Kembali</button>
    </div>
  );

  const isSeries   = movie.type === 'Series';
  const synopsis   = movie.synopsis || movie.overview || movie.description || '';
  const seasons    = (movie.seasons || []) as TMDBSeason[];

  // Film/series yang statusnya belum "Released" (mis. "Post Production",
  // "In Production", "Planned") berarti belum ada konten untuk ditonton,
  // jadi tombol "Tonton" tidak relevan dan diganti tombol "Ingatkan Saya".
  const isUpcoming = !!movie.status && movie.status.toLowerCase() !== 'released';

  const handleToggleReminder = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hapticTap();

    if (reminded) {
      removeReminder(slug);
      setReminded(false);
      return;
    }

    setReminderStatus('requesting');
    const result = await setReminder({
      slug,
      title: movie.title,
      poster: movie.poster || null,
      releaseDate: movie.releaseDate || '',
    });

    setReminded(true);
    if (result === 'unsupported') setReminderStatus('unsupported');
    else if (result === 'denied') setReminderStatus('denied');
    else setReminderStatus('idle');
  };

  return (
    <div
      className="min-h-screen"
      // Gradient ambient dari warna dominan poster/backdrop, meluruh ke
      // warna latar biasa sebelum konten utama — mirip nuansa cover Spotify.
      // ambientColor null (belum siap/gagal ekstrak) -> otomatis transparent,
      // jadi tampilan fallback ke background solid biasa tanpa efek apa pun.
      style={{
        backgroundImage: ambientColor
          ? `linear-gradient(to bottom, ${ambientColor} 0%, transparent 420px)`
          : undefined,
      }}
    >
      {/* Back + Share — bentuk tetap kotak rounded-xl (dipertahankan), tapi
          background/blur/shadow disamakan dengan tombol search di Header
          global supaya transparansinya konsisten dengan tombol melayang lain. */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4"
        style={{ background: 'linear-gradient(to bottom, rgba(8,10,12,0.92), transparent)' }}>
        <button onClick={() => router.back()}
          aria-label="Kembali"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-silver active:scale-90 transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
          <i className="fa-solid fa-arrow-left text-sm" />
        </button>
        <button onClick={() => { hapticTap(); setShowShareSheet(true); }}
          aria-label="Bagikan"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-silver active:scale-90 transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
          <i className="fa-solid fa-share-nodes text-sm" />
        </button>
      </div>

      {/* Hero backdrop — overflow-hidden karena gambar di-scale untuk parallax
          dan tidak boleh "bocor" keluar batas hero saat scroll. */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: 280 }}>
        {(movie.backdrop || movie.poster) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={heroImgRef} src={movie.backdrop || movie.poster || ''} alt={movie.title}
            className="w-full h-full object-cover will-change-transform"
            style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.4s' }}
            onLoad={() => setImgLoaded(true)} />
        ) : (
          <div className="w-full h-full bg-inke flex items-center justify-center">
            <i className="fa-solid fa-clapperboard text-5xl text-dim" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />

        {!isSeries && (
          isUpcoming ? (
            <button
              onClick={handleToggleReminder}
              className={`absolute bottom-4 right-4 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg transition-colors ${
                reminded ? 'bg-gold text-ink' : 'bg-ink/80 backdrop-blur border border-gold/50 text-gold'
              }`}
            >
              <i className={`fa-solid fa-bell text-xs`} />
              {reminderStatus === 'requesting' ? 'Memproses...' : reminded ? 'Diingatkan' : 'Ingatkan Saya'}
            </button>
          ) : (
            <Link href={`/watch/${slug}`}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gold text-ink font-bold text-sm shadow-lg">
              <i className="fa-solid fa-play text-xs" /> Tonton
            </Link>
          )
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-6">
        {/* Poster + Title row */}
        <div className="flex gap-3 mb-4">
          {movie.poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={movie.poster} alt={movie.title}
              className="w-20 rounded-xl flex-shrink-0 shadow-lg"
              style={{ aspectRatio: '2/3', objectFit: 'cover' }} />
          )}
          <div className="flex-1 min-w-0">
            {isSeries && (
              <span className="inline-block px-2 py-0.5 rounded-md bg-gold/20 text-gold text-[10px] font-bold mb-1 uppercase">Series</span>
            )}
            <h1 className="font-display font-bold text-xl leading-tight mb-1">{movie.title}</h1>
            {movie.tagline && <p className="text-dim text-xs italic mb-2">{movie.tagline}</p>}

            <div className="flex flex-wrap gap-2">
              {movie.rating && (
                <div className="flex items-center gap-1">
                  <i className="fa-solid fa-star text-[11px] text-gold" />
                  <span className="text-gold font-bold text-sm">{movie.rating}</span>
                </div>
              )}
              {movie.year && <span className="text-silver text-xs bg-ghost px-2 py-0.5 rounded-lg">{movie.year}</span>}
              {movie.duration && <span className="text-silver text-xs bg-ghost px-2 py-0.5 rounded-lg">{movie.duration}</span>}
              {movie.ageRating && (
                <span className="text-silver text-xs bg-ghost px-2 py-0.5 rounded-lg border border-line/60 font-semibold">
                  {movie.ageRating}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Genres */}
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {movie.genres.map((g: string) => (
              <Link key={g} href={`/genre/${g.toLowerCase().replace(/[\s_]/g, '-')}`}
                className="px-2.5 py-1 rounded-xl bg-ghost border border-line text-silver text-xs hover:border-gold/50 hover:text-gold transition-colors">
                {g}
              </Link>
            ))}
          </div>
        )}

        {/* Keywords — tag TMDB, lebih spesifik dari genre (mis. "time travel").
            Diklik langsung menjalankan pencarian dengan kata kunci itu. */}
        {movie.keywords && movie.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {movie.keywords.map((k) => (
              <Link key={k} href={`/search?q=${encodeURIComponent(k)}`}
                className="px-2 py-0.5 rounded-lg bg-transparent border border-line/60 text-dim text-[11px] hover:border-gold/50 hover:text-gold transition-colors">
                #{k}
              </Link>
            ))}
          </div>
        )}

        {/* Tersedia juga di — badge platform streaming legal (region ID) */}
        {movie.watchProviders && movie.watchProviders.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-dim text-xs">Juga di:</span>
            {movie.watchProviders.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-ghost border border-line">
                {p.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-inke flex items-center justify-center">
                    <i className="fa-solid fa-tv text-[8px] text-dim" />
                  </div>
                )}
                <span className="text-silver text-[11px] font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Rating & review — skor TMDB + input bintang user via guest session */}
        <div className="mb-5 p-3.5 rounded-xl bg-inke border border-line">
          <StarRating slug={slug} tmdbRating={movie.rating || null} voteCount={movie.voteCount} />
        </div>

        {/* Synopsis — section tetap dirender walau data kosong (kasus langka:
            TMDB belum punya overview sama sekali di ID maupun EN) supaya
            terlihat jelas sebagai "belum tersedia", bukan seakan hilang/bug. */}
        <div className="mb-5">
          <h2 className="font-semibold text-sm mb-2">Sinopsis</h2>
          {synopsis ? (
            <>
              <p className={`text-silver text-sm leading-relaxed ${synopsisExp ? '' : 'line-clamp-4'}`}>{synopsis}</p>
              {synopsis.length > 200 && (
                <button onClick={() => setSynopsisExp(!synopsisExp)}
                  className="flex items-center gap-1 text-gold text-xs mt-1.5 font-medium">
                  <i className={`fa-solid ${synopsisExp ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]`} />
                  {synopsisExp ? 'Lebih sedikit' : 'Selengkapnya'}
                </button>
              )}
            </>
          ) : (
            <p className="text-dim text-sm italic">Sinopsis belum tersedia untuk judul ini.</p>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {movie.director && (
            <div className="bg-inke rounded-xl p-3 border border-line">
              <div className="flex items-center gap-1.5 mb-1">
                <i className="fa-solid fa-clapperboard text-[11px] text-gold" />
                <p className="text-[10px] text-dim font-medium uppercase tracking-wide">Sutradara</p>
              </div>
              <p className="text-xs text-silver line-clamp-2">{movie.director}</p>
            </div>
          )}
          {movie.status && (
            <div className="bg-inke rounded-xl p-3 border border-line">
              <div className="flex items-center gap-1.5 mb-1">
                <i className="fa-solid fa-circle-dot text-[11px] text-gold" />
                <p className="text-[10px] text-dim font-medium uppercase tracking-wide">Status</p>
              </div>
              <p className="text-xs text-silver">{movie.status}</p>
            </div>
          )}
          {isSeries && movie.numberOfSeasons && (
            <div className="bg-inke rounded-xl p-3 border border-line">
              <div className="flex items-center gap-1.5 mb-1">
                <i className="fa-solid fa-layer-group text-[11px] text-gold" />
                <p className="text-[10px] text-dim font-medium uppercase tracking-wide">Season</p>
              </div>
              <p className="text-xs text-silver">{movie.numberOfSeasons} Season</p>
            </div>
          )}
          {isSeries && movie.numberOfEpisodes && (
            <div className="bg-inke rounded-xl p-3 border border-line">
              <div className="flex items-center gap-1.5 mb-1">
                <i className="fa-solid fa-film text-[11px] text-gold" />
                <p className="text-[10px] text-dim font-medium uppercase tracking-wide">Episode</p>
              </div>
              <p className="text-xs text-silver">{movie.numberOfEpisodes} Episode</p>
            </div>
          )}
        </div>

        {/* Cast */}
        {((movie.castDetailed && movie.castDetailed.length > 0) || (movie.cast && movie.cast.length > 0)) && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-users text-sm text-gold" />
                <h2 className="font-semibold text-sm">Pemeran</h2>
              </div>
              {movie.castDetailed && movie.castDetailed.length > 8 && (
                <button
                  onClick={() => setShowCastModal(true)}
                  className="text-gold text-xs font-medium flex items-center gap-1"
                >
                  Lihat Selengkapnya <i className="fa-solid fa-chevron-right text-[9px]" />
                </button>
              )}
            </div>

            {movie.castDetailed && movie.castDetailed.length > 0 ? (
              // Avatar + nama, dengan foto profil dari TMDB kalau tersedia
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {movie.castDetailed.slice(0, 12).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setShowCastModal(true)}
                    className="flex flex-col items-center w-16 flex-shrink-0 text-center"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-ghost border border-line mb-1.5">
                      {c.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.photo}
                          alt={c.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="fa-solid fa-user text-sm text-dim" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-[#E8EDF2] line-clamp-2 leading-tight">{c.name}</p>
                  </button>
                ))}
              </div>
            ) : (
              // Fallback lama: chip teks nama saja (mis. data cache lama tanpa castDetailed)
              <div className="flex flex-wrap gap-1.5">
                {(movie.cast || []).slice(0, 12).map(a => (
                  <span key={a} className="px-2.5 py-1 rounded-xl bg-ghost border border-line text-silver text-xs">{a}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <FavoriteButton movie={{ slug: movie.slug, title: movie.title, poster: movie.poster, backdrop: movie.backdrop, year: movie.year, rating: movie.rating, type: movie.type }} />

        {/* Trailer */}
        {movie.trailer && (
          <a href={movie.trailer} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 w-full py-3 rounded-2xl bg-inke border border-line text-silver text-sm font-medium justify-center mb-4 hover:border-gold/50 hover:text-gold transition-colors">
            <i className="fa-brands fa-youtube text-red-500" /> Tonton Trailer
          </a>
        )}

        {/* Video lainnya — clip, featurette, behind the scenes. Beda dari
            tombol Trailer di atas (yang buka YouTube di tab baru), video
            gallery ini diputar inline via VideoModal supaya tetap di app. */}
        {movie.videoGallery && movie.videoGallery.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2">
              <i className="fa-solid fa-clapperboard text-sm text-gold" />
              <h2 className="font-semibold text-sm">Video Lainnya</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {movie.videoGallery.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setActiveVideo(v)}
                  className="w-40 flex-shrink-0 text-left group"
                >
                  <div className="relative rounded-xl overflow-hidden bg-inke aspect-video mb-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.thumbnail}
                      alt={v.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-ink/80 backdrop-blur flex items-center justify-center">
                        <i className="fa-solid fa-play text-xs text-gold ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-ink/80 backdrop-blur text-[9px] font-semibold text-silver uppercase">
                      {v.type}
                    </span>
                  </div>
                  <p className="text-xs text-[#E8EDF2] line-clamp-2 leading-tight">{v.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Series: Season tabs + Episode list */}
        {isSeries && seasons.length > 0 && (
          <div className="mb-5">
            <h2 className="font-semibold text-sm mb-3">Episode</h2>

            {/* Season tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
              {seasons.map(s => (
                <button key={s.season_number}
                  onClick={() => setActiveSeason(s.season_number)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activeSeason === s.season_number ? 'bg-gold text-ink' : 'bg-inke border border-line text-silver'}`}>
                  {s.name || `Season ${s.season_number}`}
                </button>
              ))}
            </div>

            {/* Episode list */}
            {epLoading ? (
              <div className="flex justify-center py-6">
                <i className="fa-solid fa-circle-notch fa-spin text-xl text-gold" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {episodes.map(ep => (
                  <div key={ep.episode}
                    className="flex flex-col gap-2 p-3 rounded-xl bg-inke border border-line hover:border-gold/40 transition-colors group">
                    <Link href={`/watch/${slug}?season=${ep.season}&episode=${ep.episode}`}
                      className="flex items-center gap-3">
                      {ep.still ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ep.still} alt={ep.title}
                          className="w-16 h-10 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-ghost flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                          <span className="text-xs font-bold text-gold">{ep.episode}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#E8EDF2] truncate">{ep.title || `Episode ${ep.episode}`}</p>
                        {ep.runtime && <p className="text-[10px] text-dim mt-0.5">{ep.runtime}</p>}
                      </div>
                      <i className="fa-solid fa-play text-[11px] text-dim group-hover:text-gold transition-colors flex-shrink-0" />
                    </Link>
                    {/* Rating bintang per-episode, TMDB guest session mendukung ini */}
                    <div className="pl-[76px]">
                      <StarRating slug={slug} tmdbRating={null} season={ep.season} episode={ep.episode} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Movie watch CTA */}
        {!isSeries && (
          isUpcoming ? (
            <button
              onClick={handleToggleReminder}
              className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-colors ${
                reminded ? 'bg-gold text-ink' : 'bg-inke border border-gold/50 text-gold'
              }`}
            >
              <i className="fa-solid fa-bell text-xs" />
              {reminderStatus === 'requesting' ? 'Memproses...' : reminded ? 'Diingatkan — Tersimpan' : 'Ingatkan Saya Saat Rilis'}
            </button>
          ) : (
            <Link href={`/watch/${slug}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gold text-ink font-bold text-sm">
              <i className="fa-solid fa-play text-xs" /> Tonton Sekarang
            </Link>
          )
        )}
        {!isSeries && isUpcoming && (reminderStatus === 'denied' || reminderStatus === 'unsupported') && (
          <p className="text-[11px] text-dim text-center mt-2">
            {reminderStatus === 'denied' ? 'Tersimpan (izin notifikasi ditolak)' : 'Tersimpan (browser tidak dukung notifikasi)'}
          </p>
        )}
      </div>

      {/* Mungkin Kamu Suka — rekomendasi dari TMDB berdasarkan judul ini.
          Full-bleed (di luar container px-4) supaya konsisten dengan pola
          SectionRow horizontal-scroll lain di seluruh app. */}
      {movie.recommendations && movie.recommendations.length > 0 && (
        <SectionRow
          title="Mungkin Kamu Suka"
          eyebrow="Direkomendasikan"
          eyebrowIcon="fa-solid fa-wand-magic-sparkles"
          movies={movie.recommendations}
        />
      )}

      {/* Modal daftar pemeran lengkap dengan foto TMDB */}
      {showCastModal && movie.castDetailed && movie.castDetailed.length > 0 && (
        <CastModal
          cast={movie.castDetailed}
          movieTitle={movie.title}
          onClose={() => setShowCastModal(false)}
        />
      )}

      {/* Modal pemutar video galeri (clip/featurette/behind the scenes) */}
      {activeVideo && (
        <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}

      {/* Modal bagikan — link absolut ke halaman detail film/series ini */}
      {showShareSheet && (
        <ShareSheet
          title={movie.title}
          url={`${process.env.NEXT_PUBLIC_APP_URL || 'https://mdflix.web.id'}/movie/${slug}`}
          onClose={() => setShowShareSheet(false)}
        />
      )}
    </div>
  );
}
