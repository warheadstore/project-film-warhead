# WARHEAD SHOP

Aplikasi streaming film & series berbasis Next.js 14. Dengan fitur katalog, scraper, halaman detail, pemutar, pencarian, genre, rating, dan aktivitas tontonan tetap dipertahankan.

## Menjalankan lokal

1. Salin `.env.example` menjadi `.env.local`.
2. Isi `TMDB_API_KEY` dan tiga variabel Google OAuth.
3. Di Google Cloud Console, buat OAuth Client ID bertipe **Web application** dan tambahkan Authorized redirect URI yang sama persis dengan `GOOGLE_REDIRECT_URI`.
4. Jalankan:

```bash
npm install
npm run dev
```

Untuk lokal, callback default adalah `http://localhost:3000/api/auth/google/callback`. Untuk produksi, gunakan `https://mdflix.web.id/api/auth/google/callback` (atau domain deployment yang benar).

## Vercel

Tambahkan environment variables di Project Settings:
- `NEXT_PUBLIC_APP_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `TMDB_API_KEY`
- Variabel proteksi anti-bot/Redis yang memang sudah digunakan project sebelumnya, bila diperlukan.

Jangan commit `.env.local` atau secret asli ke repository. Bila API key TMDB yang lama pernah dipublikasikan, rotasi key tersebut.

## Akun WARHEAD SHOP

- Login Google menggunakan OAuth Authorization Code + PKCE dan cookie sesi HttpOnly.
- Nama tampilan, foto kustom, dan daftar favorit tersedia per akun pada browser/perangkat yang dipakai.
- Untuk saat ini, profil kustom dan favorit menggunakan `localStorage`, bukan database server; data tersebut tidak tersinkron otomatis lintas perangkat dan dapat hilang bila data browser dibersihkan.
- Identitas login dan email tetap bersumber dari Google; perubahan nama/foto WARHEAD SHOP tidak mengubah profil Google.

## Catatan

Scraper tetap bergantung pada struktur HTML sumber. Sesuaikan jika sumber berubah. OAuth harus menggunakan redirect URI yang terdaftar di Google Cloud Console.


## WARHEAD SHOP
Halaman informasi store tersedia di `/store`. Identitas visual menggunakan logo WARHEAD SHOP yang disediakan.
