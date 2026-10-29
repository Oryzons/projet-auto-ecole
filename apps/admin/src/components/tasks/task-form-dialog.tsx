"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { useTaskMutations, useTaskOptions } from "@/hooks/use-tasks";
import { TASK_CATEGORY_LABELS, TASK_PRIORITY_LABELS } from "@/lib/crm";

export type TaskDefaults = { category?: string; applicationId?: string; vehicleId?: string };

const toIsoEvening = (day: string) => (day ? new Date(`${day}T18:00:00`).toISOString() : null);
const dayString = (offset: number) => {
  const d = new Date(Date.now() + offset * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Création d'une tâche : responsable, échéance, priorité et élève ou véhicule lié. */
export function TaskFormDialog({ open, onOpenChange, defaults }: { open: boolean; onOpenChange: (open: boolean) => void; defaults?: TaskDefaults }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">{open && <TaskForm defaults={defaults} onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function TaskForm({ defaults, onDone }: { defaults?: TaskDefaults; onDone: () => void }) {
  const { data } = useTaskOptions();
  const { create } = useTaskMutations();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(defaults?.category ?? "ADMIN");
  const [priority, setPriority] = useState("NORMAL");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [due, setDue] = useState(dayString(1));
  const [link, setLink] = useState<string | null>(
    defaults?.applicationId ? `app:${defaults.applicationId}` : defaults?.vehicleId ? `veh:${defaults.vehicleId}` : null,
  );
  const [error, setError] = useState<string | null>(null);

  const linkOptions = [
    { value: "none", label: "Aucun" },
    ...(data?.applications ?? []).map((a) => ({ value: `app:${a.id}`, label: a.name, description: "Élève" })),
    ...(data?.vehicles ?? []).map((v) => ({ value: `veh:${v.id}`, label: v.name, description: "Véhicule" })),
  ];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (title.trim().length < 2) {
      setError("Donnez un titre à la tâche");
      return;
    }
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        assigneeId,
        dueAt: toIsoEvening(due),
        applicationId: link?.startsWith("app:") ? link.slice(4) : null,
        vehicleId: link?.startsWith("veh:") ? link.slice(4) : null,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>Nouvelle tâche</DialogTitle>
        <DialogDescription>Elle apparaîtra dans la zone correspondante du plan et dans la liste des tâches.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 px-6 pt-5 pb-2">
        <Field label="Titre" htmlFor="task-title" error={error}>
          <Input
            id="task-title"
            autoFocus
            value={title}
            maxLength={140}
            placeholder="Relancer pour la pièce d'identité"
            aria-invalid={Boolean(error)}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
          />
        </Field>
        <Field label="Description" htmlFor="task-desc" hint="Facultatif">
          <Textarea id="task-desc" rows={2} value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Zone">
            <Select value={category} onValueChange={setCategory} options={Object.entries(TASK_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))} aria-label="Zone" />
          </Field>
          <Field label="Responsable">
            <Select
              value={assigneeId ?? "none"}
              onValueChange={(v) => setAssigneeId(v === "none" ? null : v)}
              options={[{ value: "none", label: "Personne" }, ...(data?.staff ?? []).map((s) => ({ value: s.id, label: s.name }))]}
              aria-label="Responsable"
            />
          </Field>
          <Field label="Échéance">
            <DatePicker value={due} onChange={setDue} clearable />
          </Field>
          <Field label="Lié à">
            <Select value={link ?? "none"} onValueChange={(v) => setLink(v === "none" ? null : v)} options={linkOptions} aria-label="Élève ou véhicule lié" />
          </Field>
        </div>
        <Field label="Priorité">
          <Segmented
            value={priority}
            onChange={setPriority}
            options={Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
            className="w-full"
          />
        </Field>
      </div>
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" loading={create.isPending}>
          Créer la tâche
        </Button>
      </DialogFooter>
    </form>
  );
}
