"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, ChevronLeft, ChevronRight, ClipboardCheck, FileText, History, Gauge, Images, Info, NotebookPen, ShieldCheck, Trash2, Wrench, XIcon, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { TONE_CLASS } from "@/components/plan/tones";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useVehicleMutations } from "@/hooks/use-vehicles";
import { cn } from "@/lib/utils";
import {
  formatPlate,
  guessBody,
  VEHICLE_BODY_LABELS,
  VEHICLE_FUEL_LABELS,
  VEHICLE_PERMIT_LABELS,
  VEHICLE_STATUS_LABELS,
  VEHICLE_TRANSMISSION_LABELS,
  type VehicleDto,
} from "@/lib/vehicles";

import { LessonProgress } from "./lesson-progress";
import { DueChip, LessonHistory, VehicleDocuments, VehicleJournal } from "./vehicle-history";
import { VehiclePhotosField, VehicleVisual } from "./vehicle-photos";

const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));
const STATUS_TONE = { AVAILABLE: "success", IN_USE: "active", MAINTENANCE: "warning", OUT_OF_SERVICE: "danger" } as const;

const TABS = [
  { value: "general", label: "Général", icon: Info },
  { value: "dues", label: "Échéances", icon: CalendarClock },
  { value: "history", label: "Leçons", icon: History },
  { value: "photos", label: "Photos", icon: Images },
  { value: "notes", label: "Notes", icon: NotebookPen },
] as const;
type Tab = (typeof TABS)[number]["value"];

/**
 * Fiche d'un véhicule dans un panneau qui glisse depuis la droite :
 * aperçu en direct en haut, informations rangées par onglets, actions toujours visibles en bas.
 */
export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
  onDelete,
  nav,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: VehicleDto | null;
  onDelete?: (vehicle: VehicleDto) => void;
  /** Passage au véhicule précédent ou suivant de la liste, sans fermer le panneau. */
  nav?: Nav | null;
}) {
  // garde la fiche affichée pendant l'animation de sortie, même si le véhicule n'est plus sélectionné
  const [shown, setShown] = useState(vehicle ?? null);
  if (open && vehicle && vehicle !== shown) setShown(vehicle);
  const current = open ? (vehicle ?? null) : shown;

  return (
    // non modale : la liste des véhicules reste visible et cliquable à gauche du panneau
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false} disablePointerDismissal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden bg-popover text-popover-foreground shadow-float outline-none sm:inset-y-3 sm:right-3 sm:w-[min(540px,calc(100vw-24px))] sm:rounded-2xl sm:border sm:border-border md:w-[min(540px,45vw)]",
            "transition-[translate,opacity,scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "data-starting-style:translate-x-[calc(100%+24px)] data-starting-style:opacity-60",
            "data-ending-style:translate-x-[calc(100%+24px)] data-ending-style:opacity-60 data-ending-style:duration-300 data-ending-style:ease-[cubic-bezier(0.4,0,1,1)]",
          )}
        >
          <VehicleForm key={current?.id ?? "new"} vehicle={current} onDone={() => onOpenChange(false)} onDelete={onDelete} nav={open ? nav : null} />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Apparition en cascade des blocs du panneau, après l'arrivée de celui-ci. */
