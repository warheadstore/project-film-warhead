'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readProfile, type AccountUser } from '@/lib/client-account';
export default function GoogleAccountButton() {
  const [user,setUser] = useState<AccountUser|null>(null);
  const [picture,setPicture] = useState('');
  useEffect(()=>{
    let current: AccountUser|null = null;
    const syncProfile = () => { if(current) setPicture(readProfile(current).picture); };
    fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(d=>{ current=d.user||null; setUser(current); if(current) setPicture(readProfile(current).picture); }).catch(()=>{});
    window.addEventListener('mdflix:profile',syncProfile);
    return ()=>window.removeEventListener('mdflix:profile',syncProfile);
  },[]);
  if (!user) return <Link href="/login?next=%2Fprofile" aria-label="Login Google" className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold border border-white/10 bg-white/5 hover:bg-white/10"><i className="fa-brands fa-google" /> Masuk</Link>;
  return <Link href="/profile" aria-label="Profil WARHEAD SHOP" className="w-9 h-9 rounded-full overflow-hidden border border-white/15 bg-white/10 flex items-center justify-center">
    {picture ? <img src={picture} alt="" className="w-full h-full object-cover" /> : <i className="fa-solid fa-user" />}
  </Link>;
}
