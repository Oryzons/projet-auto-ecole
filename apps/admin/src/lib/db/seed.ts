import bcrypt from "bcryptjs";

import { DEMO_STAFF, DEMO_STUDENTS, REQUIRED_DOCS, studentDocs } from "@virage/shared/demo";

import type { Store } from "./engine";
import { seedCrm } from "./seed-crm";

/**
 * Données de démonstration de l'auto-école Virage (Lyon 7e).
 * Les identifiants sont fixes pour que les sessions restent valides après un redémarrage.
 * Connexion : sophie@virage.fr / virage2026
 */
export const DEMO_LOGIN = { email: "sophie@virage.fr", password: "virage2026" };

const ORG = "org-virage";
const DAY = 86_400_000;

// générateur pseudo-aléatoire reproductible
let state = 42;
const rand = () => {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
};
const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];

const PRICES: Record<string, number> = { "permis-b": 135000, "permis-b-auto": 99000, aac: 149000, a2: 129000 };
const REQUIRED = REQUIRED_DOCS;
const FILES: Record<string, string> = {
  TRAINING_CONTRACT: "contrat-formation-signe.pdf",
  ID_CARD: "carte-identite.pdf",
  ID_PHOTO: "ephoto-ants.pdf",
  PROOF_OF_ADDRESS: "facture-edf.pdf",
  ASSR: "assr2.pdf",
  JDC: "attestation-jdc.pdf",
  PARTNER_BADGE: "carte-etudiant.pdf",
};

type Stage = "DRAFT" | "DOCUMENTS_PENDING" | "DOCUMENTS_REVIEW" | "PAYMENT_PENDING" | "PAID" | "COMPLETED";

/** Élèves : ils viennent de @virage/shared/demo, la même liste que l'app mobile */
const STUDENTS: [string, string, string, Stage, number, number?][] = DEMO_STUDENTS.map((st) => [st.firstName, st.lastName, st.permitType, st.stage, st.days, st.installments]);

const STREETS = ["rue de Marseille", "avenue Jean Jaurès", "rue Garibaldi", "cours Gambetta", "rue de la Guillotière", "avenue Berthelot", "rue Pasteur"];
const CITIES: [string, string][] = [
  ["69007", "Lyon"],
  ["69003", "Lyon"],
  ["69008", "Lyon"],
  ["69100", "Villeurbanne"],
  ["69200", "Vénissieux"],
];

const CHATS: string[][] = [
  ["Bonjour, j'ai déposé mon justificatif de domicile, est-ce qu'il vous convient ?", "Bonjour ! Oui, il est validé. Il ne manque plus que l'ASSR 2.", "Super, je vous l'envoie ce soir."],
  ["Est-ce que je peux décaler ma leçon de jeudi à vendredi ?", "Bien sûr, Julie a un créneau vendredi à 14 h. Je vous le réserve ?", "Oui parfait, merci beaucoup !"],
  ["Bonjour, quand aurai-je mon numéro NEPH ?", "Votre demande est partie à l'ANTS lundi, comptez une à deux semaines."],
  ["Je voudrais payer le reste en 3 fois, c'est possible ?", "Oui, vous pouvez choisir le paiement en plusieurs fois depuis l'onglet Paiement."],
  ["Merci pour la séance de code d'hier, très utile !"],
  ["Bonjour, j'ai réussi mon code 🎉", "Félicitations ! On planifie la suite des leçons avec Karim."],
];

