"use client";

import { AlertTriangle, Ban, Car, CheckCircle2, Clock3, ExternalLink, Fuel, Gauge, GraduationCap, Pencil, RotateCcw, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DatePicker, timeOptions } from "@/components/ui/date-picker";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SidePanel, useLastValue } from "@/components/ui/side-panel";
import { useAppDialog } from "@/hooks/use-app-dialog";
import { LessonError, useLessonMutations } from "@/hooks/use-lessons";
import { PERMIT_TYPES } from "@/lib/constants";
import { findConflicts, isLive, lessonEnd, LESSON_DURATIONS, LESSON_STATUS_LABELS, PLANNER_END_HOUR, PLANNER_START_HOUR, vehicleFits, type LessonDto, type LessonsPayload } from "@/lib/lessons";
import { cn } from "@/lib/utils";
import { FUEL_LEVEL_LABELS, ISSUE_SEVERITY_LABELS } from "@/lib/vehicle-history";

import { dayKey, formatDuration, formatLongDay, formatTimeRange } from "./calendar-shared";

const PERMIT_SHORT: Record<string, string> = { "permis-b": "Permis B", "permis-b-auto": "Permis B auto", aac: "Conduite accompagnée", a2: "Permis A2" };
export const permitLabel = (value: string) => PERMIT_SHORT[value] ?? PERMIT_TYPES.find((p) => p.value === value)?.label ?? "Permis";
const full = (p: { firstName: string; lastName: string } | null | undefined) => (p ? `${p.firstName} ${p.lastName}`.trim() : "—");
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export type LessonDraft = { lesson?: LessonDto | null; day?: string; time?: string; instructorId?: string | null; vehicleId?: string | null };

/* ----------------------------------------------------------------------------
 * Création / modification
 * ------------------------------------------------------------------------- */

export function LessonFormDialog({ draft, onOpenChange, data }: { draft: LessonDraft | null; onOpenChange: (open: boolean) => void; data: LessonsPayload | undefined }) {
  const shown = useLastValue(draft, Boolean(draft));
  return (
    <SidePanel open={Boolean(draft)} onOpenChange={onOpenChange} className="overflow-y-auto">
      {shown && data && <LessonForm key={shown.lesson?.id ?? `${shown.day}-${shown.time}`} draft={shown} data={data} onDone={() => onOpenChange(false)} />}
    </SidePanel>
  );
}

