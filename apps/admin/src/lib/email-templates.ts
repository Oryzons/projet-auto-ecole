/**
 * Modèles des emails Virage.
 *
 * Chaque fonction renvoie l'objet, le HTML et les pièces jointes éventuelles.
 * Le HTML suit les contraintes des messageries (Gmail, Outlook, Apple Mail) :
 * mise en page en tableaux, styles en ligne, aucune image SVG. Le logo est
 * joint au message (`cid:`), il s'affiche donc même sans accès au site.
 */

export const LOGO_CID = "virage-logo";

export type EmailAttachment = {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  contentId?: string;
};

export type EmailMessage = {
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
};

export function appUrl(path = "") {
  const base = (process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

/** Échappe le texte saisi par les utilisateurs avant de l'insérer dans un email HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Objet d'email sur une seule ligne. */
export function subjectText(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/* ----------------------------------------------------------------------------
 * Couleurs et thèmes
 * ------------------------------------------------------------------------- */

const C = {
  brand: "#1e6fd9",
  brandDark: "#0b4fa8",
  ink: "#0b1b33",
  text: "#44546a",
  muted: "#8a97a8",
  line: "#e3eaf4",
  page: "#eef3fa",
  white: "#ffffff",
};

type Theme = "brand" | "success" | "warning" | "danger" | "celebrate" | "teal";

const THEMES: Record<Theme, { accent: string; soft: string; ring: string }> = {
  brand: { accent: "#1e6fd9", soft: "#eaf2fe", ring: "#cfe0fb" },
  success: { accent: "#12805c", soft: "#e8f6ef", ring: "#c6ead8" },
  warning: { accent: "#b45309", soft: "#fdf3e4", ring: "#f6dfb9" },
  danger: { accent: "#d33a3f", soft: "#fdeeee", ring: "#f6cfd0" },
  celebrate: { accent: "#7c3aed", soft: "#f3edfe", ring: "#e0d3fb" },
  teal: { accent: "#0e7c86", soft: "#e6f5f6", ring: "#c3e6e9" },
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/* ----------------------------------------------------------------------------
 * Blocs réutilisables
 * ------------------------------------------------------------------------- */

function p(html: string, style = "") {
  return `<p style="margin: 0 0 14px; font-size: 15px; line-height: 1.65; color: ${C.text}; ${style}">${html}</p>`;
}

function button(label: string, href: string, theme: Theme = "brand") {
  const color = theme === "danger" || theme === "warning" ? C.brand : THEMES[theme].accent;
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 26px 0 6px;"><tr>
    <td bgcolor="${color}" style="border-radius: 12px; background: ${color}; box-shadow: 0 6px 16px -8px ${color};">
      <a href="${href}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: ${FONT}; font-size: 15px; font-weight: 600; line-height: 1; color: #ffffff; text-decoration: none; border-radius: 12px;">${escapeHtml(label)}&nbsp;&nbsp;&rarr;</a>
    </td>
  </tr></table>`;
}

function link(label: string, href: string) {
  return `<a href="${href}" target="_blank" style="color: ${C.brand}; font-weight: 600; text-decoration: none;">${escapeHtml(label)}</a>`;
}

/** Liste de couples libellé / valeur, présentée comme une fiche. */
function details(rows: [label: string, valueHtml: string][], theme: Theme = "brand") {
  const t = THEMES[theme];
  const body = rows
    .map(
      ([label, value], index) => `<tr>
        <td style="padding: 11px 16px; ${index > 0 ? `border-top: 1px solid ${t.ring};` : ""} font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: ${C.muted}; white-space: nowrap; vertical-align: top;">${escapeHtml(label)}</td>
        <td style="padding: 11px 16px; ${index > 0 ? `border-top: 1px solid ${t.ring};` : ""} font-size: 14px; font-weight: 600; color: ${C.ink}; text-align: right;">${value}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 18px 0; border: 1px solid ${t.ring}; border-radius: 14px; background: ${t.soft}; border-collapse: separate;">${body}</table>`;
}

function note(html: string, theme: Theme = "brand") {
  const t = THEMES[theme];
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 18px 0;"><tr>
    <td style="padding: 14px 16px; border-radius: 12px; background: ${t.soft}; border: 1px solid ${t.ring}; font-size: 14px; line-height: 1.6; color: ${C.text};">${html}</td>
  </tr></table>`;
}

/** Grand montant façon reçu. */
function amountBlock(amount: string, caption: string, theme: Theme = "success") {
  const t = THEMES[theme];
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0 8px;"><tr>
    <td align="center" style="padding: 22px 16px; border-radius: 16px; background: ${t.soft}; border: 1px dashed ${t.ring};">
      <div style="font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${t.accent};">${escapeHtml(caption)}</div>
      <div style="margin-top: 6px; font-size: 34px; line-height: 1.1; font-weight: 700; letter-spacing: -0.02em; color: ${C.ink};">${escapeHtml(amount)}</div>
    </td>
  </tr></table>`;
}

/** Bulle de message citée. */
function quote(author: string, text: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 18px 0;"><tr>
    <td width="40" valign="top" style="padding-right: 12px;">
      <div style="width: 40px; height: 40px; border-radius: 20px; background: ${THEMES.brand.soft}; color: ${C.brand}; font-size: 14px; font-weight: 700; line-height: 40px; text-align: center;">${escapeHtml(initials(author))}</div>
    </td>
    <td valign="top">
      <div style="font-size: 13px; font-weight: 600; color: ${C.ink}; margin: 2px 0 6px;">${escapeHtml(author)}</div>
      <div style="padding: 13px 16px; border-radius: 4px 16px 16px 16px; background: #f3f6fb; border: 1px solid ${C.line}; font-size: 14px; line-height: 1.6; color: ${C.ink};">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
    </td>
  </tr></table>`;
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "N"
  );
}

/** Étapes numérotées (parcours de l'élève). */
function steps(items: { title: string; text: string; done?: boolean }[], theme: Theme = "brand") {
  const t = THEMES[theme];
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 18px 0 4px;">${items
    .map(
      (item, index) => `<tr>
      <td width="30" valign="top" style="padding: 0 12px ${index === items.length - 1 ? 0 : 14}px 0;">
        <div style="width: 28px; height: 28px; border-radius: 14px; background: ${item.done ? t.accent : t.soft}; color: ${item.done ? "#ffffff" : t.accent}; border: 1px solid ${item.done ? t.accent : t.ring}; font-size: 13px; font-weight: 700; line-height: 28px; text-align: center;">${item.done ? "&#10003;" : index + 1}</div>
      </td>
      <td valign="top" style="padding-bottom: ${index === items.length - 1 ? 0 : 14}px;">
        <div style="font-size: 14px; font-weight: 600; color: ${C.ink}; line-height: 28px;">${escapeHtml(item.title)}</div>
        <div style="font-size: 13px; line-height: 1.55; color: ${C.text};">${escapeHtml(item.text)}</div>
      </td>
    </tr>`,
    )
    .join("")}</table>`;
}

/* ----------------------------------------------------------------------------
 * Gabarit
 * ------------------------------------------------------------------------- */

function layout({
  theme,
  icon,
  eyebrow,
  title,
  preheader,
  body,
  footerNote,
}: {
  theme: Theme;
  icon: string;
  eyebrow: string;
  title: string;
  preheader: string;
  body: string;
  footerNote?: string;
}) {
  const t = THEMES[theme];
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
<style>
  @media (max-width: 600px) {
    .nf-card { padding-left: 22px !important; padding-right: 22px !important; }
    .nf-hero { padding-left: 22px !important; padding-right: 22px !important; }
    .nf-title { font-size: 22px !important; }
  }
</style>
</head>
<body style="margin: 0; padding: 0; background: ${C.page}; font-family: ${FONT}; -webkit-font-smoothing: antialiased;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${escapeHtml(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.page}" style="background: ${C.page};">
    <tr><td align="center" style="padding: 28px 12px 36px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px;">

        <!-- En-tête -->
        <tr><td bgcolor="${C.brand}" style="background: ${C.brand}; background-image: linear-gradient(135deg, ${C.brand} 0%, ${C.brandDark} 100%); border-radius: 20px 20px 0 0; padding: 20px 28px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
            <td style="vertical-align: middle;"><img src="cid:${LOGO_CID}" width="30" height="30" alt="" style="display: block; border: 0; width: 30px; height: 30px;"></td>
            <td style="vertical-align: middle; padding-left: 10px; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff;">Virage</td>
          </tr></table>
        </td></tr>

        <!-- Bandeau du message -->
        <tr><td class="nf-hero" bgcolor="${t.soft}" style="background: ${t.soft}; padding: 30px 40px 26px; border-left: 1px solid ${C.line}; border-right: 1px solid ${C.line};">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
            <td style="width: 52px; height: 52px; border-radius: 16px; background: #ffffff; border: 1px solid ${t.ring}; text-align: center; vertical-align: middle; font-size: 26px; line-height: 52px;">${icon}</td>
          </tr></table>
          <div style="margin-top: 18px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${t.accent};">${escapeHtml(eyebrow)}</div>
          <h1 class="nf-title" style="margin: 6px 0 0; font-size: 25px; line-height: 1.25; font-weight: 700; letter-spacing: -0.02em; color: ${C.ink};">${escapeHtml(title)}</h1>
        </td></tr>

        <!-- Contenu -->
        <tr><td class="nf-card" bgcolor="#ffffff" style="background: #ffffff; padding: 28px 40px 34px; border: 1px solid ${C.line}; border-top: 0; border-radius: 0 0 20px 20px;">
          ${body}
        </td></tr>

        <!-- Pied de page -->
        <tr><td style="padding: 22px 12px 0; text-align: center; font-size: 12px; line-height: 1.7; color: ${C.muted};">
          ${footerNote ? `${footerNote}<br>` : ""}
          <a href="${appUrl("/")}" target="_blank" style="color: ${C.muted}; text-decoration: underline;">Virage</a> · Votre dossier de permis de conduire, simplement.<br>
          Cet email est envoyé automatiquement, merci de ne pas y répondre.
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ----------------------------------------------------------------------------
 * Comptes
 * ------------------------------------------------------------------------- */

const CANDIDATE_JOURNEY = [
  { title: "Déposez vos documents", text: "Photo, pièce d'identité, certificat médical… depuis votre téléphone." },
  { title: "Votre auto-école les vérifie", text: "Vous êtes prévenu dès qu'une pièce est validée ou à refaire." },
  { title: "Réglez votre formation", text: "Par carte ou par virement, la facture est immédiate." },
  { title: "Inscrivez-vous à la séance de code", text: "Choisissez une date dans le calendrier de votre espace." },
];

export function welcomeEmail(name: string): EmailMessage {
  return {
    subject: "Bienvenue à bord ⚓",
    html: layout({
      theme: "brand",
      icon: "⚓",
      eyebrow: "Bienvenue",
      title: `Bienvenue à bord, ${name} !`,
      preheader: "Votre espace élève est prêt : voici les prochaines étapes.",
      body: `${p("Votre espace élève est prêt. Tout votre dossier de permis de conduire se gère au même endroit, à votre rythme.")}
        ${steps(CANDIDATE_JOURNEY)}
        ${button("Accéder à mon espace", appUrl("/dashboard"))}`,
    }),
  };
}

export function candidateInviteEmail(name: string, email: string, activationLink: string): EmailMessage {
  return {
    subject: "Votre dossier permis de conduire est ouvert",
    html: layout({
      theme: "brand",
      icon: "⚓",
      eyebrow: "Votre dossier",
      title: "Votre dossier permis de conduire est ouvert",
      preheader: "Choisissez votre mot de passe pour accéder à votre espace.",
      body: `${p(`Bonjour ${escapeHtml(name)}, votre auto-école a créé votre dossier sur Virage. Il ne reste qu'à choisir votre mot de passe.`)}
        ${button("Activer mon compte", activationLink)}
        ${details([
          ["Identifiant", escapeHtml(email)],
          ["Lien valable", "7 jours, une seule fois"],
        ])}
        ${steps(CANDIDATE_JOURNEY)}`,
    }),
  };
}

export function memberInviteEmail(name: string, email: string, roleLabel: string, activationLink: string): EmailMessage {
  const moniteur = roleLabel.toLowerCase().includes("moniteur");
  return {
    subject: "Vous rejoignez l'équipe sur Virage",
    html: layout({
      theme: "teal",
      icon: moniteur ? "⛵" : "🧭",
      eyebrow: "Invitation",
      title: "Vous rejoignez l'équipe",
      preheader: "Activez votre compte Virage.",
      body: `${p(`Bonjour ${escapeHtml(name)}, votre auto-école vous a ajouté à son équipe sur Virage.`)}
        ${details(
          [
            ["Rôle", escapeHtml(roleLabel)],
            ["Identifiant", escapeHtml(email)],
            ["Lien valable", "7 jours, une seule fois"],
          ],
          "teal",
        )}
        ${p(moniteur ? "Vous aurez accès au calendrier des séances de code : création des dates, suivi des inscrits." : "Vous aurez accès aux dossiers, aux paiements et au calendrier de l'auto-école.")}
        ${button("Activer mon compte", activationLink, "teal")}`,
    }),
  };
}

export function passwordResetEmail(name: string, resetLink: string): EmailMessage {
  return {
    subject: "Réinitialisation de votre mot de passe",
    html: layout({
      theme: "brand",
      icon: "🔑",
      eyebrow: "Sécurité",
      title: "Choisissez un nouveau mot de passe",
      preheader: "Lien de réinitialisation, valable 1 heure.",
      body: `${p(`Bonjour ${escapeHtml(name)}, vous avez demandé à changer votre mot de passe.`)}
        ${button("Choisir un nouveau mot de passe", resetLink)}
        ${note("Ce lien est valable <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.")}`,
    }),
  };
}

/* ----------------------------------------------------------------------------
 * Dossier
 * ------------------------------------------------------------------------- */

export function documentRejectedEmail(docLabel: string, reason: string): EmailMessage {
  return {
    subject: subjectText(`Document à renvoyer : ${docLabel}`),
    html: layout({
      theme: "warning",
      icon: "📄",
      eyebrow: "Action requise",
      title: "Un document est à renvoyer",
      preheader: `${docLabel} : document à renvoyer.`,
      body: `${p(`Votre auto-école n'a pas pu valider ce document. Pas d'inquiétude, il suffit d'en déposer une nouvelle version.`)}
        ${details(
          [
            ["Document", escapeHtml(docLabel)],
            ["Motif", escapeHtml(reason)],
          ],
          "warning",
        )}
        ${p("Astuce : une photo bien éclairée, à plat et sans reflet est validée plus vite.", `font-size: 13px; color: ${C.muted};`)}
        ${button("Déposer un nouveau document", appUrl("/documents"))}`,
    }),
  };
}

export function documentsApprovedEmail(): EmailMessage {
  return {
    subject: "Tous vos documents sont validés ✅",
    html: layout({
      theme: "success",
      icon: "✅",
      eyebrow: "Dossier complet",
      title: "Tous vos documents sont validés",
      preheader: "Votre dossier est complet, le paiement est disponible.",
      body: `${p("Bonne nouvelle : votre auto-école a validé l'ensemble de vos pièces. Votre dossier est complet.")}
        ${steps(
          [
            { title: "Documents déposés", text: "Toutes les pièces sont en ligne.", done: true },
            { title: "Documents validés", text: "Votre auto-école a tout vérifié.", done: true },
            { title: "Paiement", text: "Réglez votre formation par carte ou par virement." },
          ],
          "success",
        )}
        ${button("Régler mon dossier", appUrl("/payment"), "success")}`,
    }),
  };
}

export function applicationCompletedEmail(name: string): EmailMessage {
  return {
    subject: "Votre dossier est finalisé 🎉",
    html: layout({
      theme: "celebrate",
      icon: "🎉",
      eyebrow: "Félicitations",
      title: `Bon vent, ${name} !`,
      preheader: "Votre dossier de permis de conduire est finalisé.",
      body: `${p("Votre dossier de permis de conduire a été traité avec succès par votre auto-école. Merci pour votre confiance !")}
        ${p("Vos documents et vos factures restent disponibles dans votre espace.")}
        ${button("Voir mon dossier", appUrl("/dashboard"), "celebrate")}`,
    }),
  };
}

/* ----------------------------------------------------------------------------
 * Paiements
 * ------------------------------------------------------------------------- */

export function paymentReceivedEmail(name: string, amount: string, noteText?: string): EmailMessage {
  return {
    subject: subjectText(`Paiement de ${amount} confirmé`),
    html: layout({
      theme: "success",
      icon: "💳",
      eyebrow: "Paiement confirmé",
      title: "Merci, votre paiement est bien reçu",
      preheader: `Paiement de ${amount} reçu.`,
      body: `${p(`Bonjour ${escapeHtml(name)}, votre auto-école a bien reçu votre paiement.`)}
        ${amountBlock(amount, "Montant reçu")}
        ${p(noteText ? escapeHtml(noteText) : "Votre facture est disponible dans votre espace, rubrique Paiement.")}
        ${button("Télécharger ma facture", appUrl("/payment"), "success")}`,
    }),
  };
}

export function adminPaymentEmail(candidateName: string, amount: string): EmailMessage {
  return {
    subject: subjectText(`Paiement reçu : ${candidateName}`),
    html: layout({
      theme: "success",
      icon: "💶",
      eyebrow: "Nouveau paiement",
      title: `${candidateName} a réglé son dossier`,
      preheader: `${candidateName} a payé ${amount}.`,
      body: `${amountBlock(amount, "Encaissé")}
        ${p("La facture a été émise et envoyée à l'élève. Le paiement apparaît dans vos statistiques.")}
        ${button("Voir les finances", appUrl("/admin/finances"), "success")}`,
    }),
  };
}

export function adminDuplicatePaymentEmail(candidateName: string, amount: string): EmailMessage {
  return {
    subject: subjectText(`Paiement en double : ${candidateName}`),
    html: layout({
      theme: "danger",
      icon: "⚠️",
      eyebrow: "À vérifier",
      title: "Paiement en double détecté",
      preheader: `Paiement en double : ${candidateName}.`,
      body: `${p(`Le dossier de <strong>${escapeHtml(candidateName)}</strong> était déjà réglé et vient de recevoir un second paiement.`)}
        ${amountBlock(amount, "Montant en trop", "danger")}
        ${note("Vérifiez le paiement dans Stripe et remboursez-le si nécessaire.", "danger")}
        ${button("Ouvrir les finances", appUrl("/admin/finances"))}`,
    }),
  };
}

/* ----------------------------------------------------------------------------
 * Messagerie
 * ------------------------------------------------------------------------- */

export function newMessageEmail(senderName: string, preview: string, href: string): EmailMessage {
  return {
    subject: subjectText(`Nouveau message de ${senderName}`),
    html: layout({
      theme: "brand",
      icon: "💬",
      eyebrow: "Messagerie",
      title: "Vous avez un nouveau message",
      preheader: `${senderName} : ${preview.slice(0, 90)}`,
      body: `${quote(senderName, preview)}
        ${button("Répondre", href)}`,
    }),
  };
}

/* ----------------------------------------------------------------------------
 * Séances de code
 * ------------------------------------------------------------------------- */

export type SessionEmailInfo = {
  /** Identifiant de la session : sert d'UID dans l'agenda (une mise à jour remplace l'évènement). */
  id: string;
  title: string;
  location: string;
  /** Date et heure déjà formatées en français (fuseau de l'auto-école). */
  when: string;
  /** Pour la vignette calendrier : « 17 », « OCT. », « samedi », « 09:00 – 13:00 ». */
  day: string;
  month: string;
  weekday: string;
  time: string;
  startsAt: Date;
  endsAt: Date;
  notes?: string | null;
};

/** Vignette calendrier + lieu et horaires. */
function sessionCard(info: SessionEmailInfo, theme: Theme, struck = false) {
  const t = THEMES[theme];
  const strike = struck ? "text-decoration: line-through;" : "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 18px 0; border: 1px solid ${t.ring}; border-radius: 16px; background: ${t.soft}; border-collapse: separate;"><tr>
    <td width="74" valign="top" style="padding: 16px 0 16px 16px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 62px; border-radius: 12px; overflow: hidden; background: #ffffff; border: 1px solid ${t.ring}; border-collapse: separate;">
        <tr><td bgcolor="${t.accent}" style="background: ${t.accent}; padding: 4px 0; text-align: center; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; color: #ffffff; text-transform: uppercase; border-radius: 11px 11px 0 0;">${escapeHtml(info.month)}</td></tr>
        <tr><td style="padding: 6px 0 7px; text-align: center; font-size: 26px; line-height: 1; font-weight: 700; color: ${C.ink}; ${strike}">${escapeHtml(info.day)}</td></tr>
      </table>
    </td>
    <td valign="top" style="padding: 16px 16px 16px 14px;">
      <div style="font-size: 15px; font-weight: 700; color: ${C.ink}; ${strike}">${escapeHtml(info.title)}</div>
      <div style="margin-top: 6px; font-size: 14px; line-height: 1.5; color: ${C.text}; ${strike}">🗓&nbsp; ${escapeHtml(info.weekday.charAt(0).toUpperCase() + info.weekday.slice(1))}, ${escapeHtml(info.time)}</div>
      <div style="margin-top: 2px; font-size: 14px; line-height: 1.5; color: ${C.text}; ${strike}">📍&nbsp; ${escapeHtml(info.location)}</div>
      ${info.notes && !struck ? `<div style="margin-top: 8px; font-size: 13px; line-height: 1.5; color: ${C.muted};">${escapeHtml(info.notes)}</div>` : ""}
    </td>
  </tr></table>`;
}

function utcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function googleCalendarLink(info: SessionEmailInfo) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: info.title,
    dates: `${utcStamp(info.startsAt)}/${utcStamp(info.endsAt)}`,
    location: info.location,
    details: "Séance de code · permis de conduire",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fichier .ics joint : ajout à l'agenda en un clic (Apple, Outlook, Gmail). */
function icsAttachment(info: SessionEmailInfo): EmailAttachment {
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Virage//Cours theorique//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${info.id}@virage.fr`,
    `SEQUENCE:${Math.floor(Date.now() / 1000)}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(info.startsAt)}`,
    `DTEND:${utcStamp(info.endsAt)}`,
    `SUMMARY:${icsEscape(info.title)}`,
    `LOCATION:${icsEscape(info.location)}`,
    "DESCRIPTION:Séance de code · permis de conduire",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Séance de code demain",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return { filename: "cours-theorique.ics", content, contentType: "text/calendar; charset=utf-8" };
}

function addToCalendar(info: SessionEmailInfo) {
  return p(
    `Ajouter à mon agenda : ${link("Google Agenda", googleCalendarLink(info))} · ou ouvrez le fichier <strong>cours-theorique.ics</strong> joint.`,
    `font-size: 13px; color: ${C.muted};`,
  );
}

export function newSessionEmail(name: string, info: SessionEmailInfo, paid = true): EmailMessage {
  return {
    subject: subjectText(`Nouvelle date de séance de code : ${info.when}`),
    html: layout({
      theme: "teal",
      icon: "📅",
      eyebrow: "Nouvelle date",
      title: "Un séance de code est ouvert aux inscriptions",
      preheader: `${info.when} · ${info.location}`,
      body: `${p(`Bonjour ${escapeHtml(name)}, votre auto-école vient d'ajouter une date de séance de code.`)}
        ${sessionCard(info, "teal")}
        ${
          paid
            ? `${p("Les places sont limitées : réservez la vôtre en un clic depuis le calendrier de votre espace.")}
        ${button("Je m'inscris", appUrl("/calendar"), "teal")}`
            : `${note("🔒&nbsp; Les inscriptions à la séance de code s'ouvrent une fois votre formation <strong>réglée en totalité</strong>. Réglez-la depuis votre espace pour réserver votre place.", "warning")}
        ${button("Régler ma formation", appUrl("/payment"), "teal")}`
        }`,
    }),
  };
}

export function sessionRegistrationEmail(
  name: string,
  info: SessionEmailInfo,
  reminder: boolean,
): EmailMessage {
  return {
    subject: subjectText(`Inscription confirmée : séance de code du ${info.when}`),
    html: layout({
      theme: "success",
      icon: "🎟️",
      eyebrow: "Inscription confirmée",
      title: "Votre place est réservée",
      preheader: `${info.when} · ${info.location}`,
      body: `${p(`Bonjour ${escapeHtml(name)}, c'est noté : nous vous attendons à la séance de code.`)}
        ${sessionCard(info, "success")}
        ${note(
          reminder
            ? "🔔&nbsp; Nous vous enverrons un <strong>rappel par email 2 jours avant</strong>."
            : "Pensez à noter la date : vous n'avez pas demandé de rappel.",
          "success",
        )}
        ${addToCalendar(info)}
        ${button("Voir mes inscriptions", appUrl("/calendar"), "success")}
        ${p("Un empêchement ? Désinscrivez-vous depuis votre espace pour libérer la place.", `margin-top: 18px; font-size: 13px; color: ${C.muted};`)}`,
    }),
    attachments: [icsAttachment(info)],
  };
}

export function sessionReminderEmail(name: string, info: SessionEmailInfo): EmailMessage {
  return {
    subject: subjectText(`Rappel : séance de code ${info.when}`),
    html: layout({
      theme: "warning",
      icon: "⏰",
      eyebrow: "Rappel · J-2",
      title: "Votre séance de code approche",
      preheader: `${info.when} · ${info.location}`,
      body: `${p(`Bonjour ${escapeHtml(name)}, petit rappel : votre séance de code a lieu dans 2 jours.`)}
        ${sessionCard(info, "warning")}
        ${note("À prévoir : une pièce d'identité, de quoi prendre des notes et 10 minutes d'avance pour vous installer.", "warning")}
        ${addToCalendar(info)}
        ${button("Voir le calendrier", appUrl("/calendar"))}
        ${p("Un empêchement ? Désinscrivez-vous depuis votre espace pour libérer la place.", `margin-top: 18px; font-size: 13px; color: ${C.muted};`)}`,
    }),
    attachments: [icsAttachment(info)],
  };
}

export function sessionChangedEmail(name: string, info: SessionEmailInfo, cancelled: boolean): EmailMessage {
  if (cancelled) {
    return {
      subject: subjectText(`Séance de code annulé : ${info.when}`),
      html: layout({
        theme: "danger",
        icon: "🚫",
        eyebrow: "Annulation",
        title: "Votre séance de code est annulé",
        preheader: `Le cours du ${info.when} est annulé.`,
        body: `${p(`Bonjour ${escapeHtml(name)}, votre auto-école a annulé la session suivante. Nous sommes désolés pour le contretemps.`)}
          ${sessionCard(info, "danger", true)}
          ${p("Choisissez une autre date dans le calendrier de votre espace.")}
          ${button("Choisir une autre date", appUrl("/calendar"))}`,
      }),
    };
  }
  return {
    subject: subjectText(`Votre séance de code a changé : ${info.when}`),
    html: layout({
      theme: "brand",
      icon: "🔄",
      eyebrow: "Mise à jour",
      title: "Votre séance de code a été modifié",
      preheader: `Nouvelles informations : ${info.when} · ${info.location}`,
      body: `${p(`Bonjour ${escapeHtml(name)}, votre auto-école a modifié la session à laquelle vous êtes inscrit. Voici les informations à jour :`)}
        ${sessionCard(info, "brand")}
        ${addToCalendar(info)}
        ${button("Voir le calendrier", appUrl("/calendar"))}`,
    }),
    attachments: [icsAttachment(info)],
  };
}

/** Site de La Poste pour l'inscription à l'examen du code (sans paramètres de suivi). */
export const LAPOSTE_CODE_URL = "https://www.lecode.laposte.fr/";

/** Après le séance de code (présent à l'appel) : numéro NEPH et inscription à l'examen du code. */
export function codeExamEmail(name: string, oedippNumber: string): EmailMessage {
  return {
    subject: subjectText(`Votre numéro NEPH pour l'examen du code : ${oedippNumber}`),
    html: layout({
      theme: "celebrate",
      icon: "🎓",
      eyebrow: "Séance de code validé",
      title: "Inscrivez-vous à l'examen du code",
      preheader: `Votre numéro NEPH : ${oedippNumber}. Inscrivez-vous sur le site de La Poste.`,
      body: `${p(`Bravo ${escapeHtml(name)}, vous avez suivi votre séance de code ! Prochaine étape : vous inscrire à l'examen du code sur le site de La Poste avec votre numéro NEPH.`)}
        ${amountBlock(oedippNumber, "Votre numéro NEPH", "brand")}
        ${steps([
          { title: "Rendez-vous sur le site de La Poste", text: "lecode.laposte.fr, puis créez votre compte ou connectez-vous." },
          { title: "Choisissez l'examen du permis de conduire", text: "Saisissez votre numéro NEPH ci-dessus quand il vous est demandé." },
          { title: "Réservez votre date", text: "Choisissez le centre d'examen et le créneau qui vous conviennent." },
        ])}
        ${button("S'inscrire sur le site de La Poste", LAPOSTE_CODE_URL)}
        ${note(`<strong>L'inscription ne fonctionne pas ?</strong> Attendez 3 jours puis réessayez : votre numéro peut mettre quelques jours à être activé. Si elle ne fonctionne toujours pas, contactez-nous depuis la ${link("messagerie de votre espace", appUrl("/messages"))}.`, "warning")}`,
    }),
  };
}

/** Relevé de présence envoyé aux admins à la fin de l'appel. */
export function attendanceReportEmail(
  info: SessionEmailInfo,
  present: string[],
  absent: string[],
  takenBy: string,
  href: string,
  missingOedipp: string[] = [],
): EmailMessage {
  const total = present.length + absent.length;
  const list = (names: string[], color: string, mark: string) =>
    names.length === 0
      ? `<div style="padding: 10px 0; font-size: 14px; color: ${C.muted};">Aucun</div>`
      : names
          .map(
            (name) => `<div style="padding: 8px 0; border-top: 1px solid ${C.line}; font-size: 14px; color: ${C.ink};"><span style="display: inline-block; width: 20px; color: ${color}; font-weight: 700;">${mark}</span>${escapeHtml(name)}</div>`,
          )
          .join("");
  return {
    subject: subjectText(`Appel du ${info.when} : ${present.length}/${total} présents`),
    html: layout({
      theme: absent.length === 0 ? "success" : "teal",
      icon: "📋",
      eyebrow: "Relevé de présence",
      title: `${present.length} présent${present.length > 1 ? "s" : ""} sur ${total}`,
      preheader: `${info.title} · ${info.when} · appel fait par ${takenBy}`,
      body: `${p(`L'appel du cours a été clôturé par <strong>${escapeHtml(takenBy)}</strong>. Voici le relevé :`)}
        ${sessionCard(info, "brand")}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 18px 0;"><tr>
          <td valign="top" width="50%" style="padding-right: 8px;">
            <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${THEMES.success.accent}; padding-bottom: 6px;">Présents (${present.length})</div>
            ${list(present, THEMES.success.accent, "✓")}
          </td>
          <td valign="top" width="50%" style="padding-left: 8px;">
            <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${THEMES.danger.accent}; padding-bottom: 6px;">Absents (${absent.length})</div>
            ${list(absent, THEMES.danger.accent, "✕")}
          </td>
        </tr></table>
        ${
          present.length > 0
            ? missingOedipp.length > 0
              ? note(`<strong>Numéro NEPH manquant</strong> pour ${missingOedipp.map(escapeHtml).join(", ")} : l'email d'inscription à l'examen du code ne leur a pas été envoyé. Renseignez le numéro dans leur dossier, il partira automatiquement.`, "warning")
              : note("Les élèves présents ont reçu leur numéro NEPH et les instructions pour s'inscrire à l'examen du code.", "success")
            : ""
        }
        ${button("Voir la séance", href)}`,
    }),
  };
}

/* ----------------------------------------------------------------------------
 * Aperçu (Paramètres → Emails)
 * ------------------------------------------------------------------------- */

function sampleSession(): SessionEmailInfo {
  const startsAt = new Date(Date.now() + 5 * 24 * 3600e3);
  startsAt.setUTCHours(7, 0, 0, 0);
  const endsAt = new Date(startsAt.getTime() + 4 * 3600e3);
  const tz = "Europe/Paris";
  const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: tz });
  const time = `${fmt({ hour: "2-digit", minute: "2-digit" }).format(startsAt)} – ${fmt({ hour: "2-digit", minute: "2-digit" }).format(endsAt)}`;
  return {
    id: "apercu",
    title: "Séance de code",
    location: "Salle de code, 14 avenue de la République",
    when: `${fmt({ weekday: "long", day: "numeric", month: "long" }).format(startsAt)}, ${time}`,
    day: fmt({ day: "numeric" }).format(startsAt),
    month: fmt({ month: "short" }).format(startsAt).replace(".", ""),
    weekday: fmt({ weekday: "long", day: "numeric", month: "long" }).format(startsAt),
    time,
    startsAt,
    endsAt,
    notes: "Apportez une pièce d'identité et votre livret d'apprentissage.",
  };
}

export const EMAIL_PREVIEWS: { id: string; label: string; audience: "Élève" | "Équipe"; build: () => EmailMessage }[] = [
  { id: "welcome", label: "Bienvenue", audience: "Élève", build: () => welcomeEmail("Marie") },
  { id: "candidate-invite", label: "Dossier ouvert par l'auto-école", audience: "Élève", build: () => candidateInviteEmail("Marie", "marie@exemple.fr", appUrl("/activate")) },
  { id: "document-rejected", label: "Document à renvoyer", audience: "Élève", build: () => documentRejectedEmail("Certificat médical", "Le document est illisible, merci de le reprendre en photo à la lumière du jour.") },
  { id: "documents-approved", label: "Documents validés", audience: "Élève", build: () => documentsApprovedEmail() },
  { id: "payment-received", label: "Paiement confirmé", audience: "Élève", build: () => paymentReceivedEmail("Marie", "249,00 €") },
  { id: "new-message", label: "Nouveau message", audience: "Élève", build: () => newMessageEmail("Votre auto-école", "Bonjour Marie, votre dossier est complet. Pensez à vous inscrire au prochain séance de code !", appUrl("/messages")) },
  { id: "session-new", label: "Nouvelle date de cours", audience: "Élève", build: () => newSessionEmail("Marie", sampleSession()) },
  { id: "session-registration", label: "Inscription au cours confirmée", audience: "Élève", build: () => sessionRegistrationEmail("Marie", sampleSession(), true) },
  { id: "session-reminder", label: "Rappel J-2", audience: "Élève", build: () => sessionReminderEmail("Marie", sampleSession()) },
  { id: "session-updated", label: "Cours modifié", audience: "Élève", build: () => sessionChangedEmail("Marie", sampleSession(), false) },
  { id: "session-cancelled", label: "Cours annulé", audience: "Élève", build: () => sessionChangedEmail("Marie", sampleSession(), true) },
  { id: "completed", label: "Dossier finalisé", audience: "Élève", build: () => applicationCompletedEmail("Marie") },
  { id: "password-reset", label: "Mot de passe oublié", audience: "Élève", build: () => passwordResetEmail("Marie", appUrl("/reset-password")) },
  { id: "member-invite", label: "Invitation d'un moniteur", audience: "Équipe", build: () => memberInviteEmail("Julien", "julien@exemple.fr", "Moniteur", appUrl("/activate")) },
  { id: "admin-payment", label: "Paiement reçu", audience: "Équipe", build: () => adminPaymentEmail("Marie Durand", "249,00 €") },
  { id: "code-exam", label: "Numéro NEPH et examen du code", audience: "Élève", build: () => codeExamEmail("Marie", "12345678") },
  { id: "attendance-report", label: "Relevé de présence", audience: "Équipe", build: () => attendanceReportEmail(sampleSession(), ["Marie Durand", "Lucas Martin", "Léa Roux"], ["Hugo Petit"], "Julien (moniteur)", appUrl("/admin/calendar")) },
  { id: "admin-duplicate", label: "Paiement en double", audience: "Équipe", build: () => adminDuplicatePaymentEmail("Marie Durand", "249,00 €") },
];
