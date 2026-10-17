const TMDB_BASE = 'https://api.themoviedb.org/3';

function apiKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error('TMDB_API_KEY tidak ditemukan di environment variables');
  return key;
}

/**
 * POST /api/session/guest
 * Membuat TMDB guest session baru. Endpoint TMDB ini publik (hanya butuh
 * api_key, bukan account auth), jadi aman dipanggil dari sisi mana pun —
 * tapi tetap kita proxy lewat server supaya TMDB_API_KEY tidak terekspos
 * ke browser.
 */
export async function POST() {
  try {
    const url = new URL(`${TMDB_BASE}/authentication/guest_session/new`);
    url.searchParams.set('api_key', apiKey());

    const res = await fetch(url.toString(), {
      method: 'GET', // endpoint TMDB memang GET meski dipanggil dari POST route kita
      cache: 'no-store',
    });

    if (!res.ok) {
      return Response.json({ success: false, error: `TMDB ${res.status} ${res.statusText}` }, { status: 502 });
    }

    const data = await res.json() as {
      success: boolean;
      guest_session_id: string;
      expires_at: string;
    };

    if (!data.success || !data.guest_session_id) {
      return Response.json({ success: false, error: 'Guest session tidak berhasil dibuat' }, { status: 502 });
    }

    return Response.json({
      success: true,
      guestSessionId: data.guest_session_id,
      expiresAt: data.expires_at,
    });
  } catch (e: unknown) {
    return Response.json({ success: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
