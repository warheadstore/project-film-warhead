import Link from 'next/link';
export const metadata = { title: 'Masuk ke WARHEAD SHOP' };
export default function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const next = typeof searchParams.next === 'string' && searchParams.next.startsWith('/') && !searchParams.next.startsWith('//') ? searchParams.next : '/profile';
  const errors: Record<string,string> = { config:'Konfigurasi Google OAuth belum lengkap.', state:'Sesi login kedaluwarsa. Coba lagi.', denied:'Login dibatalkan.', token:'Google tidak dapat memverifikasi login.', server:'Terjadi kesalahan server.' };
  return <main className="min-h-[75vh] flex items-center justify-center px-5 py-20">
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9 text-center shadow-2xl">
      <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center text-red-400 text-2xl"><i className="fa-solid fa-user-shield" /></div>
      <h1 className="text-2xl font-bold mb-2">Masuk ke WARHEAD SHOP</h1>
      <p className="text-sm text-silver mb-7">Gunakan akun Google untuk menyimpan profil, favorit, dan aktivitas tontonan di perangkat ini.</p>
      {searchParams.error && <p role="alert" className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">{errors[searchParams.error] || 'Login gagal. Coba lagi.'}</p>}
      <a href={`/api/auth/google?next=${encodeURIComponent(next)}`} className="w-full inline-flex items-center justify-center gap-3 rounded-xl bg-white text-gray-900 font-semibold py-3.5 hover:bg-gray-100 transition"><i className="fa-brands fa-google text-lg" /> Lanjutkan dengan Google</a>
      <p className="mt-5 text-xs text-dim">Login aman melalui Google OAuth. WARHEAD SHOP tidak meminta kata sandi Google Anda.</p>
      <Link href="/" className="inline-block mt-5 text-sm text-silver hover:text-white">Kembali ke beranda</Link>
    </section>
  </main>;
}
