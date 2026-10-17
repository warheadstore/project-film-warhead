import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';
import Image from 'next/image';
import InfoMovieCollections from '@/components/ui/InfoMovieCollections';

export const metadata: Metadata = {
  title: 'Info & Bantuan',
  robots: { index: false },
};

export default function InfoPage() {
  return (
    <>
      <div className="px-4 pt-4 pb-safe">

        {/* Page heading — sebelumnya halaman ini langsung nyemplung ke
            banner promosi tanpa konteks judul, bikin urutan kerasa
            berantakan. */}
        <h1 className="font-display font-bold text-xl mb-4">Info &amp; Bantuan</h1>

        {/* Koleksi film menyatu di halaman Info, memakai carousel horizontal gaya WARHEAD SHOP. */}
        <InfoMovieCollections />

        {/* Join Channel banner menggunakan aset branding WARHEAD SHOP yang diberikan. */}
        <div className="bg-inke border border-line rounded-2xl overflow-hidden mb-6">
          <a
            href="https://whatsapp.com/channel/0029VbBojZB7DAWzCz6RGD1k"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join Channel WhatsApp WARHEAD SHOP"
            className="block"
          >
            <div className="relative w-full aspect-video bg-inkb">
              <Image
                src="/join-channel-banner.png"
                alt="WARHEAD SHOP — Join Channel WhatsApp"
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
            </div>
          </a>
          <div className="p-4">
            <p className="font-semibold text-sm mb-1">Ikuti Channel WhatsApp WARHEAD SHOP</p>
            <p className="text-dim text-xs leading-relaxed mb-3">
              Info film dan serial terbaru, pembaruan layanan, serta pengumuman penting.
            </p>
            <a
              href="https://whatsapp.com/channel/0029VbBojZB7DAWzCz6RGD1k"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 text-white text-sm font-semibold"
            >
              <i className="fa-brands fa-whatsapp text-base" /> Join Channel
            </a>
          </div>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-3xl overflow-hidden mb-4 shadow-xl border border-line">
            <Image src="/favicon.png" alt="WARHEAD SHOP" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <h2 className="font-display font-bold text-2xl mb-2">Install WARHEAD SHOP</h2>
          <p className="text-silver text-sm leading-relaxed max-w-xs">
            Install aplikasi ini di perangkat kamu untuk akses lebih cepat,
            tampilan layar penuh tanpa address bar, dan ikon langsung di homescreen — layaknya aplikasi native.
          </p>
        </div>

        {/* Install card */}
        <div className="flex items-center gap-3 bg-inke border border-line rounded-2xl p-4 mb-4" id="installHeroCard">
          <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0 text-gold text-xl" id="installHeroIcon">
            <i className="fa-solid fa-download" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm" id="installHeroTitle">Install WARHEAD SHOP</div>
            <div className="text-dim text-xs mt-0.5" id="installHeroSub">Cepat, ringan, bisa dibuka tanpa browser</div>
          </div>
          <button type="button" id="installActionBtn"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-ink text-xs font-bold flex-shrink-0">
            <i className="fa-solid fa-download text-[10px]" />
            <span id="installActionBtnText">Install</span>
          </button>
        </div>

        {/* iOS notice */}
        <div id="iosInstallNotice" className="hidden flex items-start gap-3 bg-inke border border-line rounded-2xl p-4 mb-4 text-silver text-sm">
          <i className="fa-brands fa-apple text-xl flex-shrink-0 mt-0.5" />
          <div>
            Di iPhone/iPad, install manual lewat Safari:
            tap ikon <strong>Bagikan</strong> <i className="fa-solid fa-arrow-up-from-bracket" /> lalu
            pilih <strong>&quot;Tambah ke Layar Utama&quot;</strong>.
          </div>
        </div>

        {/* Live System Status */}
        <p className="text-[10px] text-dim font-semibold uppercase tracking-widest mb-3">Live System Status</p>
        <div className="bg-inke border border-line rounded-2xl p-4 mb-6 space-y-3">
          {/* Server */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-silver">
              <span className="w-2 h-2 rounded-full bg-dim" id="liveDotServer" />
              Server
            </div>
            <span className="text-sm font-semibold text-[#E8EDF2]" id="liveServerStatus">Memeriksa...</span>
          </div>
          {/* Ping */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-silver">
              <i className="fa-solid fa-gauge-high text-dim text-xs" />
              Ping
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#E8EDF2]" id="livePingValue">--</span>
              <span className="flex items-end gap-0.5 h-4" id="livePingBars">
                <i className="block w-1 rounded-sm bg-inkb" style={{height:'25%'}} />
                <i className="block w-1 rounded-sm bg-inkb" style={{height:'50%'}} />
                <i className="block w-1 rounded-sm bg-inkb" style={{height:'75%'}} />
                <i className="block w-1 rounded-sm bg-inkb" style={{height:'100%'}} />
              </span>
            </div>
          </div>
          {/* Koneksi */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-silver">
              <span className="w-2 h-2 rounded-full bg-dim" id="liveDotConn" />
              Koneksi
            </div>
            <span className="text-sm font-semibold text-[#E8EDF2]" id="liveConnStatus">Mendeteksi...</span>
          </div>
          {/* Clock */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-silver">
              <i className="fa-solid fa-clock text-dim text-xs" />
              Waktu Lokal
            </div>
            <span className="text-sm font-semibold text-[#E8EDF2] font-mono" id="liveClock">--:--:--</span>
          </div>
          {/* Ping graph */}
          <div className="flex items-end gap-0.5 h-10 mt-1" id="livePingGraph" aria-hidden="true" />
        </div>

        {/* Stream Health */}
        <p className="text-[10px] text-dim font-semibold uppercase tracking-widest mb-3">Status Streaming</p>
        <div className="bg-inke border border-line rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-[11px] text-silver">
              <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Buffer Health</span>
              <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Bitrate</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-green-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" /> LIVE
            </div>
          </div>
          <svg id="trafficChart" className="w-full mb-3" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true" style={{height:80}}>
            <defs>
              <linearGradient id="trafficFillDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="trafficFillUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path id="trafficAreaDown" d="" fill="url(#trafficFillDown)" />
            <path id="trafficLineDown" d="" fill="none" stroke="#60a5fa" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
            <path id="trafficAreaUp" d="" fill="url(#trafficFillUp)" />
            <path id="trafficLineUp" d="" fill="none" stroke="#34d399" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'trafficUpValue', icon: 'fa-heart-pulse', color: '#34d399', label: 'Buffer Health' },
              { id: 'trafficDownValue', icon: 'fa-gauge-high', color: '#60a5fa', label: 'Bitrate' },
              { id: 'trafficTotalValue', icon: 'fa-database', color: '#E50914', label: 'Total Data Sesi' },
            ].map(s => (
              <div key={s.id} className="bg-inkb rounded-xl p-2.5">
                <div className="flex items-center gap-1 mb-1">
                  <i className={`fa-solid ${s.icon} text-[9px]`} style={{ color: s.color }} />
                  <span className="text-[9px] text-dim">{s.label}</span>
                </div>
                <div className="text-xs font-bold text-[#E8EDF2]" id={s.id}>--</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-dim mt-3 leading-relaxed">
            <i className="fa-solid fa-circle-info mr-1" />
            Estimasi kesehatan buffer dan bitrate berdasarkan aktivitas jaringan lokal selama sesi ini, bukan trafik server global.
          </p>
        </div>

        {/* DNS Anti-Iklan */}
        <p className="text-[10px] text-dim font-semibold uppercase tracking-widest mb-3">Blokir Iklan &amp; Popup</p>
        <div className="bg-inke border border-line rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#3DBBE8]/15 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-shield-halved text-base text-[#3DBBE8]" />
            </div>
            <div>
              <p className="font-semibold text-sm mb-0.5">Wajib Pakai DNS AdGuard</p>
              <p className="text-dim text-xs leading-relaxed">
                Player nonton WARHEAD SHOP memakai sumber pihak ketiga yang kadang menyisipkan iklan/popup.
                Ganti DNS perangkat kamu ke AdGuard supaya sebagian besar iklan &amp; popup itu terblokir
                sebelum sempat muncul di layar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-inkb border border-line rounded-xl px-3 py-2.5 mb-2">
            <code className="flex-1 text-xs font-mono text-[#E8EDF2] truncate" id="adguardDnsValue">
              dns.adguard.com
            </code>
            <button
              type="button"
              id="copyDnsBtn"
              data-copy-value="dns.adguard.com"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-ink text-[11px] font-bold flex-shrink-0"
            >
              <i className="fa-solid fa-copy text-[10px]" />
              <span id="copyDnsBtnText">Copy</span>
            </button>
          </div>

          <p className="text-[10px] text-dim leading-relaxed">
            <i className="fa-solid fa-circle-info mr-1" />
            Android: Setelan &rarr; Jaringan &amp; Internet &rarr; DNS Pribadi &rarr; tempel host di atas.
            iOS: Setelan &rarr; Wi-Fi &rarr; (i) jaringan aktif &rarr; Konfigurasi DNS &rarr; Manual, atau pasang
            profil DNS AdGuard resmi.
          </p>
        </div>

        {/* Kenapa PWA */}
        <p className="text-[10px] text-dim font-semibold uppercase tracking-widest mb-3">Kenapa Install PWA?</p>
        <div className="space-y-3 mb-6">
          {[
            { icon: 'fa-bolt', color: '#E50914', title: 'Lebih Cepat', desc: 'App-shell disimpan di perangkat, jadi buka aplikasi jauh lebih instan dibanding lewat browser.' },
            { icon: 'fa-expand', color: '#3DBBE8', title: 'Layar Penuh', desc: 'Tanpa address bar dan tab browser — tampilannya seperti aplikasi native biasa.' },
            { icon: 'fa-house', color: '#22c55e', title: 'Ikon di Homescreen', desc: 'Akses WARHEAD SHOP langsung dari homescreen atau app drawer, tanpa perlu buka browser dulu.' },
            { icon: 'fa-wifi', color: '#8B3DE8', title: 'Tetap Ringan Saat Koneksi Lemah', desc: 'Bagian tampilan aplikasi tetap bisa dimuat walau koneksi sedang tidak stabil.' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-3 bg-inke border border-line rounded-2xl p-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: f.color + '20' }}>
                <i className={`fa-solid ${f.icon} text-base`} style={{ color: f.color }} />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5">{f.title}</p>
                <p className="text-dim text-xs leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Status card */}
        <p className="text-[10px] text-dim font-semibold uppercase tracking-widest mb-3">Status</p>
        <div className="flex items-start gap-3 bg-inke border border-line rounded-2xl p-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-ghost flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-circle-info text-silver" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-0.5">Status Instalasi</p>
            <p className="text-dim text-xs leading-relaxed" id="installStatusText">Memeriksa status...</p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-dim text-[11px] pb-4 leading-relaxed">
          <i className="fa-solid fa-shield-halved mr-1 text-gold" />
          WARHEAD SHOP tetap butuh koneksi internet untuk streaming film.
          Instalasi PWA hanya mempercepat cara membuka aplikasi.
        </p>
      </div>

      <Script src="/js/install-page.js" strategy="afterInteractive" />
    </>
  );
}
