'use client';
import { usePathname } from 'next/navigation';
import Header from '@/components/ui/Header';
import BottomNav from '@/components/ui/BottomNav';
import JoinChannelPopup from '@/components/ui/JoinChannelPopup';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Halaman movie detail, watch, & homepage punya hero full-bleed di paling
  // atas dengan header transparan yang mengambang di atasnya (gaya Netflix),
  // jadi <main> tidak perlu padding-top di sana — kalau tidak, hero akan
  // terdorong ke bawah dan muncul celah kosong / bar numpuk di atasnya.
  const isHome = pathname === '/';
  const noTopPad = pathname.startsWith('/movie/') || pathname.startsWith('/watch/') || isHome;

  return (
    <>
      <Header />
      <main className={`${noTopPad ? '' : 'pt-14'} pb-safe min-h-screen`}>
        {children}
      </main>
      <BottomNav />
      <JoinChannelPopup />
    </>
  );
}
