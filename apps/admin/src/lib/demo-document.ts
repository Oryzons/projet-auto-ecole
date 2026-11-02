import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { DOCUMENT_LABELS } from "@/lib/constants";
import type { DocumentType } from "@/lib/db/client";
import { toPdfText } from "@/lib/invoice";

const BLUE = rgb(0.176, 0.314, 0.961);
const INK = rgb(0.078, 0.125, 0.235);
const MUTED = rgb(0.42, 0.46, 0.55);
const LINE = rgb(0.88, 0.9, 0.95);

/** Les pièces de la base de démonstration n'ont pas de vrai fichier : on en dessine un. */
export function isDemoFile(fileUrl: string) {
  return fileUrl.startsWith("/demo/");
}

/** Pièce fictive au format A4, pour que l'aperçu fonctionne sans stockage. */
export async function renderDemoDocument(input: { type: DocumentType; fileName: string; studentName: string; uploadedAt: Date }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(toPdfText(`${DOCUMENT_LABELS[input.type]} · ${input.studentName}`));
  const page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const text = (value: string, x: number, y: number, size: number, font = regular, color = INK) =>
    page.drawText(toPdfText(value), { x, y, size, font, color });

  page.drawRectangle({ x: 0, y: 782, width: 595, height: 60, color: BLUE });
  text("virage", 48, 805, 22, bold, rgb(1, 1, 1));
  text("Document de démonstration", 400, 808, 11, regular, rgb(1, 1, 1));

  text(DOCUMENT_LABELS[input.type], 48, 712, 24, bold);
  text(`Élève : ${input.studentName}`, 48, 682, 12, regular, MUTED);
  text(
    `Fichier : ${input.fileName} · déposé le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(input.uploadedAt)}`,
    48,
    664,
    12,
    regular,
    MUTED,
  );

  // cadre qui figure la pièce scannée
  page.drawRectangle({ x: 48, y: 200, width: 499, height: 420, borderColor: LINE, borderWidth: 1.5, color: rgb(0.965, 0.97, 0.985) });
  for (let i = 0; i < 9; i++) {
    const width = i % 3 === 2 ? 260 : 400;
    page.drawRectangle({ x: 88, y: 560 - i * 34, width, height: 10, color: LINE });
  }
  text("Aperçu d'exemple", 230, 228, 13, bold, MUTED);

  text("Ce fichier est généré pour la démonstration : aucune vraie pièce n'est stockée.", 48, 150, 10, regular, MUTED);
  return pdf.save();
}
