import { emailDelivered, sendCodeExamEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

/**
 * Envoie l'email « numéro NEPH + inscription à l'examen du code » aux
 * élèves présents à un appel terminé, une seule fois chacun.
 * Renvoie les élèves présents sans numéro NEPH (email non envoyé).
 */
export async function sendPendingCodeExamEmails(where: { sessionId?: string; candidateId?: string }) {
  const registrations = await prisma.sessionRegistration.findMany({
    where: {
      ...where,
      attendedAt: { not: null },
      codeEmailSentAt: null,
      session: { attendanceClosedAt: { not: null } },
    },
    include: { candidate: { select: { firstName: true, lastName: true, email: true, oedippNumber: true } } },
  });

  const missing: string[] = [];
  for (const registration of registrations) {
    const { candidate } = registration;
    if (!candidate.oedippNumber) {
      missing.push(`${candidate.firstName} ${candidate.lastName}`);
      continue;
    }
    const result = await sendCodeExamEmail(candidate.email, candidate.firstName, candidate.oedippNumber);
    if (emailDelivered(result)) {
      await prisma.sessionRegistration.update({ where: { id: registration.id }, data: { codeEmailSentAt: new Date() } });
    }
  }
  return { missing };
}
