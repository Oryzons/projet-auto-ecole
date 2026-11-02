"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CalendarX,
  Car,
  ChevronDown,
  ClipboardList,
  FileUp,
  GraduationCap,
  MessagesSquare,
  Sparkles,
  UserPlus,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { TONE_CLASS } from "@/components/plan/tones";
import { Button } from "@/components/ui/button";
import { RECAP_EVENT, RECAP_FLAG } from "@/lib/activity";
import { cn } from "@/lib/utils";
import type { RecapGroup } from "@/app/api/me/recap/route";

type Recap = {
  firstName: string;
  since: string;
  firstVisit: boolean;
  unread: { id: string; title: string; detail: string; at: string; count: number; href: string }[];
  unreadCount: number;
  groups: RecapGroup[];
  agenda: { lessons: number; sessions: number; exams: number; nextLesson: { at: string; title: string } | null };
};

const ICONS: Record<string, LucideIcon> = {
  signups: UserPlus,
  documents: FileUp,
  payments: Wallet,
  lessons: CalendarCheck,
  cancelled: CalendarX,
  vehicles: Car,
  assigned: ClipboardList,
  overdue: AlertTriangle,
};
const TIME = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const WEEKDAY = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

/** « hier à 17:45 », « ce matin à 08:10 », « mardi 28 octobre à 18:02 ». */
function sinceLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000);
  const at = `à ${TIME.format(d)}`;
  if (diff <= 0) return `aujourd'hui ${at}`;
  if (diff === 1) return `hier ${at}`;
  return `${WEEKDAY.format(d)} ${at}`;
}

