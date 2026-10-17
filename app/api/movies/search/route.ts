import { NextRequest } from 'next/server';
import { tmdb, normalizeMovie, type TMDBPage, type TMDBMovie } from '@/lib/tmdb';

/**
 * Jarak Levenshtein sederhana — dipakai untuk toleransi typo. Query pendek
 * (≤3 karakter) sengaja tidak diberi toleransi supaya tidak terlalu longgar
 * (mis. "it" tidak perlu di-fuzzy-match ke banyak judul).
 */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // hapus
        dp[i][j - 1] + 1,      // tambah
        dp[i - 1][j - 1] + cost // ganti
      );
    }
  }
  return dp[m][n];
}

function normalizeText(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g, '').trim();
}

/**
 * Toleransi typo maksimum berdasarkan panjang query — makin panjang query,
 * makin banyak typo yang dimaafkan (proporsional, bukan angka tetap).
 */
function maxTypoDistance(len: number): number {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  return 3;
}

/**
 * Query dianggap "match secara typo" terhadap judul kalau ada kata di judul
 * yang jaraknya dekat dengan query (atau salah satu kata query), atau kalau
 * judul mengandung query sebagai substring biasa (case-insensitive).
 */
function isTypoMatch(query: string, title: string): boolean {
  const qNorm = normalizeText(query);
  const tNorm = normalizeText(title);
  if (!qNorm || !tNorm) return false;
  if (tNorm.includes(qNorm)) return true;

  const threshold = maxTypoDistance(qNorm.length);
  if (threshold === 0) return false;

  // Bandingkan query utuh dengan tiap kata di judul, dan juga dengan
  // potongan awal judul sepanjang query (menangani typo di judul multi-kata,
  // mis. "guradian of the galaxy" vs "guardians of the galaxy").
  const titleWords = tNorm.split(/\s+/);
  for (const w of titleWords) {
    if (Math.abs(w.length - qNorm.length) <= threshold + 1 && levenshtein(qNorm, w) <= threshold) {
      return true;
    }
  }
  const prefix = tNorm.slice(0, qNorm.length + threshold);
  if (levenshtein(qNorm, prefix) <= threshold) return true;

  return false;
}

export async function GET(req: NextRequest) {
  const q    = req.nextUrl.searchParams.get('q') || '';
  const page = req.nextUrl.searchParams.get('page') || '1';
  if (!q.trim()) return Response.json({ error: 'Query wajib diisi' }, { status: 400 });

  try {
    const data = await tmdb<TMDBPage<TMDBMovie>>('/search/multi', { query: q, page, include_adult: 'false' });
    let rawResults = data.results.filter(m => m.media_type !== 'person');
    let totalPages = data.total_pages;
    let totalResults = data.total_results;

    // TMDB search sendiri sudah cukup toleran terhadap typo ringan, tapi
    // untuk typo yang membuat hasil kosong/sangat sedikit (khususnya di
    // halaman pertama), kita coba strategi fallback: potong query jadi kata
    // pertama saja (typo sering di kata kedua dst.) dan re-search, lalu
    // hasil gabungan disaring ulang lewat isTypoMatch supaya tetap relevan.
    if (page === '1' && rawResults.length < 3) {
      const firstWord = q.trim().split(/\s+/)[0];
      if (firstWord && firstWord.length >= 3 && firstWord !== q.trim()) {
        try {
          const fallback = await tmdb<TMDBPage<TMDBMovie>>('/search/multi', {
            query: firstWord,
            page: '1',
            include_adult: 'false',
          });
          const fallbackFiltered = fallback.results.filter(m => m.media_type !== 'person');
          const existingIds = new Set(rawResults.map(m => m.id));
          const merged = [
            ...rawResults,
            ...fallbackFiltered.filter(m => !existingIds.has(m.id)),
          ];
          // Saring pakai typo-match terhadap query asli supaya tidak melebar
          // ke judul yang tidak relevan sama sekali.
          const typoFiltered = merged.filter(m => isTypoMatch(q, m.title || m.name || ''));
          if (typoFiltered.length > rawResults.length) {
            rawResults = typoFiltered;
            totalPages = 1;
            totalResults = typoFiltered.length;
          }
        } catch {
          // fallback gagal — tetap pakai hasil asli, tidak fatal
        }
      }
    }

    const results = rawResults.map(normalizeMovie);
    return Response.json({ results, total_pages: totalPages, total_results: totalResults });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
