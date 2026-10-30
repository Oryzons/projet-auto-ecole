"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, ImagePlus, Star, X } from "lucide-react";
import { useRef, useState } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";
import { MAX_VEHICLE_PHOTOS } from "@/lib/vehicles";

import { VehicleIllustration } from "./vehicle-illustration";

/** Réduit une photo (1600 px max, JPEG) avant de l'envoyer : les photos de téléphone pèsent plusieurs Mo. */
async function compress(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

type Look = { name: string; color: string | null; bodyType: string | null; transmission?: string };

/** En-tête visuel d'une carte : les photos s'il y en a (la première en couverture), sinon l'illustration. */
export function VehicleVisual({ vehicle, className }: { vehicle: Look & { photos: string[] }; className?: string }) {
  const [index, setIndex] = useState(0);
  const photos = vehicle.photos;
  const current = Math.min(index, Math.max(photos.length - 1, 0));
  const step = (by: number) => setIndex((current + by + photos.length) % photos.length);
  return (
    <div className={cn("group/visual relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-soft via-secondary to-white", className)}>
      {photos.length === 0 ? (
        <VehicleIllustration {...vehicle} className="absolute inset-0 size-full p-2" />
      ) : (
        <>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img
              key={current}
              src={photos[current]}
              alt={`${vehicle.name}, photo ${current + 1}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="absolute inset-0 size-full object-cover"
            />
          </AnimatePresence>
          {photos.length > 1 && (
            <>
              {[
                { by: -1, Icon: ChevronLeft, side: "left-2", label: "Photo précédente" },
                { by: 1, Icon: ChevronRight, side: "right-2", label: "Photo suivante" },
              ].map(({ by, Icon, side, label }) => (
                <button
                  key={by}
                  type="button"
                  aria-label={label}
                  onClick={(e) => {
                    e.stopPropagation();
                    step(by);
                  }}
                  className={cn(
                    "absolute top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover/visual:opacity-100 focus-visible:opacity-100 max-sm:opacity-100",
                    side,
                  )}
                >
                  <Icon className="size-4" />
                </button>
              ))}
              <span className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
                {photos.map((_, i) => (
                  <span key={i} className={cn("h-1.5 rounded-full bg-white shadow-sm transition-all", i === current ? "w-4" : "w-1.5 opacity-60")} />
                ))}
              </span>
            </>
          )}
        </>
      )}
    </div>
  );
}

/** Gestion des photos dans la fiche : ajout, suppression, choix de la couverture. */
export function VehiclePhotosField({ look, photos, onChange, onError }: { look: Look; photos: string[]; onChange: (photos: string[]) => void; onError: (message: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const room = MAX_VEHICLE_PHOTOS - photos.length;

  async function add(files: FileList | null) {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    if (list.length > room) onError(`${MAX_VEHICLE_PHOTOS} photos au maximum : seules les ${room} premières sont ajoutées.`);
    setBusy(true);
    try {
      const added = await Promise.all(list.slice(0, room).map(compress));
      onChange([...photos, ...added]);
    } catch {
      onError("Cette image n'a pas pu être lue. Essayez un fichier JPEG ou PNG.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary-soft via-secondary to-white">
        <VehicleIllustration {...look} className="absolute inset-0 size-full p-2" />
        <span className="absolute bottom-1.5 left-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
          {photos.length ? "Illustration de secours" : "Affichée sans photo"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <AnimatePresence initial={false}>
          {photos.map((src, i) => (
            <motion.div
              key={src.slice(-48)}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="group/photo relative aspect-[4/3] overflow-hidden rounded-lg border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
              {i === 0 ? (
                <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  <Star className="size-2.5 fill-current" /> Couverture
                </span>
              ) : (
                <button
                  type="button"
                  aria-label="Mettre en couverture"
                  title="Mettre en couverture"
                  onClick={() => onChange([src, ...photos.filter((_, j) => j !== i)])}
                  className="absolute top-1 left-1 grid size-6 place-items-center rounded-md bg-white/90 text-muted-foreground opacity-0 transition-opacity group-hover/photo:opacity-100 hover:text-primary focus-visible:opacity-100 max-sm:opacity-100"
                >
                  <Star className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                aria-label={`Retirer la photo ${i + 1}`}
                onClick={() => onChange(photos.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-md bg-white/90 text-muted-foreground opacity-0 transition-opacity group-hover/photo:opacity-100 hover:text-danger focus-visible:opacity-100 max-sm:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {room > 0 && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft/40 hover:text-primary disabled:opacity-60"
          >
            <ImagePlus className="size-4" />
            {busy ? "Ajout…" : "Ajouter"}
          </button>
        )}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden onChange={(e) => void add(e.target.files)} />
      </div>
    </div>
  );
}
