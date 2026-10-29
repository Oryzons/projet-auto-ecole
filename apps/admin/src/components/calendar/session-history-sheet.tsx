"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, ClipboardCheck, ClipboardX, History, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { DateTile, formatTimeRange, isPast } from "./calendar-shared";
import type { StaffSession } from "./session-dialogs";

const time = (iso: string) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

function AttendanceChip({ session }: { session: StaffSession }) {
  const present = session.registrations.filter((r) => r.attendedAt).length;
  const total = session.registrations.length;
  if (session.attendanceClosedAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[12px] font-medium whitespace-nowrap text-success">
        <ClipboardCheck className="size-3.5" /> {present}/{total} présent{present > 1 ? "s" : ""}
      </span>
    );
  }
  if (session.attendanceOpenedAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[12px] font-medium whitespace-nowrap text-primary">
        Appel en cours · {present}/{total}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-[12px] font-medium whitespace-nowrap text-muted-foreground">
      <ClipboardX className="size-3.5" /> Appel non fait
    </span>
  );
}

function HistoryItem({ session, open, onToggle }: { session: StaffSession; open: boolean; onToggle: () => void }) {
  const called = Boolean(session.attendanceOpenedAt);
  const registrants = [...session.registrations].sort((a, b) =>
    `${a.candidate.lastName} ${a.candidate.firstName}`.localeCompare(`${b.candidate.lastName} ${b.candidate.firstName}`, "fr"),
  );

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-subtle/60"
      >
        <DateTile date={new Date(session.startsAt)} muted />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{session.title}</span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">
            {new Date(session.startsAt).getFullYear()} · {formatTimeRange(session)}
          </span>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <AttendanceChip session={session} />
          </span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <div className="space-y-3 border-t border-border px-3 pt-3 pb-3">
              {registrants.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">Aucun élève inscrit à cette séance.</p>
              ) : (
                <ul className="space-y-1.5">
                  {registrants.map((r) => {
                    const present = Boolean(r.attendedAt);
                    return (
                      <li key={r.id} className="flex items-center gap-2.5 text-[13px]">
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-full",
                            present ? "bg-success text-white" : called ? "bg-danger-soft text-danger" : "bg-subtle text-muted-foreground",
                          )}
                        >
                          {present ? <Check className="size-3" /> : <X className="size-3" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-foreground">
                          {r.candidate.lastName} {r.candidate.firstName}
                        </span>
                        <span className={cn("shrink-0", present ? "text-success" : "text-muted-foreground")}>
                          {present ? `Présent · ${time(r.attendedAt!)}` : called ? "Absent" : "Non pointé"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link
                href={`/admin/calendar/${session.id}/appel`}
                className={buttonVariants({ size: "sm", variant: "outline", className: "w-full" })}
              >
                {called ? "Ouvrir le relevé d'appel" : "Faire l'appel maintenant"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/** Historique des séances passées avec leur appel (présents / absents). */
export function SessionHistorySheet({ sessions, open, onOpenChange }: { sessions: StaffSession[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const past = useMemo(
    () =>
      sessions
        .filter((s) => isPast(s))
        .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()),
    // Recalculé à l'ouverture pour inclure les séances commencées depuis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, open],
  );
  const needle = query.trim().toLocaleLowerCase("fr");
  const listed = needle
    ? past.filter((s) =>
        [s.title, s.location, ...s.registrations.map((r) => `${r.candidate.firstName} ${r.candidate.lastName}`)]
          .join(" ")
          .toLocaleLowerCase("fr")
          .includes(needle),
      )
    : past;

  const called = past.filter((s) => s.attendanceClosedAt).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 pt-5 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <History className="size-5 text-primary" /> Historique des séances
          </SheetTitle>
          <SheetDescription>
            {past.length} séance{past.length > 1 ? "s" : ""} passée{past.length > 1 ? "s" : ""} · {called} appel{called > 1 ? "s" : ""} fait{called > 1 ? "s" : ""}
          </SheetDescription>
          <label className="relative mt-3 block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une séance ou un élève"
              aria-label="Rechercher dans l'historique"
              className="h-10 w-full rounded-xl border border-input bg-subtle/60 pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {listed.length === 0 ? (
            <EmptyState
              icon={History}
              title={past.length ? "Aucun résultat" : "Pas encore de séance passée"}
              description={past.length ? "Essayez un autre nom ou titre." : "Les séances apparaîtront ici dès qu'elles auront commencé."}
            />
          ) : (
            <ul className="space-y-2.5">
              {listed.map((s) => (
                <HistoryItem key={s.id} session={s} open={expanded === s.id} onToggle={() => setExpanded((id) => (id === s.id ? null : s.id))} />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
