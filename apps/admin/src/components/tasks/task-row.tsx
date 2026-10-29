"use client";

import { Check, ChevronDown, CircleDashed, Clock3, Link2 } from "lucide-react";
import Link from "next/link";

import { TONE_CLASS } from "@/components/plan/tones";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { dueLabel, useTaskMutations } from "@/hooks/use-tasks";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/crm";
import { cn } from "@/lib/utils";

export type TaskRowData = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: string | null;
  assignee: string | null;
  entityLabel: string | null;
  href: string | null;
  description?: string | null;
  category?: string;
};

const STATUS_ICON = { TODO: CircleDashed, IN_PROGRESS: Clock3, DONE: Check } as const;

/** Ligne de tâche : case à cocher pour terminer, menu de statut, échéance et élément lié. */
export function TaskRow({ task, dense = false, onOpen }: { task: TaskRowData; dense?: boolean; onOpen?: () => void }) {
  const { update } = useTaskMutations();
  const done = task.status === "DONE";
  const due = dueLabel(task.dueAt, done);
  const urgent = task.priority === "URGENT" || task.priority === "HIGH";

  const setStatus = (status: string) => {
    if (status === task.status) return;
    update.mutate({ id: task.id, patch: { status }, previous: task.status });
  };

  return (
    <div className={cn("group flex items-start gap-3 rounded-xl transition-colors", dense ? "px-2 py-2 hover:bg-secondary/60" : "px-3 py-3 hover:bg-secondary/50")}>
      <button
        type="button"
        onClick={() => setStatus(done ? "TODO" : "DONE")}
        disabled={update.isPending}
        aria-label={done ? `Rouvrir « ${task.title} »` : `Terminer « ${task.title} »`}
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none active:scale-90",
          done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500",
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        {onOpen ? (
          <button type="button" onClick={onOpen} className={cn("text-left text-[13.5px] leading-snug font-medium hover:text-primary", done ? "text-muted-foreground line-through" : "text-foreground")}>
            {task.title}
          </button>
        ) : (
          <p className={cn("text-[13.5px] leading-snug font-medium", done ? "text-muted-foreground line-through" : "text-foreground")}>{task.title}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          <span className={cn("font-medium", TONE_CLASS[due.tone].text, due.tone === "neutral" && "text-muted-foreground")}>{due.text}</span>
          {urgent && !done && <span className={cn("rounded-md px-1.5 py-px text-[11px] font-semibold", TONE_CLASS[task.priority === "URGENT" ? "danger" : "warning"].soft)}>{TASK_PRIORITY_LABELS[task.priority]}</span>}
          {task.assignee && <span>· {task.assignee}</span>}
          {task.entityLabel &&
            (task.href ? (
              <Link href={task.href} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                <Link2 className="size-3" />
                {task.entityLabel}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Link2 className="size-3" />
                {task.entityLabel}
              </span>
            ))}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={`Statut : ${TASK_STATUS_LABELS[task.status]}`}
              className={cn(
                "inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-transparent px-2 text-xs font-medium transition-colors hover:border-border hover:bg-card focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
                task.status === "IN_PROGRESS" ? "text-primary" : done ? "text-emerald-700" : "text-muted-foreground",
              )}
            />
          }
        >
          {TASK_STATUS_LABELS[task.status]}
          <ChevronDown className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {(["TODO", "IN_PROGRESS", "DONE"] as const).map((status) => {
            const Icon = STATUS_ICON[status];
            return (
              <DropdownMenuItem key={status} onClick={() => setStatus(status)}>
                <Icon /> {TASK_STATUS_LABELS[status]}
                {status === task.status && <Check className="ml-auto text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
