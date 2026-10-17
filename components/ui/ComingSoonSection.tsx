'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Movie } from '@/types/movie';
import { isReminderSet, setReminder, removeReminder } from '@/lib/releaseReminders';
import { hapticTap } from '@/lib/haptics';

interface Props {
  movies: Movie[];
  loading?: boolean;
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.max(0, Math.round(diffMs / 86400000));
}

function ComingSoonCard({ movie, onPermissionResult }: { movie: Movie; onPermissionResult: (r: 'granted' | 'denied' | 'unsupported') => void }) {
  const [reminded, setReminded] = useState(false);
  const [status, setStatus] = useState<'idle' | 'requesting'>('idle');

  useEffect(() => {
    setReminded(isReminderSet(movie.slug));
  }, [movie.slug]);

  const days = daysUntil(movie.releaseDate);

  const handleToggleReminder = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hapticTap();

    if (reminded) {
      removeReminder(movie.slug);
      setReminded(false);
      return;
    }

    setStatus('requesting');
    const result = await setReminder({
      slug: movie.slug,
      title: movie.title,
      poster: movie.poster || null,
      releaseDate: movie.releaseDate || '',
    });

    // Reminder selalu tersimpan di setReminder(), jadi tombol selalu
    // berpindah ke status "Diingatkan". Status izin notifikasi dilaporkan
    // ke parent section, yang menampilkan SATU pesan info (bukan per-card)
    // supaya tidak menumpuk teks merah di setiap kartu.
    setReminded(true);
    setStatus('idle');
    onPermissionResult(result === 'unsupported' ? 'unsupported' : result === 'granted' ? 'granted' : 'denied');
  };

  return (
    <div className="w-36 flex-shrink-0 group">
      <Link href={`/movie/${movie.slug}`} className="block">
        <div className="poster-card relative rounded-xl overflow-hidden bg-inkl aspect-[2/3] mb-2">
          {movie.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.poster}
              alt={movie.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-inke">
              <i className="fa-solid fa-film text-2xl text-dim" />
            </div>
          )}
          {/* Tidak ada overlay/badge apa pun di atas poster — poster tampil
              full/utuh tanpa terhalang elemen lain. */}
        </div>
      </Link>

      {/* Countdown dipindah ke luar poster, jadi baris kecil sejajar judul —
          poster jadi benar-benar bersih tanpa elemen menutupinya. */}
      {days !== null && (
        <div className="flex items-center gap-1 mb-1">
          <i className="fa-solid fa-clock text-[9px] text-gold" />
          <span className="text-gold text-[10px] font-bold">
            {days === 0 ? 'Tayang hari ini' : `${days} hari lagi`}
          </span>
        </div>
      )}

      <p className="text-xs font-medium text-[#E8EDF2] line-clamp-2 leading-tight mb-1">
        <Link href={`/movie/${movie.slug}`} className="group-hover:text-gold transition-colors">
          {movie.title}
        </Link>
      </p>
      {movie.releaseDate && (
        <p className="text-[10px] text-dim mb-1.5">
          {new Date(movie.releaseDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}

      {/* Tombol reminder dipindah ke luar poster, di bawah info film,
          supaya tidak menutupi gambar poster sama sekali */}
      <button
        onClick={handleToggleReminder}
        disabled={status === 'requesting'}
        className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
          reminded
            ? 'bg-gold text-ink'
            : 'bg-ghost border border-line text-silver'
        }`}
      >
        <i className={`fa-solid ${reminded ? 'fa-bell' : 'fa-bell'} text-[9px]`} />
        {status === 'requesting' ? 'Memproses...' : reminded ? 'Diingatkan' : 'Ingatkan Saya'}
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="w-36 flex-shrink-0">
      <div className="skeleton rounded-xl aspect-[2/3] mb-2" />
      <div className="skeleton h-3 rounded w-4/5 mb-1" />
      <div className="skeleton h-2.5 rounded w-2/5" />
    </div>
  );
}

export default function ComingSoonSection({ movies, loading }: Props) {
  const [notice, setNotice] = useState<'granted' | 'denied' | 'unsupported' | null>(null);

  if (!loading && movies.length === 0) return null;

  return (
    <section className="mb-7">
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <p className="flex items-center gap-1.5 text-gold text-[10px] font-extrabold tracking-wide mb-0.5">
            <i className="fa-solid fa-calendar-days text-[10px]" /> AKAN TAYANG
          </p>
          <h2 className="font-display font-semibold text-base tracking-tight">Segera Datang</h2>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : movies.map((m) => (
              <ComingSoonCard
                key={m.slug}
                movie={m}
                onPermissionResult={(r) => setNotice((prev) => prev ?? r)}
              />
            ))}
      </div>
      {notice === 'denied' && (
        <p className="px-4 mt-2 text-[10px] text-dim">
          Film tersimpan di daftar. Untuk dapat notifikasi saat tayang, izinkan notifikasi lewat pengaturan browser kamu.
        </p>
      )}
      {notice === 'unsupported' && (
        <p className="px-4 mt-2 text-[10px] text-dim">
          Film tersimpan di daftar. Notifikasi push tidak didukung di browser ini.
        </p>
      )}
    </section>
  );
}
