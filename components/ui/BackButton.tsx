'use client';
import { useRouter } from 'next/navigation';

export default function BackButton({ label }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-silver hover:text-gold transition-colors"
    >
      <i className="fa-solid fa-arrow-left text-base" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
