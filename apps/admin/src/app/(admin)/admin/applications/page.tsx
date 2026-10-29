"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Download, FileArchive, FileSpreadsheet, Pencil, Search, Sheet as SheetIcon, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { ApplicationsTable, type ApplicationRow } from "@/components/admin/applications-table";
import { CandidateFormDialog } from "@/components/admin/candidate-form-dialog";
import { FadeIn } from "@/components/motion";
import { EASE_OUT } from "@/components/motion/tokens";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { useAppDialog } from "@/hooks/use-app-dialog";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { signalNavigation } from "@/components/shell/navigation-progress";

type StatusFilter = "all" | "todo" | "DOCUMENTS_PENDING" | "DOCUMENTS_REVIEW" | "PAYMENT_PENDING" | "PAID" | "COMPLETED";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "todo", label: "À vérifier" },
  { value: "DOCUMENTS_PENDING", label: "Documents" },
  { value: "PAYMENT_PENDING", label: "À payer" },
  { value: "PAID", label: "Payés" },
  { value: "COMPLETED", label: "Terminés" },
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function matchesStatus(row: ApplicationRow, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "todo") return row.documents.some((d) => d.status === "PENDING");
  if (filter === "DOCUMENTS_PENDING") return row.status === "DOCUMENTS_PENDING" || row.status === "DRAFT" || row.status === "DOCUMENTS_REVIEW";
  return row.status === filter;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ApplicationsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { showConfirm } = useAppDialog();

  const initialStatus = params.get("status");
  const [status, setStatus] = useState<StatusFilter>(
    STATUS_FILTERS.some((f) => f.value === initialStatus) ? (initialStatus as StatusFilter) : "all",
  );
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(params.get("create") === "1");
  const [editing, setEditing] = useState<ApplicationRow | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery<{ applications: ApplicationRow[] }>({
    queryKey: ["applications", "all"],
    queryFn: async () => {
      const res = await fetch("/api/applications");
      if (!res.ok) throw new Error("Chargement impossible");
      return res.json();
    },
  });
  const applications = useMemo(() => data?.applications ?? [], [data]);

  const counts = useMemo(() => {
    const result = {} as Record<StatusFilter, number>;
    for (const filter of STATUS_FILTERS) result[filter.value] = applications.filter((row) => matchesStatus(row, filter.value)).length;
    return result;
  }, [applications]);

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    return applications.filter((row) => {
      if (!matchesStatus(row, status)) return false;
      if (!q) return true;
      const c = row.candidate;
      return normalize(`${c.firstName} ${c.lastName} ${c.email} ${c.phone ?? ""} ${c.oedippNumber ?? ""} ${APPLICATION_STATUS_LABELS[row.status] ?? ""}`).includes(q);
    });
  }, [applications, query, status]);

  const selectedRows = applications.filter((row) => selected.has(row.id));

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "La suppression a échoué");
        }
      }
    },
    onSuccess: (_data, ids) => {
      setSelected(new Set());
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success(ids.length > 1 ? `${ids.length} dossiers supprimés` : "Dossier supprimé", {
        description: "Les dossiers payés sont archivés pour la comptabilité.",
      });
    },
    onError: (error) => toast.error("Suppression impossible", { description: error.message }),
  });

  async function confirmDelete() {
    const count = selectedRows.length;
    const ok = await showConfirm({
      title: count > 1 ? `Supprimer ${count} dossiers ?` : "Supprimer ce dossier ?",
      description:
        count > 1
          ? "Les élèves, leurs documents et leurs messages seront effacés. Cette action est définitive."
          : `${selectedRows[0].candidate.firstName} ${selectedRows[0].candidate.lastName} : l'élève, ses documents et ses messages seront effacés. Cette action est définitive.`,
      variant: "destructive",
      confirmLabel: "Supprimer",
    });
    if (ok) remove.mutate(selectedRows.map((row) => row.id));
  }

  async function exportAs(format: "csv" | "xlsx" | "zip") {
    const ids = (selectedRows.length ? selectedRows : rows).map((row) => row.id);
    if (!ids.length) return;
    setExporting(true);
    const promise = (async () => {
      const res = await fetch("/api/applications/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, ids }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "L'export a échoué");
      }
      const blob = await res.blob();
      const name = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? `dossiers.${format}`;
      downloadBlob(blob, name);
    })();
    toast.promise(promise, {
      loading: `Préparation de l'export (${ids.length} dossier${ids.length > 1 ? "s" : ""})…`,
      success: "Export téléchargé",
      error: (error: Error) => error.message,
    });
    await promise.catch(() => {});
    setExporting(false);
  }

  const exportCount = selectedRows.length || rows.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dossiers"
        description={`${applications.length} élève${applications.length > 1 ? "s" : ""} · ${counts.todo ?? 0} dossier${counts.todo > 1 ? "s" : ""} avec des documents à vérifier`}
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" loading={exporting} disabled={!exportCount} />}>
                {!exporting && <Download />}
                Exporter
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  {selectedRows.length ? `${selectedRows.length} sélectionné${selectedRows.length > 1 ? "s" : ""}` : `${rows.length} dossier${rows.length > 1 ? "s" : ""} affiché${rows.length > 1 ? "s" : ""}`}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => void exportAs("xlsx")}>
                  <FileSpreadsheet className="text-success" /> Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void exportAs("csv")}>
                  <SheetIcon className="text-primary" /> CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void exportAs("zip")}>
                  <FileArchive className="text-muted-foreground" /> Dossiers complets (.zip)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <UserPlus /> Nouvel élève
            </Button>
          </>
        }
      />

      <FadeIn delay={0.05}>
        <Card className="gap-0 overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <Segmented
              value={status}
              onChange={(value) => {
                setStatus(value);
                setSelected(new Set());
              }}
              options={STATUS_FILTERS.map((f) => ({ ...f, count: counts[f.value] }))}
            />
            <div className="group/input relative lg:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nom, email, téléphone, NEPH…"
                aria-label="Rechercher un dossier"
                className="h-10 w-full rounded-xl border border-input bg-card pr-9 pl-9 text-sm shadow-xs outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-4 focus:ring-ring/10"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Effacer" className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {selectedRows.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
                className="overflow-hidden border-b border-border bg-primary-soft/50"
              >
                <div className="flex flex-wrap items-center gap-2 px-5 py-2.5">
                  <p className="mr-auto text-sm font-medium text-primary-strong">
                    {selectedRows.length} sélectionné{selectedRows.length > 1 ? "s" : ""}
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                    Désélectionner
                  </Button>
                  <Button size="sm" variant="outline" disabled={selectedRows.length !== 1} onClick={() => { setEditing(selectedRows[0]); setFormOpen(true); }}>
                    <Pencil /> Modifier
                  </Button>
                  <Button size="sm" variant="destructive" loading={remove.isPending} onClick={() => void confirmDelete()}>
                    <Trash2 /> Supprimer
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ApplicationsTable
            rows={rows}
            loading={isLoading}
            filtered={Boolean(query) || status !== "all"}
            selected={selected}
            onOpen={(id) => {
              signalNavigation(`/admin/applications/${id}`);
              router.push(`/admin/applications/${id}`);
            }}
            onToggle={(id, checked) =>
              setSelected((current) => {
                const next = new Set(current);
                if (checked) next.add(id);
                else next.delete(id);
                return next;
              })
            }
            onToggleAll={(checked) => setSelected(checked ? new Set(rows.map((r) => r.id)) : new Set())}
            emptyAction={
              <Button onClick={() => setFormOpen(true)}>
                <UserPlus /> Nouvel élève
              </Button>
            }
          />
        </Card>
      </FadeIn>

      <CandidateFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        target={
          editing
            ? { id: editing.id, permitType: editing.permitType, partnerRate: editing.partnerRate, paid: editing.payments.some((p) => p.status === "COMPLETED"), candidate: editing.candidate }
            : null
        }
        onSaved={(applicationId) => {
          void queryClient.invalidateQueries({ queryKey: ["applications"] });
          if (editing) setEditing(null);
          else {
            signalNavigation(`/admin/applications/${applicationId}`);
            router.push(`/admin/applications/${applicationId}`);
          }
        }}
      />
    </div>
  );
}

export default function AdminApplicationsPage() {
  return (
    <Suspense>
      <ApplicationsContent />
    </Suspense>
  );
}
