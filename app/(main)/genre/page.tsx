import type { Metadata } from 'next';
import BackButton from '@/components/ui/BackButton';
import GenreListClient from './GenreListClient';

export const metadata: Metadata = { title: 'Genre' };

export default function GenrePage() {
  return (
    <div className="py-4">
      <div className="flex items-center gap-3 px-4 mb-5">
        <BackButton />
        <h1 className="font-display font-bold text-lg">Genre</h1>
      </div>
      <GenreListClient />
    </div>
  );
}
