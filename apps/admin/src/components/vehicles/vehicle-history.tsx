"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  FilePlus2,
  FileText,
  Fuel,
  Gauge,
  History,
  MessageSquareQuote,
  Paperclip,
  Plus,
  Route,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { TONE_CLASS } from "@/components/plan/tones";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDialog } from "@/hooks/use-app-dialog";
import { useVehicleHistory, useVehicleHistoryMutations } from "@/hooks/use-vehicles";
import { cn } from "@/lib/utils";
import {
  FUEL_LEVEL_LABELS,
  ISSUE_SEVERITY_LABELS,
  JOURNAL_KIND_LABELS,
  MANUAL_JOURNAL_KINDS,
  MAX_DOCUMENT_BYTES,
  VEHICLE_DOCUMENT_LABELS,
  type JournalEntry,
  type VehicleDocument,
  type VehicleLessonDto,
} from "@/lib/vehicle-history";

const DAY = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const TIME = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const km = (n: number) => `${n.toLocaleString("fr-FR")} km`;
const fromDay = (day: string) => new Date(`${day}T12:00:00`);
const SEVERITY_TONE = { INFO: "neutral", WARNING: "warning", URGENT: "danger" } as const;

/** Pastille « dans 12 j » / « dépassée » à côté d'une échéance. */
export function DueChip({ day }: { day: string | null }) {
  if (!day) return <span className="text-[11.5px] text-muted-foreground">Non renseignée</span>;
  const days = Math.round((fromDay(day).getTime() - Date.now()) / 86_400_000);
  const tone = days < 0 ? "danger" : days <= 30 ? "warning" : "success";
  const label = days < 0 ? `Dépassée de ${-days} j` : days === 0 ? "Aujourd'hui" : days <= 60 ? `Dans ${days} j` : `Dans ${Math.round(days / 30)} mois`;
  return <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", TONE_CLASS[tone].soft)}>{label}</span>;
}

