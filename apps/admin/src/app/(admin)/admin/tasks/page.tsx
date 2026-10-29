"use client";

import { CheckCircle2, ListChecks, ListPlus, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";

import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskRow } from "@/components/tasks/task-row";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { dueLabel, useTaskOptions } from "@/hooks/use-tasks";
import { TASK_CATEGORY_LABELS, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/crm";
import type { TaskDto } from "@/lib/tasks";

type View = "todo" | "progress" | "late" | "done";
const VIEWS: View[] = ["todo", "progress", "late", "done"];
const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

const isLate = (task: TaskDto, now: number) => task.status !== "DONE" && Boolean(task.dueAt) && new Date(task.dueAt!).getTime() < now;

function matches(task: TaskDto, view: View, now: number) {
  if (view === "done") return task.status === "DONE";
  if (view === "late") return isLate(task, now);
  if (view === "progress") return task.status === "IN_PROGRESS";
  return task.status === "TODO";
}

/** Toutes les tâches de l'équipe, par statut, avec le détail et l'historique de chacune. */
export default function TasksPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { data, isLoading } = useTaskOptions();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const viewParam = params.get("view");
  const view: View = VIEWS.includes(viewParam as View) ? (viewParam as View) : "todo";
  const category = params.get("category") ?? "all";
  const assignee = params.get("assignee") ?? "all";

  const setParam = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    router.replace(`/admin/tasks${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const now = Date.now();
  const tasks = data?.tasks ?? [];
  const filtered = useMemo(
    () => tasks.filter((t) => (category === "all" || t.category === category) && (assignee === "all" || (assignee === "none" ? !t.assignee : t.assignee?.id === assignee))),
    [tasks, category, assignee],
  );
  const counts = Object.fromEntries(VIEWS.map((v) => [v, filtered.filter((t) => matches(t, v, now)).length])) as Record<View, number>;
  const visible = filtered
    .filter((t) => matches(t, view, now))
    .sort((a, b) =>
      view === "done"
        ? (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
        : (a.dueAt ?? "9").localeCompare(b.dueAt ?? "9") || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
    );
  const open = tasks.find((t) => t.id === openId) ?? null;
  const staffName = (id: string | null) => (id ? (data?.staff.find((s) => s.id === id)?.name ?? "Un membre de l'équipe") : "Système");

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Organisation"
        title="Tâches"
        description="Ce qui reste à faire, par personne et par zone de l'auto-école."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/dashboard" className={buttonVariants({ variant: "outline" })}>
              <MapIcon /> Voir sur le plan
            </Link>
            <Button onClick={() => setCreating(true)}>
              <ListPlus /> Nouvelle tâche
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          value={view}
          onChange={(v) => setParam("view", v, "todo")}
          options={[
            { value: "todo", label: "À faire", count: counts.todo },
            { value: "progress", label: "En cours", count: counts.progress },
            { value: "late", label: "En retard", count: counts.late },
            { value: "done", label: "Terminées", count: counts.done },
          ]}
          className="max-sm:w-full"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select
            value={category}
            onValueChange={(v) => setParam("category", v, "all")}
            options={[{ value: "all", label: "Toutes les zones" }, ...Object.entries(TASK_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))]}
            aria-label="Filtrer par zone"
            className="sm:w-48"
          />
          <Select
            value={assignee}
            onValueChange={(v) => setParam("assignee", v, "all")}
            options={[
              { value: "all", label: "Toute l'équipe" },
              { value: "none", label: "Sans responsable" },
              ...(data?.staff ?? []).map((s) => ({ value: s.id, label: s.name })),
            ]}
            aria-label="Filtrer par responsable"
            className="sm:w-48"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-1.5">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={view === "late" ? CheckCircle2 : ListChecks}
            title={view === "late" ? "Aucune tâche en retard" : "Aucune tâche ici"}
            description={category !== "all" || assignee !== "all" ? "Essayez d'élargir les filtres." : "Les nouvelles tâches apparaîtront ici et sur le plan."}
            compact
          />
        ) : (
          <div className="divide-y divide-border/60">
            <AnimatePresence initial={false}>
              {visible.map((task) => (
                <TaskRow
                  key={task.id}
                  onOpen={() => setOpenId(task.id)}
                  task={{ ...task, assignee: task.assignee?.name ?? null }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <TaskFormDialog
        open={creating}
        onOpenChange={setCreating}
        defaults={category !== "all" ? { category } : undefined}
      />

      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {open && (
            <>
              <SheetHeader className="pr-12">
                <SheetTitle>{open.title}</SheetTitle>
                <SheetDescription>{TASK_CATEGORY_LABELS[open.category]}</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-6">
                {open.description && <p className="text-[13.5px] leading-relaxed text-foreground">{open.description}</p>}
                <dl className="divide-y divide-border rounded-xl border border-border text-[13px]">
                  {[
                    ["Statut", TASK_STATUS_LABELS[open.status]],
                    ["Priorité", TASK_PRIORITY_LABELS[open.priority]],
                    ["Échéance", dueLabel(open.dueAt, open.status === "DONE").text],
                    ["Responsable", open.assignee?.name ?? "Personne"],
                    ["Lié à", open.entityLabel ?? "Rien"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3 px-3.5 py-2.5">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
                {open.href && (
                  <Link href={open.href} className={buttonVariants({ variant: "secondary", className: "w-full" })}>
                    Ouvrir le dossier de {open.entityLabel}
                  </Link>
                )}
                <section>
                  <h3 className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">Historique</h3>
                  <ol className="mt-2 space-y-3 border-l border-border pl-4">
                    {[...open.history].reverse().map((entry, i) => (
                      <li key={i} className="relative text-[13px]">
                        <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-primary/60 ring-4 ring-popover" />
                        <p className="text-foreground">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {staffName(entry.userId)} ·{" "}
                          {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(entry.at))}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
