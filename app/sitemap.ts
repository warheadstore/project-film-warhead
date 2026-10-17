import { MetadataRoute } from 'next';

const BASE = 'https://mdflix.web.id';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                  lastModified: new Date(), changeFrequency: 'daily',   priority: 1   },
    { url: `${BASE}/popular`,     lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/latest`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/top-rated`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/genre`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/search`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];
}
