'use client';

import { Ellipsis, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { InscriptionPanel } from '@/components/inscription/inscription-panel';
import { NotificationsPanel } from '@/components/notifications-panel';
import { SidePanel } from '@/components/side-panel';
import { allItems, dock, settings, type NavItem } from '@/lib/nav';

import s from './shell.module.css';

/** Cadre du back-office : menu flottant à gauche (barre d'onglets en bas sur téléphone) */
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const active = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const settingsOn = settings.some((i) => active(i.href));
  const mobileItems = dock.filter((i) => i.mobile);
  const moreOn = !mobileItems.some((i) => active(i.href));

  return (
    <div className={s.shell}>
      <nav className={s.dock} aria-label="Menu">
        <Link href="/" className={s.logo} aria-label="Accueil">
          V
        </Link>
        <div className={s.items}>
          {dock.map((item) => (
            <DockLink key={item.href} item={item} on={active(item.href)} />
          ))}
        </div>
        <DockLink item={{ ...settings[0], icon: Settings }} on={settingsOn} />
        <span className={s.me} title="Sophie Laurent · Virage Lyon 7e">
          SL
        </span>
      </nav>

      {/* Téléphone : la barre d'onglets de l'app */}
      <nav className={s.tabbar} aria-label="Menu">
        {mobileItems.map((item) => (
          <TabLink key={item.href} item={item} on={active(item.href)} />
        ))}
        <button className={`${s.tab} ${moreOn ? s.tabOn : ''}`} onClick={() => setMore(true)} aria-label="Plus">
          <Ellipsis size={20} />
          {moreOn ? <span>Plus</span> : null}
        </button>
      </nav>

      <main className={s.main}>
        <div className={s.content}>{children}</div>
      </main>

      <SidePanel open={more} onClose={() => setMore(false)} label="Toutes les pages" width={420}>
        <h2 className={s.moreTitle}>Toutes les pages</h2>
        <div className={s.moreGrid}>
          {allItems.map((i) => (
            <Link key={i.href} href={i.href} onClick={() => setMore(false)} className={`${s.moreItem} ${active(i.href) ? s.moreOn : ''}`}>
              <i.icon size={22} strokeWidth={1.8} />
              <span>{i.label}</span>
            </Link>
          ))}
        </div>
      </SidePanel>
      <InscriptionPanel />
      <NotificationsPanel />
    </div>
  );
}

function DockLink({ item, on }: { item: NavItem; on: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={`${s.item} ${on ? s.itemOn : ''}`} aria-current={on ? 'page' : undefined}>
      <span className={s.iconWrap}>
        <Icon size={21} strokeWidth={on ? 2.1 : 1.8} />
        {item.badge ? <span className={s.badge}>{item.badge}</span> : null}
      </span>
      <span className={s.label}>{item.short}</span>
    </Link>
  );
}

function TabLink({ item, on }: { item: NavItem; on: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={`${s.tab} ${on ? s.tabOn : ''}`} aria-label={item.short}>
      <span className={s.iconWrap}>
        <Icon size={20} strokeWidth={on ? 2.1 : 1.8} />
        {item.badge && !on ? <span className={s.badge}>{item.badge}</span> : null}
      </span>
      {on ? <span>{item.short}</span> : null}
    </Link>
  );
}
