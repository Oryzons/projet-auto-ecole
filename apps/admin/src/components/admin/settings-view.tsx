"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  Anchor,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Mail,
  Monitor,
  Send,
  Smartphone,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { EASE_OUT } from "@/components/motion/tokens";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { RelativeTime } from "@/components/ui/relative-time";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAppDialog } from "@/hooks/use-app-dialog";
import { formatIban, isValidBic, isValidIban, normalizeIban } from "@/lib/bank-transfer";
import {
  DEFAULT_BANK_TRANSFER,
  DEFAULT_COMPANY_PROFILE,
  DEFAULT_PERMIT_BRIEFINGS,
  DOCUMENT_LABELS,
  PERMIT_TYPES,
  normalizeDiscountCode,
  type DiscountCode,
  type DiscountKind,
  TEMPLATE_DOWNLOAD_TYPES,
  type BankTransferSettings,
  type CompanyProfile,
  type DocumentGuidance,
  type OrgSettings,
  type TemplateDocumentType,
} from "@/lib/constants";
import { useUploadThing } from "@/lib/uploadthing-client";
import { cn, formatBytes, formatCurrency } from "@/lib/utils";

type SectionId = "general" | "pricing" | "templates" | "stripe" | "emails";

const SECTIONS: { id: SectionId; label: string; description: string; icon: LucideIcon }[] = [
  { id: "general", label: "Auto-école", description: "Identité et mentions des factures", icon: Building2 },
  { id: "pricing", label: "Tarifs et permis", description: "Tarifs, codes et instructions de chaque formation", icon: Anchor },
  { id: "templates", label: "Pièces et consignes", description: "Modèles, consignes et liens pour les élèves", icon: FileText },
  { id: "stripe", label: "Paiement", description: "Virement, carte bancaire et Stripe", icon: CreditCard },
  { id: "emails", label: "Emails", description: "Aperçu et test des emails envoyés", icon: Mail },
];

type SettingsData = {
  organization: { id: string; name: string; slug: string; stripeAccountId: string | null };
  settings: OrgSettings;
};

