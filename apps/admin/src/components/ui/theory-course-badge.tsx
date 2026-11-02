import { CalendarCheck2, CalendarClock, CalendarX2 } from "lucide-react";

import type { TheoryCourseInfo } from "@/lib/application-types";
import { cn } from "@/lib/utils";

const day = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(new Date(iso));

/** Pastille « séance de code » : fait et présent, absent, inscrit, ou rien. */
export function TheoryCourseBadge({ course, className, compact = false }: { course: TheoryCourseInfo | undefined; className?: string; compact?: boolean }) {
  if (!course || course.status === "none") return null;
  if (compact) return <CompactBadge course={course} className={className} />;
  const config = {
    attended: {
      icon: CalendarCheck2,
      label: "Code fait · présent",
      tone: "bg-success-soft text-success ring-success/20",
    },
    absent: {
      icon: CalendarX2,
      label: "Absent à la séance de code",
      tone: "bg-danger-soft text-danger ring-danger/20",
    },
    registered: {
      icon: CalendarClock,
      label: "Inscrit à la séance de code",
      tone: "bg-primary-soft text-primary-strong ring-primary/20",
    },
  }[course.status];
  const Icon = config.icon;
  return (
    <span
      title={course.title ?? undefined}
      className={cn(
        "inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 rounded-2xl px-3 py-1 text-xs font-semibold ring-1",
        config.tone,
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <Icon className="size-3.5 shrink-0" />
        {config.label}
      </span>
      {course.startsAt && <span className="font-medium whitespace-nowrap opacity-80">{day(course.startsAt)}</span>}
    </span>
  );
}

/** Version courte pour la liste des dossiers. */
function CompactBadge({ course, className }: { course: TheoryCourseInfo; className?: string }) {
  const config = {
    attended: { icon: CalendarCheck2, label: "Présent", tone: "bg-success-soft text-success ring-success/20" },
    absent: { icon: CalendarX2, label: "Absent", tone: "bg-danger-soft text-danger ring-danger/20" },
    registered: { icon: CalendarClock, label: "Inscrit", tone: "bg-primary-soft text-primary-strong ring-primary/20" },
    none: null,
  }[course.status];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex flex-col items-start gap-0.5", className)} title={course.title ?? undefined}>
      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1", config.tone)}>
        <Icon className="size-3 shrink-0" />
        {config.label}
      </span>
      {course.startsAt && <span className="pl-1 text-[11px] whitespace-nowrap text-muted-foreground">{day(course.startsAt)}</span>}
    </span>
  );
}
