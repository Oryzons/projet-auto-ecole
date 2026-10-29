"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { TASK_STATUS_LABELS } from "@/lib/crm";
import type { TaskDto } from "@/lib/tasks";

export type TaskOptions = {
  tasks: TaskDto[];
  staff: { id: string; name: string; role: string }[];
  applications: { id: string; name: string }[];
  vehicles: { id: string; name: string }[];
};

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "L'action n'a pas pu aboutir.");
  return json;
}

export function useTaskOptions() {
  return useQuery({ queryKey: ["tasks"], queryFn: () => send("/api/tasks", "GET") as Promise<TaskOptions> });
}

/** Création et mise à jour des tâches : le plan et la liste se rafraîchissent ensemble. */
export function useTaskMutations() {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    void queryClient.invalidateQueries({ queryKey: ["plan"] });
  };

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown>; previous?: string; silent?: boolean }) =>
      send(`/api/tasks/${id}`, "PATCH", patch) as Promise<{ task: TaskDto }>,
    onSuccess: ({ task }, { id, patch, previous, silent }) => {
      refresh();
      if (silent || !patch.status) return;
      toast.success(patch.status === "DONE" ? "Tâche terminée" : `Tâche : ${TASK_STATUS_LABELS[patch.status as string]?.toLowerCase()}`, {
        description: task.title,
        action: previous
          ? { label: "Annuler", onClick: () => update.mutate({ id, patch: { status: previous }, silent: true }) }
          : undefined,
      });
    },
    onError: (error) => toast.error("Modification impossible", { description: error.message }),
  });

  const create = useMutation({
    mutationFn: (input: Record<string, unknown>) => send("/api/tasks", "POST", input) as Promise<{ task: TaskDto }>,
    onSuccess: ({ task }) => {
      refresh();
      toast.success("Tâche créée", { description: task.title });
    },
    onError: (error) => toast.error("Création impossible", { description: error.message }),
  });

  return { update, create };
}

/** Échéance lisible : « En retard de 2 j », « Aujourd'hui », « Demain », « Dans 3 j ». */
export function dueLabel(dueAt: string | null, done = false) {
  if (!dueAt) return { text: "Sans échéance", tone: "neutral" as const };
  const due = new Date(dueAt);
  const today = new Date();
  const days = Math.round((new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000);
  if (done) return { text: new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(due), tone: "neutral" as const };
  if (days < 0) return { text: `En retard de ${-days} j`, tone: "danger" as const };
  if (days === 0) return { text: "Aujourd'hui", tone: "warning" as const };
  if (days === 1) return { text: "Demain", tone: "neutral" as const };
  if (days < 7) return { text: `Dans ${days} j`, tone: "neutral" as const };
  return { text: new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(due), tone: "neutral" as const };
}
