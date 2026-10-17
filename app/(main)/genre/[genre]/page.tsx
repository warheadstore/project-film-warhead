import type { Metadata } from 'next';
import BackButton from '@/components/ui/BackButton';
import GenreClient from './GenreClient';

interface Props { params: { genre: string } }

export function generateMetadata({ params }: Props): Metadata {
  return { title: `Genre ${params.genre.replace(/-/g, ' ')}` };
}

export default function GenrePage({ params }: Props) {
  return (
    <div className="py-4">
      <div className="flex items-center gap-3 px-4 mb-5">
        <BackButton />
        <h1 className="font-display font-bold text-lg capitalize">
          {params.genre.replace(/-/g, ' ')}
        </h1>
      </div>
      <GenreClient genreSlug={params.genre} />
    </div>
  );
}