function Panel({ title, icon: Icon, action, children }: { title: string; icon: LucideIcon; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <span className="grid size-6 place-items-center rounded-lg bg-primary-soft text-primary">
            <Icon className="size-3.5" />
          </span>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Dépli en hauteur, utilisé pour les détails et les formulaires d'ajout. */
function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE_OUT }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ====================== leçons ====================== */

/** Toutes les leçons passées sur le véhicule ; un clic ouvre le compte rendu du moniteur. */
export function LessonHistory({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading } = useVehicleHistory(vehicleId);
  const [filter, setFilter] = useState<"all" | "issues">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading || !data) return <Skeleton className="h-64 rounded-2xl" />;
  const done = data.lessons.filter((l) => l.status !== "CANCELLED");
  const distance = done.reduce((sum, l) => sum + (l.report ? l.report.kmEnd - l.report.kmStart : 0), 0);
  const issues = done.reduce((sum, l) => sum + (l.report?.issues.length ?? 0), 0);
  const list = filter === "issues" ? data.lessons.filter((l) => l.report?.issues.length) : data.lessons;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Leçons", value: String(done.length), icon: History },
          { label: "Parcourus", value: km(distance), icon: Route },
          { label: "Problèmes", value: String(issues), icon: AlertTriangle, alert: issues > 0 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border/80 bg-card px-3 py-2.5 shadow-xs">
            <span className={cn("flex items-center gap-1.5 text-[11.5px] text-muted-foreground", stat.alert && "text-amber-700")}>
              <stat.icon className="size-3.5" /> {stat.label}
            </span>
            <span className="mt-0.5 block text-[17px] font-semibold text-foreground tabular">{stat.value}</span>
          </div>
        ))}
      </div>

      <Panel
        title="Historique des leçons"
        icon={History}
        action={
          <Segmented
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "Toutes" },
              { value: "issues", label: "Avec problème", count: issues || undefined },
            ]}
          />
        }
      >
        {list.length === 0 ? (
          <p className="rounded-xl bg-secondary/60 px-3 py-6 text-center text-[13px] text-muted-foreground">
            {filter === "issues" ? "Aucun problème signalé en leçon." : "Aucune leçon passée sur ce véhicule."}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {list.map((lesson) => (
              <LessonItem key={lesson.id} lesson={lesson} open={openId === lesson.id} onToggle={() => setOpenId(openId === lesson.id ? null : lesson.id)} />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function LessonItem({ lesson, open, onToggle }: { lesson: VehicleLessonDto; open: boolean; onToggle: () => void }) {
  const start = new Date(lesson.startsAt);
  const report = lesson.report;
  const cancelled = lesson.status === "CANCELLED";
  const issues = report?.issues.length ?? 0;
  return (
    <li className={cn("rounded-xl border transition-colors", open ? "border-primary/25 bg-primary-soft/25" : "border-border/70 hover:border-primary/20")}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-3 py-2.5 text-left focus-visible:outline-none">
        <span className="w-[74px] shrink-0">
          <span className="block text-[12.5px] font-semibold text-foreground first-letter:uppercase">{DAY.format(start)}</span>
          <span className="block text-[11.5px] text-muted-foreground tabular">{TIME.format(start)}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[13px] font-medium", cancelled ? "text-muted-foreground line-through" : "text-foreground")}>{lesson.student ?? "Élève"}</span>
          <span className="block truncate text-[11.5px] text-muted-foreground">avec {lesson.instructor?.split(" ")[0] ?? "—"} · {lesson.durationMinutes} min</span>
        </span>
        {cancelled ? (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Annulée</span>
        ) : report ? (
          <>
            {issues > 0 && (
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", TONE_CLASS.warning.soft)}>
                <AlertTriangle className="size-3" /> {issues}
              </span>
            )}
            <span className="text-[12px] font-medium text-foreground tabular">+{km(report.kmEnd - report.kmStart)}</span>
          </>
        ) : (
          <span className="text-[11.5px] text-muted-foreground">Sans compte rendu</span>
        )}
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-300", open && "rotate-180")} />
      </button>
      <Collapse open={open}>
        <div className="space-y-3 border-t border-border/60 px-3 pt-3 pb-3.5">
          {!report ? (
            <p className="text-[12.5px] text-muted-foreground">{cancelled ? "Leçon annulée, le véhicule n'a pas roulé." : "Le moniteur n'a pas encore rempli le compte rendu."}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Départ", value: km(report.kmStart), icon: Gauge },
                  { label: "Arrivée", value: km(report.kmEnd), icon: Gauge },
                  { label: "Distance", value: km(report.kmEnd - report.kmStart), icon: Route },
                  { label: "Carburant", value: report.fuelLevel ? FUEL_LEVEL_LABELS[report.fuelLevel]! : "—", icon: Fuel },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-border/70">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <item.icon className="size-3" /> {item.label}
                    </span>
                    <span className="block text-[13px] font-semibold text-foreground tabular">{item.value}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="mb-1.5 text-[11.5px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">Problèmes signalés</p>
                {report.issues.length === 0 ? (
                  <p className="text-[12.5px] text-emerald-700">Aucun problème, véhicule en bon état.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {report.issues.map((issue, i) => (
                      <li key={i} className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-border/70">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-medium text-foreground">{issue.label}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", TONE_CLASS[SEVERITY_TONE[issue.severity as keyof typeof SEVERITY_TONE] ?? "neutral"].soft)}>
                            {ISSUE_SEVERITY_LABELS[issue.severity]}
                          </span>
                        </span>
                        {issue.detail && <span className="mt-0.5 block text-[12px] text-muted-foreground">{issue.detail}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {report.skills.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11.5px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">Travaillé pendant la leçon</p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-white px-2.5 py-1 text-[12px] text-foreground ring-1 ring-border/70">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {report.comment && (
                <p className="flex gap-2 rounded-lg bg-white px-2.5 py-2 text-[12.5px] leading-relaxed text-foreground ring-1 ring-border/70">
                  <MessageSquareQuote className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>« {report.comment} »</span>
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Compte rendu de {lesson.instructor ?? "moniteur"}, le {DATE.format(new Date(report.submittedAt))} à {TIME.format(new Date(report.submittedAt))}
              </p>
            </>
          )}
        </div>
      </Collapse>
    </li>
  );
}

/* ====================== documents ====================== */

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Ouvre un fichier joint dans un nouvel onglet (les liens data: y sont bloqués par les navigateurs). */
async function openFile(dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  window.open(URL.createObjectURL(blob), "_blank", "noopener");
}

const DOC_OPTIONS = Object.entries(VEHICLE_DOCUMENT_LABELS).map(([value, label]) => ({ value, label }));

/** Carte grise, assurance, contrôle technique, factures… avec dates, commentaire et fichier joint. */
export function VehicleDocuments({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading } = useVehicleHistory(vehicleId);
  const { removeDocument } = useVehicleHistoryMutations(vehicleId);
  const { showConfirm } = useAppDialog();
  const [adding, setAdding] = useState(false);

  async function remove(doc: VehicleDocument) {
    const ok = await showConfirm({
      title: `Retirer « ${doc.title || VEHICLE_DOCUMENT_LABELS[doc.type]} » ?`,
      description: "Le document et son fichier seront retirés de la fiche. Le retrait restera visible dans le journal.",
      variant: "destructive",
      confirmLabel: "Retirer",
    });
    if (ok) removeDocument.mutate(doc.id);
  }

  return (
    <Panel
      title="Documents"
      icon={FileText}
      action={
        !adding && (
          <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus /> Ajouter
          </Button>
        )
      }
    >
      <Collapse open={adding}>
        <DocumentForm vehicleId={vehicleId} onDone={() => setAdding(false)} />
      </Collapse>
      {isLoading || !data ? (
        <Skeleton className="h-28 rounded-xl" />
      ) : data.documents.length === 0 ? (
        <p className="rounded-xl bg-secondary/60 px-3 py-5 text-center text-[13px] text-muted-foreground">Aucun document. Ajoutez la carte grise, l'assurance, le contrôle technique…</p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {data.documents.map((doc) => (
              <motion.li
                key={doc.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
                className="group/doc rounded-xl border border-border/80 p-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-foreground">{doc.title || VEHICLE_DOCUMENT_LABELS[doc.type]}</span>
                      {doc.expiresAt && <DueChip day={doc.expiresAt} />}
                    </div>
                    <p className="text-[11.5px] text-muted-foreground">
                      {[doc.issuedAt && `Du ${DATE.format(fromDay(doc.issuedAt))}`, doc.expiresAt && `valable jusqu'au ${DATE.format(fromDay(doc.expiresAt))}`].filter(Boolean).join(", ") ||
                        "Sans date"}
                    </p>
                    {doc.comment && <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground">{doc.comment}</p>}
                    <div className="mt-2 flex items-center gap-1">
                      {doc.file ? (
                        <button
                          type="button"
                          onClick={() => void openFile(doc.file!.dataUrl)}
                          className="inline-flex max-w-[60%] items-center gap-1 rounded-md bg-primary-soft/70 px-2 py-1 text-[11.5px] font-medium text-primary hover:bg-primary-soft"
                        >
                          <Paperclip className="size-3 shrink-0" /> <span className="truncate">{doc.file.name}</span> <ExternalLink className="size-3 shrink-0" />
                        </button>
                      ) : (
                        <span className="text-[11.5px] text-muted-foreground">Pas de fichier joint</span>
                      )}
                      <span className="ml-auto text-[11px] text-muted-foreground">{doc.addedBy ? `Ajouté par ${doc.addedBy.split(" ")[0]}` : ""}</span>
                      <button
                        type="button"
                        aria-label="Retirer le document"
                        onClick={() => void remove(doc)}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover/doc:opacity-100 hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 max-sm:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Panel>
  );
}

function DocumentForm({ vehicleId, onDone }: { vehicleId: string; onDone: () => void }) {
  const { addDocument } = useVehicleHistoryMutations(vehicleId);
  const input = useRef<HTMLInputElement>(null);
  const [doc, setDoc] = useState({ type: "INSURANCE", title: "", issuedAt: "", expiresAt: "", comment: "" });
  const [file, setFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const withExpiry = !["REGISTRATION", "SERVICE", "REPAIR", "CLAIM"].includes(doc.type);

  async function pick(f: File | undefined) {
    if (!f) return;
    if (!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(f.type)) return setError("Fichier PDF, JPEG, PNG ou WebP uniquement.");
    if (f.size > (MAX_DOCUMENT_BYTES * 3) / 4) return setError("Fichier trop lourd (4 Mo maximum).");
    setError(null);
    setFile({ name: f.name, dataUrl: await readFile(f) });
  }

  return (
    <div className="mb-3 space-y-3 rounded-xl border border-primary/20 bg-primary-soft/25 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Type de document">
          <Select value={doc.type} onValueChange={(v) => setDoc({ ...doc, type: v })} options={DOC_OPTIONS} aria-label="Type de document" />
        </Field>
        <Field label="Intitulé" htmlFor="doc-title" hint="Facultatif">
          <Input id="doc-title" value={doc.title} maxLength={80} placeholder={VEHICLE_DOCUMENT_LABELS[doc.type]} onChange={(e) => setDoc({ ...doc, title: e.target.value })} />
        </Field>
        <Field label={withExpiry ? "Date de début" : "Date du document"}>
          <DatePicker value={doc.issuedAt} onChange={(v) => setDoc({ ...doc, issuedAt: v })} clearable />
        </Field>
        {withExpiry && (
          <Field label="Valable jusqu'au" hint={doc.type === "INSURANCE" || doc.type === "INSPECTION" ? "Met à jour l'échéance de la fiche" : undefined}>
            <DatePicker value={doc.expiresAt} onChange={(v) => setDoc({ ...doc, expiresAt: v })} clearable />
          </Field>
        )}
      </div>
      <Field label="Commentaire" htmlFor="doc-comment">
        <Textarea id="doc-comment" rows={2} value={doc.comment} maxLength={1000} placeholder="Défaillances relevées, montant, garage…" onChange={(e) => setDoc({ ...doc, comment: e.target.value })} />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()}>
          <Paperclip /> {file ? "Changer le fichier" : "Joindre un fichier"}
        </Button>
        {file && <span className="max-w-[55%] truncate text-[12px] text-foreground">{file.name}</span>}
        <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" hidden onChange={(e) => void pick(e.target.files?.[0])} />
      </div>
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button
          type="button"
          size="sm"
          loading={addDocument.isPending}
          onClick={() =>
            addDocument.mutate(
              { ...doc, expiresAt: withExpiry ? doc.expiresAt : "", file },
              { onSuccess: onDone, onError: (e) => setError(e.message) },
            )
          }
        >
          <FilePlus2 /> Enregistrer le document
        </Button>
      </div>
    </div>
  );
}

/* ====================== journal ====================== */

const KIND_DOT: Record<string, string> = {
  NOTE: "bg-slate-400",
  ISSUE: "bg-amber-500",
  REPAIR: "bg-emerald-500",
  DOCUMENT: "bg-primary",
  UPDATE: "bg-violet-500",
  LESSON: "bg-red-500",
};

/** Fil chronologique : modifications de la fiche, documents, problèmes (saisis ou signalés en leçon), réparations. */
export function VehicleJournal({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading } = useVehicleHistory(vehicleId);
  const { addJournal } = useVehicleHistoryMutations(vehicleId);
  const [kind, setKind] = useState<string>("NOTE");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const entries: JournalEntry[] = data?.journal ?? [];
  const shown = all ? entries : entries.slice(0, 6);

  const submit = () => {
    if (comment.trim().length < 2) return setError("Écrivez un commentaire.");
    addJournal.mutate({ kind, comment }, { onSuccess: () => (setComment(""), setError(null)), onError: (e) => setError(e.message) });
  };

  return (
    <Panel title="Journal du véhicule" icon={History}>
      <div className="mb-4 space-y-2 rounded-xl bg-secondary/60 p-2.5">
        <Segmented
          size="sm"
          value={kind}
          onChange={setKind}
          className="w-full"
          options={MANUAL_JOURNAL_KINDS.map((k) => ({ value: k, label: JOURNAL_KIND_LABELS[k]! }))}
        />
        <Textarea
          aria-label="Commentaire"
          rows={2}
          value={comment}
          maxLength={1000}
          placeholder={kind === "ISSUE" ? "Décrivez le problème constaté…" : kind === "REPAIR" ? "Intervention réalisée, garage, montant…" : "Ajoutez une note…"}
          onChange={(e) => {
            setComment(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          className="bg-white"
        />
        {error && <p className="text-[12.5px] text-danger">{error}</p>}
        <div className="flex justify-end">
          <Button type="button" size="sm" loading={addJournal.isPending} onClick={submit}>
            Ajouter au journal
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : entries.length === 0 ? (
        <p className="text-center text-[13px] text-muted-foreground">Rien pour l'instant.</p>
      ) : (
        <ol className="relative space-y-3 before:absolute before:top-1.5 before:bottom-1.5 before:left-[5px] before:w-px before:bg-border">
          <AnimatePresence initial={false}>
            {shown.map((entry) => (
              <motion.li
                key={entry.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
                className="relative pl-6"
              >
                <span className={cn("absolute top-1 left-0 size-[11px] rounded-full ring-2 ring-card", KIND_DOT[entry.kind] ?? "bg-slate-400")} />
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[12px] font-semibold text-foreground">{JOURNAL_KIND_LABELS[entry.kind]}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {DATE.format(new Date(entry.at))}
                    {entry.author ? ` · ${entry.author}` : ""}
                  </span>
                </div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed whitespace-pre-line text-foreground">{entry.text}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
      {entries.length > 6 && (
        <button type="button" onClick={() => setAll(!all)} className="mt-3 w-full rounded-lg py-1.5 text-[12.5px] font-medium text-primary hover:bg-primary-soft/50">
          {all ? "Réduire" : `Voir les ${entries.length - 6} entrées plus anciennes`}
        </button>
      )}
    </Panel>
  );
}
