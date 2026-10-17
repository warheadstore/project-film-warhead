import type { Metadata } from 'next';

// Halaman ini SENGAJA diletakkan di luar grup route (main) — supaya tidak
// otomatis mewarisi <Header />, <BottomNav />, atau <JoinChannelPopup />
// dari app/(main)/layout.tsx. Tidak ada tautan ke halaman ini dari mana
// pun di UI (bukan di nav, footer, atau halaman manapun) — hanya bisa
// diakses dengan mengetik /privacy langsung di address bar.
//
// `robots: { index: false }` + entri `Disallow: /privacy` di
// public/robots.txt adalah dua lapis proteksi agar halaman ini tidak
// muncul di hasil pencarian ataupun ikut dirayapi crawler.
export const metadata: Metadata = {
  title: 'Kebijakan Privasi — WARHEAD SHOP',
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-ink text-[#E8EDF2] px-5 py-10 max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-1">Kebijakan Privasi WARHEAD SHOP</h1>
      <p className="text-dim text-xs mb-8">Terakhir diperbarui: 1 Oktober 2026</p>

      <section className="mb-7">
        <h2 className="font-display font-semibold text-base mb-2">1. Ringkasan</h2>
        <p className="text-silver text-sm leading-relaxed">
          WARHEAD SHOP (aplikasi web di mdflix.web.id dan aplikasi native Android)
          adalah indeks/agregator film dan series yang menampilkan metadata dari
          The Movie Database (TMDB) dan menyediakan tautan pemutaran dari
          penyedia embed pihak ketiga. WARHEAD SHOP tidak mengharuskan pembuatan
          akun, tidak meminta nama, email, atau nomor telepon untuk digunakan.
          Aplikasi native Android juga memiliki fitur Nonton Bareng (lihat
          bagian 6) yang menyimpan sejumlah data di luar perangkat kamu untuk
          keperluan sinkronisasi antar peserta.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="font-display font-semibold text-base mb-2">2. Data yang Disimpan di Perangkat Kamu</h2>
        <p className="text-silver text-sm leading-relaxed mb-2">
          Data berikut disimpan secara lokal di browser (localStorage) atau
          di perangkat (SharedPreferences pada aplikasi Android) kamu sendiri.
          Data ini <strong>tidak dikirim ke atau disimpan di server WARHEAD SHOP</strong>:
        </p>
        <ul className="text-silver text-sm leading-relaxed list-disc pl-5 space-y-1">
          <li>Riwayat pencarian judul film/series yang kamu ketik.</li>
          <li>Daftar &quot;Lanjutkan Menonton&quot; — judul, poster, dan progres episode terakhir.</li>
          <li>Daftar &quot;Ingatkan Saya&quot; untuk film yang belum rilis, beserta status notifikasi yang sudah terkirim.</li>
          <li>Rating bintang yang kamu berikan ke suatu judul (lihat bagian 3).</li>
        </ul>
        <p className="text-silver text-sm leading-relaxed mt-2">
          Kamu dapat menghapus seluruh data ini kapan saja lewat pengaturan
          browser (clear site data) atau, di aplikasi Android, lewat
          Pengaturan → Aplikasi → WARHEAD SHOP → Hapus data.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="font-display font-semibold text-base mb-2">3. Rating Film (TMDB Guest Session)</h2>
        <p className="text-silver text-sm leading-relaxed">
          Saat kamu memberi rating bintang pada sebuah judul, WARHEAD SHOP membuat
          &quot;guest session&quot; anonim langsung ke TMDB (themoviedb.org) — ini
          adalah fitur publik resmi TMDB yang tidak memerlukan akun atau data
          pribadi apa pun. ID guest session ini hanya berupa string acak,
          tersimpan di perangkat kamu, dan dikirim ke TMDB semata-mata untuk
          mencatat angka rating. WARHEAD SHOP tidak dapat mengaitkan rating ini
          dengan identitas kamu. Pengelolaan data oleh TMDB sendiri diatur
          oleh kebijakan privasi TMDB.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="font-display font-semibold text-base mb-2">4. Penyedia Pemutaran Pihak Ketiga</h2>
        <p className="text-silver text-sm leading-relaxed">
          Saat kamu menonton, video ditampilkan melalui iframe dari penyedia
          embed pihak ketiga (bukan dihosting oleh WARHEAD SHOP). Interaksi kamu
          dengan pemutar video tersebut — termasuk alamat IP dan data lain
          yang lazim diproses saat memuat halaman web — tunduk pada kebijakan
          privasi penyedia masing-masing, bukan kebijakan ini. WARHEAD SHOP tidak
          memiliki kendali atas praktik data pihak ketiga tersebut.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="font-display font-semibold text-base mb-2">5. Notifikasi (Aplikasi Android)</h2>
        <p className="text-silver text-sm leading-relaxed">
          Aplikasi Android WARHEAD SHOP dapat mengirim notifikasi lokal — misalnya
          saat film yang kamu tandai &quot;Ingatkan Saya&quot; sudah tayang.
          Notifikasi ini dijadwalkan dan diproses langsung di perangkat kamu;
          tidak ada data yang dikirim ke server WARHEAD SHOP untuk keperluan ini.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="font-display font-semibold text-base mb-2">6. Fitur Nonton Bareng (Aplikasi Native)</h2>
        <p className="text-silver text-sm leading-relaxed mb-2">
          Fitur Nonton Bareng (&quot;Nobar&quot;) pada aplikasi native Android
          memungkinkan beberapa pengguna menonton bersama dalam satu room
          sambil mengobrol lewat chat. Berbeda dari bagian 2 di atas, data
          berikut TIDAK hanya tersimpan di perangkat kamu — data ini dikirim
          dan disimpan di sebuah database daring (cloud) milik WARHEAD SHOP,
          supaya bisa disinkronkan secara langsung (real-time) ke semua
          peserta room yang sama:
        </p>
        <ul className="text-silver text-sm leading-relaxed list-disc pl-5 space-y-1 mb-2">
          <li>
            <strong>Identitas perangkat.</strong> Untuk mengenali perangkat
            kamu tanpa perlu akun/login, aplikasi membuat ID pengguna anonim
            yang diturunkan dari Android ID perangkat kamu. ID ini TIDAK
            pernah dikaitkan dengan nama asli, nomor telepon, atau email.
          </li>
          <li>
            <strong>Profil Nobar.</strong> Username yang kamu pilih sendiri
            dan foto profil (opsional) yang kamu unggah ditampilkan ke
            peserta room lain. Keduanya bisa diganti atau dihapus kapan saja
            dari dalam aplikasi.
          </li>
          <li>
            <strong>Pesan chat room.</strong> Setiap pesan yang kamu kirim di
            chat Nobar (termasuk reaksi emoji dan status pin pesan) disimpan
            di database selama room tersebut aktif, dan dapat dilihat oleh
            semua peserta room yang sama.
          </li>
          <li>
            <strong>Peran &amp; status room.</strong> Status seperti Host,
            VIP, Admin, atau Developer, status mute/kick, serta status
            sematkan/bubarkan room disimpan untuk mengatur hak akses dalam
            fitur ini.
          </li>
        </ul>
        <p className="text-silver text-sm leading-relaxed">
          Data pesan chat dan status room dihapus saat room ditutup. Profil
          (username, foto, ID perangkat) tetap tersimpan di database selama
          aplikasi masih terpasang di perangkat kamu, dan dapat diminta
          dihapus lewat kanal kontak pada bagian 10 di bawah.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="font-display font-semibold text-base mb-2">7. Data Teknis Umum</h2>
        <p className="text-silver text-sm leading-relaxed">
          Seperti layanan web pada umumnya, server WARHEAD SHOP dapat menyimpan
          log teknis standar (alamat IP, jenis perangkat/browser, halaman yang
          diakses, dan waktu akses) untuk keperluan keamanan dan diagnosis
          gangguan. Log ini tidak dijual atau dibagikan ke pihak ketiga untuk
          kepentingan pemasaran.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="font-display font-semibold text-base mb-2">8. Anak-anak</h2>
        <p className="text-silver text-sm leading-relaxed">
          WARHEAD SHOP tidak secara khusus ditujukan untuk anak-anak di bawah 13
          tahun dan tidak dengan sengaja mengumpulkan data pribadi dari
          kelompok usia tersebut.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="font-display font-semibold text-base mb-2">9. Perubahan Kebijakan</h2>
        <p className="text-silver text-sm leading-relaxed">
          Kebijakan ini dapat diperbarui dari waktu ke waktu seiring perubahan
          fitur WARHEAD SHOP. Tanggal &quot;Terakhir diperbarui&quot; di bagian
          atas halaman ini akan disesuaikan setiap kali ada perubahan.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-base mb-2">10. Kontak</h2>
        <p className="text-silver text-sm leading-relaxed">
          Pertanyaan seputar kebijakan ini, termasuk permintaan penghapusan
          data profil Nobar, dapat disampaikan melalui kanal kontak developer
          yang tercantum pada halaman listing aplikasi.
        </p>
      </section>
    </main>
  );
}
