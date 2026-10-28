'use client';

import { X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import s from './side-panel.module.css';

/**
 * Panneau qui glisse depuis la droite de l'écran, comme les feuilles de l'app mobile.
 * Il reste monté le temps de son animation de sortie.
 */
export function SidePanel({
  open,
  onClose,
  children,
  footer,
  header,
  width = 480,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Zone fixe en bas (bouton principal) */
  footer?: ReactNode;
  /** Barre du haut ; par défaut un simple bouton fermer */
  header?: ReactNode;
  width?: number;
  label: string;
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // laisse le navigateur peindre l'état fermé avant d'animer l'entrée
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 320);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return (
    <div className={s.root} data-shown={shown}>
      <div className={s.backdrop} onClick={onClose} />
      <aside className={s.panel} style={{ width: `min(${width}px, 100vw)` }} role="dialog" aria-modal="true" aria-label={label}>
        <div className={s.top}>
          {header ?? (
            <>
              <span />
              <RoundButton label="Fermer" onClick={onClose}>
                <X size={18} />
              </RoundButton>
            </>
          )}
        </div>
        <div className={s.body}>{children}</div>
        {footer ? <div className={s.footer}>{footer}</div> : null}
      </aside>
    </div>
  );
}

/** Bouton rond blanc de l'app (retour, fermer, aide…) */
export function RoundButton({ children, label, onClick, primary }: { children: ReactNode; label: string; onClick?: () => void; primary?: boolean }) {
  return (
    <button type="button" className={`${s.round} ${primary ? s.roundPrimary : ''}`} onClick={onClick} aria-label={label} title={label}>
      {children}
    </button>
  );
}
