import { Suspense } from 'react';
import type { Metadata } from 'next';
import WatchClient from './WatchClient';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://mdflix.web.id';
  try {
    const res  = await fetch(`${base}/api/movies/detail/${params.slug}`, {
      next: { revalidate: 3600 },
      headers: { 'x-mz-internal': process.env.ANTI_BOT_SECRET || '' },
    });
    const data = await res.json();
    if (data.title) {
      return {
        title: `Nonton ${data.title}`,
        description: `Nonton ${data.title} (${data.year || ''}) sub indo HD gratis di WARHEAD SHOP.`,
        robots: { index: false }, // watch pages tidak perlu diindex
      };
    }
  } catch {}
  return { title: 'Nonton Film', robots: { index: false } };
}

export default function WatchPage({ params }: Props) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-gold" />
      </div>
    }>
      <WatchClient slug={params.slug} />
    </Suspense>
  );
}
