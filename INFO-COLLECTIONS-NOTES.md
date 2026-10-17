# WARHEAD SHOP Info collections

The Info page now includes three horizontal collections styled with the existing WARHEAD SHOP dark/red design:
- Favorit: uses the existing per-Google-account browser storage (`lib/client-account.ts`).
- Lanjutkan Menonton: uses the existing local history (`lib/continueWatching.ts`).
- Riwayat Tontonan: uses the same locally recorded viewing list.

The current player uses third-party streaming embeds/iframes. Browsers cannot read currentTime/duration from a cross-origin iframe unless the provider explicitly exposes a supported postMessage/player API. Therefore the UI intentionally does not fabricate playback minutes or a fake progress bar. Accurate minute/second resume progress requires a supported player API or a same-origin HTML5 video source.

The collections remain on `/info`; no new page or navigation item is added. Existing favorites and watch routes are retained.
