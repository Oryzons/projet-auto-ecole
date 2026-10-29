"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardCheck,
  Clock3,
  Expand,
  Lock,
  MailCheck,
  MapPin,
  QrCode,
  RotateCcw,
  ScanLine,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { formatLongDay, formatTimeRange } from "@/components/calendar/calendar-shared";
import { EASE_OUT } from "@/components/motion/tokens";
import { FadeIn } from "@/components/motion";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDialog } from "@/hooks/use-app-dialog";
import { cn } from "@/lib/utils";

type Registration = {
  id: string;
  attendedAt: string | null;
  attendanceMethod: "qr" | "manual" | null;
  candidate: { id: string; firstName: string; lastName: string; phone: string | null };
};

type AttendanceData = {
  session: {
    id: string;
    title: string;
    location: string;
    startsAt: string;
    durationMinutes: number;
    capacity: number;
    attendanceOpenedAt: string | null;
    attendanceClosedAt: string | null;
  };
  state: "not-started" | "open" | "closed";
  canOpen: boolean;
  qr: { url: string; image: string; expiresAt: number } | null;
  serverNow: number;
  registrations: Registration[];
};

const CODE_PERIOD_MS = 15_000;

async function sendJson(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Action impossible, réessayez.");
  return json;
}

const clock = (iso: string) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** Barre qui se vide jusqu'au prochain changement de QR code. */
function CodeTimer({ expiresAt, offset }: { expiresAt: number; offset: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = Math.max(0, expiresAt - (now + offset));
  return (
    <div className="w-full max-w-[280px]">
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-linear"
          style={{ width: `${(remaining / CODE_PERIOD_MS) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground tabular-nums">
        Nouveau code dans {Math.ceil(remaining / 1000)} s
      </p>
    </div>
  );
}

function PresenceToggle({ present, pending, onChange, name }: { present: boolean; pending: boolean; onChange: (present: boolean) => void; name: string }) {
  return (
    <div role="radiogroup" aria-label={`Présence de ${name}`} className="relative grid shrink-0 grid-cols-2 rounded-xl bg-secondary p-0.5 text-[13px] font-medium">
      {[
        { value: true, label: "Présent", icon: Check },
        { value: false, label: "Absent", icon: X },
      ].map((option) => {
        const active = option.value === present;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={pending}
            onClick={() => !active && onChange(option.value)}
            className={cn(
              "relative flex items-center justify-center gap-1 rounded-[10px] px-2.5 py-1.5 transition-colors disabled:opacity-60",
              active ? (option.value ? "text-white" : "text-foreground") : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`presence-${name}`}
                className={cn("absolute inset-0 rounded-[10px] shadow-xs", option.value ? "bg-success" : "bg-card")}
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            )}
            <option.icon className="relative size-3.5" />
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function AttendancePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
  const { showConfirm } = useAppDialog();
  const qrRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  const queryKey = ["attendance", id];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const json = (await sendJson(`/api/sessions/${id}/attendance`, "GET")) as AttendanceData;
      setOffset(json.serverNow - Date.now());
      return json;
    },
    // Pendant l'appel : nouveaux présents et QR code à jour toutes les 3 secondes.
    refetchInterval: (query) => (query.state.data?.state === "open" ? 3000 : false),
    refetchIntervalInBackground: true,
  });

  const action = useMutation({
    mutationFn: (kind: "open" | "close") => sendJson(`/api/sessions/${id}/attendance`, "POST", { action: kind }) as Promise<AttendanceData>,
    onSuccess: (json, kind) => {
      queryClient.setQueryData(queryKey, json);
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      if (kind === "close") toast.success("Appel terminé", { description: "Le relevé a été envoyé aux administrateurs." });
    },
    onError: (error) => toast.error("Action impossible", { description: error.message }),
  });

  const mark = useMutation({
    mutationFn: ({ registrationId, present }: { registrationId: string; present: boolean }) =>
      sendJson(`/api/sessions/${id}/attendance`, "PATCH", { registrationId, present }),
    onMutate: ({ registrationId, present }) => {
      queryClient.setQueryData<AttendanceData>(queryKey, (current) =>
        current && {
          ...current,
          registrations: current.registrations.map((r) =>
            r.id === registrationId ? { ...r, attendedAt: present ? new Date().toISOString() : null, attendanceMethod: present ? "manual" : null } : r,
          ),
        },
      );
    },
    onError: (error) => {
      toast.error("Pointage impossible", { description: error.message });
      void queryClient.invalidateQueries({ queryKey });
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  async function close() {
    if (!data) return;
    const absent = data.registrations.filter((r) => !r.attendedAt).length;
    const ok = await showConfirm({
      title: "Terminer l'appel ?",
      description:
        absent > 0
          ? `${absent} élève${absent > 1 ? "s seront notés absents" : " sera noté absent"}. Le relevé sera envoyé aux administrateurs.`
          : "Tous les élèves sont présents. Le relevé sera envoyé aux administrateurs.",
      confirmLabel: "Terminer l'appel",
    });
    if (ok) action.mutate("close");
  }

  function fullscreen() {
    const element = qrRef.current;
    if (!element) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void element.requestFullscreen?.().catch(() => toast.error("Plein écran indisponible sur cet appareil"));
  }

  if (isError) {
    return <EmptyState icon={CalendarDays} title="Séance introuvable" description="Elle a peut-être été supprimée." />;
  }
  if (isLoading || !data) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { session, state, registrations } = data;
  const startsAt = new Date(session.startsAt);
  const present = registrations.filter((r) => r.attendedAt);
  const total = registrations.length;

  return (
    <div className="space-y-6">
      <FadeIn>
        <Link href="/admin/calendar" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> Calendrier
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">Appel</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">{session.title}</h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4 text-primary" />
                {formatLongDay(startsAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-4 text-primary" />
                {formatTimeRange({ startsAt: session.startsAt, durationMinutes: session.durationMinutes })}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" />
                {session.location}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-xs">
            <span className="grid size-10 place-items-center rounded-xl bg-success-soft text-success">
              <UserCheck className="size-5" />
            </span>
            <div>
              <p className="text-[22px] leading-none font-semibold text-foreground tabular-nums">
                <motion.span key={present.length} initial={reduce ? false : { y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block">
                  {present.length}
                </motion.span>
                <span className="text-muted-foreground"> / {total}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">présents</p>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* QR code / état de l'appel */}
        <FadeIn delay={0.05}>
          <Card ref={qrRef} className="relative h-full items-center justify-center gap-0 overflow-hidden px-6 py-8 text-center [&:fullscreen]:bg-white">
            <AnimatePresence mode="wait" initial={false}>
              {state === "open" && data.qr ? (
                <motion.div
                  key="open"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="flex w-full flex-col items-center"
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                      <span className="relative inline-flex size-2 rounded-full bg-success" />
                    </span>
                    Appel en cours
                  </span>
                  <div className="relative mt-5 w-full max-w-[340px] rounded-3xl border border-border bg-white p-4 shadow-sm [:fullscreen_&]:max-w-[min(80vh,80vw)]">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.img
                        key={data.qr.expiresAt}
                        src={data.qr.image}
                        alt="QR code de présence"
                        initial={{ opacity: 0.4 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0.4 }}
                        transition={{ duration: 0.25 }}
                        className="aspect-square w-full"
                      />
                    </AnimatePresence>
                    {!reduce && (
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-6 h-0.5 rounded-full bg-primary/50 shadow-[0_0_12px_var(--color-primary)]"
                        animate={{ top: ["12%", "88%", "12%"] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </div>
                  <p className="mt-5 flex items-center gap-2 text-sm font-medium text-foreground">
                    <ScanLine className="size-4 text-primary" />
                    Scannez avec l&apos;appareil photo de votre téléphone
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Le code change toutes les 15 secondes : une photo envoyée à un absent ne sert à rien.</p>
                  <div className="mt-4 flex w-full justify-center">
                    <CodeTimer expiresAt={data.qr.expiresAt} offset={offset} />
                  </div>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Button variant="outline" onClick={fullscreen}>
                      <Expand /> Plein écran
                    </Button>
                    <Button onClick={() => void close()} loading={action.isPending}>
                      {!action.isPending && <ClipboardCheck />} Terminer l&apos;appel
                    </Button>
                  </div>
                </motion.div>
              ) : state === "closed" ? (
                <motion.div key="closed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                  <span className="grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
                    <Lock className="size-8" />
                  </span>
                  <h2 className="mt-5 text-xl font-semibold text-foreground">Appel terminé</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Clôturé à {clock(session.attendanceClosedAt!)} · {present.length} présent{present.length > 1 ? "s" : ""}, {total - present.length} absent
                    {total - present.length > 1 ? "s" : ""}
                  </p>
                  <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-success-soft px-3.5 py-2 text-[13px] text-success">
                    <MailCheck className="size-4" /> Relevé envoyé aux administrateurs
                  </p>
                  <p className="mt-4 max-w-xs text-xs text-muted-foreground">Vous pouvez encore corriger une présence dans la liste.</p>
                  {data.canOpen && (
                    <Button variant="outline" className="mt-5" onClick={() => action.mutate("open")} loading={action.isPending}>
                      {!action.isPending && <RotateCcw />} Rouvrir l&apos;appel
                    </Button>
                  )}
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                  <span className="relative grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
                    <QrCode className="size-9" />
                  </span>
                  <h2 className="mt-5 text-xl font-semibold text-foreground">Faire l&apos;appel par QR code</h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Un QR code s&apos;affiche : chaque élève le scanne avec son téléphone et il est noté présent. À la fin, le relevé est envoyé aux administrateurs.
                  </p>
                  {data.canOpen ? (
                    <Button size="lg" className="mt-6" onClick={() => action.mutate("open")} loading={action.isPending}>
                      {!action.isPending && <QrCode />} Ouvrir l&apos;appel
                    </Button>
                  ) : (
                    <p className="mt-6 rounded-xl bg-subtle px-4 py-2.5 text-[13px] text-muted-foreground">
                      L&apos;appel s&apos;ouvre le jour de la séance, à partir de 2 h avant le début.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </FadeIn>

        {/* Liste des inscrits */}
        <FadeIn delay={0.1}>
          <Card className="h-full gap-0 p-0">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="text-[15px] font-semibold text-foreground">Élèves inscrits</p>
                <p className="text-[13px] text-muted-foreground">
                  {state === "open" ? "Les présents s'ajoutent en direct. Pointez à la main un élève sans téléphone." : "Pointage manuel possible à tout moment."}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground tabular-nums">{total}</span>
            </div>
            {total === 0 ? (
              <EmptyState compact icon={UsersRound} title="Aucun inscrit" description="Ajoutez des élèves depuis la fiche de la séance." />
            ) : (
              <ul className="divide-y divide-border">
                {registrations.map((r) => {
                  const name = `${r.candidate.firstName} ${r.candidate.lastName}`;
                  const isPresent = Boolean(r.attendedAt);
                  return (
                    <motion.li
                      key={r.id}
                      layout
                      className="relative flex items-center gap-3 px-5 py-3"
                      animate={isPresent && !reduce ? { backgroundColor: ["rgba(22,163,74,0.12)", "rgba(22,163,74,0)"] } : undefined}
                      transition={{ duration: 1.4 }}
                    >
                      <div className="relative">
                        <Avatar size="sm" firstName={r.candidate.firstName} lastName={r.candidate.lastName} />
                        <AnimatePresence>
                          {isPresent && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 22 }}
                              className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-success text-white ring-2 ring-card"
                            >
                              <Check className="size-2.5" strokeWidth={3.5} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {isPresent
                            ? `${r.attendanceMethod === "qr" ? "Scanné" : "Pointé à la main"} à ${clock(r.attendedAt!)}`
                            : state === "open"
                              ? "En attente du scan"
                              : state === "closed"
                                ? "Absent"
                                : r.candidate.phone ?? "—"}
                        </p>
                      </div>
                      <PresenceToggle
                        name={name}
                        present={isPresent}
                        pending={mark.isPending && mark.variables?.registrationId === r.id}
                        onChange={(value) => mark.mutate({ registrationId: r.id, present: value })}
                      />
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
