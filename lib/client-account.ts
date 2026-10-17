export type AccountUser = { id: string; name: string; email: string; picture: string };
export type SavedMovie = { slug: string; title: string; poster?: string | null; backdrop?: string | null; year?: string | null; rating?: string | null; type?: string | null };
export type AccountProfile = { name: string; picture: string };
const prefix = 'mdflix:account:';
export function readProfile(user: AccountUser): AccountProfile {
  try {
    const v = JSON.parse(localStorage.getItem(`${prefix}${user.id}:profile`) || '{}');
    return { name: typeof v.name === 'string' && v.name.trim() ? v.name : user.name, picture: typeof v.picture === 'string' ? v.picture : user.picture };
  } catch { return { name: user.name, picture: user.picture }; }
}
export function writeProfile(user: AccountUser, profile: AccountProfile) {
  localStorage.setItem(`${prefix}${user.id}:profile`, JSON.stringify({ name: profile.name.trim().slice(0, 60) || user.name, picture: profile.picture }));
}
export function readFavorites(user: AccountUser): SavedMovie[] {
  try { const v = JSON.parse(localStorage.getItem(`${prefix}${user.id}:favorites`) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
export function toggleFavorite(user: AccountUser, movie: SavedMovie): boolean {
  const list = readFavorites(user);
  const exists = list.some(x => x.slug === movie.slug);
  const next = exists ? list.filter(x => x.slug !== movie.slug) : [movie, ...list].slice(0, 300);
  localStorage.setItem(`${prefix}${user.id}:favorites`, JSON.stringify(next));
  return !exists;
}
