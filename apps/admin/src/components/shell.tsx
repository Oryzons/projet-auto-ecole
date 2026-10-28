'use client';

import { Bell, ChevronsUpDown, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';

import { school } from '@virage/shared/mock';

import { allItems, nav } from '@/lib/nav';

import s from './shell.module.css';

/** Cadre du back-office : menu latéral, barre du haut et contenu */
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const current = allItems.find((i) => active(i.href));
  const search = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K : recherche
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <Link href="/" className={s.brand}>
          <span className={s.logo}>V</span>
          <span className={s.brandText}>
            <strong>{school.name}</strong>
            <span>Administration</span>
          </span>
        </Link>

        <nav className={s.nav}>
          {nav.map((group) => (
            <div key={group.title} className={s.group}>
              <p className={s.groupTitle}>{group.title}</p>
              {group.items.map(({ href, label, icon: Icon, badge }) => (
                <Link key={href} href={href} className={`${s.item} ${active(href) ? s.itemOn : ''}`} title={label}>
                  <Icon size={18} strokeWidth={1.9} />
                  <span className={s.itemLabel}>{label}</span>
                  {badge ? <span className={s.count}>{badge}</span> : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <button className={s.school}>
          <span className="avatar tone-primary">SL</span>
          <span className={s.schoolText}>
            <strong>Sophie Laurent</strong>
            <span>
              {school.name} · {school.city}
            </span>
          </span>
          <ChevronsUpDown size={16} className="muted" />
        </button>
      </aside>

      <div className={s.main}>
        <header className={s.topbar}>
          <div className={s.crumb}>
            <span className="muted">{school.name}</span>
            <span className="muted">/</span>
            <strong>{current?.label ?? 'Tableau de bord'}</strong>
          </div>
          <label className={s.search}>
            <Search size={16} className="muted" />
            <input ref={search} placeholder="Rechercher un élève, une facture…" />
            <kbd>⌘K</kbd>
          </label>
          <button className={s.icon} aria-label="Notifications">
            <Bell size={18} />
            <span className={s.dot} />
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            <span className={s.hideSm}>Nouvelle inscription</span>
          </button>
        </header>
        <main className={s.content}>{children}</main>
      </div>
    </div>
  );
}
