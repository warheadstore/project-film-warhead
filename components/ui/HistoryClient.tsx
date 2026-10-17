'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getContinueWatching, removeFromContinueWatching, type ContinueWatchingItem } from '@/lib/continueWatching';
export default function HistoryClient() {
  const [items,setItems] = useState<ContinueWatchingItem[]>([]);
  useEffect(()=>{ const load=()=>setItems(getContinueWatching()); load(); window.addEventListener('storage',load); return ()=>window.removeEventListener('storage',load); },[]);
  const remove=(slug:string)=>{removeFromContinueWatching(slug);setItems(getContinueWatching());};
  return <div className="max-w-6xl mx-auto px-5 py-10 sm:py-14"><p className="text-xs uppercase tracking-[.22em] text-red-400 mb-2">Aktivitas</p><h1 className="text-3xl sm:text-4xl font-bold mb-2">Riwayat tontonan</h1><p className="text-sm text-silver mb-8">Film dan series yang terakhir kamu buka di perangkat ini.</p>
  {!items.length ? <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center"><i className="fa-solid fa-clock-rotate-left text-3xl text-dim mb-4"/><h2 className="text-xl font-semibold mb-2">Belum ada riwayat</h2><p className="text-sm text-silver mb-5">Mulai menonton film atau series untuk mengisi daftar ini.</p><Link href="/" className="inline-flex rounded-xl bg-red-600 px-5 py-3 font-semibold">Jelajahi film</Link></div>
  : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{items.map(item=><div key={item.slug} className="group relative"><Link href={`/watch/${encodeURIComponent(item.slug)}`}><div className="aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10 mb-2">{item.poster?<img src={item.poster} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>:<div className="h-full flex items-center justify-center"><i className="fa-solid fa-film text-2xl text-dim"/></div>}</div><p className="font-semibold text-sm line-clamp-2">{item.title}</p><p className="text-xs text-silver mt-1">{item.year||''}{item.season?` · S${item.season} E${item.episode||1}`:''}</p></Link><button onClick={()=>remove(item.slug)} className="mt-2 text-xs text-silver hover:text-red-300"><i className="fa-solid fa-xmark mr-1"/>Hapus dari riwayat</button></div>)}</div>}
  <p className="text-xs text-dim mt-8">Riwayat tersimpan di browser/perangkat ini dan tidak tersinkron otomatis lintas perangkat.</p></div>;
}
