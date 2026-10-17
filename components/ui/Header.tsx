'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import GoogleAccountButton from '@/components/ui/GoogleAccountButton';

const SCROLL_THRESHOLD = 60; // px sebelum header mulai solid

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isSearch = pathname.startsWith('/search');
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  // Header adaptif hanya relevan di homepage (di atas hero carousel yang
  // gambarnya bisa terang). Halaman lain sudah gelap solid dari awal,
  // jadi header di sana langsung solid tanpa perlu efek transparan.
  useEffect(() => {
    if (!isHome) { setScrolled(true); return; }
    setScrolled(window.scrollY > SCROLL_THRESHOLD);
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  // Halaman detail film & watch sudah punya bar navigasi (back button) sendiri
  // di atas hero image, jadi Header global tidak perlu dirender di sana
  // supaya tidak numpuk dan menutupi bagian atas gambar.
  const hasOwnHeader = pathname.startsWith('/movie/') || pathname.startsWith('/watch/');
  if (hasOwnHeader) return null;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-3 transition-all duration-300"
      style={{
        background: scrolled
          ? 'linear-gradient(to bottom, rgba(8,10,12,0.98) 0%, rgba(8,10,12,0.9) 100%)'
          : 'linear-gradient(to bottom, rgba(8,10,12,0.55) 0%, rgba(8,10,12,0) 100%)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <Link href="/" aria-label="WARHEAD SHOP — Beranda" className="flex items-center flex-shrink-0">
        <Image src="/mdflix-logo.png" alt="WARHEAD SHOP" width={116} height={30} className="h-7 w-auto object-contain" priority />
      </Link>

      <div className="flex-1" />

      <GoogleAccountButton />

      {!isSearch && (
        <button
          onClick={() => router.push('/search')}
          aria-label="Cari"
          className="w-10 h-10 rounded-full flex items-center justify-center text-silver hover:text-gold active:scale-90 transition-all duration-200"
          style={{
            background: scrolled
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <i className="fa-solid fa-magnifying-glass text-sm" />
        </button>
      )}
    </header>
  );
}
