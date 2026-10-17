'use client';

/**
 * Getar singkat untuk micro-interaction (toggle reminder, kasih rating,
 * dsb). Hanya berjalan di Android/browser yang mendukung Vibration API —
 * iOS Safari tidak mendukungnya sama sekali, jadi fungsi ini no-op di sana
 * (tidak error, cuma diam).
 */
export function hapticTap() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  } catch {
    // Beberapa browser melempar error kalau dipanggil di luar user gesture
    // langsung — aman diabaikan, ini cuma polish, bukan fitur inti.
  }
}

/** Getar sedikit lebih tegas untuk aksi yang terasa lebih "final" (mis. rating tersimpan). */
export function hapticConfirm() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([15, 30, 15]);
    }
  } catch {
    // no-op
  }
}
