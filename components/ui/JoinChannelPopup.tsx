'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const CHANNEL_URL = 'https://whatsapp.com/channel/0029VbBojZB7DAWzCz6RGD1k';
const STORAGE_KEY  = 'mz_join_channel_last_shown';
const WEEK_MS      = 7 * 24 * 60 * 60 * 1000;

export default function JoinChannelPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      const lastTime = last ? parseInt(last, 10) : 0;
      if (Date.now() - lastTime >= WEEK_MS) {
        // beri jeda kecil agar tidak muncul instan bersamaan load halaman
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage tidak tersedia — jangan tampilkan popup
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)' }}
      onClick={dismiss}
    >
      <div
        className="w-full max-w-sm bg-inke border border-line rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="relative">
          <button
            onClick={dismiss}
            aria-label="Tutup"
            className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            <i className="fa-solid fa-xmark text-xs" />
          </button>

          <div className="relative w-full aspect-[16/9] bg-inkb">
            <Image
              src="/join-channel-banner.png"
              alt="WARHEAD SHOP Channel Banner"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="font-display font-bold text-base mb-1">Jangan Ketinggalan Update!</p>
          <p className="text-dim text-xs leading-relaxed mb-4">
            Join channel WhatsApp WARHEAD SHOP untuk dapat info film & series baru,
            perbaikan server, dan pengumuman penting lainnya secara langsung.
          </p>

          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 text-white text-sm font-semibold"
          >
            <i className="fa-brands fa-whatsapp text-base" /> Join Channel
          </a>

          <p className="text-center text-dim text-[10px] mt-3">
            ThanzX — Developer & maintenance WARHEAD SHOP Ramadani Muhammad
          </p>
        </div>
      </div>
    </div>
  );
}
