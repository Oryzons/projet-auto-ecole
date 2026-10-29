'use client';

import { AlertCircle, AlertOctagon, Info, Trash2, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { EASE_OUT } from '@/components/motion/tokens';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AppDialogVariant = 'default' | 'error' | 'warning' | 'destructive';

export type AppDialogViewProps = {
  open: boolean;
  type: 'alert' | 'confirm';
  title: string;
  description?: string;
  variant?: AppDialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onExitComplete?: () => void;
};

const VARIANTS: Record<AppDialogVariant, { icon: LucideIcon; iconClass: string; button: 'default' | 'destructive' }> = {
  default: { icon: Info, iconClass: 'bg-primary-soft text-primary', button: 'default' },
  error: { icon: AlertOctagon, iconClass: 'bg-danger-soft text-danger', button: 'default' },
  warning: { icon: AlertCircle, iconClass: 'bg-warning-soft text-warning', button: 'default' },
  destructive: { icon: Trash2, iconClass: 'bg-danger-soft text-danger', button: 'destructive' },
};

/** Boîte de dialogue d'alerte ou de confirmation (voir `useAppDialog`). */
export function AppDialogView({
  open,
  type,
  title,
  description,
  variant = 'default',
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  onExitComplete,
}: AppDialogViewProps) {
  const { icon: Icon, iconClass, button } = VARIANTS[variant];
  const dismiss = type === 'alert' ? onConfirm : onCancel;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, dismiss]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4">
          <motion.button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={dismiss}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="app-dialog-title"
            aria-describedby={description ? 'app-dialog-description' : undefined}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="relative w-full max-w-[420px] rounded-2xl border border-border bg-card p-6 shadow-float"
          >
            <div className="flex gap-4">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.05 }}
                className={cn('grid size-11 shrink-0 place-items-center rounded-xl', iconClass)}
              >
                <Icon className="size-5" />
              </motion.span>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 id="app-dialog-title" className="text-[16px] font-semibold tracking-[-0.01em] text-foreground">
                  {title}
                </h2>
                {description && (
                  <p id="app-dialog-description" className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              {type === 'confirm' && (
                <Button variant="ghost" onClick={onCancel}>
                  {cancelLabel ?? 'Annuler'}
                </Button>
              )}
              <Button
                variant={button}
                autoFocus
                onClick={onConfirm}
                className={cn(type === 'alert' && 'min-w-24', button === 'destructive' && 'bg-danger text-white hover:bg-danger/90')}
              >
                {confirmLabel ?? (type === 'alert' ? 'Compris' : 'Confirmer')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
