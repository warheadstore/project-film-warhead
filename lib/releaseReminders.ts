const STORAGE_KEY = 'mz_release_reminders';

export interface ReminderItem {
  slug: string;
  title: string;
  poster: string | null;
  releaseDate: string; // YYYY-MM-DD
  notifiedAt?: number; // epoch ms, set once the "release day" notification has fired
}

function readAll(): ReminderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: ReminderItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function isReminderSet(slug: string): boolean {
  return readAll().some((i) => i.slug === slug);
}

export function getReminders(): ReminderItem[] {
  return readAll();
}

export function removeReminder(slug: string) {
  writeAll(readAll().filter((i) => i.slug !== slug));
}

/**
 * Simpan reminder untuk film ini. Reminder SELALU tersimpan di localStorage
 * terlepas dari izin notifikasi — supaya tombol "Ingatkan Saya" tetap
 * berfungsi (menandai film) walau browser tidak mendukung, memblokir,
 * atau user menolak izin notifikasi push.
 *
 * Izin notifikasi hanya dicoba secara best-effort di background agar,
 * kalau berhasil, user juga dapat push notification saat film rilis.
 * Kegagalan izin TIDAK membatalkan penyimpanan reminder.
 *
 * Returns status untuk UI: 'granted' | 'denied' | 'default' | 'unsupported'
 * — reminder tetap tersimpan pada semua kasus di atas.
 */
export async function setReminder(item: Omit<ReminderItem, 'notifiedAt'>): Promise<NotificationPermission | 'unsupported'> {
  // Simpan reminder dulu, apa pun kondisi notifikasi
  const items = readAll().filter((i) => i.slug !== item.slug);
  items.push(item);
  writeAll(items);

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    return permission;
  } catch {
    // Beberapa browser mobile melempar error saat requestPermission
    // dipanggil di luar konteks tertentu — reminder tetap tersimpan.
    return Notification.permission;
  }
}

/**
 * Check saved reminders against today's date and fire a notification
 * for any title whose release date has arrived (and hasn't already been
 * notified). Call this on app load / homepage mount — there's no
 * server-side push, so this "catches up" whenever the user opens the app.
 */
export async function checkDueReminders() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const items = readAll();
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;

  for (const item of items) {
    if (item.notifiedAt) continue;
    if (!item.releaseDate || item.releaseDate > today) continue; // no date, or not due yet

    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const body = `${item.title} sudah tayang sekarang — yuk nonton!`;
      if (reg) {
        await reg.showNotification('WARHEAD SHOP', {
          body,
          icon: '/favicon.png',
          badge: '/favicon.png',
          tag: `release-${item.slug}`,
          data: { url: `/movie/${item.slug}` },
        });
      } else {
        new Notification('WARHEAD SHOP', { body, icon: '/favicon.png' });
      }
      item.notifiedAt = Date.now();
      changed = true;
    } catch {
      // notification failed silently — will retry next app open
    }
  }

  if (changed) writeAll(items);
}
