
    // ---------------------------------------------------------------
    // Live System Status — real (not fake) measurements:
    //  - Ping: actual round-trip time to the AI API endpoint, measured
    //    via fetch + performance.now(). Uses HEAD-ish no-cors mode so it
    //    works even though we don't need to read the response body.
    //  - Server status: derived from whether that ping succeeds.
    //  - Connection: navigator.onLine + Network Information API (effective
    //    type) where the browser supports it.
    //  - Clock: real local time, ticking every second.
    // ---------------------------------------------------------------
    (function () {
      const PING_TARGET = 'https://api.themoviedb.org/3/trending/all/week';
      const PING_INTERVAL_MS = 8000;

      const dotServer = document.getElementById('liveDotServer');
      const serverStatusEl = document.getElementById('liveServerStatus');
      const pingValueEl = document.getElementById('livePingValue');
      const pingBarsEl = document.getElementById('livePingBars');
      const dotConn = document.getElementById('liveDotConn');
      const connStatusEl = document.getElementById('liveConnStatus');
      const clockEl = document.getElementById('liveClock');
      const graphEl = document.getElementById('livePingGraph');

      const pingHistory = [];
      const MAX_HISTORY = 24;

      function classifyPing(ms) {
        if (ms == null) return { label: 'Timeout', cls: 'bad', bars: 0 };
        if (ms < 200) return { label: `${ms} ms`, cls: 'good', bars: 4 };
        if (ms < 500) return { label: `${ms} ms`, cls: 'ok', bars: 3 };
        if (ms < 1200) return { label: `${ms} ms`, cls: 'slow', bars: 2 };
        return { label: `${ms} ms`, cls: 'bad', bars: 1 };
      }

      function renderBars(count) {
        const bars = pingBarsEl.querySelectorAll('i');
        bars.forEach((bar, idx) => {
          bar.classList.toggle('active', idx < count);
        });
      }

      function renderGraph() {
        graphEl.innerHTML = '';
        pingHistory.slice(-MAX_HISTORY).forEach((ms) => {
          const bar = document.createElement('span');
          const height = ms == null ? 6 : Math.max(6, Math.min(36, ms / 25));
          bar.style.height = height + 'px';
          bar.className = ms == null ? 'bad' : (ms < 200 ? 'good' : ms < 500 ? 'ok' : ms < 1200 ? 'slow' : 'bad');
          graphEl.appendChild(bar);
        });
      }

      async function measurePing() {
        const started = performance.now();
        try {
          // no-cors: we only care about round-trip timing, not the payload,
          // and the API doesn't need to send CORS headers for that.
          await fetch(PING_TARGET, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
          const elapsed = Math.round(performance.now() - started);
          return elapsed;
        } catch (e) {
          return null;
        }
      }

      async function tick() {
        const ms = await measurePing();
        pingHistory.push(ms);
        if (pingHistory.length > MAX_HISTORY) pingHistory.shift();

        const result = classifyPing(ms);
        pingValueEl.textContent = result.label;
        renderBars(result.bars);
        renderGraph();

        if (ms == null) {
          dotServer.className = 'live-dot bad';
          serverStatusEl.textContent = 'Tidak terjangkau';
        } else {
          dotServer.className = 'live-dot good pulse';
          serverStatusEl.textContent = 'Online';
        }
      }

      function updateConnectionInfo() {
        const online = navigator.onLine;
        dotConn.className = online ? 'live-dot good pulse' : 'live-dot bad';

        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (online && conn && conn.effectiveType) {
          connStatusEl.textContent = `Online · ${conn.effectiveType.toUpperCase()}`;
        } else {
          connStatusEl.textContent = online ? 'Online' : 'Offline';
        }
      }

      function updateClock() {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }

      window.addEventListener('online', updateConnectionInfo);
      window.addEventListener('offline', updateConnectionInfo);
      if (navigator.connection) {
        navigator.connection.addEventListener('change', updateConnectionInfo);
      }

      updateConnectionInfo();
      updateClock();
      setInterval(updateClock, 1000);

      tick();
      setInterval(tick, PING_INTERVAL_MS);

      // ---------------------------------------------------------------
      // Stream Health chart — driven by the browser's real Resource
      // Timing API (performance.getEntriesByType('resource')), so the
      // numbers reflect actual bytes transferred by this page/session
      // rather than being purely decorative.
      //  - Bitrate: bytes/sec actually transferred, converted to kbps —
      //    a real proxy for how fast the stream's segments are loading.
      //  - Buffer Health: derived from how consistent that transfer
      //    rate is tick-to-tick. Steady, non-zero transfer = healthy
      //    buffer; long idle/zero gaps = buffer risk. This is an
      //    estimate from local network activity, not a real player
      //    buffer readout (the 2Embed/SuperEmbed iframe is cross-origin
      //    so its actual buffer state isn't observable from here).
      // Data is sampled every TRAFFIC_SAMPLE_MS, but rendering runs on
      // its own requestAnimationFrame loop that continuously
      // interpolates (lerp) toward the latest sampled values and
      // smoothly scrolls the chart, so the line flows instead of
      // jumping between discrete redraws. The path itself is also
      // drawn as a smoothed curve (Catmull-Rom → cubic bezier) instead
      // of straight jagged segments between points.
      // ---------------------------------------------------------------
      const TRAFFIC_SAMPLE_MS = 1500;
      const TRAFFIC_MAX_POINTS = 40;
      const TRAFFIC_SMOOTHING = 0.08; // lerp factor per animation frame (~0-1, lower = smoother/slower)
      const upSeries = [];   // sampled (target) values
      const downSeries = [];
      const upDisplay = [];  // currently displayed (interpolated) values
      const downDisplay = [];
      let lastTransferredBytes = 0;
      let totalBytes = 0;
      let displayedUpRate = 0;
      let displayedDownRate = 0;
      let displayedTotal = 0;
      const recentDeltas = []; // recent per-tick transfer amounts, used for Buffer Health
      const BUFFER_WINDOW = 8;

      const trafficAreaDown = document.getElementById('trafficAreaDown');
      const trafficLineDown = document.getElementById('trafficLineDown');
      const trafficAreaUp = document.getElementById('trafficAreaUp');
      const trafficLineUp = document.getElementById('trafficLineUp');
      const trafficUpValue = document.getElementById('trafficUpValue');
      const trafficDownValue = document.getElementById('trafficDownValue');
      const trafficTotalValue = document.getElementById('trafficTotalValue');

      function lerp(a, b, t) { return a + (b - a) * t; }

      function formatKbps(bytesPerSec) {
        const kbps = (bytesPerSec * 8) / 1024;
        if (kbps < 1) return '0 kbps';
        if (kbps < 1000) return Math.round(kbps) + ' kbps';
        return (kbps / 1000).toFixed(1) + ' Mbps';
      }

      function formatKB(bytes) {
        const kb = bytes / 1024;
        if (kb < 1024) return kb.toFixed(kb < 10 ? 1 : 0) + ' KB';
        return (kb / 1024).toFixed(2) + ' MB';
      }

      function formatBufferHealth(pct) {
        return Math.round(pct) + '%';
      }

      // Builds a smoothed SVG path (cubic bezier through each point,
      // Catmull-Rom style tangents) instead of a straight-segment
      // polyline, so the curve itself looks fluid rather than jagged.
      function smoothPathFromValues(values, maxVal) {
        if (values.length < 2) return { line: '', area: '' };
        const stepX = 300 / (TRAFFIC_MAX_POINTS - 1);
        const startIdx = TRAFFIC_MAX_POINTS - values.length;
        const pts = values.map((v, i) => {
          const x = (startIdx + i) * stepX;
          const norm = maxVal > 0 ? Math.min(1, v / maxVal) : 0;
          const y = 92 - norm * 80;
          return [x, y];
        });

        let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i === 0 ? i : i - 1];
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

          const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
          const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
          const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
          const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

          d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
        }

        const lastX = pts[pts.length - 1][0];
        const firstX = pts[0][0];
        const area = `${d} L ${lastX.toFixed(2)} 100 L ${firstX.toFixed(2)} 100 Z`;
        return { line: d, area };
      }

      function renderTrafficChart() {
        const maxVal = Math.max(1, ...upDisplay, ...downDisplay);
        const down = smoothPathFromValues(downDisplay, maxVal);
        const up = smoothPathFromValues(upDisplay, maxVal);
        trafficLineDown.setAttribute('d', down.line);
        trafficAreaDown.setAttribute('d', down.area);
        trafficLineUp.setAttribute('d', up.line);
        trafficAreaUp.setAttribute('d', up.area);
      }

      // Continuous render loop: every frame, nudge each displayed value
      // a fraction closer to its target (sampled) value. This is what
      // turns "new data every 1.5s" into a smooth, ever-flowing line
      // instead of a chart that visibly snaps on each sample tick.
      function animateTrafficFrame() {
        for (let i = 0; i < TRAFFIC_MAX_POINTS; i++) {
          const targetDown = downSeries[i] ?? downDisplay[i] ?? 0;
          const targetUp = upSeries[i] ?? upDisplay[i] ?? 0;
          downDisplay[i] = lerp(downDisplay[i] ?? targetDown, targetDown, TRAFFIC_SMOOTHING);
          upDisplay[i] = lerp(upDisplay[i] ?? targetUp, targetUp, TRAFFIC_SMOOTHING);
        }

        displayedDownRate = lerp(displayedDownRate, downSeries[downSeries.length - 1] || 0, TRAFFIC_SMOOTHING);
        displayedUpRate = lerp(displayedUpRate, upSeries[upSeries.length - 1] || 0, TRAFFIC_SMOOTHING);
        displayedTotal = lerp(displayedTotal, totalBytes, 0.15);

        // trafficDownValue = Bitrate (real transfer rate, kbps/Mbps)
        trafficDownValue.textContent = formatKbps(displayedDownRate);
        // trafficUpValue = Buffer Health (0-100%, derived from transfer stability)
        trafficUpValue.textContent = formatBufferHealth(displayedUpRate);
        trafficTotalValue.textContent = formatKB(displayedTotal);

        renderTrafficChart();
        requestAnimationFrame(animateTrafficFrame);
      }

      function sampleTraffic() {
        let currentTransferred = 0;
        try {
          const entries = performance.getEntriesByType('resource');
          entries.forEach((e) => {
            currentTransferred += (e.transferSize || e.encodedBodySize || 0);
          });
        } catch (e) { /* Resource Timing unsupported — fall back to 0 */ }

        // Bytes transferred since the previous sample = a real proxy
        // for stream bitrate at this tick.
        const deltaDown = Math.max(0, currentTransferred - lastTransferredBytes);
        lastTransferredBytes = currentTransferred;

        const perSec = 1000 / TRAFFIC_SAMPLE_MS;
        const downRate = deltaDown * perSec; // bytes/sec → bitrate

        // Buffer health isn't directly observable (the video plays in a
        // cross-origin iframe), so it's estimated from how consistently
        // data keeps flowing: steady non-zero transfer → healthy buffer,
        // long idle/zero stretches → buffer risk. Expressed as 0-100%.
        recentDeltas.push(deltaDown);
        if (recentDeltas.length > BUFFER_WINDOW) recentDeltas.shift();
        const activeTicks = recentDeltas.filter((d) => d > 0).length;
        const bufferHealthPct = (activeTicks / recentDeltas.length) * 100;

        totalBytes += deltaDown;

        downSeries.push(downRate);
        upSeries.push(bufferHealthPct);
        if (downSeries.length > TRAFFIC_MAX_POINTS) downSeries.shift();
        if (upSeries.length > TRAFFIC_MAX_POINTS) upSeries.shift();
      }

      sampleTraffic();
      setInterval(sampleTraffic, TRAFFIC_SAMPLE_MS);
      requestAnimationFrame(animateTrafficFrame);
    })();
  
