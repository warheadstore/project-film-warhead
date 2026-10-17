'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getContinueWatching, removeFromContinueWatching, type ContinueWatchingItem } from '@/lib/continueWatching';
import { readFavorites, type AccountUser, type SavedMovie } from '@/lib/client-account';

type CollectionProps = { title: string; eyebrow?: string; icon: string; children: React.ReactNode };

function Collection({ title, eyebrow, icon, children }: CollectionProps) {
  return (
    <section className="mb-7 min-w-0">
      <div className="flex items-end justify-between gap-3 px-4 mb-3">
        <div className="min-w-0">
          {eyebrow && <p className="text-[9px] uppercase tracking-[.2em] text-red-400 font-bold mb-1">{eyebrow}</p>}
          <h2 className="font-display font-bold text-base sm:text-lg tracking-tight flex items-center gap-2">
            <i className={`fa-solid ${icon} text-red-500 text-sm`} aria-hidden="true" />{title}
          </h2>
        </div>
        <span className="text-[10px] text-dim flex-shrink-0">Geser <i className="fa-solid fa-arrow-right ml-1" /></span>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ icon, title, desc, href, action }: { icon: string; title: string; desc: string; href: string; action: string }) {
  return (
    <div className="mx-4 rounded-2xl border border-line bg-inke p-5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-inkb border border-line flex items-center justify-center flex-shrink-0">
        <i className={`fa-solid ${icon} text-red-400`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[11px] text-dim leading-relaxed mt-1">{desc}</p>
        <Link href={href} className="inline-flex text-[11px] font-bold text-red-400 mt-2 hover:text-red-300">{action} <i className="fa-solid fa-arrow-right ml-1 mt-0.5" /></Link>
      </div>
    </div>
  );
}

function PosterCard({ item, onRemove, showRemove = false }: { item: SavedMovie | ContinueWatchingItem; onRemove?: () => void; showRemove?: boolean }) {
  const href = `/watch/${encodeURIComponent(item.slug)}`;
  const isContinue = 'lastWatchedAt' in item;
  return (
    <article className="w-[112px] sm:w-[132px] flex-shrink-0 group relative">
      <Link href={href} className="block active:scale-[.97] transition-transform duration-150">
        <div className="poster-card relative aspect-[2/3] rounded-xl overflow-hidden bg-inkb border border-line/70 mb-2">
          {item.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.poster} alt={item.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          ) : <div className="absolute inset-0 flex items-center justify-center"><i className="fa-solid fa-film text-2xl text-dim" /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
          {item.type === 'Series' && 'season' in item && item.season && (
            <span className="absolute top-2 left-2 rounded-md bg-black/75 border border-white/10 px-1.5 py-1 text-[9px] text-white">S{item.season} E{item.episode || 1}</span>
          )}
          {isContinue && <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-1.5 py-1 text-[9px] font-semibold text-white"><i className="fa-regular fa-clock mr-1 text-red-400" />Terakhir dibuka</span>}
          {showRemove && onRemove && (
            <button type="button" aria-label="Hapus dari daftar" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }} className="absolute right-2 top-2 z-10 w-7 h-7 rounded-full bg-black/75 border border-white/15 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
              <i className="fa-solid fa-xmark text-[10px]" />
            </button>
          )}
        </div>
        <p className="text-xs font-semibold text-[#E8EDF2] line-clamp-2 leading-snug group-hover:text-red-300 transition-colors">{item.title}</p>
        <p className="text-[10px] text-dim mt-1">{item.year || (isContinue ? 'Terakhir ditonton' : '')}</p>
      </Link>
    </article>
  );
}

export default function InfoMovieCollections() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [favorites, setFavorites] = useState<SavedMovie[]>([]);
  const [history, setHistory] = useState<ContinueWatchingItem[]>([]);
  const [ready, setReady] = useState(false);


  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : { user: null })
      .then((data) => {
        if (!alive) return;
        const currentUser = data?.user as AccountUser | undefined;
        setUser(currentUser || null);
        if (currentUser) setFavorites(readFavorites(currentUser));
        setHistory(getContinueWatching());
      })
      .catch(() => { if (alive) setHistory(getContinueWatching()); })
      .finally(() => { if (alive) setReady(true); });
    const onFavorites = () => {
      fetch('/api/auth/me', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
        if (alive && d?.user) setFavorites(readFavorites(d.user));
      }).catch(() => {});
    };
    const onStorage = () => { setHistory(getContinueWatching()); if (user) setFavorites(readFavorites(user)); };
    window.addEventListener('mdflix:favorites', onFavorites);
    window.addEventListener('mdflix:history', onStorage);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onStorage);
    return () => {
      alive = false;
      window.removeEventListener('mdflix:favorites', onFavorites);
      window.removeEventListener('mdflix:history', onStorage);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onStorage);
    };
  }, [user?.id]);

  const removeHistory = (slug: string) => {
    removeFromContinueWatching(slug);
    setHistory(getContinueWatching());
    window.dispatchEvent(new Event('mdflix:history'));
  };

  if (!ready) return <div className="h-16" aria-label="Memuat koleksi film" />;

  return (
    <div className="-mx-4 mb-7 border-y border-line/70 bg-gradient-to-b from-white/[0.018] to-transparent py-5">
      <Collection title="Favorit" eyebrow="Koleksi kamu" icon="fa-heart">
        {favorites.length ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1 snap-x snap-mandatory">{favorites.map((item) => <div key={item.slug} className="snap-start"><PosterCard item={item} /></div>)}</div>
        ) : (
          <EmptyState icon="fa-heart" title="Belum ada film favorit" desc={user ? 'Simpan film lewat tombol Favorit di halaman detail.' : 'Masuk dengan Google untuk melihat koleksi favorit akunmu.'} href={user ? '/' : '/login?next=%2Finfo'} action={user ? 'Jelajahi film' : 'Masuk dengan Google'} />
        )}
      </Collection>

      <Collection title="Lanjutkan Menonton" eyebrow="Putar lagi kapan saja" icon="fa-play">
        {history.length ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1 snap-x snap-mandatory">{history.slice(0, 12).map((item) => <div key={`${item.slug}-${item.season || 0}-${item.episode || 0}`} className="snap-start"><PosterCard item={item} onRemove={() => removeHistory(item.slug)} showRemove /></div>)}</div>
        ) : (
          <EmptyState icon="fa-play" title="Belum ada tontonan" desc="Film atau serial yang kamu buka akan muncul di sini." href="/" action="Cari film" />
        )}
      </Collection>

      <Collection title="Riwayat Tontonan" eyebrow="Aktivitas terbaru" icon="fa-clock-rotate-left">
        {history.length ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1 snap-x snap-mandatory">{history.slice(0, 20).map((item) => <div key={`history-${item.slug}-${item.season || 0}-${item.episode || 0}`} className="snap-start"><PosterCard item={item} /></div>)}</div>
        ) : (
          <EmptyState icon="fa-clock-rotate-left" title="Riwayat masih kosong" desc="Mulai menonton untuk menyimpan daftar aktivitas di perangkat ini." href="/" action="Jelajahi WARHEAD SHOP" />
        )}
      </Collection>
      <p className="px-4 text-[10px] leading-relaxed text-dim">Koleksi mengikuti data yang tersedia di perangkat dan akun saat ini. Player streaming eksternal WARHEAD SHOP belum menyediakan akses posisi pemutaran, jadi menit tontonan yang akurat belum bisa ditampilkan.</p>
    </div>
  );
}
