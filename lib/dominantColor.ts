'use client';

/**
 * Ekstrak warna dominan dari sebuah gambar (poster/backdrop) via canvas,
 * dipakai untuk gradient background dinamis di halaman detail (mirip
 * pendekatan Spotify: warna cover jadi nuansa latar).
 *
 * Berjalan sepenuhnya di browser — gambar TMDB (image.tmdb.org) mengirim
 * header CORS terbuka, jadi canvas tidak "tainted" dan pixel data bisa
 * dibaca. Kalau karena alasan apa pun gagal (network, CORS berubah, dst),
 * caller harus fallback ke warna solid default — fungsi ini tidak pernah
 * throw, cukup resolve ke null.
 */
export function extractDominantColor(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          // Sample kecil (32x32) cukup untuk rata-rata warna dan jauh lebih
          // murah daripada memproses gambar resolusi penuh.
          const size = 32;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);

          ctx.drawImage(img, 0, 0, size, size);
          const { data } = ctx.getImageData(0, 0, size, size);

          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha < 200) continue; // lewati piksel transparan/hampir transparan
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
          if (count === 0) return resolve(null);

          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);

          // Redupkan supaya cocok jadi latar gelap (bukan warna terang
          // penuh yang akan bentrok dengan teks putih di atasnya).
          const darken = (c: number) => Math.round(c * 0.35);
          resolve(`rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    } catch {
      resolve(null);
    }
  });
}
