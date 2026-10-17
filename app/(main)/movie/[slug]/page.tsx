import type { Metadata } from 'next';
import MovieDetailClient from './MovieDetailClient';

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
      const title = `${data.title} (${data.year || ''})`;
      const desc  = data.synopsis
        ? data.synopsis.slice(0, 155) + (data.synopsis.length > 155 ? '...' : '')
        : `Nonton ${data.title} sub indo HD gratis di WARHEAD SHOP.`;
      const img   = data.backdrop || data.poster || `${base}/opengraph-image`;
      return {
        title,
        description: desc,
        openGraph: {
          title,
          description: desc,
          images: [{ url: img, width: 1280, height: 720, alt: data.title }],
          type: data.type === 'Series' ? 'video.tv_show' : 'video.movie',
        },
        twitter: { card: 'summary_large_image', title, description: desc, images: [img] },
      };
    }
  } catch {}
  return { title: 'Detail Film' };
}

export default function MovieDetailPage({ params }: Props) {
  return <MovieDetailClient slug={params.slug} />;
}
