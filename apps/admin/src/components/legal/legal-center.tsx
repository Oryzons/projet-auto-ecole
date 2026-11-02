"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  Clock,
  Cookie,
  Database,
  Download,
  FileText,
  Loader2,
  Lock,
  Scale,
  Server,
  ShieldCheck,
  Trash2,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { EASE_OUT } from "@/components/motion/tokens";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import type { CompanyProfile } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Role = "ADMIN" | "CANDIDATE" | "SKIPPER";

const ROLE_LABEL: Record<Role, string> = {
  CANDIDATE: "élève",
  ADMIN: "administrateur",
  SKIPPER: "moniteur",
};

const UPDATED_AT = "16 octobre 2026";

function Section({
  id,
  icon: Icon,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <Card id={id} className="scroll-mt-24 gap-0 overflow-hidden p-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-content`}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-subtle/60 sm:px-5"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-foreground">{title}</span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">{summary}</span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-300", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-content`}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border px-4 py-4 text-sm leading-relaxed text-muted-foreground sm:px-5 [&_strong]:font-medium [&_strong]:text-foreground">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-0.5 px-3.5 py-2.5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
          <dt className="text-[13px] font-medium text-foreground">{label}</dt>
          <dd className="text-[13px]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LegalCenter({
  role,
  orgName,
  company,
  applicationId,
}: {
  role: Role;
  orgName: string;
  company: CompanyProfile;
  /** Dossier de l'élève, pour envoyer une demande à l'auto-école depuis la messagerie. */
  applicationId: string | null;
}) {
  const [open, setOpen] = useState<string | null>("data");
  const [exporting, setExporting] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  const school = company.legalName || orgName || "votre auto-école";
  const address = [company.address, [company.postalCode, company.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const contact = company.email || null;
  const isCandidate = role === "CANDIDATE";

  const toggle = (id: string) => setOpen((current) => (current === id ? null : id));

  async function exportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/profile/export");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Export impossible");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `virage-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Vos données ont été téléchargées");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export impossible");
    } finally {
      setExporting(false);
    }
  }

  async function requestDeletion() {
    if (!applicationId) return;
    if (!window.confirm("Envoyer à votre auto-école une demande de suppression de vos données ?")) return;
    setRequesting(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          content:
            "Demande RGPD : je souhaite la suppression de mes données personnelles (article 17 du RGPD). Merci de me confirmer la prise en compte de ma demande et les données que vous devez conserver pour vos obligations légales.",
        }),
      });
      if (!res.ok) throw new Error();
      setRequested(true);
      toast.success("Demande envoyée à votre auto-école", { description: "Elle vous répondra dans la messagerie." });
    } catch {
      toast.error("La demande n'a pas pu être envoyée. Réessayez depuis la messagerie.");
    } finally {
      setRequesting(false);
    }
  }

  const dataByRole: Record<Role, ReactNode[]> = {
    CANDIDATE: [
      <><strong>Identité et contact</strong> : nom, prénom, email, téléphone, adresse, date de naissance, photo d&apos;identité.</>,
      <><strong>Dossier de permis</strong> : type de permis, numéro NEPH, pièces justificatives (identité, certificat médical, photo…) et leur statut de vérification.</>,
      <><strong>Paiements</strong> : montants, échéances, mode de paiement et factures. Les numéros de carte ne sont jamais stockés par Virage : ils sont traités par Stripe.</>,
      <><strong>Formation</strong> : inscriptions aux séances de code et rappels.</>,
      <><strong>Échanges</strong> : messages avec votre auto-école et historique de votre dossier.</>,
    ],
    SKIPPER: [
      <><strong>Compte</strong> : nom, prénom, email, téléphone et photo de profil.</>,
      <><strong>Activité</strong> : séances de code créés ou animés, et élèves inscrits que vous consultez pour les encadrer.</>,
    ],
    ADMIN: [
      <><strong>Compte</strong> : nom, prénom, email, téléphone et photo de profil.</>,
      <><strong>Activité</strong> : messages envoyés, vérifications de pièces, paiements enregistrés et cours créés, conservés dans l&apos;historique des dossiers.</>,
    ],
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Confidentialité"
        title="Données et mentions légales"
        description={`Ce que nous conservons sur vous en tant que ${ROLE_LABEL[role]}, pourquoi, et comment exercer vos droits.`}
      />

      {/* Actions RGPD */}
      <Card className="gap-4 p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
            <UserCheck className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground">Vos données vous appartiennent</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Téléchargez à tout moment une copie de vos données, ou demandez leur suppression.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={() => void exportData()} disabled={exporting}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />} Télécharger mes données
          </Button>
          {isCandidate && applicationId ? (
            <Button
              variant="outline"
              className="text-danger"
              onClick={() => void requestDeletion()}
              disabled={requesting || requested}
            >
              {requesting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {requested ? "Demande envoyée" : "Demander la suppression"}
            </Button>
          ) : (
            <a
              href={contact ? `mailto:${contact}?subject=${encodeURIComponent("Demande RGPD")}` : undefined}
              aria-disabled={!contact}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-input px-4 text-sm font-medium text-danger shadow-xs transition-colors hover:bg-subtle [&_svg]:size-4",
                !contact && "pointer-events-none opacity-50",
              )}
            >
              <Trash2 /> Demander la suppression
            </a>
          )}
        </div>
        {!isCandidate && (
          <p className="text-xs text-muted-foreground">
            {role === "ADMIN"
              ? "En tant qu'administrateur, vous traitez aussi les demandes des élèves : elles arrivent dans la messagerie, préfixées « Demande RGPD »."
              : "Votre demande est adressée à l'administrateur de l'auto-école."}
          </p>
        )}
      </Card>

      <div className="space-y-3">
        <Section
          id="data"
          icon={Database}
          title="Données collectées"
          summary="Ce que l'application enregistre vous concernant"
          open={open === "data"}
          onToggle={() => toggle("data")}
        >
          <List items={dataByRole[role]} />
          <p>
            Nous enregistrons aussi, pour la sécurité de votre compte, la date de vos connexions et l&apos;adresse IP utilisée
            lors des tentatives de connexion (pour bloquer les attaques), sans les conserver au-delà de quelques heures.
          </p>
        </Section>

        <Section
          id="purposes"
          icon={Scale}
          title="Finalités et bases légales"
          summary="Pourquoi ces données sont traitées"
          open={open === "purposes"}
          onToggle={() => toggle("purposes")}
        >
          <Rows
            rows={[
              ["Préparer et déposer le dossier de permis", "Exécution du contrat de formation (art. 6.1.b RGPD) et obligation réglementaire (dossier NEPH)."],
              ["Encaisser les paiements et facturer", "Exécution du contrat et obligation légale comptable (art. 6.1.c)."],
              ["Organiser les séances de code", "Exécution du contrat de formation."],
              ["Vous envoyer des emails de suivi", "Exécution du contrat : aucun email publicitaire n'est envoyé."],
              ["Sécuriser la plateforme", "Intérêt légitime (art. 6.1.f) : prévenir les accès frauduleux et la surcharge."],
            ]}
          />
          <p>Vos données ne sont ni vendues, ni louées, ni utilisées à des fins publicitaires.</p>
        </Section>

        <Section
          id="retention"
          icon={Clock}
          title="Durées de conservation"
          summary="Combien de temps nous gardons vos données"
          open={open === "retention"}
          onToggle={() => toggle("retention")}
        >
          <Rows
            rows={[
              ["Dossier et pièces", "Pendant la formation, puis jusqu'à l'archivage du dossier par l'auto-école. À l'archivage, les données personnelles du dossier sont anonymisées."],
              ["Factures et paiements", "10 ans, durée imposée par le Code de commerce (art. L123-22)."],
              ["Messages", "Le temps de la relation avec l'auto-école, puis supprimés avec le dossier."],
              ["Compte", "Jusqu'à votre demande de suppression ou la fin de la relation avec l'auto-école."],
              ["Journaux de sécurité", "Quelques heures (limitation des tentatives de connexion)."],
            ]}
          />
        </Section>

        <Section
          id="processors"
          icon={Server}
          title="Hébergement et sous-traitants"
          summary="Où sont stockées vos données et qui y a accès"
          open={open === "processors"}
          onToggle={() => toggle("processors")}
        >
          <p>
            Seuls <strong>{school}</strong> et les personnes qu&apos;elle autorise (administrateurs, moniteurs pour les cours)
            accèdent à vos données. Nous faisons appel à des prestataires techniques, liés par contrat et soumis au RGPD :
          </p>
          <Rows
            rows={[
              ["Hostinger", "Hébergement du site et de la base de données."],
              ["Stripe", "Paiement par carte. Certifié PCI-DSS ; vos données bancaires ne transitent jamais par nos serveurs."],
              ["UploadThing", "Stockage chiffré des pièces justificatives et photos."],
              ["Resend", "Envoi des emails de notification."],
            ]}
          />
          <p>
            Certains prestataires (Stripe, UploadThing, Resend) peuvent traiter des données hors de l&apos;Union européenne,
            notamment aux États-Unis. Ces transferts sont encadrés par le Data Privacy Framework UE–États-Unis ou par les
            clauses contractuelles types de la Commission européenne.
          </p>
        </Section>

        <Section
          id="security"
          icon={Lock}
          title="Sécurité"
          summary="Comment vos données sont protégées"
          open={open === "security"}
          onToggle={() => toggle("security")}
        >
          <List
            items={[
              "Connexion chiffrée (HTTPS) sur tout le site.",
              "Mots de passe chiffrés de façon irréversible (bcrypt) : personne, pas même l'auto-école, ne peut les lire.",
              "Pièces justificatives accessibles uniquement à vous et à votre auto-école.",
              "Limitation des tentatives de connexion et des requêtes pour bloquer les attaques par force brute et la surcharge.",
              "Chaque rôle n'accède qu'aux pages et données dont il a besoin.",
            ]}
          />
        </Section>

        <Section
          id="rights"
          icon={ShieldCheck}
          title="Vos droits"
          summary="Accès, rectification, suppression, portabilité…"
          open={open === "rights"}
          onToggle={() => toggle("rights")}
        >
          <List
            items={[
              <><strong>Accès et portabilité</strong> : le bouton « Télécharger mes données » ci-dessus vous remet une copie complète, dans un format lisible par machine.</>,
              <><strong>Rectification</strong> : modifiez vos informations depuis votre profil, ou demandez-le à l&apos;auto-école.</>,
              <><strong>Suppression</strong> : sur demande, sauf pour les données que la loi nous oblige à conserver (factures).</>,
              <><strong>Opposition et limitation</strong> : vous pouvez vous opposer à un traitement fondé sur l&apos;intérêt légitime.</>,
            ]}
          />
          <p>
            Nous répondons sous un mois. {contact ? <>Contact : <a className="font-medium text-primary hover:underline" href={`mailto:${contact}`}>{contact}</a>. </> : null}
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la{" "}
            <a className="font-medium text-primary hover:underline" href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer">
              CNIL
            </a>
            .
          </p>
        </Section>

        <Section
          id="cookies"
          icon={Cookie}
          title="Cookies"
          summary="Uniquement ce qui est nécessaire au fonctionnement"
          open={open === "cookies"}
          onToggle={() => toggle("cookies")}
        >
          <Rows
            rows={[
              ["Cookie de session", "Vous garde connecté de façon sécurisée (httpOnly). Indispensable : exempté de consentement."],
              ["Stockage local", "Vos notifications et préférences d'affichage, conservées uniquement sur votre appareil."],
            ]}
          />
          <p>Aucun cookie publicitaire, de mesure d&apos;audience ou de réseau social n&apos;est utilisé.</p>
        </Section>

        <Section
          id="legal"
          icon={FileText}
          title="Mentions légales"
          summary="Éditeur, responsable du traitement et hébergeur"
          open={open === "legal"}
          onToggle={() => toggle("legal")}
        >
          <Rows
            rows={[
              ["Responsable du traitement", <>{school}{address ? <><br />{address}</> : null}</>],
              ...(company.siret ? ([["SIRET", company.siret]] as [string, ReactNode][]) : []),
              ...(company.vatNumber ? ([["TVA intracommunautaire", company.vatNumber]] as [string, ReactNode][]) : []),
              ...(contact || company.phone
                ? ([["Contact", [contact, company.phone].filter(Boolean).join(" · ")]] as [string, ReactNode][])
                : []),
              ["Plateforme", "Virage, logiciel de gestion des dossiers de permis de conduire, édité pour le compte de l'auto-école."],
              ["Hébergeur", "Hostinger International Ltd, 61 Lordou Vironos, 6023 Larnaca, Chypre — hostinger.fr"],
            ]}
          />
          {role === "ADMIN" && !company.legalName && (
            <p className="rounded-xl bg-warning-soft px-3 py-2 text-[13px] text-warning">
              Complétez l&apos;identité de l&apos;auto-école (raison sociale, adresse, SIRET, email) dans Paramètres › Auto-école : ces
              mentions s&apos;afficheront ici pour tous les utilisateurs.
            </p>
          )}
        </Section>
      </div>

      <p className="pb-4 text-center text-xs text-muted-foreground">Dernière mise à jour : {UPDATED_AT}</p>
    </div>
  );
}
