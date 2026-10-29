import { Resend } from "resend";

import {
  adminDuplicatePaymentEmail,
  adminPaymentEmail,
  appUrl,
  applicationCompletedEmail,
  attendanceReportEmail,
  codeExamEmail,
  candidateInviteEmail,
  documentRejectedEmail,
  documentsApprovedEmail,
  LOGO_CID,
  memberInviteEmail,
  newMessageEmail,
  newSessionEmail,
  passwordResetEmail,
  paymentReceivedEmail,
  sessionChangedEmail,
  sessionRegistrationEmail,
  sessionReminderEmail,
  welcomeEmail,
  type EmailAttachment,
  type EmailMessage,
  type SessionEmailInfo,
} from "@/lib/email-templates";
import { EMAIL_LOGO_PNG_BASE64 } from "@/lib/email-logo";

export { escapeHtml } from "@/lib/email-templates";
export type { SessionEmailInfo } from "@/lib/email-templates";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/** Expéditeur : doit utiliser le domaine vérifié dans Resend (virage.fr). */
const FROM = process.env.EMAIL_FROM || "Virage <notifications@virage.fr>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || undefined;

/** Logo joint en ligne (cid:) : affiché même si le site n'est pas accessible publiquement. */
function logoAttachment(): EmailAttachment {
  return {
    filename: "virage.png",
    content: Buffer.from(EMAIL_LOGO_PNG_BASE64, "base64"),
    contentType: "image/png",
    contentId: LOGO_CID,
  };
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments = [],
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}) {
  if (!resend) {
    const message = `[Email] RESEND_API_KEY manquant — To: ${to}, Subject: ${subject}`;
    if (process.env.NODE_ENV === "production") {
      console.error(message);
    } else {
      console.log(message);
    }
    return { id: "mock" };
  }

  const logo = html.includes(`cid:${LOGO_CID}`) ? logoAttachment() : null;

  // Un email qui échoue ne doit jamais faire échouer l'action métier
  // (paiement, validation de document…) qui l'a déclenché.
  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      replyTo: REPLY_TO,
      attachments: [...(logo ? [logo] : []), ...attachments],
    });
    if (result.error) {
      console.error("[Email] Resend error:", result.error);
      return null;
    }
    return result.data;
  } catch (error) {
    console.error("[Email] Envoi impossible:", error);
    return null;
  }
}

function deliver(to: string, message: EmailMessage) {
  return sendEmail({ to, ...message });
}

/** Envoie le même email à plusieurs destinataires en parallèle. */
export async function sendToMany(
  recipients: string[],
  send: (to: string) => Promise<unknown>,
) {
  await Promise.allSettled(recipients.map((to) => send(to)));
}

export async function sendWelcomeEmail(to: string, name: string) {
  return deliver(to, welcomeEmail(name));
}

/** Vrai si l'email est réellement parti (clé Resend présente et envoi accepté). */
export async function sendAttendanceReportEmail(
  to: string,
  info: SessionEmailInfo,
  present: string[],
  absent: string[],
  takenBy: string,
  missingOedipp: string[] = [],
) {
  return deliver(
    to,
    attendanceReportEmail(info, present, absent, takenBy, appUrl(`/admin/calendar/${info.id}/appel`), missingOedipp),
  );
}

export async function sendCodeExamEmail(to: string, name: string, oedippNumber: string) {
  return deliver(to, codeExamEmail(name, oedippNumber));
}

export function emailDelivered(result: unknown) {
  return Boolean(resend && result);
}

/** Invitation d'un élève créé par l'admin : lien d'activation, jamais de mot de passe en clair. */
export async function sendCandidateInviteEmail(to: string, name: string, activationLink: string) {
  return deliver(to, candidateInviteEmail(name, to, activationLink));
}

/** Invitation d'un membre de l'équipe (admin ou moniteur). */
export async function sendMemberInviteEmail(
  to: string,
  name: string,
  roleLabel: string,
  activationLink: string,
) {
  return deliver(to, memberInviteEmail(name, to, roleLabel, activationLink));
}

export async function sendPasswordResetEmail(to: string, name: string, link: string) {
  return deliver(to, passwordResetEmail(name, link));
}

export async function sendDocumentRejectedEmail(to: string, docLabel: string, reason: string) {
  return deliver(to, documentRejectedEmail(docLabel, reason));
}

export async function sendDocumentsApprovedEmail(to: string) {
  return deliver(to, documentsApprovedEmail());
}

export async function sendPaymentReceivedEmail(
  to: string,
  name: string,
  amount: string,
  note?: string,
) {
  return deliver(to, paymentReceivedEmail(name, amount, note));
}

export async function sendNewMessageEmail(
  to: string,
  senderName: string,
  preview: string,
  applicationId: string,
  recipientRole: "ADMIN" | "CANDIDATE" = "CANDIDATE",
) {
  const messagesPath =
    recipientRole === "ADMIN"
      ? `/admin/messages?application=${encodeURIComponent(applicationId)}`
      : "/messages";
  return deliver(to, newMessageEmail(senderName, preview, appUrl(messagesPath)));
}

export async function sendApplicationCompletedEmail(to: string, name: string) {
  return deliver(to, applicationCompletedEmail(name));
}

export async function sendAdminPaymentNotification(to: string, candidateName: string, amount: string) {
  return deliver(to, adminPaymentEmail(candidateName, amount));
}

/** Alerte quand un dossier reçoit un second paiement (à rembourser). */
export async function sendAdminDuplicatePaymentAlert(to: string, candidateName: string, amount: string) {
  return deliver(to, adminDuplicatePaymentEmail(candidateName, amount));
}

/* ----------------------------------------------------------------------------
 * Séances de code
 * ------------------------------------------------------------------------- */

export async function sendNewSessionEmail(to: string, name: string, info: SessionEmailInfo, paid = true) {
  return deliver(to, newSessionEmail(name, info, paid));
}

export async function sendSessionRegistrationEmail(
  to: string,
  name: string,
  info: SessionEmailInfo,
  reminder: boolean,
) {
  return deliver(to, sessionRegistrationEmail(name, info, reminder));
}

export async function sendSessionReminderEmail(to: string, name: string, info: SessionEmailInfo) {
  return deliver(to, sessionReminderEmail(name, info));
}

export async function sendSessionChangedEmail(
  to: string,
  name: string,
  info: SessionEmailInfo,
  cancelled: boolean,
) {
  return deliver(to, sessionChangedEmail(name, info, cancelled));
}

/** État de l'envoi, pour la page Paramètres. */
export function emailStatus() {
  return { configured: Boolean(resend), from: FROM, appUrl: appUrl("") };
}
