"use client";

import { AnimatePresence, motion } from "motion/react";
import { CloudUpload, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

export const ACCEPTED_FILES = "application/pdf,image/png,image/jpeg,image/webp,image/heic";
const MAX_SIZE = 8 * 1024 * 1024;

/**
 * Zone de dépôt (glisser-déposer ou clic) avec progression animée.
 * `onFile` reçoit le fichier validé ; le parent gère l'envoi.
 */
export function FileDrop({
  onFile,
  uploading,
  progress,
  label = "Déposer un fichier",
  hint = "PDF ou image · 8 Mo maximum",
  compact = false,
  disabled = false,
  onInvalid,
  accept = ACCEPTED_FILES,
}: {
  onFile: (file: File) => void;
  uploading: boolean;
  progress: number;
  label?: string;
  hint?: string;
  compact?: boolean;
  disabled?: boolean;
  onInvalid?: (message: string) => void;
  accept?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      onInvalid?.("Le fichier dépasse 8 Mo.");
      return;
    }
    onFile(file);
  }

  return (
    <div
      role="button"
      tabIndex={disabled || uploading ? -1 : 0}
      aria-disabled={disabled || uploading}
      onClick={() => !uploading && !disabled && input.current?.click()}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !uploading && !disabled) {
          event.preventDefault();
          input.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!uploading && !disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!uploading && !disabled) pick(event.dataTransfer.files);
      }}
      className={cn(
        "group relative flex items-center overflow-hidden rounded-xl border border-dashed text-left transition-[border-color,background-color,transform] duration-200 outline-none focus-visible:ring-4 focus-visible:ring-ring/20",
        compact ? "gap-3 px-3.5 py-3" : "gap-4 px-4 py-4",
        dragging
          ? "scale-[1.01] border-primary bg-primary-soft"
          : "border-[color-mix(in_srgb,var(--primary)_28%,var(--border))] bg-subtle hover:border-primary/60 hover:bg-primary-soft/50",
        (disabled || uploading) && "cursor-default",
        disabled && "opacity-60",
      )}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          pick(event.target.files);
          event.target.value = "";
        }}
      />
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-xl bg-card text-primary shadow-xs ring-1 ring-border transition-transform duration-300 ease-out group-hover:-translate-y-0.5",
          compact ? "size-9" : "size-11",
        )}
      >
        {uploading ? <Loader2 className="size-[18px] animate-spin" /> : <CloudUpload className="size-[18px]" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">
          {uploading ? `Envoi en cours… ${Math.round(progress)} %` : dragging ? "Relâchez pour déposer" : label}
        </span>
        <span className="block text-xs text-muted-foreground">
          {uploading ? "Ne fermez pas la page" : (
            <>
              <span className="hidden sm:inline">Glissez-déposez ou </span>
              <span className="font-medium text-primary sm:hidden">Touchez pour choisir · </span>
              <span className="hidden font-medium text-primary sm:inline">parcourez</span>
              <span className="hidden sm:inline"> · </span>
              {hint}
            </>
          )}
        </span>
      </span>
      <AnimatePresence>
        {uploading && (
          <motion.span
            className="absolute inset-x-0 bottom-0 h-1 bg-primary/15"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="block h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(4, progress)}%` }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