function LessonForm({ draft, data, onDone }: { draft: LessonDraft; data: LessonsPayload; onDone: () => void }) {
  const { create, update } = useLessonMutations();
  const lesson = draft.lesson ?? null;
  const start = lesson ? new Date(lesson.startsAt) : null;
  const [form, setForm] = useState({
    applicationId: lesson?.applicationId ?? "",
    instructorId: lesson?.instructor?.id ?? draft.instructorId ?? "",
    vehicleId: lesson?.vehicle?.id ?? draft.vehicleId ?? "",
    date: start ? dayKey(start) : (draft.day ?? dayKey(new Date())),
    time: start ? hhmm(start) : (draft.time ?? "09:00"),
    durationMinutes: lesson?.durationMinutes ?? 60,
    notes: lesson?.notes ?? "",
  });
  // « Personnalisée » : durée hors des 4 boutons, réglée sur la frise
  const [custom, setCustom] = useState(() => !LESSON_DURATIONS.includes(lesson?.durationMinutes ?? 60));
  const [timelineDragging, setTimelineDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const student = data.students.find((s) => s.applicationId === form.applicationId) ?? null;
  const vehicle = data.vehicles.find((v) => v.id === form.vehicleId) ?? null;
  const startsAt = new Date(`${form.date}T${form.time}`);

  const conflicts = useMemo(() => {
    if (!form.applicationId || Number.isNaN(startsAt.getTime())) return [];
    const list = findConflicts(
      { id: lesson?.id, startsAt, durationMinutes: form.durationMinutes, status: "PLANNED", instructorId: form.instructorId || null, vehicleId: form.vehicleId || null, applicationId: form.applicationId },
      data.lessons.map((l) => ({ ...l, instructorId: l.instructor?.id ?? null, vehicleId: l.vehicle?.id ?? null })),
      {
        instructor: (id) => data.instructors.find((i) => i.id === id)?.firstName,
        vehicle: (id) => data.vehicles.find((v) => v.id === id)?.name,
        student: () => (student ? full(student) : undefined),
      },
    );
    if (vehicle && (vehicle.status === "MAINTENANCE" || vehicle.status === "OUT_OF_SERVICE"))
      list.push({ kind: "vehicle-status", message: `${vehicle.name} est ${vehicle.status === "MAINTENANCE" ? "au garage" : "hors service"}` });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, data, lesson?.id]);
  // leçons du moniteur ce jour-là, affichées en gris sur la frise
  const busy = data.lessons
    .filter((l) => l.id !== lesson?.id && l.status !== "CANCELLED" && form.instructorId && l.instructor?.id === form.instructorId && dayKey(new Date(l.startsAt)) === form.date)
    .map((l) => ({ id: l.id, start: minutesOf(new Date(l.startsAt)), end: minutesOf(new Date(l.startsAt)) + l.durationMinutes, label: full(l.student) }));
  const permit = student?.permitType ?? lesson?.student.permitType ?? null;
  const mismatch = permit && vehicle && !vehicleFits(permit, vehicle.transmission);

  const errors = {
    applicationId: !form.applicationId ? "Choisissez un élève" : undefined,
    instructorId: !form.instructorId ? "Choisissez un moniteur" : undefined,
    date: Number.isNaN(startsAt.getTime()) ? "Date invalide" : undefined,
  };
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : undefined);

  /** L'élève choisi : son moniteur attitré et le premier véhicule adapté et libre sont proposés. */
  function pickStudent(applicationId: string) {
    const s = data.students.find((x) => x.applicationId === applicationId);
    const instructorId = form.instructorId || s?.instructorId || "";
    let vehicleId = form.vehicleId;
    if (s && (!vehicleId || !vehicleFits(s.permitType, data.vehicles.find((v) => v.id === vehicleId)?.transmission ?? ""))) {
      const free = data.vehicles.filter(
        (v) =>
          vehicleFits(s.permitType, v.transmission) &&
          v.status !== "MAINTENANCE" &&
          v.status !== "OUT_OF_SERVICE" &&
          !findConflicts(
            { startsAt, durationMinutes: form.durationMinutes, status: "PLANNED", instructorId: null, vehicleId: v.id, applicationId: "" },
            data.lessons.map((l) => ({ ...l, instructorId: l.instructor?.id ?? null, vehicleId: l.vehicle?.id ?? null })),
          ).length,
      );
      vehicleId = free[0]?.id ?? "";
    }
    setForm({ ...form, applicationId, instructorId, vehicleId });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (Object.values(errors).some(Boolean)) return;
    const payload = {
      instructorId: form.instructorId,
      vehicleId: form.vehicleId || null,
      startsAt: startsAt.toISOString(),
      durationMinutes: form.durationMinutes,
      notes: form.notes.trim() || null,
    };
    try {
      if (lesson) await update.mutateAsync({ id: lesson.id, data: payload });
      else await create.mutateAsync({ ...payload, applicationId: form.applicationId });
      toast.success(lesson ? "Leçon modifiée" : "Leçon planifiée", { description: `${student ? full(student) : full(lesson?.student)} · ${formatLongDay(startsAt)} à ${form.time}` });
      onDone();
    } catch (error) {
      setServerError(error instanceof LessonError ? error.message : "Enregistrement impossible");
    }
  }

  const studentOptions = data.students.map((s) => ({
    value: s.applicationId,
    label: full(s),
    description: `${permitLabel(s.permitType)} · ${s.hoursBooked} h / ${s.hoursPlanned} h`,
  }));
  if (lesson && !studentOptions.some((o) => o.value === lesson.applicationId))
    studentOptions.unshift({ value: lesson.applicationId, label: full(lesson.student), description: permitLabel(lesson.student.permitType) });

  return (
    <form onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>{lesson ? "Modifier la leçon" : "Nouvelle leçon de conduite"}</DialogTitle>
        <DialogDescription>Le moniteur, le véhicule et l&apos;élève doivent être libres sur le créneau.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 px-6 pt-5 pb-2 sm:grid-cols-2">
        <Field label="Élève" htmlFor="l-student" error={show("applicationId")} className="sm:col-span-2">
          <Select
            id="l-student"
            icon={GraduationCap}
            value={form.applicationId || null}
            placeholder="Choisir un élève…"
            disabled={Boolean(lesson)}
            onValueChange={pickStudent}
            options={studentOptions}
            invalid={Boolean(show("applicationId"))}
            popupClassName="max-h-72"
          />
        </Field>
        <Field label="Moniteur" htmlFor="l-instructor" error={show("instructorId")}>
          <Select
            id="l-instructor"
            icon={UserRound}
            value={form.instructorId || null}
            placeholder="Choisir…"
            onValueChange={(instructorId) => setForm({ ...form, instructorId })}
            options={data.instructors.map((i) => ({ value: i.id, label: full(i), description: student?.instructorId === i.id ? "Moniteur attitré" : undefined }))}
            invalid={Boolean(show("instructorId"))}
          />
        </Field>
        <Field label="Véhicule" htmlFor="l-vehicle">
          <Select
            id="l-vehicle"
            icon={Car}
            value={form.vehicleId || ""}
            onValueChange={(vehicleId) => setForm({ ...form, vehicleId })}
            options={[
              { value: "", label: "Sans véhicule" },
              ...data.vehicles.map((v) => ({
                value: v.id,
                label: v.name,
                description: [v.plate, v.status === "MAINTENANCE" ? "au garage" : v.status === "OUT_OF_SERVICE" ? "hors service" : null, permit && !vehicleFits(permit, v.transmission) ? "non adapté" : null]
                  .filter(Boolean)
                  .join(" · "),
              })),
            ]}
          />
        </Field>
        <Field label="Date" htmlFor="l-date" error={show("date")}>
          <DatePicker id="l-date" value={form.date} onChange={(date) => setForm({ ...form, date })} invalid={Boolean(show("date"))} />
        </Field>
        <Field label="Heure de début" htmlFor="l-time">
          <Select id="l-time" icon={Clock3} value={form.time} onValueChange={(time) => setForm({ ...form, time })} options={timeOptions(form.time)} />
        </Field>
        <Field label="Durée" htmlFor="l-duration" className="sm:col-span-2">
          <div id="l-duration" className="grid grid-cols-3 gap-2 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
            {[...LESSON_DURATIONS, null].map((m) => {
              const selected = m === null ? custom : !custom && form.durationMinutes === m;
              return (
                <button
                  key={m ?? "custom"}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => (m === null ? setCustom(true) : (setCustom(false), setForm({ ...form, durationMinutes: m })))}
                  className={cn(
                    "h-10 rounded-xl border px-3 text-sm font-medium whitespace-nowrap transition-colors",
                    selected ? "border-primary bg-primary-soft text-primary-strong" : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {m === null ? "Personnalisée" : formatDuration(m)}
                </button>
              );
            })}
          </div>
          {custom && (
            <DayTimeline
              start={Number.isNaN(startsAt.getTime()) ? DAY_START : minutesOf(startsAt)}
              duration={form.durationMinutes}
              busy={busy}
              onChange={(start, durationMinutes) => setForm((f) => ({ ...f, time: toHHMM(start), durationMinutes }))}
              onDragChange={setTimelineDragging}
            />
          )}
        </Field>
        <Field label="Objectif ou consigne" htmlFor="l-notes" hint="Facultatif : visible par le moniteur." className="sm:col-span-2">
          <Textarea id="l-notes" rows={2} maxLength={1000} value={form.notes} placeholder="Ex. : travail des ronds-points, départ de l'agence" onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>

        {!timelineDragging && (conflicts.length > 0 || mismatch || serverError) && (
          <div className="space-y-1.5 rounded-xl border border-warning/30 bg-warning-soft/60 px-4 py-3 text-[13px] sm:col-span-2" role="alert">
            {[...new Set([serverError, ...conflicts.map((c) => c.message)].filter(Boolean))].map((message) => (
              <p key={message} className="flex items-start gap-2 font-medium text-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /> {message}
              </p>
            ))}
            {mismatch && (
              <p className="flex items-start gap-2 text-muted-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                {vehicle!.name} ne correspond pas au {permitLabel(permit!).toLowerCase()} préparé par l&apos;élève.
              </p>
            )}
          </div>
        )}
      </div>
      <DialogFooter className="mt-3 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" loading={create.isPending || update.isPending} disabled={conflicts.length > 0}>
          {lesson ? "Enregistrer" : "Planifier la leçon"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/* ----------------------------------------------------------------------------
 * Détail : infos, compte rendu et actions
 * ------------------------------------------------------------------------- */

export function LessonDetailDialog({
  lesson,
  canEdit,
  onOpenChange,
  onEdit,
}: {
  lesson: LessonDto | null;
  canEdit: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (lesson: LessonDto) => void;
}) {
  // une autre leçon cliquée dans le planning remplace le contenu, sans refermer le panneau
  const shown = useLastValue(lesson, Boolean(lesson));
  return (
    <SidePanel open={Boolean(lesson)} onOpenChange={onOpenChange} className="overflow-y-auto">
      {shown && <LessonDetail key={shown.id} lesson={shown} canEdit={canEdit} onClose={() => onOpenChange(false)} onEdit={onEdit} />}
    </SidePanel>
  );
}

const STATUS_STYLE: Record<string, string> = {
  PLANNED: "bg-primary-soft text-primary-strong",
  LIVE: "bg-success-soft text-success",
  DONE: "bg-secondary text-muted-foreground",
  CANCELLED: "bg-danger-soft text-danger",
};

function LessonDetail({ lesson, canEdit, onClose, onEdit }: { lesson: LessonDto; canEdit: boolean; onClose: () => void; onEdit: (lesson: LessonDto) => void }) {
  const { update, remove } = useLessonMutations();
  const { showConfirm } = useAppDialog();
  const [now] = useState(() => Date.now());
  const live = isLive(lesson, now);
  const started = new Date(lesson.startsAt).getTime() <= now;
  const statusKey = live ? "LIVE" : lesson.status;
  const report = lesson.report;

  async function setStatus(status: LessonDto["status"]) {
    if (status === "CANCELLED") {
      const ok = await showConfirm({
        title: `Annuler la leçon de ${lesson.student.firstName} ?`,
        description: "Le créneau du moniteur et du véhicule sera libéré.",
        variant: "destructive",
        confirmLabel: "Annuler la leçon",
        cancelLabel: "Garder",
      });
      if (!ok) return;
    }
    update.mutate(
      { id: lesson.id, data: { status } },
      { onSuccess: () => toast.success(status === "DONE" ? "Leçon marquée comme effectuée" : status === "CANCELLED" ? "Leçon annulée" : "Leçon rétablie") },
    );
    onClose();
  }

  async function destroy() {
    const ok = await showConfirm({ title: "Supprimer cette leçon ?", description: "Elle disparaîtra du planning et de l'historique.", variant: "destructive", confirmLabel: "Supprimer" });
    if (!ok) return;
    remove.mutate(lesson.id);
    onClose();
  }

  return (
    <div>
      <DialogHeader>
        <div className="flex items-center gap-3 pr-14">
          <Avatar firstName={lesson.student.firstName} lastName={lesson.student.lastName} />
          <div className="min-w-0">
            <DialogTitle className="truncate">{full(lesson.student)}</DialogTitle>
            <DialogDescription>
              Leçon de conduite · {permitLabel(lesson.student.permitType)}
            </DialogDescription>
          </div>
          <span className={cn("ml-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLE[statusKey])}>
            {live ? "En cours" : LESSON_STATUS_LABELS[lesson.status]}
          </span>
        </div>
      </DialogHeader>

      <div className="space-y-4 px-6 pt-5 pb-2">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Info icon={Clock3} label={formatLongDay(new Date(lesson.startsAt))} value={`${formatTimeRange(lesson)} · ${formatDuration(lesson.durationMinutes)}`} wide />
          <Info icon={UserRound} label="Moniteur" value={full(lesson.instructor)} />
          <Info icon={Car} label="Véhicule" value={lesson.vehicle ? `${lesson.vehicle.name} · ${lesson.vehicle.plate}` : "Sans véhicule"} />
        </dl>

        {live && (
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-success" style={{ width: `${Math.min(100, ((now - new Date(lesson.startsAt).getTime()) / (lessonEnd(lesson) - new Date(lesson.startsAt).getTime())) * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Fin dans {Math.max(1, Math.round((lessonEnd(lesson) - now) / 60_000))} min</p>
          </div>
        )}

        {lesson.notes && <p className="rounded-xl bg-subtle px-4 py-3 text-[13px] text-foreground">{lesson.notes}</p>}

        {report ? (
          <section className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-[13px] font-semibold text-foreground">Compte rendu du moniteur</p>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Gauge className="size-4" /> <span className="font-semibold text-foreground tabular">{(report.kmEnd - report.kmStart).toLocaleString("fr-FR")} km</span> parcourus
              </span>
              {report.fuelLevel && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Fuel className="size-4" /> Carburant : <span className="font-medium text-foreground">{FUEL_LEVEL_LABELS[report.fuelLevel]}</span>
                </span>
              )}
            </div>
            {report.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {report.skills.map((s) => (
                  <span key={s} className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-strong">
                    {s}
                  </span>
                ))}
              </div>
            )}
            {report.issues.map((issue) => (
              <p key={issue.label} className="flex items-start gap-2 rounded-lg bg-warning-soft/60 px-3 py-2 text-[13px]">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                <span>
                  <span className="font-medium text-foreground">{issue.label}</span>
                  <span className="text-muted-foreground"> · {ISSUE_SEVERITY_LABELS[issue.severity]}</span>
                  {issue.detail && <span className="block text-muted-foreground">{issue.detail}</span>}
                </span>
              </p>
            ))}
            {report.comment && <p className="text-[13px] text-muted-foreground italic">« {report.comment} »</p>}
          </section>
        ) : lesson.status === "DONE" ? (
          <p className="text-[13px] text-muted-foreground">Le moniteur n&apos;a pas encore rempli de compte rendu.</p>
        ) : null}

        {canEdit && (
          <div className="flex flex-wrap gap-2 text-[13px]">
            <Link href={`/admin/applications/${lesson.applicationId}`} className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-strong">
              Dossier de l&apos;élève <ExternalLink className="size-3.5" />
            </Link>
            {lesson.vehicle && (
              <Link href={`/admin/vehicles?id=${lesson.vehicle.id}`} className="ml-3 inline-flex items-center gap-1 font-medium text-primary hover:text-primary-strong">
                Fiche du véhicule <ExternalLink className="size-3.5" />
              </Link>
            )}
          </div>
        )}
      </div>

      {canEdit && (
        <DialogFooter className="mt-3 flex-wrap border-t border-border pt-4">
          {lesson.status === "CANCELLED" ? (
            <>
              <Button variant="ghost" onClick={destroy}>
                <Trash2 /> Supprimer
              </Button>
              <Button variant="outline" onClick={() => setStatus("PLANNED")}>
                <RotateCcw /> Rétablir
              </Button>
            </>
          ) : lesson.status === "PLANNED" ? (
            <>
              <Button variant="destructive" onClick={() => setStatus("CANCELLED")}>
                <Ban /> Annuler la leçon
              </Button>
              <Button variant="outline" onClick={() => onEdit(lesson)}>
                <Pencil /> Modifier
              </Button>
              {started && (
                <Button onClick={() => setStatus("DONE")}>
                  <CheckCircle2 /> Marquer effectuée
                </Button>
              )}
            </>
          ) : (
            <Button variant="outline" onClick={() => setStatus("PLANNED")}>
              <RotateCcw /> Repasser en prévue
            </Button>
          )}
        </DialogFooter>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value, wide }: { icon: typeof Clock3; label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl bg-subtle px-3 py-2.5", wide && "col-span-2")}>
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate font-medium text-foreground">{value}</dd>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Frise de la journée : régler début et fin à 5 minutes près
 * ------------------------------------------------------------------------- */

const DAY_START = PLANNER_START_HOUR * 60;
const DAY_END = PLANNER_END_HOUR * 60;
const DAY_SPAN = DAY_END - DAY_START;
const STEP = 5;
const MIN_DURATION = 15;
const MAX_DURATION = 240;
const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();
const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const clampTo = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const snap = (m: number) => Math.round(m / STEP) * STEP;
type Grip = "start" | "end" | "move";

/** Ramène un créneau dans les bornes : journée 7h–20h, durée de 15 min à 4 h, début toujours avant la fin. */
function fit(grip: Grip, start: number, end: number, duration: number) {
  if (grip === "move") {
    const s = clampTo(start, DAY_START, DAY_END - duration);
    return { start: s, end: s + duration };
  }
  if (grip === "start") return { start: clampTo(start, Math.max(DAY_START, end - MAX_DURATION), end - MIN_DURATION), end };
  return { start, end: clampTo(end, start + MIN_DURATION, Math.min(DAY_END, start + MAX_DURATION)) };
}

function DayTimeline({
  start,
  duration,
  busy,
  onChange,
  onDragChange,
}: {
  start: number;
  duration: number;
  busy: { id: string; start: number; end: number; label: string }[];
  onChange: (start: number, duration: number) => void;
  /** pendant le glisser, le formulaire garde sa hauteur (pas d'alerte qui fait sauter la fenêtre) */
  onDragChange?: (dragging: boolean) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [active, setActive] = useState<Grip | null>(null);
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setTrackWidth(entry!.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const end = start + duration;
  const pct = (m: number) => `${((m - DAY_START) / DAY_SPAN) * 100}%`;
  const px = (minutes: number) => (minutes / DAY_SPAN) * trackWidth;
  const clash = busy.some((b) => b.start < end && b.end > start);
  const emit = (next: { start: number; end: number }) => onChange(next.start, next.end - next.start);
  const minutesAt = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    return DAY_START + ((clientX - rect.left) / rect.width) * DAY_SPAN;
  };

  /** Glisser : l'élément saisi capture le pointeur, la position est recalculée depuis la piste à chaque mouvement. */
  function begin(grip: Grip, event: ReactPointerEvent<HTMLElement>, from = { start, end }) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation(); // la fenêtre de dialogue est déplaçable : elle ne doit pas bouger
    const el = event.currentTarget;
    el.setPointerCapture(event.pointerId);
    el.focus({ preventScroll: true });
    const x0 = minutesAt(event.clientX);
    const { start: s0, end: e0 } = from;
    const d0 = e0 - s0;
    setActive(grip);
    onDragChange?.(true);
    const move = (e: PointerEvent) => {
      const delta = minutesAt(e.clientX) - x0;
      if (grip === "move") emit(fit("move", snap(s0 + delta), 0, d0));
      else if (grip === "start") emit(fit("start", snap(s0 + delta), e0, d0));
      else emit(fit("end", s0, snap(e0 + delta), d0));
    };
    const stop = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", stop);
      el.removeEventListener("pointercancel", stop);
      setActive(null);
      onDragChange?.(false);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", stop);
  }

  /** Clic sur la piste hors du créneau : le début s'y place, la durée est gardée, et on peut continuer à glisser. */
  function jump(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("[data-range]")) return;
    const next = fit("move", snap(minutesAt(event.clientX)), 0, duration);
    emit(next);
    begin("move", event, next);
  }

  function keys(grip: Grip) {
    return (event: ReactKeyboardEvent) => {
      const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? STEP : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -STEP : 0;
      if (!step) return;
      event.preventDefault();
      event.stopPropagation();
      if (grip === "move") emit(fit("move", start + step, 0, duration));
      else if (grip === "start") emit(fit("start", start + step, end, duration));
      else emit(fit("end", start, end + step, duration));
    };
  }

  const label = `${toHHMM(start)} – ${toHHMM(end)} · ${formatDuration(duration)}`;
  const rangePx = px(duration);
  const handle = (grip: Grip) =>
    cn(
      "absolute top-1/2 z-10 h-9 w-3 -translate-y-1/2 cursor-ew-resize touch-none rounded-full bg-white shadow-[0_2px_6px_rgb(15_40_84/0.25)] ring-2 outline-none transition-transform hover:scale-110 focus-visible:ring-4",
      clash ? "ring-danger focus-visible:ring-danger/40" : "ring-primary focus-visible:ring-primary/40",
      active === grip && "scale-125 hover:scale-125",
      grip === "start" ? "right-full -mr-1" : "left-full -ml-1",
    );
  const bubble = (position: string, text: string) => (
    <span className={cn("pointer-events-none absolute bottom-full mb-2.5 -translate-x-1/2 rounded-md px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white tabular shadow-md", clash ? "bg-danger" : "bg-foreground", position)}>
      {text}
    </span>
  );

  return (
    <div className="mt-3 rounded-xl border border-border bg-card px-4 pt-3 pb-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <span className={cn("font-semibold tabular", clash ? "text-danger" : "text-foreground")}>{label}</span>
        <span className="text-xs text-muted-foreground">{clash ? "Chevauche une leçon du moniteur" : "Glissez le créneau ou ses bords · flèches : 5 min"}</span>
      </div>
      <div ref={trackRef} onPointerDown={jump} className="relative mt-8 h-14 cursor-pointer touch-none rounded-xl bg-secondary select-none">
        {Array.from({ length: (PLANNER_END_HOUR - PLANNER_START_HOUR) * 2 - 1 }, (_, i) => (
          <span
            key={i}
            className={cn("pointer-events-none absolute w-px", i % 2 ? "inset-y-0 bg-foreground/10" : "inset-y-4 bg-foreground/[0.06]")}
            style={{ left: pct(DAY_START + (i + 1) * 30) }}
          />
        ))}
        {busy.map((b) => (
          <span
            key={b.id}
            title={`${b.label} · ${toHHMM(b.start)} – ${toHHMM(b.end)}`}
            className="absolute inset-y-2 flex items-center overflow-hidden rounded-lg px-1.5 text-[10px] font-medium text-slate-600"
            style={{
              left: pct(b.start),
              width: `calc(${pct(b.end)} - ${pct(b.start)})`,
              background: "repeating-linear-gradient(135deg, rgb(148 163 184 / 0.35) 0 4px, rgb(148 163 184 / 0.16) 4px 8px)",
            }}
          >
            {px(b.end - b.start) > 44 && <span className="truncate">{b.label}</span>}
          </span>
        ))}
        <div
          data-range
          role="slider"
          tabIndex={0}
          aria-label="Déplacer le créneau"
          aria-valuemin={DAY_START}
          aria-valuemax={DAY_END - duration}
          aria-valuenow={start}
          aria-valuetext={`${toHHMM(start)} – ${toHHMM(end)}`}
          onPointerDown={(e) => begin("move", e)}
          onKeyDown={keys("move")}
          className={cn(
            "absolute inset-y-1.5 flex touch-none items-center justify-center rounded-lg px-1 text-[11px] font-semibold whitespace-nowrap text-white tabular outline-none focus-visible:ring-4",
            active === "move" ? "cursor-grabbing" : "cursor-grab",
            clash ? "bg-danger shadow-[0_4px_14px_-3px_rgb(229_72_77/0.55)] focus-visible:ring-danger/30" : "bg-primary shadow-[0_4px_14px_-3px_rgb(45_80_245/0.55)] focus-visible:ring-primary/30",
          )}
          style={{ left: pct(start), width: `calc(${pct(end)} - ${pct(start)})` }}
        >
          <span className="pointer-events-none overflow-hidden">{rangePx >= 150 ? label : rangePx >= 46 ? formatDuration(duration) : ""}</span>
          <span
            role="slider"
            tabIndex={0}
            aria-label="Heure de début"
            aria-valuemin={DAY_START}
            aria-valuemax={end - MIN_DURATION}
            aria-valuenow={start}
            aria-valuetext={toHHMM(start)}
            onPointerDown={(e) => begin("start", e)}
            onKeyDown={keys("start")}
            className={handle("start")}
          />
          <span
            role="slider"
            tabIndex={0}
            aria-label="Heure de fin"
            aria-valuemin={start + MIN_DURATION}
            aria-valuemax={DAY_END}
            aria-valuenow={end}
            aria-valuetext={toHHMM(end)}
            onPointerDown={(e) => begin("end", e)}
            onKeyDown={keys("end")}
            className={handle("end")}
          />
          {active === "start" && bubble("left-0", toHHMM(start))}
          {active === "end" && bubble("left-full", toHHMM(end))}
          {active === "move" && bubble("left-1/2", `${toHHMM(start)} – ${toHHMM(end)}`)}
        </div>
      </div>
      <div className="relative mt-1.5 h-4 text-[10px] text-muted-foreground tabular">
        {Array.from({ length: PLANNER_END_HOUR - PLANNER_START_HOUR + 1 }, (_, i) => (
          <span
            key={i}
            className={cn("absolute", i === 0 ? "" : i === PLANNER_END_HOUR - PLANNER_START_HOUR ? "-translate-x-full" : "-translate-x-1/2")}
            style={{ left: pct(DAY_START + i * 60) }}
          >
            {PLANNER_START_HOUR + i}h
          </span>
        ))}
      </div>
    </div>
  );
}