export function SettingsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get("tab") as SectionId | null;
  const active: SectionId = SECTIONS.some((s) => s.id === requested) ? requested! : "general";

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Chargement impossible");
      return (await res.json()) as SettingsData;
    },
  });

  const select = (id: SectionId) => router.replace(id === "general" ? pathname : `${pathname}?tab=${id}`, { scroll: false });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
      <nav aria-label="Sections des paramètres" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <Segmented
          className="lg:hidden"
          options={SECTIONS.map((s) => ({ value: s.id, label: s.label }))}
          value={active}
          onChange={select}
        />
        <ul className="hidden space-y-1 lg:block">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === active;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => select(section.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    isActive ? "text-primary-strong" : "text-muted-foreground hover:bg-subtle hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="settings-active"
                      className="absolute inset-0 rounded-xl border border-primary/15 bg-primary-soft"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className="relative mt-0.5 size-[18px] shrink-0" />
                  <span className="relative">
                    <span className="block text-sm font-medium">{section.label}</span>
                    <span className={cn("mt-0.5 block text-xs", isActive ? "text-primary-strong/70" : "text-muted-foreground")}>
                      {section.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0">
        {isLoading || !data ? (
          <div className="space-y-5">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="space-y-5"
            >
              {active === "general" && <GeneralSection data={data} />}
              {active === "pricing" && <PricingSection settings={data.settings} />}
              {active === "templates" && <TemplatesSection settings={data.settings} />}
              {active === "emails" && <EmailsSection />}
              {active === "stripe" && (
                <>
                  <BankTransferSection settings={data.settings} />
                  <StripeSection initialAccountId={data.organization.stripeAccountId} settings={data.settings} />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Emails
 * ------------------------------------------------------------------------- */

type EmailsData = {
  status: { configured: boolean; from: string; appUrl: string; testRecipient: string };
  templates: { id: string; label: string; audience: "Élève" | "Équipe"; subject: string }[];
};

function EmailsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-emails"],
    queryFn: async () => {
      const res = await fetch("/api/admin/emails");
      if (!res.ok) throw new Error("Chargement impossible");
      return (await res.json()) as EmailsData;
    },
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const current = data?.templates.find((t) => t.id === selected) ?? data?.templates[0];

  const { data: html, isFetching: loadingPreview } = useQuery({
    queryKey: ["admin-email-preview", current?.id],
    enabled: Boolean(current),
    queryFn: async () => {
      const res = await fetch(`/api/admin/emails/${current!.id}`);
      if (!res.ok) throw new Error("Aperçu indisponible");
      return res.text();
    },
    staleTime: 60_000,
  });

  const sendTest = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/emails/${id}`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      return json as { sent: boolean; to: string };
    },
    onSuccess: (result) =>
      result.sent
        ? toast.success("Email de test envoyé", { description: `Vérifiez la boîte ${result.to}.` })
        : toast.info("Envoi simulé", { description: "Ajoutez RESEND_API_KEY dans le fichier .env pour envoyer de vrais emails." }),
    onError: (error) => toast.error("Envoi impossible", { description: error.message }),
  });

  if (isLoading || !data || !current) {
    return <Skeleton className="h-[640px] rounded-2xl" />;
  }

  const groups = (["Élève", "Équipe"] as const).map((audience) => ({
    audience,
    items: data.templates.filter((t) => t.audience === audience),
  }));

  return (
    <>
      <SectionCard
        title="Envoi des emails"
        description="Les emails partent automatiquement à chaque étape du dossier."
        aside={
          <Badge variant={data.status.configured ? "success" : "warning"} dot>
            {data.status.configured ? "Actif" : "Non configuré"}
          </Badge>
        }
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="min-w-0 rounded-xl border border-border px-4 py-3">
            <dt className="text-xs text-muted-foreground">Expéditeur</dt>
            <dd className="mt-0.5 truncate font-medium text-foreground">{data.status.from}</dd>
          </div>
          <div className="min-w-0 rounded-xl border border-border px-4 py-3">
            <dt className="text-xs text-muted-foreground">Liens des emails vers</dt>
            <dd className="mt-0.5 truncate font-medium text-foreground">{data.status.appUrl}</dd>
          </div>
        </dl>
        {!data.status.configured && (
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Ajoutez votre clé Resend (<code className="rounded bg-secondary px-1 py-0.5 text-xs">RESEND_API_KEY</code>) dans le fichier .env du serveur
            puis redémarrez-le : les emails partiront depuis votre domaine.
          </p>
        )}
      </SectionCard>

      <Card className="gap-0 overflow-hidden p-0">
        <div className="grid min-w-0 lg:grid-cols-[230px_minmax(0,1fr)]">
          <div className="border-b border-border lg:border-r lg:border-b-0">
            <div className="flex gap-2 overflow-x-auto p-3 lg:block lg:max-h-[720px] lg:space-y-4 lg:overflow-y-auto">
              {groups.map((group) => (
                <div key={group.audience} className="contents lg:block">
                  <p className="hidden px-2 pb-1.5 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase lg:block">
                    {group.audience === "Élève" ? "Envoyés aux élèves" : "Envoyés à l'équipe"}
                  </p>
                  {group.items.map((item) => {
                    const isActive = item.id === current.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelected(item.id)}
                        className={cn(
                          "relative shrink-0 rounded-lg px-3 py-2 text-left text-[13px] whitespace-nowrap transition-colors lg:block lg:w-full lg:whitespace-normal",
                          isActive ? "font-medium text-primary-strong" : "text-muted-foreground hover:bg-subtle hover:text-foreground",
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="email-template-active"
                            className="absolute inset-0 rounded-lg bg-primary-soft"
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          />
                        )}
                        <span className="relative">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">Objet</p>
                <p className="truncate text-sm font-semibold text-foreground">{current.subject}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden items-center rounded-lg bg-secondary p-0.5 sm:flex">
                  {(
                    [
                      { value: "desktop", icon: Monitor, label: "Ordinateur" },
                      { value: "mobile", icon: Smartphone, label: "Téléphone" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-label={option.label}
                      title={option.label}
                      onClick={() => setDevice(option.value)}
                      className={cn(
                        "grid size-7 place-items-center rounded-md transition-colors",
                        device === option.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <option.icon className="size-4" />
                    </button>
                  ))}
                </div>
                <Button size="sm" variant="outline" loading={sendTest.isPending} onClick={() => sendTest.mutate(current.id)}>
                  {!sendTest.isPending && <Send />}
                  M&apos;envoyer un test
                </Button>
              </div>
            </div>
            <div className="relative bg-[#eef3fa] px-2 py-4 sm:px-4">
              <motion.div
                animate={{ maxWidth: device === "mobile" ? 390 : 720 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
                className="mx-auto overflow-hidden rounded-xl"
              >
                <iframe
                  key={current.id}
                  title={`Aperçu : ${current.label}`}
                  srcDoc={html ?? ""}
                  sandbox=""
                  className={cn("block h-[680px] w-full bg-[#eef3fa] transition-opacity duration-200", loadingPreview && "opacity-50")}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

/* ----------------------------------------------------------------------------
 * Briques communes
 * ------------------------------------------------------------------------- */

function SectionCard({
  title,
  description,
  children,
  footer,
  aside,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <Card className="gap-0 p-0">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {aside}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
      {footer}
    </Card>
  );
}

/** Pied de carte : apparaît dès qu'il y a des modifications à enregistrer. */
function SaveBar({ dirty, saving, onReset, onSave, disabled }: { dirty: boolean; saving: boolean; onReset: () => void; onSave: () => void; disabled?: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {dirty && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.24, ease: EASE_OUT }}
          className="overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-border bg-subtle/60 px-5 py-3 sm:px-6">
            <p className="text-[13px] text-muted-foreground">Modifications non enregistrées</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onReset} disabled={saving}>
                Annuler
              </Button>
              <Button size="sm" onClick={onSave} loading={saving} disabled={disabled}>
                Enregistrer
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useSaveSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: OrgSettings) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(res.status === 400 ? (json.error ?? "Certaines valeurs sont invalides.") : "Enregistrement impossible.");
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      void queryClient.invalidateQueries({ queryKey: ["finances"] });
      toast.success("Paramètres enregistrés");
    },
    onError: (error) => toast.error("Erreur", { description: error.message }),
  });
}

/* ----------------------------------------------------------------------------
 * Auto-école
 * ------------------------------------------------------------------------- */

const COMPANY_FIELDS: { key: keyof CompanyProfile; label: string; placeholder?: string; wide?: boolean; inputMode?: "numeric" | "email" | "tel" }[] = [
  { key: "legalName", label: "Raison sociale", wide: true },
  { key: "address", label: "Adresse", wide: true },
  { key: "postalCode", label: "Code postal", inputMode: "numeric" },
  { key: "city", label: "Ville" },
  { key: "siret", label: "SIRET", placeholder: "14 chiffres", inputMode: "numeric" },
  { key: "vatNumber", label: "N° de TVA", placeholder: "Facultatif" },
  { key: "email", label: "Email de contact", inputMode: "email" },
  { key: "phone", label: "Téléphone", inputMode: "tel" },
];

function GeneralSection({ data }: { data: SettingsData }) {
  const initial = { ...DEFAULT_COMPANY_PROFILE, ...data.settings.company };
  const [company, setCompany] = useState<CompanyProfile>(initial);
  const save = useSaveSettings();
  const dirty = JSON.stringify(company) !== JSON.stringify(initial);

  return (
    <>
      <SectionCard title="Votre auto-école" description="Ces informations identifient votre espace Virage.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" htmlFor="org-name">
            <Input id="org-name" value={data.organization.name} readOnly className="bg-subtle text-muted-foreground" />
          </Field>
          <Field label="Identifiant" htmlFor="org-slug">
            <Input id="org-slug" value={data.organization.slug} readOnly className="bg-subtle font-mono text-[13px] text-muted-foreground" />
          </Field>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Pour changer le nom de l&apos;auto-école, contactez le support.</p>
      </SectionCard>

      <SectionCard
        title="Mentions sur les factures"
        description="Reprises sur chaque facture téléchargée par vos élèves."
        footer={
          <SaveBar
            dirty={dirty}
            saving={save.isPending}
            onReset={() => setCompany(initial)}
            onSave={() => save.mutate({ ...data.settings, company })}
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {COMPANY_FIELDS.map((field) => (
            <Field key={field.key} label={field.label} htmlFor={`company-${field.key}`} className={field.wide ? "sm:col-span-2" : undefined}>
              <Input
                id={`company-${field.key}`}
                value={company[field.key] ?? ""}
                placeholder={field.placeholder}
                inputMode={field.inputMode}
                onChange={(event) => setCompany((prev) => ({ ...prev, [field.key]: event.target.value }))}
              />
            </Field>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Sans numéro de TVA, la facture indique « TVA non applicable, article 293 B du CGI ».
        </p>
      </SectionCard>
    </>
  );
}

/* ----------------------------------------------------------------------------
 * Tarifs et permis
 * ------------------------------------------------------------------------- */

const toEuros = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
function toCents(value: string) {
  const parsed = Number.parseFloat(value.replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : NaN;
}

type CodeDraft = {
  key: string;
  code: string;
  label: string;
  kind: DiscountKind;
  value: string;
};

function describeCodes(drafts: CodeDraft[]): { error?: string; codes: DiscountCode[] } {
  const codes: DiscountCode[] = [];
  const seen = new Set<string>();
  for (const draft of drafts) {
    const code = normalizeDiscountCode(draft.code);
    if (!code && !draft.value.trim() && !draft.label.trim()) continue;
    if (code.length < 2 || !/^[A-Z0-9_-]+$/.test(code)) {
      return { error: "Un code contient au moins 2 lettres, chiffres ou tirets.", codes: [] };
    }
    if (seen.has(code)) return { error: `Le code ${code} est en double.`, codes: [] };
    seen.add(code);
    if (draft.kind === "percent") {
      if (!/^\d+$/.test(draft.value.trim())) return { error: `Pourcentage invalide pour ${code}.`, codes: [] };
      const value = Number(draft.value.trim());
      if (value < 1 || value > 100) return { error: `Le pourcentage de ${code} doit être entre 1 et 100.`, codes: [] };
      codes.push({ code, label: draft.label.trim(), kind: "percent", value });
    } else {
      const cents = toCents(draft.value);
      if (!Number.isFinite(cents) || cents < 1) return { error: `Montant invalide pour ${code}.`, codes: [] };
      codes.push({ code, label: draft.label.trim(), kind: "amount", value: cents });
    }
  }
  return { codes };
}

function PricingSection({ settings }: { settings: OrgSettings }) {
  const initialPrices = Object.fromEntries(
    PERMIT_TYPES.map((permit) => {
      const row = settings.permitPrices[permit.value];
      return [
        permit.value,
        {
          standard: toEuros(row?.standard ?? settings.standardPrice),
          partner: toEuros(row?.partner ?? settings.partnerPrice),
        },
      ];
    }),
  ) as Record<string, { standard: string; partner: string }>;
  const initialStamp = toEuros(settings.fiscalStampPrice);
  const [prices, setPrices] = useState(initialPrices);
  const [stamp, setStamp] = useState(initialStamp);
  const [permits, setPermits] = useState<string[]>(settings.permitTypes);
  const initialBriefings = Object.fromEntries(
    PERMIT_TYPES.map((permit) => [permit.value, settings.permitBriefings[permit.value] ?? ""]),
  ) as Record<string, string>;
  const initialCodes: CodeDraft[] = settings.discountCodes.map((code, index) => ({
    key: `${code.code}-${index}`,
    code: code.code,
    label: code.label,
    kind: code.kind,
    value: code.kind === "amount" ? toEuros(code.value) : String(code.value),
  }));
  const [briefings, setBriefings] = useState(initialBriefings);
  const [codes, setCodes] = useState(initialCodes);
  const [codeKey, setCodeKey] = useState(settings.discountCodes.length);
  const save = useSaveSettings();
  const parsedCodes = describeCodes(codes);

  const parsed = Object.fromEntries(
    PERMIT_TYPES.map((permit) => [
      permit.value,
      { standard: toCents(prices[permit.value].standard), partner: toCents(prices[permit.value].partner) },
    ]),
  ) as Record<string, { standard: number; partner: number }>;
  const stampCents = toCents(stamp);
  const invalid = Number.isNaN(stampCents) || Object.values(parsed).some((row) => Number.isNaN(row.standard) || Number.isNaN(row.partner));
  const dirty =
    stamp !== initialStamp ||
    JSON.stringify(prices) !== JSON.stringify(initialPrices) ||
    JSON.stringify(briefings) !== JSON.stringify(initialBriefings) ||
    JSON.stringify(codes) !== JSON.stringify(initialCodes) ||
    [...permits].sort().join() !== [...settings.permitTypes].sort().join();

  function savePricing() {
    if (parsedCodes.error) return;
    const main = parsed["permis-b"];
    save.mutate({
      ...settings,
      permitTypes: permits,
      permitPrices: parsed,
      permitBriefings: Object.fromEntries(PERMIT_TYPES.map((permit) => [permit.value, briefings[permit.value].trim()])),
      discountCodes: parsedCodes.codes,
      standardPrice: main.standard,
      partnerPrice: main.partner,
      fiscalStampPrice: stampCents,
    });
  }

  return (
    <SectionCard
      title="Tarifs par permis"
      description="Chaque formation a son tarif, ses instructions d'accueil, et les codes de réduction proposés à l'inscription. Les montants s'appliquent aux dossiers qui n'ont pas encore été payés."
      footer={
        <SaveBar
          dirty={dirty}
          saving={save.isPending}
          disabled={invalid || permits.length === 0 || Boolean(parsedCodes.error)}
          onReset={() => {
            setPrices(initialPrices);
            setStamp(initialStamp);
            setPermits(settings.permitTypes);
            setBriefings(initialBriefings);
            setCodes(initialCodes);
          }}
          onSave={savePricing}
        />
      }
    >
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        {PERMIT_TYPES.map((permit) => {
          const checked = permits.includes(permit.value);
          const row = parsed[permit.value];
          const saving = !invalid && row.standard > row.partner ? row.standard - row.partner : 0;
          return (
            <li key={permit.value} className="px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-3">
                  <span className={cn("grid size-9 place-items-center rounded-lg transition-colors", checked ? "bg-primary-soft text-primary" : "bg-subtle text-muted-foreground")}>
                    <Anchor className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-foreground">{permit.label}</span>
                    <span className="text-xs text-muted-foreground">{checked ? "Proposé aux nouveaux dossiers" : "Masqué à la création"}</span>
                  </span>
                </span>
                <Switch
                  checked={checked}
                  onCheckedChange={(value) =>
                    setPermits((prev) => (value ? [...prev, permit.value] : prev.filter((item) => item !== permit.value)))
                  }
                  aria-label={`Proposer ${permit.label}`}
                />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { key: "standard" as const, label: "Tarif standard", hint: "Élève hors partenariat" },
                    { key: "partner" as const, label: "Tarif partenaire", hint: "Structure partenaire" },
                  ]
                ).map((field) => {
                  const value = row[field.key];
                  return (
                    <Field key={field.key} label={field.label} htmlFor={`price-${permit.value}-${field.key}`} hint={field.hint} error={Number.isNaN(value) ? "Montant invalide" : undefined}>
                      <div className="relative">
                        <Input
                          id={`price-${permit.value}-${field.key}`}
                          inputMode="decimal"
                          value={prices[permit.value][field.key]}
                          onChange={(event) =>
                            setPrices((prev) => ({
                              ...prev,
                              [permit.value]: { ...prev[permit.value], [field.key]: event.target.value },
                            }))
                          }
                          className="pr-8 text-right font-medium tabular"
                        />
                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                      </div>
                    </Field>
                  );
                })}
              </div>
              {saving > 0 && (
                <p className="mt-3 rounded-lg bg-primary-soft px-3 py-2 text-[13px] text-primary-strong">
                  Un partenaire économise {formatCurrency(saving)} sur le {permit.label.toLowerCase()}.
                </p>
              )}
              <Field
                className="mt-3"
                label="Instructions après l'inscription"
                htmlFor={`briefing-${permit.value}`}
                hint="Affichées à l'élève à sa première connexion. Vide : le texte par défaut est utilisé. Une ligne qui commence par # devient un titre, une ligne qui commence par - une puce."
              >
                <Textarea
                  id={`briefing-${permit.value}`}
                  value={briefings[permit.value] ?? ""}
                  rows={6}
                  maxLength={4000}
                  className="field-sizing-fixed h-36 resize-y"
                  placeholder={DEFAULT_PERMIT_BRIEFINGS[permit.value]}
                  onChange={(event) => setBriefings((prev) => ({ ...prev, [permit.value]: event.target.value }))}
                />
              </Field>
            </li>
          );
        })}
      </ul>
      {permits.length === 0 && <p className="mt-3 text-xs text-danger">Gardez au moins un permis actif.</p>}

      <div className="mt-5 max-w-xs">
        <Field label="Timbre fiscal" htmlFor="price-stamp" hint="Inclus dans les tarifs ci-dessus" error={Number.isNaN(stampCents) ? "Montant invalide" : undefined}>
          <div className="relative">
            <Input
              id="price-stamp"
              inputMode="decimal"
              value={stamp}
              onChange={(event) => setStamp(event.target.value)}
              className="pr-8 text-right font-medium tabular"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">€</span>
          </div>
        </Field>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-sm font-medium text-foreground">Codes de réduction</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Proposés à l&apos;inscription, à la place du tarif partenaire. La réduction s&apos;applique au tarif standard du permis choisi.
        </p>
        {codes.length === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-3 text-[13px] text-muted-foreground">
            Aucun code pour l&apos;instant. Les élèves voient alors le tarif standard ou partenaire.
          </p>
        )}
        <ul className={cn("space-y-3", codes.length > 0 && "mt-4")}>
          {codes.map((draft, index) => (
            <li key={draft.key} className="rounded-xl border border-border p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Code" htmlFor={`code-${draft.key}`}>
                  <Input
                    id={`code-${draft.key}`}
                    value={draft.code}
                    onChange={(event) =>
                      setCodes((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, code: event.target.value.toUpperCase() } : item)))
                    }
                    placeholder="ETE2026"
                    className="uppercase"
                    maxLength={40}
                  />
                </Field>
                <Field label="Libellé" htmlFor={`code-label-${draft.key}`} hint="Facultatif, visible après vérification">
                  <Input
                    id={`code-label-${draft.key}`}
                    value={draft.label}
                    onChange={(event) =>
                      setCodes((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, label: event.target.value } : item)))
                    }
                    placeholder="Offre été"
                    maxLength={80}
                  />
                </Field>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-end">
                <Segmented
                  size="sm"
                  value={draft.kind}
                  onChange={(kind) => setCodes((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, kind } : item)))}
                  options={[
                    { value: "amount", label: "€" },
                    { value: "percent", label: "%" },
                  ]}
                />
                <Field label={draft.kind === "percent" ? "Pourcentage" : "Montant"} htmlFor={`code-value-${draft.key}`}>
                  <div className="relative">
                    <Input
                      id={`code-value-${draft.key}`}
                      inputMode="decimal"
                      value={draft.value}
                      onChange={(event) =>
                        setCodes((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, value: event.target.value } : item)))
                      }
                      placeholder={draft.kind === "percent" ? "10" : "20,00"}
                      className="pr-8 text-right font-medium tabular"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                      {draft.kind === "percent" ? "%" : "€"}
                    </span>
                  </div>
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger"
                  onClick={() => setCodes((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 /> Retirer
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {parsedCodes.error && <p className="mt-3 text-xs font-medium text-danger">{parsedCodes.error}</p>}
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={() => {
            const key = `new-${codeKey}`;
            setCodeKey((current) => current + 1);
            setCodes((prev) => [...prev, { key, code: "", label: "", kind: "amount", value: "" }]);
          }}
        >
          <Plus /> Ajouter un code
        </Button>
      </div>
    </SectionCard>
  );
}

/* ----------------------------------------------------------------------------
 * Pièces : modèles et consignes
 * ------------------------------------------------------------------------- */

type TemplateFile = NonNullable<OrgSettings["documentTemplates"]>[TemplateDocumentType];

function TemplatesSection({ settings }: { settings: OrgSettings }) {
  const [open, setOpen] = useState<TemplateDocumentType | null>(null);
  return (
    <SectionCard
      title="Pièces du dossier"
      description="Pour chaque pièce, ajoutez un modèle à télécharger et une consigne (texte ou lien) affichés à l'élève."
    >
      <ul className="space-y-3">
        {TEMPLATE_DOWNLOAD_TYPES.map((type) => (
          <PieceRow
            key={type}
            type={type}
            template={settings.documentTemplates?.[type]}
            guidance={settings.documentGuidance?.[type]}
            open={open === type}
            onToggle={() => setOpen((current) => (current === type ? null : type))}
          />
        ))}
      </ul>
    </SectionCard>
  );
}

function PieceRow({
  type,
  template,
  guidance,
  open,
  onToggle,
}: {
  type: TemplateDocumentType;
  template?: TemplateFile;
  guidance?: DocumentGuidance;
  open: boolean;
  onToggle: () => void;
}) {
  const configured = Boolean(template || guidance?.instructions || guidance?.linkUrl);
  return (
    <li className={cn("overflow-hidden rounded-xl border transition-colors", open ? "border-primary/25 shadow-xs" : "border-border")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-subtle/60"
      >
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", configured ? "bg-primary-soft text-primary" : "bg-subtle text-muted-foreground")}>
          <FileText className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-foreground">{DOCUMENT_LABELS[type]}</span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            {template && <Badge variant="info">Modèle</Badge>}
            {guidance?.instructions && <Badge variant="info">Consigne</Badge>}
            {guidance?.linkUrl && <Badge variant="info">Lien</Badge>}
            {!configured && <span className="text-xs text-muted-foreground">Rien d&apos;ajouté</span>}
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: EASE_OUT }} className="text-muted-foreground">
          <ChevronDown className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-border px-4 pt-4 pb-4">
              <TemplateFileRow type={type} template={template} />
              <GuidanceForm type={type} guidance={guidance} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function TemplateFileRow({ type, template }: { type: TemplateDocumentType; template?: TemplateFile }) {
  const queryClient = useQueryClient();
  const { showConfirm } = useAppDialog();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["settings"] });

  const { startUpload, isUploading } = useUploadThing("orgDocumentTemplateUploader", {
    onUploadProgress: setProgress,
    onClientUploadComplete: () => {
      setProgress(0);
      toast.success("Modèle importé", { description: DOCUMENT_LABELS[type] });
      refresh();
    },
    onUploadError: (error) => {
      setProgress(0);
      toast.error("Échec de l'import", { description: error.message });
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/document-templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: type }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Suppression impossible");
    },
    onSuccess: () => {
      toast.success("Modèle supprimé");
      refresh();
    },
    onError: (error) => toast.error("Erreur", { description: error.message }),
  });

  async function confirmRemove() {
    const ok = await showConfirm({
      title: "Supprimer ce modèle ?",
      description: "Les élèves ne pourront plus le télécharger tant qu'un nouveau fichier n'aura pas été importé.",
      confirmLabel: "Supprimer",
      variant: "destructive",
    });
    if (ok) remove.mutate();
  }

  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-foreground">Modèle à télécharger</p>
      <div className="relative flex flex-wrap items-center gap-3 overflow-hidden rounded-lg bg-subtle px-3.5 py-3">
        <p className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
          {template ? (
            <span className="font-medium text-foreground">
              {template.fileName} <span className="font-normal text-muted-foreground">· {formatBytes(template.fileSize)}</span>
            </span>
          ) : (
            "PDF ou image, 8 Mo maximum. Facultatif."
          )}
        </p>
        <input
          ref={input}
          type="file"
          accept="application/pdf,image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void startUpload([file], { documentType: type });
          }}
        />
        <div className="flex items-center gap-1.5">
          {template && (
            <>
              <a href={template.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-card">
                <Eye className="size-3.5" /> Aperçu
              </a>
              <Button size="icon-sm" variant="ghost" aria-label="Supprimer le modèle" onClick={() => void confirmRemove()} disabled={remove.isPending} className="text-muted-foreground hover:bg-danger-soft hover:text-danger">
                <Trash2 />
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => input.current?.click()} disabled={isUploading}>
            {isUploading ? <Loader2 className="animate-spin" /> : template ? <RotateCcw /> : <Upload />}
            {isUploading ? `${Math.round(progress)} %` : template ? "Remplacer" : "Ajouter un modèle"}
          </Button>
        </div>
        {isUploading && (
          <motion.span className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary" style={{ scaleX: progress / 100 }} />
        )}
      </div>
    </div>
  );
}

function GuidanceForm({ type, guidance }: { type: TemplateDocumentType; guidance?: DocumentGuidance }) {
  const queryClient = useQueryClient();
  const initial = {
    instructions: guidance?.instructions ?? "",
    linkUrl: guidance?.linkUrl ?? "",
    linkLabel: guidance?.linkLabel ?? "",
  };
  const [draft, setDraft] = useState(initial);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const urlInvalid = draft.linkUrl.trim() !== "" && !/^https?:\/\/\S+$/i.test(draft.linkUrl.trim());

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/document-guidance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: type, ...draft }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
    },
    onSuccess: () => {
      toast.success("Consigne enregistrée", { description: DOCUMENT_LABELS[type] });
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (error) => toast.error("Erreur", { description: error.message }),
  });

  const id = `guidance-${type}`;
  return (
    <div className="space-y-3">
      <Field label="Consigne pour l'élève" htmlFor={`${id}-text`} hint="Facultatif. Affichée au-dessus de la zone de dépôt.">
        <Textarea
          id={`${id}-text`}
          rows={3}
          maxLength={1000}
          placeholder="Ex. : photo récente, fond uni clair, visage dégagé, sans lunettes."
          value={draft.instructions}
          onChange={(event) => setDraft((d) => ({ ...d, instructions: event.target.value }))}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Field label="Lien utile" htmlFor={`${id}-url`} error={urlInvalid ? "Le lien doit commencer par https://" : undefined}>
          <Input
            id={`${id}-url`}
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={draft.linkUrl}
            aria-invalid={urlInvalid}
            onChange={(event) => setDraft((d) => ({ ...d, linkUrl: event.target.value }))}
          />
        </Field>
        <Field label="Texte du lien" htmlFor={`${id}-label`}>
          <Input
            id={`${id}-label`}
            maxLength={80}
            placeholder="Ex. : Normes de la photo d'identité"
            value={draft.linkLabel}
            onChange={(event) => setDraft((d) => ({ ...d, linkLabel: event.target.value }))}
          />
        </Field>
      </div>
      <AnimatePresence initial={false}>
        {dirty && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="flex justify-end gap-2"
          >
            <Button size="sm" variant="ghost" onClick={() => setDraft(initial)} disabled={save.isPending}>
              Annuler
            </Button>
            <Button size="sm" onClick={() => save.mutate()} loading={save.isPending} disabled={urlInvalid}>
              Enregistrer la consigne
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Stripe
 * ------------------------------------------------------------------------- */

type StripeStatus = {
  platformConfigured: boolean;
  stripeAccountId: string | null;
  account: { id: string; valid: boolean; businessName: string | null; email: string | null; chargesEnabled: boolean; detailsSubmitted: boolean } | null;
  sync: { lastSyncedAt: string | null; pendingPayments: number; isSynchronized: boolean };
};

/* ----------------------------------------------------------------------------
 * Virement bancaire
 * ------------------------------------------------------------------------- */

function BankTransferSection({ settings }: { settings: OrgSettings }) {
  const save = useSaveSettings();
  const initial: BankTransferSettings = {
    ...DEFAULT_BANK_TRANSFER,
    ...settings.bankTransfer,
    iban: formatIban(settings.bankTransfer?.iban ?? ""),
  };
  const [form, setForm] = useState<BankTransferSettings>(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const ibanError = form.iban.trim() && !isValidIban(form.iban) ? "IBAN invalide, vérifiez les chiffres" : undefined;
  const bicError = form.bic.trim() && !isValidBic(form.bic) ? "BIC invalide (8 ou 11 caractères)" : undefined;
  const complete = Boolean(form.holder.trim() && form.iban.trim() && !ibanError && !bicError);

  function persist(next: BankTransferSettings) {
    save.mutate(
      { ...settings, bankTransfer: { ...next, iban: normalizeIban(next.iban), bic: next.bic.trim().toUpperCase() } },
      { onSuccess: () => setForm({ ...next, iban: formatIban(next.iban), bic: next.bic.trim().toUpperCase() }) },
    );
  }

  return (
    <SectionCard
      title="Virement bancaire"
      description="Sans frais. L'élève voit vos coordonnées et une référence propre à son dossier. Vous confirmez la réception dans Finances, la facture part alors automatiquement."
      footer={
        <SaveBar
          dirty={dirty}
          saving={save.isPending}
          disabled={Boolean(ibanError || bicError) || (form.enabled && !complete)}
          onReset={() => setForm(initial)}
          onSave={() => persist(form)}
        />
      }
    >
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border px-4 py-3.5 transition-colors hover:bg-subtle/60">
        <span>
          <span className="block text-sm font-medium text-foreground">Proposer le paiement par virement</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {complete ? "Affiché en premier sur la page de paiement de l'élève." : "Renseignez d'abord le titulaire et l'IBAN."}
          </span>
        </span>
        <Switch
          checked={form.enabled}
          disabled={save.isPending || (!form.enabled && !complete)}
          onCheckedChange={(value) => (dirty ? setForm({ ...form, enabled: value }) : persist({ ...form, enabled: value }))}
        />
      </label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Titulaire du compte" htmlFor="bt-holder" className="sm:col-span-2">
          <Input id="bt-holder" value={form.holder} maxLength={120} placeholder="Nom de l'auto-école" onChange={(e) => setForm({ ...form, holder: e.target.value })} />
        </Field>
        <Field label="IBAN" htmlFor="bt-iban" error={ibanError}>
          <Input
            id="bt-iban"
            value={form.iban}
            maxLength={42}
            autoComplete="off"
            spellCheck={false}
            placeholder="FR76 0000 0000 0000 0000 0000 000"
            aria-invalid={Boolean(ibanError)}
            className="font-mono text-[13px]"
            onChange={(e) => setForm({ ...form, iban: e.target.value.toUpperCase() })}
            onBlur={() => !ibanError && setForm((f) => ({ ...f, iban: formatIban(f.iban) }))}
          />
        </Field>
        <Field label="BIC" htmlFor="bt-bic" error={bicError} hint="Facultatif">
          <Input
            id="bt-bic"
            value={form.bic}
            maxLength={11}
            autoComplete="off"
            spellCheck={false}
            placeholder="BNPAFRPPXXX"
            aria-invalid={Boolean(bicError)}
            className="font-mono text-[13px]"
            onChange={(e) => setForm({ ...form, bic: e.target.value.toUpperCase().replace(/\s/g, "") })}
          />
        </Field>
      </div>
    </SectionCard>
  );
}

function StripeSection({ initialAccountId, settings }: { initialAccountId: string | null; settings: OrgSettings }) {
  const queryClient = useQueryClient();
  const saveSettings = useSaveSettings();
  const [accountId, setAccountId] = useState(initialAccountId ?? "");

  const { data: status, isLoading } = useQuery<StripeStatus>({
    queryKey: ["stripe-status"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/status");
      if (!res.ok) throw new Error("Statut indisponible");
      return res.json();
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["stripe-status"] });
    void queryClient.invalidateQueries({ queryKey: ["settings"] });
  };

  const saveAccount = useMutation({
    mutationFn: async (stripeAccountId: string | null) => {
      const res = await fetch("/api/settings/stripe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeAccountId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Compte invalide");
    },
    onSuccess: (_data, stripeAccountId) => {
      toast.success(stripeAccountId ? "Compte Stripe enregistré" : "Compte Stripe déconnecté");
      invalidate();
    },
    onError: (error) => toast.error("Enregistrement impossible", { description: error.message }),
  });

  const sync = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/sync", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Synchronisation impossible");
      return json as { synced: number };
    },
    onSuccess: (result) => {
      toast.success("Stripe synchronisé", { description: result.synced ? `${result.synced} paiement(s) mis à jour.` : "Tout était déjà à jour." });
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ["finances"] });
    },
    onError: (error) => toast.error("Synchronisation impossible", { description: error.message }),
  });

  if (isLoading || !status) return <Skeleton className="h-80 rounded-2xl" />;

  const connected = Boolean(status.stripeAccountId && status.account?.valid);
  const trimmed = accountId.trim();
  const dirty = trimmed !== (initialAccountId ?? "");

  return (
    <>
      <SectionCard
        title="Compte Stripe"
        description="Les paiements en ligne de vos élèves sont versés sur ce compte."
        aside={
          !status.platformConfigured ? (
            <Badge variant="danger" dot>Indisponible</Badge>
          ) : connected ? (
            <Badge variant="success" dot>Connecté</Badge>
          ) : (
            <Badge variant="warning" dot>À configurer</Badge>
          )
        }
        footer={
          <SaveBar
            dirty={dirty}
            saving={saveAccount.isPending}
            disabled={!status.platformConfigured || (trimmed !== "" && !trimmed.startsWith("acct_"))}
            onReset={() => setAccountId(initialAccountId ?? "")}
            onSave={() => saveAccount.mutate(trimmed || null)}
          />
        }
      >
        {!status.platformConfigured && (
          <p className="mb-4 rounded-lg border border-danger/15 bg-danger-soft px-3 py-2.5 text-[13px] text-danger">
            La clé secrète Stripe n&apos;est pas configurée sur le serveur (variable STRIPE_SECRET_KEY).
          </p>
        )}

        {connected && status.account && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-success/20 bg-success-soft/60 px-4 py-3">
            <CheckCircle2 className="size-5 shrink-0 text-success" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{status.account.businessName ?? status.account.email ?? status.account.id}</p>
              <p className="text-xs text-muted-foreground">
                Paiements {status.account.chargesEnabled ? "activés" : "désactivés"} · profil {status.account.detailsSubmitted ? "complet" : "incomplet"}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { setAccountId(""); saveAccount.mutate(null); }} disabled={saveAccount.isPending}>
              Déconnecter
            </Button>
          </div>
        )}

        <Field label="Identifiant du compte Connect" htmlFor="stripe-account-id" error={trimmed && !trimmed.startsWith("acct_") ? "L'identifiant commence par « acct_ »." : undefined}>
          <Input
            id="stripe-account-id"
            placeholder="acct_1XXXXXXXXXXXX"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className="font-mono text-[13px]"
            spellCheck={false}
            disabled={!status.platformConfigured}
          />
        </Field>
        <p className="mt-2 text-xs text-muted-foreground">
          Disponible dans le{" "}
          <a href="https://dashboard.stripe.com/settings/account" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-primary hover:text-primary-strong">
            tableau de bord Stripe <ExternalLink className="size-3" />
          </a>
          .
        </p>
      </SectionCard>

      <SectionCard
        title="Synchronisation"
        description="Récupère les paiements en ligne dont la confirmation ne nous est pas parvenue."
        aside={
          <Button variant="outline" size="sm" onClick={() => sync.mutate()} loading={sync.isPending} disabled={!status.platformConfigured}>
            {!sync.isPending && <RefreshCw />} Synchroniser
          </Button>
        }
      >
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-subtle px-4 py-3">
            <dt className="text-xs text-muted-foreground">Dernière synchronisation</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {status.sync.lastSyncedAt ? <RelativeTime date={status.sync.lastSyncedAt} /> : "Jamais"}
            </dd>
          </div>
          <div className="rounded-xl bg-subtle px-4 py-3">
            <dt className="text-xs text-muted-foreground">Paiements en attente de confirmation</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{status.sync.pendingPayments}</dd>
          </div>
        </dl>
      </SectionCard>
    </>
  );
}
