'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readFavorites, type AccountUser, type SavedMovie } from '@/lib/client-account';
export default function FavoritesClient() {
  const [user,setUser] = useState<AccountUser|null>(null);
  const [items,setItems] = useState<SavedMovie[]>([]);
  const [ready,setReady] = useState(false);
  useEffect(()=>{
    fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(d=>{ if(d.user){setUser(d.user);setItems(readFavorites(d.user));} }).finally(()=>setReady(true));
    const update=()=>{ if(user) setItems(readFavorites(user)); };
    window.addEventListener('mdflix:favorites',update);
    return ()=>window.removeEventListener('mdflix:favorites',update);
  },[user?.id]);
  if(!ready) return <div className="max-w-6xl mx-auto px-5 py-24 text-silver">Memuat favorit…</div>;
  if(!user) return <div className="max-w-xl mx-auto px-5 py-24 text-center"><h1 className="text-3xl font-bold mb-3">Favorit Saya</h1><p className="text-silver mb-6">Masuk dengan Google untuk menyimpan film favorit.</p><Link href="/login?next=%2Ffavorites" className="inline-flex rounded-xl bg-red-600 px-5 py-3 font-semibold">Masuk dengan Google</Link></div>;
  return <div className="max-w-6xl mx-auto px-5 py-10 sm:py-14"><p className="text-xs uppercase tracking-[.22em] text-red-400 mb-2">Koleksi kamu</p><h1 className="text-3xl sm:text-4xl font-bold mb-2">Favorit Saya</h1><p className="text-sm text-silver mb-8">{items.length} judul tersimpan</p>
    {!items.length ? <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center"><i className="fa-regular fa-heart text-3xl text-dim mb-4"/><h2 className="text-xl font-semibold mb-2">Belum ada favorit</h2><p className="text-sm text-silver mb-5">Buka detail film dan tekan Tambah ke Favorit.</p><Link href="/" className="inline-flex rounded-xl bg-red-600 px-5 py-3 font-semibold">Jelajahi film</Link></div>
    : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{items.map(item=><Link key={item.slug} href={`/movie/${encodeURIComponent(item.slug)}`} className="group"><div className="aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10 mb-2">{item.poster?<img src={item.poster} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>:<div className="h-full flex items-center justify-center"><i className="fa-solid fa-film text-2xl text-dim"/></div>}</div><p className="font-semibold text-sm line-clamp-2">{item.title}</p><p className="text-xs text-silver mt-1">{item.year||''}</p></Link>)}</div>}
    <p className="text-xs text-dim mt-8">Catatan: favorit saat ini tersimpan di browser/perangkat ini, dipisahkan per akun Google.</p>
  </div>;
}
