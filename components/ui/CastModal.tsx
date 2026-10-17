'use client';
import { useEffect } from 'react';
import type { CastMember } from '@/types/movie';

interface Props {
  cast: CastMember[];
  movieTitle: string;
  onClose: () => void;
}

export default function CastModal({ cast, movieTitle, onClose }: Props) {
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
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[85vh] bg-inkl border border-line rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-line" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-line flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-base">Pemeran</h2>
            <p className="text-dim text-xs truncate max-w-[240px]">{movieTitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-ghost flex items-center justify-center text-silver hover:text-gold transition-colors flex-shrink-0"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Grid pemeran — scrollable */}
        <div className="overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-3 gap-4">
            {cast.map((member) => (
              <div key={member.id} className="flex flex-col items-center text-center">
                <div className="w-full aspect-square rounded-full overflow-hidden bg-ghost mb-2 border border-line">
                  {member.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photo}
                      alt={member.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fa-solid fa-user text-lg text-dim" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-[#E8EDF2] line-clamp-2 leading-tight">{member.name}</p>
                {member.character && (
                  <p className="text-[10px] text-dim line-clamp-1 mt-0.5">{member.character}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
