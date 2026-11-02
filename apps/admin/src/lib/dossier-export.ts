import {
  APPLICATION_STATUS_LABELS,
  DOCUMENT_LABELS,
  PAYMENT_METHOD_LABELS,
  PERMIT_TYPES,
} from "@/lib/constants";
import { formatCandidateAddress } from "@/lib/candidate-schema";
import { paymentCoverage } from "@/lib/payment";
import { formatCurrency, formatDate } from "@/lib/utils";
import JSZip from "jszip";
import Papa from "papaparse";
import writeXlsxFile from "write-excel-file/node";

export const DOSSIER_EXPORT_FORMATS = ["csv", "xlsx", "zip"] as const;

export type DossierExportFormat = (typeof DOSSIER_EXPORT_FORMATS)[number];

const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "En vérification",
  APPROVED: "Validé",
  REJECTED: "Refusé",
};

export type ExportableApplication = {
  id: string;
  status: string;
  permitType: string;
  partnerRate: boolean;
  discountCode?: string | null;
  totalAmount: number | null;
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    street: string | null;
    postalCode: string | null;
    city: string | null;
    dateOfBirth: Date | string | null;
    oedippNumber: string | null;
    profilePhotoUrl: string | null;
  };
  documents: {
    type: string;
    status: string;
    fileUrl: string;
    fileName: string;
    mimeType?: string | null;
    rejectionReason?: string | null;
  }[];
  payments: {
    status: string;
    amount?: number;
    method?: string | null;
    installmentCount?: number | null;
    installmentIndex?: number | null;
    paidAt: Date | string | null;
  }[];
};

export type ExportRow = {
  Dossier: string;
  Nom: string;
  Prénom: string;
  Email: string;
  Téléphone: string;
  Adresse: string;
  "Date de naissance": string;
  "Numéro NEPH": string;
  Permis: string;
  Tarif: string;
  Statut: string;
  Paiement: string;
  "Mode de paiement": string;
  "Date de paiement": string;
  Montant: string;
  Documents: string;
};

function permitLabel(value: string) {
  return PERMIT_TYPES.find((item) => item.value === value)?.label ?? value;
}

function documentLabel(type: string) {
  return DOCUMENT_LABELS[type as keyof typeof DOCUMENT_LABELS] ?? type;
}

function birthLabel(value: Date | string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
    new Date(value),
  );
}

function completedPayments(application: ExportableApplication) {
  return application.payments.filter((payment) => payment.status === "COMPLETED");
}

export function toExportRow(application: ExportableApplication): ExportRow {
  const candidate = application.candidate;
  const payments = completedPayments(application);
  const coverage = paymentCoverage(
    payments.map((payment) => ({ status: payment.status, amount: payment.amount ?? 0 })),
    application.totalAmount,
  );
  const paymentLabel = coverage.fullyPaid ? "Payé" : coverage.partial ? "Partiel" : "Non payé";
  const documents = application.documents
    .map(
      (document) =>
        `${documentLabel(document.type)} (${DOCUMENT_STATUS_LABELS[document.status] ?? document.status})`,
    )
    .join(" ; ");

  return {
    Dossier: application.id.slice(0, 8).toUpperCase(),
    Nom: candidate.lastName,
    Prénom: candidate.firstName,
    Email: candidate.email,
    Téléphone: candidate.phone ?? "",
    Adresse: formatCandidateAddress(candidate),
    "Date de naissance": birthLabel(candidate.dateOfBirth),
    "Numéro NEPH": candidate.oedippNumber ?? "",
    Permis: permitLabel(application.permitType),
    Tarif: application.partnerRate ? "Partenaire" : application.discountCode ? `Code ${application.discountCode}` : "Standard",
    Statut: APPLICATION_STATUS_LABELS[application.status] ?? application.status,
    Paiement: paymentLabel,
    "Mode de paiement": payments
      .map((payment) => {
        const method = payment.method
          ? (PAYMENT_METHOD_LABELS[payment.method] ?? payment.method)
          : "";
        const slice =
          payment.installmentIndex && payment.installmentCount
            ? `versement ${payment.installmentIndex}/${payment.installmentCount}`
            : "";
        return [method, slice].filter(Boolean).join(" ");
      })
      .filter(Boolean)
      .join(" ; "),
    "Date de paiement": payments
      .map((payment) => (payment.paidAt ? formatDate(payment.paidAt) : ""))
      .filter(Boolean)
      .join(" ; "),
    Montant: coverage.partial
      ? `${formatCurrency(coverage.paidAmount)} / ${formatCurrency(coverage.total || application.totalAmount || 0)}`
      : application.totalAmount
        ? formatCurrency(application.totalAmount)
        : "",
    Documents: documents,
  };
}

export function exportFileBaseName(date = new Date()) {
  return `dossiers-${date.toISOString().slice(0, 10)}`;
}

export function toCsv(applications: ExportableApplication[]) {
  const csv = Papa.unparse(applications.map(toExportRow), { header: true, escapeFormulae: true });
  return `\uFEFF${csv}`;
}

