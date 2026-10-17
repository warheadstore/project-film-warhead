'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',         icon: 'fa-solid fa-house',             label: 'Beranda' },
  { href: '/search',   icon: 'fa-solid fa-magnifying-glass',  label: 'Cari'    },
  { href: '/genre',    icon: 'fa-solid fa-layer-group',       label: 'Genre'   },
  { href: '/popular',  icon: 'fa-solid fa-fire',              label: 'Populer' },
  { href: '/info',     icon: 'fa-solid fa-circle-info',       label: 'Info'    },
];

export default function BottomNav() {
  const pathname = usePathname();
  const activeIndex = NAV.findIndex(({ href }) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)
  );
  const count = NAV.length;
  const slotWidth = 100 / count;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}
    >
      <nav
        className="relative flex items-center px-2 py-2 rounded-[28px] w-full max-w-md overflow-visible"
        style={{
          background: 'rgba(15,18,21,0.72)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow:
            '0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Bubble tunggal yang meluncur (slide) ke posisi tab aktif.
            Pakai transform:translateX (GPU-accelerated, tidak memicu reflow)
            supaya tetap ringan walau jarak slide jauh (misal Home -> Info).
            Durasi pendek + easing standar (tanpa bounce/overshoot) supaya
            terasa cepat & responsif, bukan berat/delay. */}
        {activeIndex >= 0 && (
          <span
            className="absolute rounded-full pointer-events-none flex flex-col items-center justify-center gap-0.5 transition-transform duration-250 ease-out will-change-transform"
            style={{
              left: 0,
              top: -22,
              width: `${slotWidth}%`,
              height: 56,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          >
            <span
              className="flex flex-col items-center justify-center gap-0.5 rounded-full"
              style={{
                width: 56,
                height: 56,
                background: 'linear-gradient(145deg, #FF3943 0%, #E50914 55%, #B20710 100%)',
                boxShadow:
                  '0 8px 20px rgba(229,9,20,0.45), 0 2px 0 rgba(255,255,255,0.25) inset, 0 -6px 10px rgba(0,0,0,0.15) inset',
              }}
            >
              <i className={`${NAV[activeIndex].icon} text-[16px] text-ink`} />
              <span className="text-[9px] font-semibold text-ink/80 leading-none">
                {NAV[activeIndex].label}
              </span>
            </span>
          </span>
        )}

        {NAV.map(({ href, icon, label }, i) => {
          const active = i === activeIndex;
          return (
            <Link
              key={href}
              href={href}
              className="relative flex-1 flex items-center justify-center py-1.5"
            >
              {/* Icon statis tetap dirender di slot; disembunyikan (opacity 0)
                  saat aktif karena posisi itu sudah ditempati bubble yang
                  meluncur di atasnya. Ini yang membuat transisi terasa mulus
                  tanpa dua elemen dobel muncul bersamaan. */}
              <span
                className={`flex flex-col items-center justify-center gap-1 transition-opacity duration-200 ${
                  active ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <i className={`${icon} text-[16px] text-dim`} />
                <span className="text-[9px] font-medium text-dim leading-none">
                  {label}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
