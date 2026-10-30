"use client";

import { AnimatePresence, motion } from "motion/react";
import { Car, Fuel, Gauge, Pencil, Plus, ShieldCheck, Trash2, Wrench } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { TONE_CLASS } from "@/components/plan/tones";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonProgress } from "@/components/vehicles/lesson-progress";
import { usePageSplit } from "@/components/shell/page-popup";
import { VehicleFormDialog } from "@/components/vehicles/vehicle-form-dialog";
import { VehicleVisual } from "@/components/vehicles/vehicle-photos";
import { useAppDialog } from "@/hooks/use-app-dialog";
import { useVehicleMutations, useVehicles } from "@/hooks/use-vehicles";
import { cn } from "@/lib/utils";
import {
  VEHICLE_FUEL_LABELS,
  VEHICLE_PERMIT_LABELS,
  VEHICLE_STATUS_LABELS,
  VEHICLE_TRANSMISSION_LABELS,
  type VehicleDto,
} from "@/lib/vehicles";

const STATUS_TONE = { AVAILABLE: "success", IN_USE: "active", MAINTENANCE: "warning", OUT_OF_SERVICE: "danger" } as const;
const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const formatDay = (day: string | null) => (day ? DATE.format(new Date(`${day}T12:00:00`)) : "Non renseignée");
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`;

/** Parc automobile : chaque véhicule avec ses échéances, à créer, modifier ou supprimer. */
export default function VehiclesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { data, isLoading } = useVehicles();
  const { remove } = useVehicleMutations();
  const { showConfirm } = useAppDialog();
  const [creating, setCreating] = useState(false);
  const vehicles = data?.vehicles ?? [];
  // ?id=… ouvre directement la fiche (lien depuis le plan ou une tâche)
  const editId = params.get("id");
  const editing = vehicles.find((v) => v.id === editId) ?? null;
  const openEdit = (id: string | null) => {
    setCreating(false);
    router.replace(id ? `/admin/vehicles?id=${id}` : "/admin/vehicles", { scroll: false });
  };
  const startCreate = () => {
    if (editId) router.replace("/admin/vehicles", { scroll: false });
    setCreating(true);
  };
  // un seul panneau à droite, pour la création comme pour la modification ; la liste se décale à gauche
  const panelOpen = creating || Boolean(editing);
  usePageSplit(panelOpen);
  const index = editing ? vehicles.indexOf(editing) : -1;
  const nav = editing
    ? { index, total: vehicles.length, go: (delta: number) => openEdit(vehicles[(index + delta + vehicles.length) % vehicles.length]!.id) }
    : null;

  async function confirmDelete(vehicle: VehicleDto) {
    const first = await showConfirm({
      title: `Supprimer ${vehicle.name} (${vehicle.plate}) ?`,
      description: "Le véhicule sera retiré du parc, du plan et du planning des leçons.",
      variant: "destructive",
      confirmLabel: "Continuer",
    });
    if (!first) return;
    const usage = [vehicle.lessons && plural(vehicle.lessons, "leçon à venir", "leçons à venir"), vehicle.openTasks && plural(vehicle.openTasks, "tâche ouverte", "tâches ouvertes")]
      .filter(Boolean)
      .join(" et ");
    const second = await showConfirm({
      title: "Êtes-vous vraiment sûr ?",
      description: `La suppression est irréversible : vous perdrez toutes les données associées à ce véhicule (fiche, échéances, notes${
        usage ? `, et son lien avec ${usage}` : ""
      }).`,
      variant: "destructive",
      confirmLabel: "Supprimer définitivement",
    });
    if (second) remove.mutate(vehicle);
  }

  const counts = {
    available: vehicles.filter((v) => v.status === "AVAILABLE").length,
    garage: vehicles.filter((v) => v.status === "MAINTENANCE").length,
    alerts: vehicles.filter((v) => v.alerts.some((a) => a.tone === "danger")).length,
  };

  return (
    <div className="@container space-y-6">
      <PageHeader
        eyebrow="Garage"
        title="Véhicules"
        description="Le parc de l'auto-école : informations, entretien, contrôle technique et assurance."
        actions={
          <Button onClick={startCreate}>
            <Plus /> Nouveau véhicule
          </Button>
        }
      />

      {vehicles.length > 0 && (
        <div className="flex flex-wrap gap-2 text-[13px]">
          {[
            { label: plural(vehicles.length, "véhicule"), tone: "neutral" as const },
            { label: `${counts.available} disponible${counts.available > 1 ? "s" : ""}`, tone: "success" as const },
            { label: `${counts.garage} au garage`, tone: "warning" as const },
            { label: plural(counts.alerts, "échéance dépassée", "échéances dépassées"), tone: counts.alerts ? ("danger" as const) : ("success" as const) },
          ].map((chip) => (
            <span key={chip.label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-medium text-foreground">
              <span className={cn("size-1.5 rounded-full", TONE_CLASS[chip.tone].dot)} />
              {chip.label}
            </span>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Aucun véhicule"
          description="Ajoutez les voitures et motos de l'auto-école pour suivre leur entretien et les réserver pour les leçons."
          action={
            <Button onClick={startCreate}>
              <Plus /> Ajouter un véhicule
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                selected={vehicle.id === editing?.id}
                onEdit={() => openEdit(vehicle.id)}
                onDelete={() => void confirmDelete(vehicle)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <VehicleFormDialog
        open={panelOpen}
        onOpenChange={(open) => !open && openEdit(null)}
        vehicle={editing}
        onDelete={(v) => void confirmDelete(v)}
        nav={nav}
      />
    </div>
  );
}

function VehicleCard({ vehicle, selected, onEdit, onDelete }: { vehicle: VehicleDto; selected: boolean; onEdit: () => void; onDelete: () => void }) {
  const ref = useRef<HTMLElement>(null);
  // le véhicule ouvert dans le panneau reste en vue quand on passe de l'un à l'autre
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selected]);
  // une leçon en cours prime sur le statut saisi à la main
  const status = vehicle.currentLesson ? "IN_USE" : vehicle.status;
  const tone = STATUS_TONE[status as keyof typeof STATUS_TONE] ?? "neutral";
  const today = new Date().toISOString().slice(0, 10);
  const dueTone = (day: string | null) => {
    if (!day) return "text-muted-foreground";
    if (day < today) return "text-red-600 font-semibold";
    return new Date(`${day}T12:00:00`).getTime() - Date.now() < 30 * 86_400_000 ? "text-amber-700 font-semibold" : "text-foreground";
  };

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      ref={ref}
      aria-current={selected || undefined}
      className={cn(
        "group flex flex-col rounded-2xl border bg-card p-4 shadow-xs transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-sm",
        selected ? "border-primary/60 shadow-sm ring-3 ring-primary/15" : "border-border",
      )}
    >
      <div role="button" tabIndex={-1} onClick={onEdit} className="-mx-1 -mt-1 mb-3 cursor-pointer">
        <VehicleVisual vehicle={vehicle} className="aspect-[16/9]" />
      </div>
      <button type="button" onClick={onEdit} className="flex items-start gap-3 text-left focus-visible:outline-none">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-foreground group-hover:text-primary">{vehicle.name}</span>
          <span className="mt-1 inline-flex rounded-md border border-slate-300 bg-white px-1.5 py-px font-mono text-[12px] font-semibold tracking-wide text-slate-700">
            {vehicle.plate}
          </span>
        </span>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", TONE_CLASS[tone].soft)}>{VEHICLE_STATUS_LABELS[status]}</span>
      </button>

      {vehicle.currentLesson && <LessonProgress lesson={vehicle.currentLesson} />}

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="size-3.5" /> {VEHICLE_PERMIT_LABELS[vehicle.permitCategory]}
        </span>
        <span className="inline-flex items-center gap-1">
          <Car className="size-3.5" /> {VEHICLE_TRANSMISSION_LABELS[vehicle.transmission]}
        </span>
        <span className="inline-flex items-center gap-1">
          <Fuel className="size-3.5" /> {VEHICLE_FUEL_LABELS[vehicle.fuel]}
        </span>
        <span className="inline-flex items-center gap-1">
          <Gauge className="size-3.5" /> {vehicle.mileage.toLocaleString("fr-FR")} km
        </span>
      </div>

      <dl className="mt-3 divide-y divide-border/70 rounded-xl border border-border/70 text-[12.5px]">
        {[
          ["Révision", vehicle.nextServiceAt, vehicle.nextServiceMileage ? ` ou ${vehicle.nextServiceMileage.toLocaleString("fr-FR")} km` : ""],
          ["Contrôle technique", vehicle.inspectionExpiresAt, ""],
          ["Assurance", vehicle.insuranceExpiresAt, vehicle.insurer ? ` · ${vehicle.insurer}` : ""],
        ].map(([label, day, extra]) => (
          <div key={label} className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={cn("truncate text-right", dueTone(day as string | null))}>
              {formatDay(day as string | null)}
              <span className="font-normal text-muted-foreground">{extra}</span>
            </dd>
          </div>
        ))}
      </dl>

      {vehicle.notes && (
        <p className="mt-3 flex gap-2 rounded-xl bg-secondary/70 px-3 py-2 text-[12.5px] leading-relaxed text-foreground">
          <Wrench className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <span className="line-clamp-2">{vehicle.notes}</span>
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 pt-4">
        <span className="mr-auto text-[12px] text-muted-foreground">
          {vehicle.lessons ? plural(vehicle.lessons, "leçon à venir", "leçons à venir") : "Aucune leçon à venir"}
        </span>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil /> Modifier
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label={`Supprimer ${vehicle.name}`} className="text-danger hover:bg-danger-soft hover:text-danger">
          <Trash2 />
        </Button>
      </div>
    </motion.article>
  );
}