export async function toXlsx(applications: ExportableApplication[]) {
  const rows = applications.map(toExportRow);
  const headers = rows[0] ? (Object.keys(rows[0]) as (keyof ExportRow)[]) : [];
  const sheet = [
    headers,
    ...rows.map((row) => headers.map((header) => row[header])),
  ];
  const workbook = writeXlsxFile(sheet, { sheet: "Dossiers" });
  return workbook.toBuffer();
}

function safeSegment(value: string) {
  const cleaned = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned.slice(0, 70) || "dossier";
}

function extensionOf(fileName: string, mimeType?: string | null) {
  const fromName = fileName.match(/\.([a-zA-Z0-9]{1,8})$/)?.[1];
  if (fromName) return fromName.toLowerCase();
  if (mimeType?.includes("pdf")) return "pdf";
  if (mimeType?.includes("png")) return "png";
  if (mimeType?.includes("jpeg") || mimeType?.includes("jpg")) return "jpg";
  if (mimeType?.includes("webp")) return "webp";
  return "bin";
}

function uniqueName(base: string, used: Set<string>) {
  let name = base;
  let index = 2;
  while (used.has(name)) {
    name = `${base}-${index}`;
    index += 1;
  }
  used.add(name);
  return name;
}

function informationText(application: ExportableApplication, missingFiles: string[]) {
  const row = toExportRow(application);
  const lines = [
    `Dossier ${row.Dossier}`,
    `Nom : ${row.Nom}`,
    `Prénom : ${row.Prénom}`,
    `Email : ${row.Email}`,
    `Téléphone : ${row.Téléphone || "—"}`,
    `Adresse : ${row.Adresse || "—"}`,
    `Date de naissance : ${row["Date de naissance"] || "—"}`,
    `Numéro NEPH : ${row["Numéro NEPH"] || "—"}`,
    `Permis : ${row.Permis}`,
    `Tarif : ${row.Tarif}`,
    `Statut : ${row.Statut}`,
    `Paiement : ${row.Paiement}`,
    `Mode de paiement : ${row["Mode de paiement"] || "—"}`,
    `Date de paiement : ${row["Date de paiement"] || "—"}`,
    `Montant : ${row.Montant || "—"}`,
    "",
    "Documents",
  ];

  if (application.documents.length === 0) {
    lines.push("Aucun document déposé");
  } else {
    for (const document of application.documents) {
      const status =
        DOCUMENT_STATUS_LABELS[document.status] ?? document.status;
      const reason = document.rejectionReason
        ? ` — motif : ${document.rejectionReason}`
        : "";
      lines.push(
        `- ${documentLabel(document.type)} : ${status} (${document.fileName})${reason}`,
      );
    }
  }

  if (missingFiles.length > 0) {
    lines.push("", "Fichiers non récupérés", ...missingFiles.map((name) => `- ${name}`));
  }

  return lines.join("\n");
}

function readmeText() {
  return [
    "Export Virage",
    "",
    "Ce dossier contient un sous-dossier par élève.",
    "Chaque sous-dossier inclut informations.txt et, lorsqu'ils existent, les fichiers de l'élève dans documents/.",
    "recapitulatif.csv reprend la liste complète.",
    "",
  ].join("\n");
}

/** Seuls les fichiers hébergés chez Uploadthing sont téléchargés côté serveur. */
const FILE_HOST_SUFFIXES = ["utfs.io", ".ufs.sh", ".uploadthing.com"];

export function isDownloadableFileUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return FILE_HOST_SUFFIXES.some(
      (suffix) => parsed.hostname === suffix.replace(/^\./, "") || parsed.hostname.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

export async function toZip(
  applications: ExportableApplication[],
  fetchFile: (url: string) => Promise<Uint8Array | null>,
) {
  const zip = new JSZip();
  const root = exportFileBaseName();
  const usedFolders = new Set<string>();

  zip.file(`${root}/LISEZMOI.txt`, readmeText());
  zip.file(`${root}/recapitulatif.csv`, toCsv(applications));

  for (const application of applications) {
    const candidate = application.candidate;
    const folder = uniqueName(
      safeSegment(`${candidate.lastName}-${candidate.firstName}`),
      usedFolders,
    );
    const base = `${root}/${folder}`;
    const missing: string[] = [];
    const usedFiles = new Set<string>();

    if (
      candidate.profilePhotoUrl &&
      isDownloadableFileUrl(candidate.profilePhotoUrl)
    ) {
      const bytes = await fetchFile(candidate.profilePhotoUrl);
      if (bytes) {
        const ext = extensionOf("photo.jpg", "image/jpeg");
        zip.file(`${base}/photo-profil.${ext}`, bytes);
      } else {
        missing.push("Photo de profil");
      }
    }

    for (const document of application.documents) {
      const label = documentLabel(document.type);
      const ext = extensionOf(document.fileName, document.mimeType);
      const fileName = uniqueName(
        `${safeSegment(label)}.${ext}`,
        usedFiles,
      );

      if (!isDownloadableFileUrl(document.fileUrl)) {
        missing.push(label);
        continue;
      }

      const bytes = await fetchFile(document.fileUrl);
      if (!bytes) {
        missing.push(label);
        continue;
      }

      zip.file(`${base}/documents/${fileName}`, bytes);
    }

    zip.file(`${base}/informations.txt`, informationText(application, missing));
  }

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
}
