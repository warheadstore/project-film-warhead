'use client';
import { useEffect, useState } from 'react';

interface Props {
  /** Judul film/series — dipakai di teks share dan header sheet */
  title: string;
  /** URL absolut halaman detail yang mau dibagikan */
  url: string;
  onClose: () => void;
}

/** Daftar channel share — tiap channel punya cara build link sendiri
 *  (beberapa terima teks+url gabung, ada yang cuma terima url polos). */
function buildShareLinks(title: string, url: string) {
  const text = `Nonton "${title}" di WARHEAD SHOP!`;
  const encodedText = encodeURIComponent(text);
  const encodedUrl  = encodeURIComponent(url);

  return [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: 'fa-brands fa-whatsapp',
      color: '#25D366',
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    },
    {
      key: 'telegram',
      label: 'Telegram',
      icon: 'fa-brands fa-telegram',
      color: '#26A5E4',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      key: 'twitter',
      label: 'X / Twitter',
      icon: 'fa-brands fa-x-twitter',
      color: '#E8EDF2',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: 'fa-brands fa-facebook',
      color: '#1877F2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
  ];
}

export default function ShareSheet({ title, url, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    // navigator.share cuma ada di browser yang support Web Share API
    // (kebanyakan mobile browser modern) — di desktop biasanya tidak ada,
    // jadi tombol ini disembunyikan otomatis kalau tidak didukung.
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const shareText = `Nonton "${title}" di WARHEAD SHOP!`;
  const channels = buildShareLinks(title, url);

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: shareText, url });
      onClose();
    } catch {
      // User membatalkan share sheet native — biarkan, jangan tampilkan error
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API gagal (mis. izin ditolak) — biarkan tanpa crash
    }
  };

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
            <h2 className="font-display font-bold text-base">Bagikan</h2>
            <p className="text-dim text-xs truncate max-w-[240px]">{title}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-ghost flex items-center justify-center text-silver hover:text-gold transition-colors flex-shrink-0"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto">
          {/* Tombol share native OS — muncul paling atas kalau didukung,
              karena ini paling cepat/lengkap (termasuk share ke app chat lain
              yang tidak ter-list manual di sini, mis. Instagram DM/Line). */}
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-2xl bg-gold text-ink font-bold text-sm"
            >
              <i className="fa-solid fa-share-nodes text-xs" />
              Bagikan via Aplikasi Lain
            </button>
          )}

          {/* Grid channel share */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {channels.map(c => (
              <a
                key={c.key}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: c.color + '1A', border: `1px solid ${c.color}40` }}
                >
                  <i className={`${c.icon} text-lg`} style={{ color: c.color }} />
                </div>
                <span className="text-[10px] text-silver text-center leading-tight">{c.label}</span>
              </a>
            ))}
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-ghost border border-line">
            <p className="flex-1 text-xs text-dim truncate pl-2">{url.replace(/^https?:\/\//, '')}</p>
            <button
              onClick={handleCopyLink}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                copied ? 'bg-green-500/20 text-green-400' : 'bg-gold text-ink'
              }`}
            >
              <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'} text-[11px]`} />
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
