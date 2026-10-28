import { notFound } from 'next/navigation';

import { allItems } from '@/lib/nav';

/** Pages du menu pas encore dessinées */
export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = allItems.find((i) => i.href === `/${section}`);
  if (!item) notFound();
  const Icon = item.icon;
  return (
    <div className="card fade-in" style={{ display: 'grid', placeItems: 'center', gap: 12, padding: '80px 24px', textAlign: 'center' }}>
      <span className="tone-primary" style={{ width: 64, height: 64, borderRadius: 20, display: 'grid', placeItems: 'center' }}>
        <Icon size={28} />
      </span>
      <h1 style={{ margin: 0, fontSize: 24, letterSpacing: -0.5 }}>{item.label}</h1>
      <p className="muted" style={{ margin: 0, maxWidth: 420 }}>
        Cette page est la prochaine à dessiner. Elle utilisera les mêmes données que l’app mobile.
      </p>
    </div>
  );
}

export function generateStaticParams() {
  return allItems.filter((i) => !i.ready && i.href !== '/').map((i) => ({ section: i.href.slice(1) }));
}
