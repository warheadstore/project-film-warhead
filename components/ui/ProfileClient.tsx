'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { readProfile, writeProfile, type AccountUser, type AccountProfile } from '@/lib/client-account';

export default function ProfileClient() {
  const [user,setUser] = useState<AccountUser|null>(null);
  const [profile,setProfile] = useState<AccountProfile|null>(null);
  const [busy,setBusy] = useState(true);
  const [message,setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(()=>{ fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(d=>{ if(d.user){setUser(d.user);setProfile(readProfile(d.user));} }).finally(()=>setBusy(false)); },[]);
  const upload = (file?: File) => {
    if (!file || !profile) return;
    if (!file.type.startsWith('image/')) { setMessage('Pilih file gambar.'); return; }
    if (file.size > 900_000) { setMessage('Ukuran foto maksimal 900 KB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setProfile(p=>p?({...p,picture:String(reader.result)}):p); setMessage('Foto siap disimpan.'); };
    reader.readAsDataURL(file);
  };
  const save = () => { if(!user||!profile)return; try { writeProfile(user,profile); window.dispatchEvent(new Event('mdflix:profile')); setMessage('Profil tersimpan di perangkat ini.'); } catch { setMessage('Gagal menyimpan. Coba foto yang lebih kecil.'); } };
  const logout = async () => { await fetch('/api/auth/logout',{method:'POST'}); location.href='/'; };
  if (busy) return <div className="max-w-4xl mx-auto px-5 py-24 text-silver">Memuat akun…</div>;
  if (!user || !profile) return <div className="max-w-lg mx-auto px-5 py-24 text-center"><h1 className="text-2xl font-bold mb-3">Profil WARHEAD SHOP</h1><p className="text-silver mb-6">Masuk dengan Google untuk mengelola profil dan daftar favorit.</p><Link className="inline-flex rounded-xl bg-red-600 px-5 py-3 font-semibold" href="/login?next=%2Fprofile">Masuk dengan Google</Link></div>;
  return <div className="max-w-4xl mx-auto px-5 py-10 sm:py-14">
    <p className="text-xs uppercase tracking-[.22em] text-red-400 mb-2">Akun WARHEAD SHOP</p><h1 className="text-3xl sm:text-4xl font-bold mb-8">Profil kamu</h1>
    <div className="grid md:grid-cols-[1fr_300px] gap-5">
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
        <div className="flex items-center gap-4 mb-7">
          <button onClick={()=>fileRef.current?.click()} className="w-20 h-20 rounded-full overflow-hidden border border-white/15 bg-white/10 shrink-0 relative">
            {profile.picture ? <img src={profile.picture} alt="Foto profil" className="w-full h-full object-cover"/> : <i className="fa-solid fa-user text-2xl"/>}
            <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] py-1">Ubah</span>
          </button>
          <div className="min-w-0"><p className="font-semibold text-lg truncate">{profile.name}</p><p className="text-sm text-silver truncate">{user.email}</p><p className="text-xs text-dim mt-1">Akun Google terhubung</p></div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>upload(e.target.files?.[0])}/>
        </div>
        <label className="block text-sm text-silver mb-2" htmlFor="display-name">Nama tampilan</label>
        <input id="display-name" maxLength={60} value={profile.name} onChange={e=>setProfile(p=>p?({...p,name:e.target.value}):p)} className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-red-500 mb-4"/>
        <p className="text-xs text-dim mb-5">Nama dan foto kustom disimpan di browser ini. Email dan identitas login tetap berasal dari Google.</p>
        {message && <p className="text-sm text-silver mb-4" role="status">{message}</p>}
        <div className="flex flex-wrap gap-3"><button onClick={save} className="rounded-xl bg-red-600 hover:bg-red-500 px-5 py-3 font-semibold text-sm">Simpan perubahan</button><button onClick={()=>{setProfile(readProfile(user));setMessage('Perubahan dibatalkan.');}} className="rounded-xl border border-white/10 px-5 py-3 text-sm">Reset</button></div>
      </section>
      <aside className="space-y-3">
        <Link href="/history" className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 hover:bg-white/[0.07]"><span className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center"><i className="fa-solid fa-clock-rotate-left"/></span><span><b className="block">Riwayat tontonan</b><small className="text-silver">Lanjutkan film terakhir</small></span><i className="fa-solid fa-chevron-right ml-auto text-dim"/></Link>
        <Link href="/favorites" className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 hover:bg-white/[0.07]"><span className="w-11 h-11 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center"><i className="fa-solid fa-heart"/></span><span><b className="block">Favorit saya</b><small className="text-silver">Film yang disimpan</small></span><i className="fa-solid fa-chevron-right ml-auto text-dim"/></Link>
        <Link href="/" className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 hover:bg-white/[0.07]"><span className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center"><i className="fa-solid fa-clapperboard"/></span><span><b className="block">Jelajahi film</b><small className="text-silver">Cari tontonan baru</small></span><i className="fa-solid fa-chevron-right ml-auto text-dim"/></Link>
        <button onClick={logout} className="w-full text-left flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-5 hover:bg-red-500/10"><span className="w-11 h-11 rounded-xl bg-red-500/10 text-red-300 flex items-center justify-center"><i className="fa-solid fa-right-from-bracket"/></span><span><b className="block">Keluar</b><small className="text-silver">Akhiri sesi Google</small></span></button>
      </aside>
    </div>
  </div>;
}
