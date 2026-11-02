import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { SignatureData } from '@/components/signature-pad';
import { school, student } from '@/data/mock';

export const contractArticles = [
  { title: 'Objet du contrat', body: 'Formation à la conduite en vue de l’obtention du permis B, conformément à l’arrêté du 13 mai 2013 relatif au contrat type d’enseignement de la conduite.' },
  { title: 'Programme et calendrier', body: 'Évaluation de départ, formation théorique (code) et pratique (20 h minimum), suivie dans le livret d’apprentissage numérique.' },
  { title: 'Prix et paiement', body: 'Prix total de 1 350 € TTC, payable comptant ou en 3 échéances de 450 € sans frais.' },
  { title: 'Annulation des leçons', body: 'Toute leçon non décommandée 48 h à l’avance est due, sauf motif légitime justifié.' },
  { title: 'Rétractation et résiliation', body: 'Délai de rétractation de 14 jours. Résiliation possible à tout moment, les prestations effectuées restant dues.' },
];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Contrat mis en page en HTML, converti en PDF par expo-print */
export function contractHtml({ permis, formule, signature, signedAt }: { permis: string; formule: string; signature?: SignatureData; signedAt?: string | null }) {
  const sig =
    signature && signature.paths.length && signature.width
      ? `<svg viewBox="0 0 ${signature.width} ${signature.height}" width="260" height="${Math.round((260 * signature.height) / signature.width)}">${signature.paths
          .map((d) => `<path d="${d}" stroke="#14203C" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
          .join('')}</svg>`
      : '<div class="empty">Non signé</div>';
  const rows: [string, string][] = [
    ['Élève', `${student.firstName} ${student.lastName}`],
    ['Né(e) le', student.birthDate],
    ['Adresse', student.address],
    ['Formation', permis],
    ['Formule', formule],
    ['Dossier', student.fileNumber],
    ['Prix total TTC', '1 350 €'],
    ['Modalités', '3 × 450 € sans frais'],
  ];
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
  @page { margin: 36px 40px; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #14203C; font-size: 12px; line-height: 1.55; }
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2D50F5; padding-bottom: 14px; margin-bottom: 22px; }
  .brand { font-size: 26px; font-weight: 800; color: #2D50F5; letter-spacing: -0.5px; }
  .meta { text-align: right; color: #5B6B82; font-size: 11px; }
  h1 { font-size: 20px; margin: 0 0 4px; } .sub { color: #5B6B82; margin: 0 0 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
  td { padding: 7px 10px; border-bottom: 1px solid #E3EAF4; } td:first-child { color: #5B6B82; width: 38%; } td:last-child { font-weight: 600; }
  h2 { font-size: 13px; margin: 16px 0 4px; } p { margin: 0; color: #33415C; }
  .sign { margin-top: 30px; display: flex; gap: 24px; }
  .box { flex: 1; border: 1px solid #E3EAF4; border-radius: 10px; padding: 12px 14px; min-height: 120px; }
  .label { font-size: 10px; font-weight: 700; color: #5B6B82; letter-spacing: .6px; text-transform: uppercase; margin-bottom: 6px; }
  .empty { color: #8A99AF; font-style: italic; padding-top: 30px; }
  .stamp { display: inline-block; margin-top: 14px; padding: 6px 12px; border: 2px solid #2D50F5; border-radius: 8px; color: #2D50F5; font-weight: 800; transform: rotate(-4deg); }
  .foot { margin-top: 28px; color: #8A99AF; font-size: 10px; text-align: center; }
  </style></head><body>
  <div class="head"><div class="brand">${school.name}</div><div class="meta">Auto-école ${school.name} · ${school.city}<br/>${school.phone}</div></div>
  <h1>Contrat d’enseignement de la conduite</h1>
  <p class="sub">Établi conformément à l’arrêté du 13 mai 2013</p>
  <table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
  ${contractArticles.map((a, i) => `<h2>Article ${i + 1} · ${esc(a.title)}</h2><p>${esc(a.body)}</p>`).join('')}
  <div class="sign">
    <div class="box"><div class="label">Pour l’auto-école</div><div class="stamp">${school.name.toUpperCase()} · ${school.city.toUpperCase()}</div></div>
    <div class="box"><div class="label">L’élève${signedAt ? ` · signé le ${esc(signedAt)}` : ''}</div>${sig}</div>
  </div>
  <div class="foot">Document généré par l’application ${school.name} · Signature électronique conforme au règlement eIDAS</div>
  </body></html>`;
}

/** Génère le PDF et ouvre le menu de partage iOS (Enregistrer dans Fichiers, AirDrop, Mail…) */
export async function generateContract(html: string) {
  if (Platform.OS === 'web') return null;
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  return uri;
}

export async function openContract(uri: string | null, html: string) {
  if (!uri) {
    // sur le web : boîte de dialogue d'impression / « Enregistrer en PDF »
    await Print.printAsync({ html });
    return;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Contrat de formation' });
  } else {
    await Print.printAsync({ uri });
  }
}
