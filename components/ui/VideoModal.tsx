'use client';
import { useEffect } from 'react';
import type { VideoItem } from '@/types/movie';

interface Props {
  video: VideoItem;
  onClose: () => void;
}

export default function VideoModal({ video, onClose }: Props) {
  // Kunci scroll body selama modal terbuka
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  // Tutup dengan tombol Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-inkl border border-line rounded-2xl overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{video.name}</p>
            <p className="text-dim text-[10px] uppercase tracking-wide">{video.type}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-ghost flex items-center justify-center text-silver hover:text-gold transition-colors flex-shrink-0"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Player — autoplay begitu modal dibuka, sesuai ekspektasi user yang baru saja tap thumbnail */}
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          <iframe
            src={`https://www.youtube.com/embed/${video.key}?autoplay=1&rel=0`}
            title={video.name}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
