/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: '**.tmdb.org' },
    ],
    unoptimized: true,
  },
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: '/watch/:path*',
        headers: [
          { key: 'X-Frame-Options',    value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy',    value: 'no-referrer' },
          // Block popups & top-level navigation from iframe scripts
          { key: 'Permissions-Policy', value: 'popups=(), popups-to-escape-sandbox=()' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // Block window.open and top-level redirect from any embedded content
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https://image.tmdb.org https://*.tmdb.org https://placehold.co; media-src 'self'; frame-src *; connect-src 'self' https://api.themoviedb.org https://api.anthropic.com;" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