export function seed(store: Store) {
  state = 42;
  const now = Date.now();
  const ago = (days: number, hours = 0) => new Date(now - days * DAY - hours * 3_600_000);
  const t = store.tables;
  const hash = bcrypt.hashSync(DEMO_LOGIN.password, 10);

  t.organization.push({
    id: ORG,
    slug: "virage",
    name: "Virage",
    stripeAccountId: null,
    createdAt: ago(400),
    updatedAt: ago(2),
    settings: {
      permitTypes: ["permis-b", "permis-b-auto", "aac", "a2"],
      permitPrices: {
        "permis-b": { standard: 135000, partner: 115000 },
        "permis-b-auto": { standard: 99000, partner: 89000 },
        aac: { standard: 149000, partner: 129000 },
        a2: { standard: 129000, partner: 109000 },
      },
      standardPrice: 135000,
      partnerPrice: 115000,
      fiscalStampPrice: 8000,
      discountCodes: [{ code: "PARRAIN", label: "Parrainage d'un ami", kind: "amount", value: 5000 }],
      bankTransfer: { enabled: true, holder: "VIRAGE AUTO-ECOLE", iban: "FR76 3000 4012 3400 0101 2345 678", bic: "BNPAFRPPXXX" },
      company: {
        legalName: "Virage Auto-École SAS",
        address: "12 rue de Marseille",
        postalCode: "69007",
        city: "Lyon",
        siret: "912 345 678 00019",
        vatNumber: "FR12 912345678",
        email: "contact@virage.fr",
        phone: "04 78 00 00 00",
      },
    },
  });

  const user = (id: string, role: string, firstName: string, lastName: string, extra: Record<string, unknown> = {}) => {
    const row = {
      id,
      email: `${firstName}.${lastName}`
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .concat("@email.fr"),
      passwordHash: hash,
      role,
      firstName,
      lastName,
      phone: `06 ${Math.floor(10 + rand() * 89)} ${Math.floor(10 + rand() * 89)} ${Math.floor(10 + rand() * 89)} ${Math.floor(10 + rand() * 89)}`,
      profilePhotoUrl: null,
      street: null,
      postalCode: null,
      city: null,
      dateOfBirth: null,
      oedippNumber: null,
      organizationId: ORG,
      createdAt: ago(300),
      updatedAt: ago(10),
      ...extra,
    };
    t.user.push(row);
    return row;
  };

  // équipe
  // dernière visite la veille au soir : le récap de connexion a de quoi montrer
  // l'équipe vient de @virage/shared/demo : mêmes personnes et mêmes téléphones dans l'app
  const team = DEMO_STAFF.map((m) =>
    user(m.id, m.role, m.firstName, m.lastName, {
      email: m.id === "u-sophie" ? DEMO_LOGIN.email : m.email,
      phone: m.phone,
      ...(m.id === "u-sophie" ? { lastSeenAt: ago(0, 15) } : {}),
    }),
  );
  const instructors = team.filter((m) => m.role === "SKIPPER");

  let invoice = 0;
  const candidates: { id: string; app: string; stage: Stage; created: number }[] = [];

  STUDENTS.forEach(([firstName, lastName, permitType, stage, days, installments], index) => {
    const shared = DEMO_STUDENTS[index]!;
    const id = `u-${firstName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}`;
    const [postalCode, city] = pick(CITIES);
    const age = permitType === "aac" ? 15 + Math.floor(rand() * 2) : 17 + Math.floor(rand() * 9);
    user(id, "CANDIDATE", firstName, lastName, {
      phone: shared.phone,
      street: `${Math.floor(2 + rand() * 120)} ${pick(STREETS)}`,
      postalCode,
      city,
      dateOfBirth: new Date(Date.UTC(new Date().getFullYear() - age, Math.floor(rand() * 12), 1 + Math.floor(rand() * 27))),
      oedippNumber: ["PAID", "COMPLETED"].includes(stage) || (stage === "PAYMENT_PENDING" && index % 2 === 0) ? `2307${Math.floor(10000000 + rand() * 89999999)}` : null,
      createdAt: ago(days, 2),
      updatedAt: ago(Math.min(days, 2)),
    });

    const app = `app-${id.slice(2)}`;
    const partner = index % 7 === 3;
    const total = partner ? PRICES[permitType] - 20000 : PRICES[permitType];
    const finished = stage === "COMPLETED";
    t.permitApplication.push({
      id: app,
      organizationId: ORG,
      candidateId: id,
      permitType,
      status: stage,
      partnerRate: partner,
      partnerCompany: partner ? "Université Lyon 2" : null,
      discountCode: index === 13 ? "PARRAIN" : null,
      discountKind: index === 13 ? "amount" : null,
      discountValue: index === 13 ? 5000 : null,
      briefingSeenAt: stage === "DRAFT" ? null : ago(days - 1),
      totalAmount: index === 13 ? total - 5000 : total,
      archivedAt: null,
      instructorId: shared.instructorId,
      hoursPlanned: shared.hoursPlanned,
      createdAt: ago(days, 2),
      updatedAt: ago(Math.min(days, finished ? 6 : 1 + (index % 4))),
    });
    candidates.push({ id, app, stage, created: days });

    const event = (type: string, daysAgo: number, metadata: Record<string, unknown> = {}, userId: string | null = id) =>
      t.applicationEvent.push({ id: `ev-${t.applicationEvent.length + 1}`, applicationId: app, userId, type, metadata, createdAt: ago(daysAgo, rand() * 8) });

    event("CREATED", days);

    // pièces du dossier
    // même état des pièces que dans l'app mobile (Documents de l'élève)
    const docStates = studentDocs(shared, index);
    const deposited = REQUIRED.filter((type) => docStates[type]);
    const docCount = deposited.length;
    const types: string[] = [...deposited, ...(partner && docCount ? ["PARTNER_BADGE"] : [])];
    types.forEach((type, i) => {
      const uploaded = Math.max(0.2, days - 2 - i * 0.6);
      const status: string = docStates[type as keyof typeof docStates] ?? "APPROVED";
      t.document.push({
        id: `doc-${app}-${type.toLowerCase()}`,
        applicationId: app,
        type,
        status,
        fileUrl: `/demo/${FILES[type]}`,
        fileKey: null,
        fileName: FILES[type],
        fileSize: 180_000 + Math.floor(rand() * 900_000),
        mimeType: FILES[type].endsWith(".jpg") ? "image/jpeg" : "application/pdf",
        rejectionReason:
          status === "REJECTED"
            ? type === "PROOF_OF_ADDRESS"
              ? "Document de plus de 6 mois, merci d'en déposer un récent."
              : "Le document est flou, merci d'en renvoyer une photo nette."
            : null,
        reviewedById: status === "PENDING" ? null : "u-sophie",
        reviewedAt: status === "PENDING" ? null : ago(uploaded - 0.5),
        createdAt: ago(uploaded),
        updatedAt: ago(uploaded),
      });
      event("DOCUMENT_UPLOADED", uploaded, { documentType: type, source: "candidate" });
      if (status === "APPROVED") event("DOCUMENT_APPROVED", uploaded - 0.4, { documentType: type }, "u-sophie");
      if (status === "REJECTED") event("DOCUMENT_REJECTED", uploaded - 0.4, { documentType: type }, "u-sophie");
    });

    // paiements
    const amount = index === 13 ? total - 5000 : total;
    const paid = (daysAgo: number, value: number, extra: Record<string, unknown> = {}) => {
      invoice += 1;
      const at = ago(daysAgo, rand() * 6);
      t.payment.push({
        id: `pay-${app}-${t.payment.length + 1}`,
        applicationId: app,
        amount: value,
        currency: "eur",
        status: "COMPLETED",
        method: pick(["STRIPE", "STRIPE", "CARD", "TRANSFER", "CHECK"]),
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        installmentCount: null,
        installmentIndex: null,
        paidAt: at,
        invoiceNumber: `VIR-${at.getFullYear()}-${String(invoice).padStart(4, "0")}`,
        createdAt: at,
        updatedAt: at,
        ...extra,
      });
      event("PAYMENT_COMPLETED", daysAgo, { amount: value });
    };
    if (stage === "PAID" || stage === "COMPLETED") {
      if (installments) {
        const part = Math.round(amount / installments);
        for (let k = 0; k < installments; k++) {
          paid(Math.max(0.5, days - 8 - k * 30), k === installments - 1 ? amount - part * (installments - 1) : part, { installmentCount: installments, installmentIndex: k + 1, method: "STRIPE" });
        }
      } else paid(Math.max(1, days - 8), amount);
    } else if (shared.paidInstallments && installments) {
      // échéancier en cours (Lucas : 2 échéances sur 3, comme dans l'app)
      const part = Math.round(amount / installments);
      for (let k = 0; k < shared.paidInstallments; k++) {
        paid(Math.max(0.5, days - 2 - k * 30), part, { installmentCount: installments, installmentIndex: k + 1, method: "STRIPE" });
      }
    } else if (stage === "PAYMENT_PENDING" && installments) {
      const part = Math.round(amount / installments);
      paid(Math.max(1, days - 10), part, { installmentCount: installments, installmentIndex: 1, method: "STRIPE" });
    } else if (stage === "PAYMENT_PENDING" && index === 12) {
      // virement annoncé par l'élève, à confirmer par l'auto-école
      t.payment.push({
        id: `pay-${app}-transfer`,
        applicationId: app,
        amount,
        currency: "eur",
        status: "PENDING",
        method: "TRANSFER",
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        installmentCount: null,
        installmentIndex: null,
        paidAt: null,
        invoiceNumber: null,
        createdAt: ago(1, 3),
        updatedAt: ago(1, 3),
      });
    }
    // heures de conduite supplémentaires, achetées par packs au fil de la formation
    if (stage === "PAID" || stage === "COMPLETED") {
      for (let d = days - 25; d > (finished ? 20 : 2); d -= 18 + Math.floor(rand() * 14)) {
        paid(d, rand() > 0.4 ? 26000 : 52000);
      }
    }
    if (finished) event("COMPLETED", 6 + index % 5, {}, "u-sophie");
  });

  // messagerie
  candidates.slice(0, CHATS.length * 2).forEach(({ id, app }, i) => {
    const chat = CHATS[i % CHATS.length];
    if (i >= CHATS.length && i % 2) return;
    chat.forEach((content, k) => {
      const fromStudent = k % 2 === 0;
      const at = ago(i * 0.7 + (chat.length - k) * 0.08, 0);
      const last = k === chat.length - 1;
      t.message.push({
        id: `msg-${app}-${k}`,
        applicationId: app,
        senderId: fromStudent ? id : "u-sophie",
        content,
        readAt: fromStudent && last && i < 4 ? null : at,
        createdAt: at,
      });
    });
  });

  // calendrier : séances de code, examens blancs et rendez-vous pédagogiques
  const at = (days: number, hour: number) => {
    const d = new Date(now + days * DAY);
    d.setHours(hour, 0, 0, 0);
    // pas de séance le dimanche : on décale au lundi
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d;
  };
  const sessions: [string, number, number, number, number, string][] = [
    ["Séance de code", -14, 18, 120, 14, "Salle de code · Agence Lyon 7e"],
    ["Examen blanc", -9, 10, 60, 16, "Salle de code · Agence Lyon 7e"],
    ["Séance de code", -5, 18, 120, 14, "Salle de code · Agence Lyon 7e"],
    ["Rendez-vous pédagogique AAC", -2, 14, 180, 8, "Agence Lyon 7e"],
    ["Séance de code", 1, 18, 120, 14, "Salle de code · Agence Lyon 7e"],
    ["Examen blanc", 3, 10, 60, 16, "Salle de code · Agence Lyon 7e"],
    ["Séance de code", 6, 18, 120, 14, "Salle de code · Agence Lyon 7e"],
    ["Séance de code", 8, 10, 120, 14, "Salle de code · Agence Lyon 7e"],
    ["Rendez-vous pédagogique AAC", 12, 14, 180, 8, "Agence Lyon 7e"],
    ["Séance de code", 13, 18, 120, 14, "Salle de code · Agence Lyon 7e"],
    ["Examen blanc", 17, 10, 60, 16, "Salle de code · Agence Lyon 7e"],
  ];
  sessions.forEach(([title, days, hour, duration, capacity, location], i) => {
    const sid = `ses-${i + 1}`;
    const startsAt = at(days, hour);
    const past = days < 0;
    t.theorySession.push({
      id: sid,
      organizationId: ORG,
      title,
      location,
      startsAt,
      durationMinutes: duration,
      capacity,
      notes: title.startsWith("Rendez-vous") ? "Venir avec l'accompagnateur et le livret d'apprentissage." : title === "Examen blanc" ? "40 questions en conditions réelles." : null,
      createdById: i % 3 === 0 ? "u-sophie" : pick(instructors).id,
      createdAt: ago(30),
      updatedAt: ago(30),
      attendanceSecret: null,
      attendanceOpenedAt: past ? startsAt : null,
      attendanceClosedAt: past ? new Date(startsAt.getTime() + duration * 60_000) : null,
    });
    const pool = candidates.filter((c) => c.stage !== "DRAFT" && (title.includes("AAC") ? ["u-emma", "u-camille"].includes(c.id) : true));
    const count = Math.min(pool.length, title.includes("AAC") ? 2 : 4 + Math.floor(rand() * 7));
    const chosen = [...pool].sort(() => rand() - 0.5).slice(0, count);
    chosen.forEach((c, k) => {
      t.sessionRegistration.push({
        id: `reg-${sid}-${k}`,
        sessionId: sid,
        candidateId: c.id,
        reminder: true,
        reminderSentAt: past ? new Date(startsAt.getTime() - 2 * DAY) : null,
        attendedAt: past && rand() > 0.15 ? new Date(startsAt.getTime() + 5 * 60_000) : null,
        attendanceMethod: past ? "MANUAL" : null,
        codeEmailSentAt: null,
        createdAt: ago(Math.max(1, -days + 5)),
      });
    });
  });

  t.invoiceCounter.push({ organizationId: ORG, year: new Date().getFullYear(), value: invoice });

  seedCrm(store, now);
}
