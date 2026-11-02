import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { PERMIT_TYPES, type CompanyProfile } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export interface InvoiceInput {
  number: string;
  paidAt: Date;
  amountCents: number;
  permitType: string;
  company: CompanyProfile;
  organizationName: string;
  paymentMethod?: string | null;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
  };
}

function money(cents: number) {
  return formatCurrency(cents).replace(/\u202f/g, " ").replace(/\u00a0/g, " ");
}

function formatInvoiceDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function permitLabel(value: string) {
  return PERMIT_TYPES.find((item) => item.value === value)?.label ?? value;
}

// Caractères hors Latin-1 que l'encodage WinAnsi des polices standard sait afficher.
const WIN_ANSI_EXTRA = new Set(
  "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ".split(""),
);

/**
 * Rend un texte affichable avec les polices standard du PDF :
 * les caractères inconnus (Ł, ễ, émojis…) sont remplacés par leur lettre
 * de base ou retirés, au lieu de faire planter la génération.
 */
export function toPdfText(value: string): string {
  return Array.from(value.replace(/[\u202f\u00a0]/g, " "))
    .map((char) => {
      const code = char.codePointAt(0) ?? 0;
      if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)) return char;
      if (WIN_ANSI_EXTRA.has(char)) return char;
      const base = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (base && Array.from(base).every((c) => (c.codePointAt(0) ?? 0) <= 0xff)) return base;
      const fallback: Record<string, string> = { "Ł": "L", "ł": "l", "Đ": "D", "đ": "d", "ı": "i" };
      return fallback[char] ?? "";
    })
    .join("");
}

export async function buildInvoicePdf(input: InvoiceInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Facture ${input.number}`);
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const blue = rgb(0.118, 0.435, 0.851);
  const ink = rgb(0.043, 0.106, 0.2);
  const text = rgb(0.27, 0.33, 0.42);
  const muted = rgb(0.54, 0.59, 0.66);
  const line = rgb(0.9, 0.93, 0.97);
  const soft = rgb(0.95, 0.97, 1);

  type Font = typeof font;
  const draw = (
    value: string,
    x: number,
    y: number,
    options: { size?: number; font?: Font; color?: ReturnType<typeof rgb>; align?: "left" | "right" } = {},
  ) => {
    const f = options.font ?? font;
    const size = options.size ?? 10;
    const safe = toPdfText(value);
    const width = f.widthOfTextAtSize(safe, size);
    page.drawText(safe, {
      x: options.align === "right" ? x - width : x,
      y,
      size,
      font: f,
      color: options.color ?? ink,
    });
  };

  const sellerName = input.company.legalName.trim() || input.organizationName;
  const hasVat = Boolean(input.company.vatNumber.trim());
  const total = input.amountCents;
  const vat = hasVat ? total - Math.round(total / 1.2) : 0;
  const net = total - vat;
  const right = 547;

  // Bandeau
  page.drawRectangle({ x: 0, y: 822, width: 595, height: 20, color: blue });
  page.drawRectangle({ x: 48, y: 760, width: 26, height: 26, color: blue });
  draw(sellerName, 84, 768, { size: 14, font: bold });

  draw("FACTURE", right, 772, { size: 20, font: bold, color: blue, align: "right" });
  draw(input.number, right, 754, { size: 11, font: bold, align: "right" });
  draw(`Réglée le ${formatInvoiceDate(input.paidAt)}`, right, 738, {
    color: muted,
    align: "right",
  });
  if (input.paymentMethod) {
    draw(`Moyen de paiement : ${input.paymentMethod}`, right, 724, {
      color: muted,
      align: "right",
    });
  }

  // Émetteur / client
  page.drawLine({ start: { x: 48, y: 700 }, end: { x: right, y: 700 }, thickness: 1, color: line });
  draw("ÉMETTEUR", 48, 678, { size: 8, font: bold, color: muted });
  draw("FACTURÉ À", 320, 678, { size: 8, font: bold, color: muted });
  draw(sellerName, 48, 660, { size: 11, font: bold });
  draw(input.customer.name, 320, 660, { size: 11, font: bold });

  const sellerLines = [
    input.company.address,
    [input.company.postalCode, input.company.city].filter(Boolean).join(" "),
    input.company.siret ? `SIRET ${input.company.siret}` : "",
    input.company.vatNumber ? `TVA ${input.company.vatNumber}` : "",
    input.company.email,
    input.company.phone,
  ].filter(Boolean);

  const customerLines = [
    input.customer.address ?? "",
    input.customer.email,
    input.customer.phone ?? "",
  ].filter(Boolean);

  sellerLines.forEach((value, index) => draw(value.slice(0, 60), 48, 644 - index * 14, { color: text }));
  customerLines.forEach((value, index) => draw(value.slice(0, 60), 320, 644 - index * 14, { color: text }));

  // Lignes
  let y = 530;
  page.drawRectangle({ x: 48, y: y - 10, width: right - 48, height: 30, color: soft });
  draw("Désignation", 60, y, { size: 9, font: bold, color: text });
  draw(hasVat ? "Montant TTC" : "Montant", right - 12, y, { size: 9, font: bold, color: text, align: "right" });
  y -= 34;
  draw(`Formation permis de conduire : ${permitLabel(input.permitType)}`, 60, y, { size: 11 });
  draw(money(total), right - 12, y, { size: 11, font: bold, align: "right" });
  y -= 18;
  page.drawLine({ start: { x: 48, y }, end: { x: right, y }, thickness: 1, color: line });

  // Totaux
  y -= 34;
  const totals: [string, string][] = hasVat
    ? [
        ["Total HT", money(net)],
        ["TVA 20 %", money(vat)],
      ]
    : [];
  totals.forEach(([label, value]) => {
    draw(label, 380, y, { color: text });
    draw(value, right - 12, y, { align: "right" });
    y -= 20;
  });
  page.drawRectangle({ x: 368, y: y - 12, width: right - 368, height: 32, color: blue });
  draw(hasVat ? "Total TTC" : "Total", 380, y, { size: 12, font: bold, color: rgb(1, 1, 1) });
  draw(money(total), right - 12, y, { size: 12, font: bold, color: rgb(1, 1, 1), align: "right" });

  draw("Facture acquittée.", 48, y, { color: text });

  if (!hasVat) {
    draw("TVA non applicable, article 293 B du CGI.", 48, 110, { size: 9, color: muted });
  }
  page.drawLine({ start: { x: 48, y: 90 }, end: { x: right, y: 90 }, thickness: 1, color: line });
  draw(`${sellerName} · Document édité par Virage`, 48, 72, { size: 9, color: muted });

  return doc.save();
}
