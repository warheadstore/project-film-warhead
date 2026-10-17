'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readFavorites, toggleFavorite, type AccountUser, type SavedMovie } from '@/lib/client-account';
export default function FavoriteButton({ movie }: { movie: SavedMovie }) {
  const [user,setUser] = useState<AccountUser|null>(null);
  const [saved,setSaved] = useState(false);
  const router = useRouter();
  useEffect(()=>{ fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(d=>{ if(d.user){setUser(d.user);setSaved(readFavorites(d.user).some(x=>x.slug===movie.slug));} }).catch(()=>{}); },[movie.slug]);
  const click = () => {
    if(!user){router.push(`/login?next=${encodeURIComponent(location.pathname)}`);return;}
    try { setSaved(toggleFavorite(user,movie)); window.dispatchEvent(new Event('mdflix:favorites')); } catch {}
  };
  return <button type="button" onClick={click} aria-pressed={saved} className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl border text-sm font-semibold transition-colors mb-3 ${saved?'bg-red-500/15 border-red-500/40 text-red-300':'bg-inke border-line text-silver hover:border-red-500/40 hover:text-red-300'}`}><i className={`fa-${saved?'solid':'regular'} fa-heart`} />{saved?'Hapus dari Favorit':'Tambah ke Favorit'}</button>;
}
