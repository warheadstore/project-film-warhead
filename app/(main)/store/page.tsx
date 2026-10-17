import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'WARHEAD SHOP — Informasi Store',
  description: 'Kontak resmi, channel, media sosial, dan metode pembayaran WARHEAD SHOP.',
};

const channels = [
  ['Information WARHEAD SHOP', 'https://whatsapp.com/channel/0029VbBojZB7DAWzCz6RGD1k'],
  ['Info & Promo WARHEAD STORE', 'https://whatsapp.com/channel/0029VazQx1423n3Z9IMogA1J'],
  ['Channel WhatsApp Elaina', 'https://whatsapp.com/channel/0029Vb7XARSAu3aIuXlI9l2d'],
  ['Testimoni WhatsApp', 'https://whatsapp.com/channel/0029VbDB4CmATRSulpAIhF2v'],
  ['Archive WhatsApp', 'https://whatsapp.com/channel/0029VbD682B90x335XFBmS1Y'],
  ['Info Produk', 'https://whatsapp.com/channel/0029VbBkUkD3gvWZZuG5Ta2A'],
  ['Pricelist WhatsApp', 'https://whatsapp.com/channel/0029Vb7VPXZ8aKvAujeybt3e'],
];
const telegram = [
  ['Telegram Owner', 'https://t.me/muhammad_ramadani88'],
  ['WARHEAD SHOP', 'https://t.me/warheadshop'],
  ['Channel Information', 'https://t.me/infowarheadshop'],
  ['Channel Pricelist', 'https://t.me/warhead_store1'],
  ['Grup Telegram 1', 'https://t.me/infowarheadshop1'],
  ['Grup Telegram 2', 'https://t.me/infowarheadshop2'],
  ['Testimoni Telegram', 'https://t.me/testiwarhead_store1'],
  ['Archive Telegram', 'https://t.me/archivewarheadstore'],
];
const socials = [
  ['Info Lengkap Store', 'https://info.warhead1.shop'],
  ['Instagram Store', 'https://instagram.com/warhead_store1'],
  ['TikTok Store', 'https://tiktok.com/@warhead_store1'],
  ['Info Lengkap Owner', 'https://lynk.id/muhammad_ramadani86'],
  ['Instagram Owner', 'https://www.instagram.com/muhammad_ramadani86/'],
  ['TikTok Owner', 'https://tiktok.com/@muhammad_ramadani86'],
  ['Facebook Owner', 'https://facebook.com/ramadanimuhammad86'],
  ['Threads Owner', 'https://www.threads.com/@muhammad_ramadani86/'],
  ['X / Twitter Owner', 'https://x.com/dani_muhammad86'],
];
const payments = [
  ['DANA', '085156766859'], ['OVO', '085156766859'], ['GoPay', '085156766859'],
  ['ShopeePay', '085156766859'], ['Bank BCA', '3540537452'],
  ['SeaBank', '901039276750'], ['Bank Jago', '109463788737'],
];
function LinkList({ items }: { items: string[][] }) {
  return <div className="grid gap-2 sm:grid-cols-2">{items.map(([label, url]) =>
    <a key={label} href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white/90 transition hover:border-amber-400/50 hover:bg-white/[0.07]">
      <span>{label}</span><span className="text-amber-300">↗</span>
    </a>)}</div>;
}
export default function StoreInfoPage() {
  return <main className="min-h-screen bg-[#08090c] px-4 pb-12 pt-20 text-white">
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 flex flex-col items-center text-center">
        <div className="mb-5 w-full max-w-[340px]">
          <Image src="/mdflix-logo.png" alt="WARHEAD SHOP" width={680} height={496} className="h-auto w-full" priority />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[.28em] text-amber-300">Official Store</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">WARHEAD SHOP</h1>
        <p className="mt-2 text-white/60">Owner: Ramadani Muhammad</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-black" href="https://wa.me/6285156766859" target="_blank" rel="noopener noreferrer">WhatsApp Owner</a>
          <a className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold" href="https://t.me/warheadshop" target="_blank" rel="noopener noreferrer">Telegram Store</a>
        </div>
      </header>
      <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <h2 className="mb-3 text-lg font-bold">Kontak WhatsApp</h2>
        <p className="mb-2 text-sm text-white/65">Owner 1</p><a className="text-amber-300" href="https://wa.me/821096766221">+82 10-9676-6221</a>
        <p className="mb-2 mt-4 text-sm text-white/65">Owner 2</p><a className="text-amber-300" href="https://wa.me/6285156766859">+62 851-5676-6859</a>
      </section>
      <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <h2 className="mb-4 text-lg font-bold">Channel WhatsApp</h2><LinkList items={channels} />
      </section>
      <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <h2 className="mb-4 text-lg font-bold">Telegram</h2><LinkList items={telegram} />
      </section>
      <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <h2 className="mb-4 text-lg font-bold">Media Sosial</h2><LinkList items={socials} />
      </section>
      <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <h2 className="mb-4 text-lg font-bold">Metode Pembayaran</h2>
        <div className="grid gap-3 sm:grid-cols-2">{payments.map(([name, number]) => <div key={name} className="rounded-xl border border-white/10 px-4 py-3">
          <p className="text-sm text-white/60">{name}</p><p className="mt-1 font-semibold">{number}</p>
        </div>)}</div>
        <p className="mt-4 text-sm text-white/60">Nama pemilik rekening: <strong className="text-white">MUHAMMAD RAMADANI</strong></p>
      </section>
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <h2 className="mb-3 text-lg font-bold">Informasi Tambahan</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-white/55">Alamat</dt><dd className="mt-1">Jl. Taman Siswa Balun Sawahan Cepu, Blora, Jawa Tengah</dd></div>
          <div><dt className="text-white/55">Kota / Negara</dt><dd className="mt-1">Indonesia · 58312</dd></div>
          <div><dt className="text-white/55">Email</dt><dd className="mt-1"><a className="text-amber-300" href="mailto:ramadani9b@gmail.com">ramadani9b@gmail.com</a></dd></div>
          <div><dt className="text-white/55">Tag</dt><dd className="mt-1">@WARHEADSHOP2026</dd></div>
        </dl>
      </section>
      <footer className="pt-8 text-center text-xs text-white/40">WARHEAD SHOP · Official Information</footer>
    </div>
  </main>;
}
