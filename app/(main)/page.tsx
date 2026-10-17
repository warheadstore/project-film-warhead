import { Suspense } from 'react';
import HomeClient from './HomeClient';

export const revalidate = 300; // 5 min cache

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  );
}