function ago(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} h` : `${Math.round(hours / 24)} j`;
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/**
 * Pop-up de bienvenue à droite, juste après la connexion : messages non lus,
 * tout ce qui s'est passé depuis la dernière visite et le programme du jour.
 */
export function LoginRecap() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    // le drapeau n'est retiré qu'à l'ouverture : en développement, React lance cet effet deux fois
    let flagged = false;
    try {
      flagged = sessionStorage.getItem(RECAP_FLAG) === "1";
    } catch {}
    if (!flagged) return;
    setArmed(true);
    // laisse la caméra finir sa plongée et la vue d'ensemble s'installer
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.removeItem(RECAP_FLAG);
      } catch {}
      setOpen(true);
    }, reduce ? 300 : 1900);
    return () => window.clearTimeout(timer);
  }, [reduce]);

  // « Voir le récap » dans le menu du compte le rouvre à tout moment
  useEffect(() => {
    const reopen = () => {
      setArmed(true);
      setOpen(true);
    };
    window.addEventListener(RECAP_EVENT, reopen);
    return () => window.removeEventListener(RECAP_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("[data-page-popup]") && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const { data } = useQuery({
    queryKey: ["login-recap"],
    queryFn: async () => {
      const res = await fetch("/api/me/recap");
      if (!res.ok) throw new Error("recap");
      return (await res.json()) as Recap;
    },
    enabled: armed,
    staleTime: Infinity,
  });

  const go = (href: string) => {
    setOpen(false);
    router.push(href, { scroll: false });
  };
  const show = open && Boolean(data);
  const news = data?.groups.reduce((sum, g) => sum + g.count, 0) ?? 0;

  return (
    <AnimatePresence>
      {show && data && (
        <motion.aside
          key="recap"
          role="dialog"
          aria-label={`Bienvenue ${data.firstName}`}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 420, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: 420, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-[45] flex max-h-[86svh] flex-col overflow-hidden rounded-t-3xl border border-border bg-popover shadow-float md:inset-x-auto md:top-[76px] md:right-4 md:bottom-4 md:max-h-none md:w-[400px] md:rounded-3xl"
        >
          {/* en-tête de bienvenue */}
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-primary to-[#5b78ff] px-5 pt-5 pb-5 text-white">
            <motion.span
              aria-hidden
              className="absolute -top-10 -right-8 size-40 rounded-full bg-white/10"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.15 }}
            />
            <button
              type="button"
              aria-label="Fermer le récap"
              onClick={() => setOpen(false)}
              className="absolute top-3.5 right-3.5 grid size-8 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="size-4" />
            </button>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.15 }}
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-white/80"
            >
              <Sparkles className="size-3.5" /> {data.firstVisit ? "Première connexion" : `Dernière visite ${sinceLabel(data.since)}`}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.22 }}
              className="mt-1 text-[24px] font-semibold tracking-[-0.02em]"
            >
              Bienvenue {data.firstName}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.3 }}
              className="mt-1 text-[13.5px] leading-relaxed text-white/85"
            >
              {data.unreadCount || news
                ? `${[data.unreadCount && `${data.unreadCount} message${data.unreadCount > 1 ? "s" : ""} non lu${data.unreadCount > 1 ? "s" : ""}`, news && `${news} nouveauté${news > 1 ? "s" : ""}`].filter(Boolean).join(" et ")} depuis votre dernière visite.`
                : "Rien de nouveau depuis votre dernière visite."}
            </motion.p>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
            {/* messages non lus */}
            {data.unread.length > 0 && (
              <Section index={0} title="Messages non lus" count={data.unreadCount} icon={MessagesSquare} action={{ label: "Messagerie", onClick: () => go("/admin/messages") }}>
                <ul className="space-y-1">
                  {data.unread.slice(0, 4).map((thread) => (
                    <li key={thread.id}>
                      <button
                        type="button"
                        onClick={() => go(thread.href)}
                        className="flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-secondary/80"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-[12px] font-semibold text-primary">{initials(thread.title)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-[13px] font-semibold text-foreground">{thread.title}</span>
                            <span className="shrink-0 text-[11px] text-muted-foreground">{ago(thread.at)}</span>
                          </span>
                          <span className="line-clamp-1 text-[12.5px] text-muted-foreground">{thread.detail}</span>
                        </span>
                        {thread.count > 1 && (
                          <span className="mt-1 grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10.5px] leading-5 font-semibold text-white">{thread.count}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* nouveautés */}
            <Section index={1} title="Depuis votre dernière visite" icon={Sparkles}>
              {data.groups.length === 0 ? (
                <p className="rounded-xl bg-secondary/60 px-3 py-4 text-center text-[13px] text-muted-foreground">Tout est calme, rien de nouveau.</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.groups.map((group, i) => {
                    const Icon = ICONS[group.key] ?? Sparkles;
                    const isOpen = expanded === group.key;
                    return (
                      <motion.li
                        key={group.key}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.45 + i * 0.05 }}
                        className={cn("rounded-xl border transition-colors", isOpen ? "border-primary/20 bg-primary-soft/20" : "border-border/70")}
                      >
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => setExpanded(isOpen ? null : group.key)}
                          className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left"
                        >
                          <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", TONE_CLASS[group.tone].soft)}>
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{group.label}</span>
                          <span className="text-[13px] font-semibold text-foreground tabular">{group.count}</span>
                          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: EASE_OUT }}
                              className="overflow-hidden"
                            >
                              <ul className="space-y-0.5 px-2.5 pb-2">
                                {group.items.slice(0, 5).map((item) => (
                                  <li key={item.id}>
                                    <button
                                      type="button"
                                      disabled={!item.href}
                                      onClick={() => item.href && go(item.href)}
                                      className="flex w-full items-baseline gap-2 rounded-lg px-2 py-1.5 text-left enabled:hover:bg-white"
                                    >
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[12.5px] font-medium text-foreground">{item.title}</span>
                                        {item.detail && <span className="block truncate text-[11.5px] text-muted-foreground">{item.detail}</span>}
                                      </span>
                                      <span className="shrink-0 text-[11px] text-muted-foreground">{ago(item.at)}</span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                              <button
                                type="button"
                                onClick={() => go(group.href)}
                                className="mb-2 ml-4.5 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                              >
                                {group.items.length > 5 ? `Voir les ${group.items.length}` : "Ouvrir"} <ArrowRight className="size-3" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </Section>

            {/* programme du jour */}
            <Section index={2} title="Aujourd'hui" icon={CalendarCheck}>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Leçons", value: data.agenda.lessons, icon: Car },
                  { label: "Séances de code", value: data.agenda.sessions, icon: BookOpen },
                  { label: "Examens", value: data.agenda.exams, icon: GraduationCap },
                ].map((tile) => (
                  <button
                    key={tile.label}
                    type="button"
                    onClick={() => go("/admin/calendar")}
                    className="rounded-xl border border-border/70 px-2.5 py-2 text-left transition-colors hover:border-primary/25 hover:bg-primary-soft/20"
                  >
                    <tile.icon className="size-4 text-muted-foreground" />
                    <span className="mt-1 block text-[18px] font-semibold text-foreground tabular">{tile.value}</span>
                    <span className="block text-[11px] leading-tight text-muted-foreground">{tile.label}</span>
                  </button>
                ))}
              </div>
              {data.agenda.nextLesson && (
                <p className="mt-2 text-[12.5px] text-muted-foreground">
                  Prochaine leçon à <span className="font-medium text-foreground">{TIME.format(new Date(data.agenda.nextLesson.at))}</span> avec {data.agenda.nextLesson.title}.
                </p>
              )}
            </Section>
          </div>

          <div className="shrink-0 border-t border-border/70 px-4 py-3">
            <Button className="w-full" onClick={() => setOpen(false)}>
              C&apos;est parti <ArrowRight />
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Section({
  index,
  title,
  icon: Icon,
  count,
  action,
  children,
}: {
  index: number;
  title: string;
  icon: LucideIcon;
  count?: number;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.3 + index * 0.08 }}>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h3 className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
          <Icon className="size-3.5" /> {title}
          {count ? <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[10.5px] leading-4 font-semibold tracking-normal text-white">{count}</span> : null}
        </h3>
        {action && (
          <button type="button" onClick={action.onClick} className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
            {action.label} <ArrowRight className="size-3" />
          </button>
        )}
      </div>
      {children}
    </motion.section>
  );
}