// ---------------------------------------------------------------
// Install page wiring — ported from the original pwa.js.
// Wires up the "Install" button using the deferred prompt captured
// globally in app/layout.tsx (window.__mdflixDeferredInstallPrompt).
// ---------------------------------------------------------------
(function initInstallPage() {
  function run() {
    const btn = document.getElementById('installActionBtn');
    const btnText = document.getElementById('installActionBtnText');
    const statusText = document.getElementById('installStatusText');
    const heroTitle = document.getElementById('installHeroTitle');
    const heroSub = document.getElementById('installHeroSub');
    const heroIcon = document.getElementById('installHeroIcon');
    const iosNotice = document.getElementById('iosInstallNotice');
    if (!btn || !statusText) return; // not on this page

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

    function renderState() {
      if (window.__mdflixIsInstalled) {
        btn.disabled = true;
        btn.style.background = '#22c55e';
        btn.style.color = '#fff';
        btnText.textContent = 'Terpasang';
        heroIcon.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#22c55e"></i>';
        heroTitle.textContent = 'WARHEAD SHOP Sudah Terinstall';
        heroSub.textContent = 'Aplikasi sudah berjalan sebagai PWA di perangkat kamu';
        statusText.textContent = 'Terinstall — aplikasi berjalan dalam mode standalone.';
        iosNotice.classList.add('hidden');
        return;
      }

      if (isIos) {
        btn.disabled = true;
        btnText.textContent = 'Lihat cara install';
        statusText.textContent = 'Belum terinstall — di iOS, install dilakukan manual lewat menu Bagikan Safari.';
        iosNotice.classList.remove('hidden');
        return;
      }

      if (window.__mdflixDeferredInstallPrompt) {
        btn.disabled = false;
        btnText.textContent = 'Install';
        statusText.textContent = 'Siap diinstall — tekan tombol Install untuk memasang aplikasi.';
        iosNotice.classList.add('hidden');
      } else {
        btn.disabled = false;
        btnText.textContent = 'Install';
        statusText.textContent = 'Menunggu browser mengizinkan instalasi. Jika tombol tidak merespons, buka menu browser dan pilih "Install app" / "Tambahkan ke layar utama" secara manual.';
        iosNotice.classList.add('hidden');
      }
    }

    btn.addEventListener('click', async () => {
      if (window.__mdflixIsInstalled) return;
      if (isIos) return;

      const promptEvent = window.__mdflixDeferredInstallPrompt;
      if (!promptEvent) {
        statusText.textContent = 'Prompt instalasi belum tersedia. Coba buka menu browser (⋮ atau ⋯) dan pilih "Install app".';
        return;
      }

      btn.disabled = true;
      promptEvent.prompt();
      try {
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          statusText.textContent = 'Instalasi dikonfirmasi — menyiapkan aplikasi...';
        } else {
          statusText.textContent = 'Instalasi dibatalkan. Anda bisa mencoba lagi kapan saja.';
          btn.disabled = false;
        }
      } catch (e) {
        btn.disabled = false;
      }
      window.__mdflixDeferredInstallPrompt = null;
    });

    document.addEventListener('mdflix:install-available', renderState);
    document.addEventListener('mdflix:installed', renderState);
    // Also fire on load in case prompt already captured
    window.addEventListener('load', function() { setTimeout(renderState, 500); });

    renderState();
  }

  function setupCopyDns() {
    var copyBtn = document.getElementById('copyDnsBtn');
    if (!copyBtn) return;

    var btnText = document.getElementById('copyDnsBtnText');
    var value = copyBtn.getAttribute('data-copy-value') || 'dns.adguard.com';
    var resetTimer = null;

    copyBtn.addEventListener('click', async function() {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          // Fallback untuk browser lama / non-secure context
          var tmp = document.createElement('textarea');
          tmp.value = value;
          tmp.style.position = 'fixed';
          tmp.style.opacity = '0';
          document.body.appendChild(tmp);
          tmp.focus();
          tmp.select();
          document.execCommand('copy');
          document.body.removeChild(tmp);
        }

        if (btnText) btnText.textContent = 'Tersalin!';
        copyBtn.classList.add('opacity-80');
      } catch (e) {
        if (btnText) btnText.textContent = 'Gagal, salin manual';
      }

      clearTimeout(resetTimer);
      resetTimer = setTimeout(function() {
        if (btnText) btnText.textContent = 'Copy';
        copyBtn.classList.remove('opacity-80');
      }, 2000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
    document.addEventListener('DOMContentLoaded', setupCopyDns);
  } else {
    run();
    setupCopyDns();
  }
})();
