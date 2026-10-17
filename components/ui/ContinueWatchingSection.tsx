'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getContinueWatching, removeFromContinueWatching, type ContinueWatchingItem } from '@/lib/continueWatching';

export default function ContinueWatchingSection() {
  const [items, setItems] = useState<ContinueWatchingItem[] | null>(null);

  useEffect(() => {
    setItems(getContinueWatching());
  }, []);

  const handleRemove = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromContinueWatching(slug);
    setItems((prev) => (prev ? prev.filter((i) => i.slug !== slug) : prev));
  };

  // Belum ada data (belum diketahui / kosong) — jangan render apa-apa,
  // supaya tidak ada layout shift atau section kosong yang mengganggu.
  if (!items || items.length === 0) return null;

  return (
    <section className="mb-7">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="font-display font-semibold text-base tracking-tight">Lanjutkan Menonton</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
        {items.map((item) => {
          const watchHref = item.type === 'Series' && item.season && item.episode
            ? `/watch/${item.slug}?season=${item.season}&episode=${item.episode}`
            : `/watch/${item.slug}`;
          return (
            <div key={item.slug} className="w-36 flex-shrink-0 group relative">
              {/* Satu Link besar membungkus SELURUH card (poster + judul),
                  sama seperti pola di MovieCard.tsx yang sudah terbukti solid
                  untuk klik/tap di semua area kartu — bukan dipecah jadi dua
                  Link terpisah yang menyisakan celah yang tidak bisa diklik.
                  Tombol X ditaruh sebagai sibling SETELAH Link (bukan nested
                  di dalamnya) dengan z-index lebih tinggi, supaya tap di area
                  tombol tetap ditangani tombol, sisanya ditangani Link. */}
              <Link href={watchHref} className="block active:scale-[0.96] transition-transform duration-150">
                <div className="poster-card relative rounded-xl overflow-hidden bg-inkl aspect-[2/3] mb-2">
                  {item.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.poster}
                      alt={item.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-inke">
                      <i className={`${item.type === 'Series' ? 'fa-solid fa-tv' : 'fa-solid fa-film'} text-2xl text-dim`} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {item.type === 'Series' && item.season && item.episode && (
                    <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-md bg-inkb/90 text-silver text-[9px] font-semibold leading-none pointer-events-none">
                      S{item.season} E{item.episode}
                    </div>
                  )}
                </div>

                <p className="text-xs font-medium text-[#E8EDF2] line-clamp-2 leading-tight group-hover:text-gold transition-colors">
                  {item.title}
                </p>
                {item.year && <p className="text-[10px] text-dim mt-0.5">{item.year}</p>}
              </Link>

              <button
                type="button"
                onClick={(e) => handleRemove(e, item.slug)}
                aria-label="Hapus dari daftar"
                className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full flex items-center justify-center text-white"
                style={{ background: 'rgba(0,0,0,0.65)' }}
              >
                <i className="fa-solid fa-xmark text-[10px]" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
