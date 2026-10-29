"use client";

import { Check, Download, ExternalLink, FileText, Loader2, X } from "lucide-react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DocumentStatusBadge } from "@/components/ui/status-badge";
import { DocumentStatus } from "@/lib/db/client";
import { cn, formatDay } from "@/lib/utils";

type PreviewDoc = {
  id: string;
  status: DocumentStatus | string;
  fileName: string;
  mimeType?: string;
  createdAt: string | Date;
};

/** Fenêtre d'aperçu d'une pièce : on la consulte et on la valide sans quitter le dossier. */
export function DocumentPreviewDialog({
  label,
  doc,
  open,
  onOpenChange,
  onApprove,
  onReject,
  approving,
}: {
  label: string;
  doc: PreviewDoc;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const url = `/api/documents/${doc.id}/file`;
  const extension = doc.fileName.split(".").pop()?.toLowerCase() ?? "";
  const image = doc.mimeType ? doc.mimeType.startsWith("image/") : ["jpg", "jpeg", "png", "webp"].includes(extension);
  const previewable = image || (doc.mimeType ? doc.mimeType === "application/pdf" : extension === "pdf");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setLoaded(false);
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex h-[min(88svh,920px)] max-w-4xl flex-col overflow-hidden p-0">
        <div className="flex items-start gap-3 border-b border-border px-5 py-4 pr-14 sm:px-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="flex flex-wrap items-center gap-2 pr-0">
              {label}
              <DocumentStatusBadge status={doc.status} />
            </DialogTitle>
            <DialogDescription className="mt-0.5 truncate text-xs">
              {doc.fileName} · déposé le {formatDay(doc.createdAt)}
            </DialogDescription>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-subtle">
          {previewable ? (
            <>
              {!loaded && (
                <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              )}
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={label}
                  onLoad={() => setLoaded(true)}
                  className={cn("size-full object-contain p-4 transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
                />
              ) : (
                <iframe
                  src={`${url}#toolbar=0&view=FitH`}
                  title={label}
                  onLoad={() => setLoaded(true)}
                  // pas de fondu : certains lecteurs PDF ne signalent jamais la fin du chargement
                  className="relative size-full border-0"
                />
              )}
            </>
          ) : (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
              Aperçu indisponible pour ce type de fichier. Téléchargez-le pour l&apos;ouvrir.
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3 sm:px-6">
          <a href={`${url}?download=1`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <Download /> Télécharger
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ExternalLink /> Nouvel onglet
          </a>
          {doc.status === DocumentStatus.PENDING && (
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onReject} disabled={approving}>
                <X /> Refuser
              </Button>
              <Button size="sm" onClick={onApprove} loading={approving}>
                {!approving && <Check />} Valider
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
