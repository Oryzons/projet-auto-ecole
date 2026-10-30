"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useVehicleMutations } from "@/hooks/use-vehicles";
import {
  guessBody,
  VEHICLE_BODY_LABELS,
  VEHICLE_FUEL_LABELS,
  VEHICLE_PERMIT_LABELS,
  VEHICLE_STATUS_LABELS,
  VEHICLE_TRANSMISSION_LABELS,
  type VehicleDto,
} from "@/lib/vehicles";

import { VehiclePhotosField } from "./vehicle-photos";

const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));

/** Fiche complète d'un véhicule : création (sans `vehicle`) ou modification. */
export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: VehicleDto | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {open && <VehicleForm key={vehicle?.id ?? "new"} vehicle={vehicle ?? null} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

function VehicleForm({ vehicle, onDone }: { vehicle: VehicleDto | null; onDone: () => void }) {
  const { save } = useVehicleMutations();
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

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return setError({ field: "name", message: "Indiquez la marque et le modèle" });
    if (form.plate.trim().length < 4) return setError({ field: "plate", message: "Indiquez l'immatriculation" });
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

  return (
    <form onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>{vehicle ? `Modifier ${vehicle.name}` : "Nouveau véhicule"}</DialogTitle>
        <DialogDescription>
          {vehicle ? "Toutes les informations du véhicule. Les tâches liées suivent le changement de nom." : "Il apparaîtra au garage sur le plan et pourra être réservé pour les leçons."}
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[min(64svh,620px)] space-y-6 overflow-y-auto px-6 pt-5 pb-2">
        {error && !error.field && <p className="rounded-xl border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error.message}</p>}

        <Section title="Photos">
          <VehiclePhotosField
            look={{ name: form.name || "Véhicule", color: form.color || null, bodyType: form.bodyType || null, transmission: form.transmission }}
            photos={form.photos}
            onChange={(photos) => set("photos", photos)}
            onError={(message) => setError({ message })}
          />
        </Section>

        <Section title="Identité">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marque et modèle" htmlFor="veh-name" error={error?.field === "name" ? error.message : null}>
              <Input id="veh-name" autoFocus value={form.name} maxLength={80} placeholder="Peugeot 208" onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Immatriculation" htmlFor="veh-plate" error={error?.field === "plate" ? error.message : null}>
              <Input
                id="veh-plate"
                value={form.plate}
                maxLength={15}
                placeholder="AB-123-CD"
                className="uppercase"
                onChange={(e) => set("plate", e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Couleur" htmlFor="veh-color" hint="Facultatif">
              <Input id="veh-color" value={form.color} maxLength={30} placeholder="Blanc" onChange={(e) => set("color", e.target.value)} />
            </Field>
            <Field label="Silhouette" hint="Pour l'illustration affichée sans photo">
              <Select
                value={form.bodyType || "AUTO"}
                onValueChange={(v) => set("bodyType", v === "AUTO" ? "" : v)}
                options={[
                  { value: "AUTO", label: `Automatique (${VEHICLE_BODY_LABELS[guessBody(form.name, form.transmission)].toLowerCase()})` },
                  ...options(VEHICLE_BODY_LABELS),
                ]}
                aria-label="Silhouette"
              />
            </Field>
            <Field label="Première mise en circulation">
              <DatePicker value={form.firstRegistrationAt} onChange={(v) => set("firstRegistrationAt", v)} clearable />
            </Field>
            <Field label="Numéro de série (VIN)" htmlFor="veh-vin" hint="17 caractères, sur la carte grise (case E)" className="sm:col-span-2">
              <Input id="veh-vin" value={form.vin} maxLength={17} className="uppercase" onChange={(e) => set("vin", e.target.value.toUpperCase())} />
            </Field>
          </div>
        </Section>

        <Section title="Utilisation">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Permis enseigné">
              <Select value={form.permitCategory} onValueChange={(v) => set("permitCategory", v)} options={options(VEHICLE_PERMIT_LABELS)} aria-label="Permis enseigné" />
            </Field>
            <Field label="Statut">
              <Select value={form.status} onValueChange={(v) => set("status", v)} options={options(VEHICLE_STATUS_LABELS)} aria-label="Statut" />
            </Field>
            <Field label="Boîte">
              <Segmented value={form.transmission} onChange={(v) => set("transmission", v)} options={options(VEHICLE_TRANSMISSION_LABELS)} className="w-full" />
            </Field>
            <Field label="Énergie">
              <Select value={form.fuel} onValueChange={(v) => set("fuel", v)} options={options(VEHICLE_FUEL_LABELS)} aria-label="Énergie" />
            </Field>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3">
            <span>
              <span className="block text-sm font-medium text-foreground">Double commande</span>
              <span className="block text-xs text-muted-foreground">Pédales côté moniteur, obligatoires pour les leçons auto.</span>
            </span>
            <Switch checked={form.dualControls} onCheckedChange={(v) => set("dualControls", v)} aria-label="Double commande" />
          </label>
        </Section>

        <Section title="Entretien">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Kilométrage actuel" htmlFor="veh-km">
              <Input id="veh-km" inputMode="numeric" value={form.mileage} placeholder="0" onChange={(e) => set("mileage", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Prochaine révision">
              <DatePicker value={form.nextServiceAt} onChange={(v) => set("nextServiceAt", v)} clearable />
            </Field>
            <Field label="Ou à (km)" htmlFor="veh-service-km" hint="Facultatif">
              <Input
                id="veh-service-km"
                inputMode="numeric"
                value={form.nextServiceMileage}
                placeholder="70 000"
                onChange={(e) => set("nextServiceMileage", e.target.value.replace(/\D/g, ""))}
              />
            </Field>
          </div>
        </Section>

        <Section title="Contrôle technique et assurance">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contrôle technique valable jusqu'au">
              <DatePicker value={form.inspectionExpiresAt} onChange={(v) => set("inspectionExpiresAt", v)} clearable />
            </Field>
            <Field label="Assurance valable jusqu'au">
              <DatePicker value={form.insuranceExpiresAt} onChange={(v) => set("insuranceExpiresAt", v)} clearable />
            </Field>
            <Field label="Assureur" htmlFor="veh-insurer">
              <Input id="veh-insurer" value={form.insurer} maxLength={60} placeholder="MMA Pro" onChange={(e) => set("insurer", e.target.value)} />
            </Field>
            <Field label="Numéro de contrat" htmlFor="veh-policy">
              <Input id="veh-policy" value={form.insurancePolicy} maxLength={40} onChange={(e) => set("insurancePolicy", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Field label="Notes" htmlFor="veh-notes" hint="Réparations en cours, rayures, consignes pour les moniteurs…">
          <Textarea id="veh-notes" rows={3} value={form.notes} maxLength={2000} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>

      <DialogFooter className="border-t border-border/70 pt-4">
        <Button type="button" variant="outline" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" loading={save.isPending}>
          {vehicle ? "Enregistrer" : "Ajouter le véhicule"}
        </Button>
      </DialogFooter>
    </form>
  );
}
