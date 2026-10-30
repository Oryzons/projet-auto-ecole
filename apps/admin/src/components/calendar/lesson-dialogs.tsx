"use client";

import { AlertTriangle, Ban, Car, CheckCircle2, Clock3, ExternalLink, Fuel, Gauge, GraduationCap, Pencil, RotateCcw, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DatePicker, timeOptions } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppDialog } from "@/hooks/use-app-dialog";
import { LessonError, useLessonMutations } from "@/hooks/use-lessons";
import { PERMIT_TYPES } from "@/lib/constants";
import { findConflicts, isLive, lessonEnd, LESSON_DURATIONS, LESSON_STATUS_LABELS, vehicleFits, type LessonDto, type LessonsPayload } from "@/lib/lessons";
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
  return (
    <Dialog open={Boolean(draft)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-xl overflow-y-auto">
        {draft && data && <LessonForm key={draft.lesson?.id ?? `${draft.day}-${draft.time}`} draft={draft} data={data} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
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
          <div id="l-duration" className="grid grid-cols-4 gap-2">
            {[...new Set([...LESSON_DURATIONS, form.durationMinutes])].sort((a, b) => a - b).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForm({ ...form, durationMinutes: m })}
                className={cn(
                  "h-10 rounded-xl border text-sm font-medium transition-colors",
                  form.durationMinutes === m ? "border-primary bg-primary-soft text-primary-strong" : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {formatDuration(m)}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Objectif ou consigne" htmlFor="l-notes" hint="Facultatif : visible par le moniteur." className="sm:col-span-2">
          <Textarea id="l-notes" rows={2} maxLength={1000} value={form.notes} placeholder="Ex. : travail des ronds-points, départ de l'agence" onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>

        {(conflicts.length > 0 || mismatch || serverError) && (
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
  return (
    <Dialog open={Boolean(lesson)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-xl overflow-y-auto">
        {lesson && <LessonDetail lesson={lesson} canEdit={canEdit} onClose={() => onOpenChange(false)} onEdit={onEdit} />}
      </DialogContent>
    </Dialog>
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