function Reveal({ index, children, className }: { index: number; children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.12 + index * 0.06 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Group({ title, icon: Icon, children }: { title: string; icon?: LucideIcon; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
      <h3 className="mb-3.5 flex items-center gap-2 text-[13px] font-semibold text-foreground">
        {Icon && (
          <span className="grid size-6 place-items-center rounded-lg bg-primary-soft text-primary">
            <Icon className="size-3.5" />
          </span>
        )}
        {title}
      </h3>
      {children}
    </section>
  );
}

function DueRow({ icon: Icon, label, value, onChange, children }: { icon: LucideIcon; label: string; value: string; onChange: (v: string) => void; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/80 p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          <Icon className="size-4 text-muted-foreground" /> {label}
        </span>
        <DueChip day={value} />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <DatePicker value={value} onChange={onChange} clearable />
        {children}
      </div>
    </div>
  );
}

type Nav = { index: number; total: number; go: (delta: number) => void };

const FIELD_TAB: Record<string, Tab> = { name: "general", plate: "general" };

function VehicleForm({
  vehicle,
  onDone,
  onDelete,
  nav,
}: {
  vehicle: VehicleDto | null;
  onDone: () => void;
  onDelete?: (vehicle: VehicleDto) => void;
  nav?: Nav | null;
}) {
  const { save } = useVehicleMutations();
  const [tab, setTab] = useState<Tab>("general");
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState({
    name: vehicle?.name ?? "",
    plate: vehicle?.plate ?? "",
    status: vehicle?.status ?? "AVAILABLE",
    transmission: vehicle?.transmission ?? "MANUAL",
    fuel: vehicle?.fuel ?? "PETROL",
    permitCategory: vehicle?.permitCategory ?? "B",
    dualControls: vehicle?.dualControls ?? true,
    color: vehicle?.color ?? "",
    vin: vehicle?.vin ?? "",
    firstRegistrationAt: vehicle?.firstRegistrationAt ?? "",
    mileage: String(vehicle?.mileage ?? ""),
    nextServiceAt: vehicle?.nextServiceAt ?? "",
    nextServiceMileage: vehicle?.nextServiceMileage == null ? "" : String(vehicle.nextServiceMileage),
    inspectionExpiresAt: vehicle?.inspectionExpiresAt ?? "",
    insuranceExpiresAt: vehicle?.insuranceExpiresAt ?? "",
    insurer: vehicle?.insurer ?? "",
    insurancePolicy: vehicle?.insurancePolicy ?? "",
    notes: vehicle?.notes ?? "",
    bodyType: vehicle?.bodyType ?? "",
    photos: vehicle?.photos ?? [],
  });
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (error?.field === key) setError(null);
  };
  const go = (next: Tab) => {
    const order = TABS.map((t) => t.value);
    setDirection(order.indexOf(next) >= order.indexOf(tab) ? 1 : -1);
    setTab(next);
  };
  const fail = (field: string, message: string) => {
    setError({ field, message });
    if (FIELD_TAB[field]) go(FIELD_TAB[field]);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return fail("name", "Indiquez la marque et le modèle");
    if (form.plate.trim().length < 4) return fail("plate", "Indiquez l'immatriculation");
    save.mutate(
      {
        id: vehicle?.id,
        data: {
          ...form,
          mileage: form.mileage === "" ? 0 : Number(form.mileage),
          nextServiceMileage: form.nextServiceMileage === "" ? null : Number(form.nextServiceMileage),
        },
      },
      { onSuccess: onDone, onError: (e) => setError({ message: e.message }) },
    );
  };

  const status = vehicle?.currentLesson ? "IN_USE" : form.status;
  const tone = STATUS_TONE[status as keyof typeof STATUS_TONE] ?? "neutral";
  const look = { name: form.name || "Véhicule", color: form.color || null, bodyType: form.bodyType || null, transmission: form.transmission, photos: form.photos };
  const dueAlerts = [form.nextServiceAt, form.inspectionExpiresAt, form.insuranceExpiresAt].filter((d) => d && d < new Date().toISOString().slice(0, 10)).length;

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      {/* aperçu : photo de couverture ou illustration, mis à jour pendant la saisie */}
      <div className="relative shrink-0">
        <motion.div initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.05 }}>
          <VehicleVisual vehicle={look} className="h-[190px] rounded-none sm:h-[210px]" />
        </motion.div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/55 to-transparent" />
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {nav && nav.total > 1 && (
            <div className="flex items-center rounded-xl bg-white/90 shadow-sm">
              <button type="button" aria-label="Véhicule précédent" onClick={() => nav.go(-1)} className="grid size-9 place-items-center rounded-l-xl text-foreground transition-colors hover:bg-white">
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-0.5 text-[12px] font-medium text-muted-foreground tabular">
                {nav.index + 1}/{nav.total}
              </span>
              <button type="button" aria-label="Véhicule suivant" onClick={() => nav.go(1)} className="grid size-9 place-items-center rounded-r-xl text-foreground transition-colors hover:bg-white">
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
          <DialogPrimitive.Close
            aria-label="Fermer"
            className="grid size-9 place-items-center rounded-xl bg-white/90 text-foreground shadow-sm transition-colors hover:bg-white"
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>
        </div>
        <span className={cn("absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11.5px] font-semibold shadow-sm", TONE_CLASS[tone].soft)}>
          {VEHICLE_STATUS_LABELS[status]}
        </span>
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3 text-white">
          <div className="min-w-0">
            <DialogPrimitive.Title className="truncate text-[19px] font-semibold tracking-[-0.01em] drop-shadow-sm">
              {form.name.trim() || (vehicle ? vehicle.name : "Nouveau véhicule")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-[12.5px] text-white/85">
              {[VEHICLE_BODY_LABELS[form.bodyType || guessBody(form.name, form.transmission)], VEHICLE_PERMIT_LABELS[form.permitCategory], form.color].filter(Boolean).join(" · ")}
            </DialogPrimitive.Description>
          </div>
          {form.plate && (
            <span className="flex shrink-0 overflow-hidden rounded-md border border-white/80 bg-white font-mono text-[13px] font-semibold tracking-wide text-slate-800 shadow-sm">
              <span className="bg-primary px-1 text-[9px] leading-[22px] text-white">F</span>
              <span className="px-2 leading-[22px]">{form.plate}</span>
            </span>
          )}
        </div>
      </div>

      <Reveal index={0} className="shrink-0 border-b border-border/70 px-4 py-3">
        <Segmented
          value={tab}
          onChange={go}
          className="w-full"
          options={TABS.map((t) => ({
            value: t.value,
            label: t.label,
            count: t.value === "photos" ? form.photos.length || undefined : t.value === "dues" ? dueAlerts || undefined : undefined,
          }))}
        />
      </Reveal>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-secondary/35 px-4 py-4">
        {error && !error.field && <p className="mb-3 rounded-xl border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error.message}</p>}
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={tab}
            custom={direction}
            initial={{ opacity: 0, x: 24 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 * direction }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="space-y-3"
          >
            {tab === "general" && (
              <>
                {vehicle?.currentLesson && (
                  <Reveal index={1}>
                    <LessonProgress lesson={vehicle.currentLesson} />
                  </Reveal>
                )}
                <Reveal index={1}>
                  <Group title="Identité" icon={Info}>
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <Field label="Marque et modèle" htmlFor="veh-name" error={error?.field === "name" ? error.message : null} className="sm:col-span-2">
                        <Input id="veh-name" autoFocus={!vehicle} value={form.name} maxLength={80} placeholder="Peugeot 208" onChange={(e) => set("name", e.target.value)} />
                      </Field>
                      <Field label="Immatriculation" htmlFor="veh-plate" error={error?.field === "plate" ? error.message : null}>
                        <Input
                          id="veh-plate"
                          value={form.plate}
                          maxLength={15}
                          placeholder="AB-123-CD"
                          className="font-mono tracking-wide uppercase"
                          onChange={(e) => set("plate", formatPlate(e.target.value))}
                        />
                      </Field>
                      <Field label="Couleur" htmlFor="veh-color">
                        <Input id="veh-color" value={form.color} maxLength={30} placeholder="Blanc" onChange={(e) => set("color", e.target.value)} />
                      </Field>
                      <Field label="Silhouette">
                        <Select
                          value={form.bodyType || "AUTO"}
                          onValueChange={(v) => set("bodyType", v === "AUTO" ? "" : v)}
                          options={[
                            { value: "AUTO", label: `Automatique (${VEHICLE_BODY_LABELS[guessBody(form.name, form.transmission)]!.toLowerCase()})` },
                            ...options(VEHICLE_BODY_LABELS),
                          ]}
                          aria-label="Silhouette"
                        />
                      </Field>
                      <Field label="Mise en circulation">
                        <DatePicker value={form.firstRegistrationAt} onChange={(v) => set("firstRegistrationAt", v)} clearable />
                      </Field>
                      <Field label="Numéro de série (VIN)" htmlFor="veh-vin" hint="17 caractères, case E de la carte grise" className="sm:col-span-2">
                        <Input id="veh-vin" value={form.vin} maxLength={17} className="font-mono uppercase" onChange={(e) => set("vin", e.target.value.toUpperCase())} />
                      </Field>
                    </div>
                  </Group>
                </Reveal>
                <Reveal index={2}>
                  <Group title="Utilisation" icon={ShieldCheck}>
                    <div className="space-y-3.5">
                      <Field label="Boîte">
                        <Segmented value={form.transmission} onChange={(v) => set("transmission", v)} options={options(VEHICLE_TRANSMISSION_LABELS)} className="w-full" />
                      </Field>
                      <div className="grid gap-3.5 sm:grid-cols-3">
                        <Field label="Permis">
                          <Select value={form.permitCategory} onValueChange={(v) => set("permitCategory", v)} options={options(VEHICLE_PERMIT_LABELS)} aria-label="Permis enseigné" />
                        </Field>
                        <Field label="Énergie">
                          <Select value={form.fuel} onValueChange={(v) => set("fuel", v)} options={options(VEHICLE_FUEL_LABELS)} aria-label="Énergie" />
                        </Field>
                        <Field label="Statut">
                          <Select value={form.status} onValueChange={(v) => set("status", v)} options={options(VEHICLE_STATUS_LABELS)} aria-label="Statut" />
                        </Field>
                      </div>
                      <label className="flex items-center justify-between gap-3 rounded-xl bg-secondary/70 px-3.5 py-3">
                        <span>
                          <span className="block text-sm font-medium text-foreground">Double commande</span>
                          <span className="block text-xs text-muted-foreground">Pédales côté moniteur, obligatoires pour les leçons auto.</span>
                        </span>
                        <Switch checked={form.dualControls} onCheckedChange={(v) => set("dualControls", v)} aria-label="Double commande" />
                      </label>
                    </div>
                  </Group>
                </Reveal>
              </>
            )}

            {tab === "dues" && (
              <>
                <Reveal index={1}>
                  <Group title="Kilométrage" icon={Gauge}>
                    <Field label="Compteur actuel" htmlFor="veh-km">
                      <div className="relative">
                        <Input id="veh-km" inputMode="numeric" value={form.mileage} placeholder="0" className="pr-10 tabular" onChange={(e) => set("mileage", e.target.value.replace(/\D/g, ""))} />
                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px] text-muted-foreground">km</span>
                      </div>
                    </Field>
                  </Group>
                </Reveal>
                <Reveal index={2}>
                  <Group title="Échéances" icon={CalendarClock}>
                    <div className="space-y-2.5">
                      <DueRow icon={Wrench} label="Prochaine révision" value={form.nextServiceAt} onChange={(v) => set("nextServiceAt", v)}>
                        <div className="relative">
                          <Input
                            aria-label="Ou au kilométrage"
                            inputMode="numeric"
                            value={form.nextServiceMileage}
                            placeholder="ou à 70 000"
                            className="pr-10 tabular"
                            onChange={(e) => set("nextServiceMileage", e.target.value.replace(/\D/g, ""))}
                          />
                          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px] text-muted-foreground">km</span>
                        </div>
                      </DueRow>
                      <DueRow icon={ClipboardCheck} label="Contrôle technique" value={form.inspectionExpiresAt} onChange={(v) => set("inspectionExpiresAt", v)} />
                      <DueRow icon={ShieldCheck} label="Assurance" value={form.insuranceExpiresAt} onChange={(v) => set("insuranceExpiresAt", v)}>
                        <Input aria-label="Assureur" value={form.insurer} maxLength={60} placeholder="Assureur (MMA Pro)" onChange={(e) => set("insurer", e.target.value)} />
                      </DueRow>
                      <Field label="Numéro de contrat d'assurance" htmlFor="veh-policy">
                        <Input id="veh-policy" value={form.insurancePolicy} maxLength={40} className="font-mono" onChange={(e) => set("insurancePolicy", e.target.value)} />
                      </Field>
                    </div>
                  </Group>
                </Reveal>
              </>
            )}

            {tab === "dues" &&
              (vehicle ? (
                <>
                  <Reveal index={3}>
                    <VehicleDocuments vehicleId={vehicle.id} />
                  </Reveal>
                  <Reveal index={4}>
                    <VehicleJournal vehicleId={vehicle.id} />
                  </Reveal>
                </>
              ) : (
                <Reveal index={3}>
                  <p className="flex items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-3.5 text-[12.5px] text-muted-foreground">
                    <FileText className="size-4 shrink-0" /> Les documents et le journal seront disponibles une fois le véhicule ajouté.
                  </p>
                </Reveal>
              ))}

            {tab === "history" && (
              <Reveal index={1}>
                {vehicle ? (
                  <LessonHistory vehicleId={vehicle.id} />
                ) : (
                  <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-center text-[13px] text-muted-foreground">
                    Les leçons apparaîtront ici dès que le véhicule sera réservé.
                  </p>
                )}
              </Reveal>
            )}

            {tab === "photos" && (
              <Reveal index={1}>
                <Group title="Photos du véhicule" icon={Images}>
                  <p className="-mt-1.5 mb-3 text-[12.5px] text-muted-foreground">La première photo sert de couverture. Sans photo, l'illustration ci-dessous est affichée.</p>
                  <VehiclePhotosField look={look} photos={form.photos} onChange={(photos) => set("photos", photos)} onError={(message) => setError({ message })} />
                </Group>
              </Reveal>
            )}

            {tab === "notes" && (
              <Reveal index={1}>
                <Group title="Notes pour l'équipe" icon={NotebookPen}>
                  <Textarea
                    id="veh-notes"
                    aria-label="Notes"
                    rows={8}
                    value={form.notes}
                    maxLength={2000}
                    placeholder="Réparations en cours, rayures, consignes pour les moniteurs…"
                    onChange={(e) => set("notes", e.target.value)}
                  />
                  <p className="mt-1.5 text-right text-[11px] text-muted-foreground tabular">{form.notes.length} / 2000</p>
                </Group>
              </Reveal>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Reveal index={3} className="flex shrink-0 items-center gap-2 border-t border-border/70 bg-popover px-4 py-3">
        {vehicle && onDelete && (
          <Button type="button" variant="ghost" onClick={() => onDelete(vehicle)} className="mr-auto text-danger hover:bg-danger-soft hover:text-danger">
            <Trash2 /> Supprimer
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onDone} className={vehicle && onDelete ? "" : "ml-auto"}>
          Annuler
        </Button>
        <Button type="submit" loading={save.isPending}>
          {vehicle ? "Enregistrer" : "Ajouter le véhicule"}
        </Button>
      </Reveal>
    </form>
  );
}
