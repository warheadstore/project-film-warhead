import { Suspense } from 'react';
import SearchClient from './SearchClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Cari Film' };

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchClient />
    </Suspense>
  );
}
