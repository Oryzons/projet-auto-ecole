"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CornerDownLeft, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { adminNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { signalNavigation } from "./navigation-progress";

type SearchApplication = {
  id: string;
  status: string;
  candidate: { firstName: string; lastName: string; email: string; profilePhotoUrl?: string | null };
};

type Result =
  | { kind: "page"; id: string; label: string; href: string; icon: (typeof adminNav.primary)[number]["icon"] }
  | { kind: "application"; id: string; label: string; href: string; application: SearchApplication };

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Recherche rapide (⌘K) : élèves et pages de l'espace admin. */
export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const { data } = useQuery<{ applications: SearchApplication[] }>({
    queryKey: ["applications", "all"],
    queryFn: () => fetch("/api/applications").then((res) => res.json()),
    enabled: open,
    staleTime: 30_000,
  });

  const results = useMemo<Result[]>(() => {
    const q = normalize(query.trim());
    const pages: Result[] = [...adminNav.primary, ...adminNav.secondary, ...adminNav.extra]
      .filter((item) => !q || normalize(item.label).includes(q))
      .map((item) => ({ kind: "page", id: item.href, label: item.label, href: item.href, icon: item.icon }));
    const applications: Result[] = (data?.applications ?? [])
      .filter((app) => {
        if (!q) return true;
        const haystack = normalize(`${app.candidate.firstName} ${app.candidate.lastName} ${app.candidate.email}`);
        return q.split(/\s+/).every((part) => haystack.includes(part));
      })
      .slice(0, q ? 8 : 5)
      .map((app) => ({
        kind: "application",
        id: app.id,
        label: `${app.candidate.firstName} ${app.candidate.lastName}`,
        href: `/admin/applications/${app.id}`,
        application: app,
      }));
    return q ? [...applications, ...pages] : [...pages, ...applications];
  }, [data, query]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(result: Result | undefined) {
    if (!result) return;
    onOpenChange(false);
    signalNavigation(new URL(result.href, window.location.href).pathname);
    router.push(result.href);
  }

  function changeQuery(value: string) {
    setQuery(value);
    setActive(0);
  }

  const applicationResults = results.filter((r) => r.kind === "application");
  const pageResults = results.filter((r) => r.kind === "page");
  const groups: { title: string; items: Result[] }[] = (query.trim()
    ? [
        { title: "Élèves", items: applicationResults },
        { title: "Pages", items: pageResults },
      ]
    : [
        { title: "Pages", items: pageResults },
        { title: "Dossiers récents", items: applicationResults },
      ]
  ).filter((group) => group.items.length > 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) changeQuery("");
      }}
    >
      <DialogContent position="top" showCloseButton={false} className="max-w-xl overflow-hidden p-0">
        <DialogTitle className="sr-only">Recherche rapide</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-[18px] shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((i) => Math.min(results.length - 1, i + 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (event.key === "Enter") {
                event.preventDefault();
                const ordered = groups.flatMap((g) => g.items);
                go(ordered[active]);
              }
            }}
            placeholder="Rechercher un élève, une page…"
            className="h-14 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="hidden rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:block">
            Échap
          </kbd>
        </div>
        <ul ref={listRef} className="scroll-area max-h-[min(60vh,440px)] overflow-y-auto p-2">
          {groups.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              Aucun résultat pour « {query} »
            </li>
          )}
          {(() => {
            let index = -1;
            return groups.map((group) => (
              <li key={group.title} className="pb-1">
                <p className="px-2.5 pt-2 pb-1.5 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  {group.title}
                </p>
                <ul>
                  {group.items.map((result) => {
                    index += 1;
                    const i = index;
                    const selected = i === active;
                    return (
                      <li key={`${result.kind}-${result.id}`}>
                        <button
                          type="button"
                          data-index={i}
                          onMouseMove={() => setActive(i)}
                          onClick={() => go(result)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-100",
                            selected ? "bg-primary-soft" : "hover:bg-subtle",
                          )}
                        >
                          {result.kind === "page" ? (
                            <span className={cn("grid size-8 place-items-center rounded-lg", selected ? "bg-white text-primary" : "bg-secondary text-muted-foreground")}>
                              <result.icon className="size-4" />
                            </span>
                          ) : (
                            <Avatar
                              size="sm"
                              firstName={result.application.candidate.firstName}
                              lastName={result.application.candidate.lastName}
                              src={result.application.candidate.profilePhotoUrl}
                            />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">{result.label}</span>
                            {result.kind === "application" && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {result.application.candidate.email}
                              </span>
                            )}
                          </span>
                          {result.kind === "application" && (
                            <ApplicationStatusBadge status={result.application.status} className="hidden sm:inline-flex" />
                          )}
                          {selected ? (
                            <CornerDownLeft className="size-4 text-primary" />
                          ) : (
                            <ArrowRight className="size-4 text-transparent" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ));
          })()}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
