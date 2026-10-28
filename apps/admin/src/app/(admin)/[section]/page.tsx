import { notFound } from 'next/navigation';

import { PageTop } from '@/components/page-top';
import { allItems } from '@/lib/nav';

/** Pages du menu pas encore dessinées */
export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = allItems.find((i) => i.href === `/${section}`);
  if (!item) notFound();
  const Icon = item.icon;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageTop eyebrow="Bientôt" title={item.label} />
      <div className="card fade-in" style={{ display: 'grid', placeItems: 'center', gap: 12, padding: '80px 24px', textAlign: 'center', borderRadius: 24 }}>
        <span className="tone-primary" style={{ width: 64, height: 64, borderRadius: 20, display: 'grid', placeItems: 'center' }}>
          <Icon size={28} />
        </span>
        <h2 style={{ margin: 0, fontSize: 22, letterSpacing: -0.5 }}>On y travaille</h2>
        <p className="muted" style={{ margin: 0, maxWidth: 420 }}>
          Cette page est la prochaine à dessiner. Elle utilisera les mêmes données que l’app mobile.
        </p>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return allItems.filter((i) => !i.ready && i.href !== '/').map((i) => ({ section: i.href.slice(1) }));
}
