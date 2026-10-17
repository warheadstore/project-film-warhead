import type { Metadata, Viewport } from 'next';
import './globals.css';

const APP_NAME = 'WARHEAD SHOP';
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://info.warhead1.shop';
const APP_DESC = 'Informasi resmi, produk, dan layanan WARHEAD SHOP.';

// OG Banner — 3 opsi, pilih salah satu di env:
// Opsi 1 (lokal)  : OG_IMAGE_LOCAL=og.jpg  → taruh file di /public/og.jpg
// Opsi 2 (url)    : OG_IMAGE_URL=https://example.com/banner.jpg
// Opsi 3 (env)    : set OG_IMAGE_URL di Vercel dashboard
const OG_IMAGE = process.env.OG_IMAGE_URL
  || (process.env.OG_IMAGE_LOCAL ? `${APP_URL}/${process.env.OG_IMAGE_LOCAL}` : null);

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Nonton Film & Series Sub Indo HD`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESC,
  keywords: [
    'nonton film', 'streaming gratis', 'movie sub indo', 'nonton series',
    'film terbaru', 'film populer', 'warhead shop', 'store', 'produk',
    'film sub indonesia', 'streaming film hd',
  ],
  authors:   [{ name: APP_NAME, url: APP_URL }],
  creator:   APP_NAME,
  publisher: APP_NAME,
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website', locale: 'id_ID',
    url: APP_URL, siteName: APP_NAME,
    title: `${APP_NAME} — Nonton Film & Series Sub Indo HD`,
    description: APP_DESC,
    images: OG_IMAGE ? [{ url: OG_IMAGE, width: 1200, height: 630, alt: APP_NAME }] : [],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Nonton Film & Series Sub Indo HD`,
    description: APP_DESC,
    images: OG_IMAGE ? [OG_IMAGE] : [],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple:    '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest:   '/manifest.json',
  alternates: { canonical: APP_URL },
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1,
  themeColor: '#080A0C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Preconnect ke domain gambar TMDB — hampir semua gambar utama
            (poster, backdrop, termasuk LCP element di homepage) datang dari
            sini. Tanpa ini, browser baru membuka koneksi TLS ke domain
            tersebut setelah parser menemukan tag <img> pertama, menambah
            ratusan ms sebelum gambar mulai di-download sama sekali. */}
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />

        {/* Font Awesome dimuat non-blocking: browser tetap mem-preload file
            CSS-nya lebih awal (prioritas tinggi), tapi tidak menahan render
            pertama sampai file itu selesai di-parse — ini yang sebelumnya
            terdeteksi PageSpeed sebagai "permintaan pemblokiran render".
            media="print" membuatnya tidak render-blocking untuk browser,
            lalu script kecil di bawah langsung men-switch media jadi "all"
            begitu head selesai di-parse supaya ikonnya tetap tampil normal. */}
        <link
          rel="preload"
          as="style"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          media="print"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var links = document.querySelectorAll('link[media="print"][href*="font-awesome"]');
            links.forEach(function(l) { l.media = 'all'; });
          })();
        ` }} />
        <noscript>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: APP_NAME,
              url: APP_URL,
              description: APP_DESC,
              potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: `${APP_URL}/search?q={search_term_string}` },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
          // Capture install prompt globally (like VoltrazCore)
          window.__mdflixDeferredInstallPrompt = null;
          window.__mdflixIsInstalled = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__mdflixDeferredInstallPrompt = e;
            document.dispatchEvent(new Event('mdflix:install-available'));
          });
          window.addEventListener('appinstalled', function() {
            window.__mdflixIsInstalled = true;
            window.__mdflixDeferredInstallPrompt = null;
            document.dispatchEvent(new Event('mdflix:installed'));
          });
        `}} />
      </head>
      <body className="bg-ink text-[#E8EDF2] font-body antialiased">
        {children}
        {/* Honeypot anti-bot: tak terlihat oleh user, dilarang di robots.txt.
            Scraper yang mengikuti semua link akan kena ban sementara. */}
        <a
          href="/api/catalog-export"
          rel="nofollow noindex"
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
        >
          catalog
        </a>
      </body>
    </html>
  );
}
