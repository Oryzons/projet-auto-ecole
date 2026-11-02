"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Mail, MessagesSquare, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { FadeIn } from "@/components/motion";
import { EASE_OUT } from "@/components/motion/tokens";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InputWithIcon } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { ADMIN_HELP_FAQS, HELP_TOPICS, type HelpTopic } from "@/lib/help-faq";
import { cn } from "@/lib/utils";

const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function AdminHelpPage() {
  const [topic, setTopic] = useState<HelpTopic | "all">("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(ADMIN_HELP_FAQS[0].id);

  const items = useMemo(() => {
    const q = normalize(query.trim());
    return ADMIN_HELP_FAQS.filter(
      (item) =>
        (topic === "all" || item.topic === topic) &&
        (!q || normalize(`${item.question} ${item.answer}`).includes(q)),
    );
  }, [topic, query]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Aide" title="Comment pouvons-nous vous aider ?" description="Les réponses aux questions les plus fréquentes sur Virage." />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <FadeIn>
          <Card className="gap-0 p-0">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <Segmented size="sm" options={HELP_TOPICS} value={topic} onChange={setTopic} />
              <InputWithIcon
                icon={Search}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une question…"
                aria-label="Rechercher dans l'aide"
                className="h-9 sm:w-64"
              />
            </div>
            {items.length === 0 ? (
              <EmptyState icon={SearchX} title="Aucun résultat" description="Essayez d'autres mots, ou écrivez-nous directement." className="py-14" />
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const expanded = open === item.id;
                  return (
                    <li key={item.id}>
                      <h3>
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-controls={`faq-${item.id}`}
                          onClick={() => setOpen(expanded ? null : item.id)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-subtle/60"
                        >
                          <span className={cn("text-[15px] font-medium transition-colors", expanded ? "text-primary-strong" : "text-foreground")}>
                            {item.question}
                          </span>
                          <motion.span
                            animate={{ rotate: expanded ? 180 : 0 }}
                            transition={{ duration: 0.25, ease: EASE_OUT }}
                            className={cn("grid size-7 shrink-0 place-items-center rounded-full", expanded ? "bg-primary-soft text-primary" : "text-muted-foreground")}
                          >
                            <ChevronDown className="size-4" />
                          </motion.span>
                        </button>
                      </h3>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div
                            id={`faq-${item.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: EASE_OUT }}
                            className="overflow-hidden"
                          >
                            <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </FadeIn>

        <FadeIn delay={0.08} className="space-y-4">
          <Card className="relative gap-0 overflow-hidden border-transparent bg-gradient-to-br from-primary to-primary-strong p-5 text-white shadow-primary">
            <svg className="pointer-events-none absolute -right-6 -bottom-4 h-20 w-56 text-white/10" viewBox="0 0 200 60" fill="none" aria-hidden>
              <path d="M0 30 C 25 15 50 45 75 30 C 100 15 125 45 150 30 C 175 15 200 45 225 30" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
            </svg>
            <span className="grid size-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Mail className="size-5" />
            </span>
            <p className="mt-4 text-[15px] font-semibold">Écrire au support</p>
            <p className="mt-1 text-[13px] leading-relaxed text-white/80">Réponse sous 24 h ouvrées. Joignez une capture d&apos;écran si possible.</p>
            <a
              href="mailto:support@virage.fr"
              className="relative mt-4 inline-flex h-9 items-center rounded-[10px] bg-white px-4 text-[13px] font-semibold text-primary-strong transition-transform hover:-translate-y-0.5"
            >
              support@virage.fr
            </a>
          </Card>
          <Card className="gap-0 p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <MessagesSquare className="size-5" />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-foreground">Échanger avec un élève</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">La messagerie vous permet de répondre à vos élèves en temps réel.</p>
            <Link href="/admin/messages" className="mt-3 inline-block text-[13px] font-semibold text-primary hover:text-primary-strong">
              Ouvrir les messages →
            </Link>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
