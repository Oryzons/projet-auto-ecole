"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { usePageSplit } from "@/components/shell/page-popup";
import { cn } from "@/lib/utils";

/** Panneaux ouverts : un seul à la fois, en ouvrir un referme le précédent. */
const openPanels = new Set<{ close: () => void }>();

/**
 * Panneau qui glisse depuis la droite (fiche véhicule, leçon, séance…).
 * Non modal : la fenêtre de la page se décale à gauche et reste visible et cliquable à côté.
 */
export function SidePanel({
  open,
  onOpenChange,
  children,
  className,
  showCloseButton = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  /** croix en haut à droite ; la fiche véhicule place la sienne sur sa photo */
  showCloseButton?: boolean;
}) {
  usePageSplit(open);
  const closeRef = useRef(() => onOpenChange(false));
  closeRef.current = () => onOpenChange(false);
  useEffect(() => {
    if (!open) return;
    const self = { close: () => closeRef.current() };
    openPanels.forEach((panel) => panel.close());
    openPanels.clear();
    openPanels.add(self);
    return () => void openPanels.delete(self);
  }, [open]);
  // Échap ferme le panneau même quand le focus est resté dans la page à gauche (panneau non modal) ;
  // une confirmation ouverte par-dessus prend Échap pour elle (voir app-dialog)
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector('[data-slot="dialog-content"], [role="alertdialog"]')) return;
      onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      modal={false}
      disablePointerDismissal
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Popup
          data-slot="side-panel"
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden bg-popover text-popover-foreground shadow-float outline-none sm:inset-y-3 sm:right-3 sm:w-[min(540px,calc(100vw-24px))] sm:rounded-2xl sm:border sm:border-border md:w-[min(540px,45vw)]",
            "transition-[translate,opacity,scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "data-starting-style:translate-x-[calc(100%+24px)] data-starting-style:opacity-60",
            "data-ending-style:translate-x-[calc(100%+24px)] data-ending-style:opacity-60 data-ending-style:duration-300 data-ending-style:ease-[cubic-bezier(0.4,0,1,1)]",
            // boutons du formulaire toujours visibles en bas du panneau
            "[&_[data-slot=dialog-footer]]:sticky [&_[data-slot=dialog-footer]]:bottom-0 [&_[data-slot=dialog-footer]]:z-10 [&_[data-slot=dialog-footer]]:mt-auto [&_[data-slot=dialog-footer]]:bg-popover [&_[data-slot=dialog-footer]]:pt-4",
            className,
          )}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              aria-label="Fermer"
              className="absolute top-4 right-4 z-10 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <XIcon className="size-4" />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Garde le dernier contenu affiché pendant l'animation de sortie, quand la sélection est déjà vide. */
export function useLastValue<T>(value: T | null | undefined, open: boolean) {
  const [shown, setShown] = useState(value ?? null);
  if (open && value && value !== shown) setShown(value);
  return open ? (value ?? null) : shown;
}
