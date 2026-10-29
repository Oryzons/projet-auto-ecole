"use client";

import { AlertTriangle, Check, Copy, MailCheck, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type InviteResult = { name: string; email: string; inviteLink: string; emailSent: boolean };

/**
 * Affiche le lien d'activation après une invitation : l'admin peut le copier
 * ou le partager lui-même (SMS, WhatsApp…), même si l'email n'est pas parti.
 */
export function InviteLinkDialog({ result, onClose }: { result: InviteResult | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible", { description: "Sélectionnez le lien et copiez-le à la main." });
    }
  }

  async function share() {
    if (!result) return;
    try {
      await navigator.share({
        title: "Votre accès Virage",
        text: `Bonjour ${result.name}, voici votre lien pour activer votre compte Virage :`,
        url: result.inviteLink,
      });
    } catch {
      // partage annulé
    }
  }

  return (
    <Dialog open={Boolean(result)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {result && (
          <>
            <DialogHeader>
              <DialogTitle>Lien d&apos;activation de {result.name}</DialogTitle>
              <DialogDescription>Valable 7 jours. Il permet de choisir son mot de passe.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-6 pt-5 pb-2">
              {result.emailSent ? (
                <p className="flex items-start gap-2.5 rounded-xl bg-success-soft px-3.5 py-3 text-[13px] text-success">
                  <MailCheck className="mt-0.5 size-4 shrink-0" />
                  <span>Email envoyé à {result.email}. Vous pouvez aussi lui transmettre le lien directement.</span>
                </p>
              ) : (
                <p className="flex items-start gap-2.5 rounded-xl bg-warning-soft px-3.5 py-3 text-[13px] text-warning">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>L&apos;email n&apos;a pas pu partir. Transmettez ce lien vous-même à {result.email}.</span>
                </p>
              )}
              <div className="flex items-center gap-2 rounded-xl border border-input bg-subtle/60 p-1.5 pl-3">
                <input
                  readOnly
                  value={result.inviteLink}
                  aria-label="Lien d'activation"
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none"
                />
                <Button size="sm" variant={copied ? "outline" : "default"} onClick={() => void copy()}>
                  {copied ? <Check /> : <Copy />} {copied ? "Copié" : "Copier"}
                </Button>
              </div>
            </div>
            <DialogFooter className="mt-3 border-t border-border pt-4">
              {canShare && (
                <Button variant="outline" onClick={() => void share()}>
                  <Share2 /> Partager
                </Button>
              )}
              <Button onClick={onClose}>Terminé</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
