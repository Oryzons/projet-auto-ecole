'use client';

import { Bell, Plus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { RoundButton } from '@/components/side-panel';
import { openPanel } from '@/lib/panels';

import s from './page-top.module.css';

/**
 * En-tête de page façon app mobile : petite ligne en capitales, grand titre,
 * et à droite les boutons ronds (recherche, notifications, inscription).
 */
export function PageTop({ eyebrow, title, children }: { eyebrow: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <header className={s.top}>
      <div className={s.text}>
        <p className={s.eyebrow}>{eyebrow}</p>
        <h1 className={s.title}>{title}</h1>
      </div>
      <div className={s.actions}>
        {children}
        <SearchButton />
        <span className={s.bell}>
          <RoundButton label="Notifications" onClick={() => openPanel('notifications')}>
            <Bell size={19} />
          </RoundButton>
          <span className={s.dot} />
        </span>
        <RoundButton label="Inscrire un élève" primary onClick={() => openPanel('inscription')}>
          <Plus size={21} />
        </RoundButton>
      </div>
    </header>
  );
}

/** Loupe qui s'ouvre en champ de recherche (⌘K / Ctrl+K) */
function SearchButton() {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  return (
    <label className={`${s.search} ${open ? s.searchOn : ''}`} onClick={() => setOpen(true)}>
      <Search size={19} />
      <input ref={input} placeholder="Élève, facture, moniteur…" tabIndex={open ? 0 : -1} onBlur={(e) => !e.target.value && setOpen(false)} />
      {open ? (
        <button
          type="button"
          aria-label="Fermer la recherche"
          onClick={(e) => {
            e.stopPropagation();
            if (input.current) input.current.value = '';
            setOpen(false);
          }}>
          <X size={16} />
        </button>
      ) : null}
    </label>
  );
}

/** Bouton qui ouvre un panneau latéral depuis une page serveur */
export function OpenPanel({ panel, className, children }: { panel: 'inscription' | 'notifications'; className?: string; children: ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => openPanel(panel)}>
      {children}
    </button>
  );
}
