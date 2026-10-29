import { delegate, Store, type ModelDef } from "./db/engine";
import { seed } from "./db/seed";

const one = (model: string, from: string, to = "id") => ({ model, kind: "one" as const, from, to });
const many = (model: string, to: string, from = "id") => ({ model, kind: "many" as const, from, to });

/** Même schéma que Virage (prisma/schema.prisma), adapté au permis de conduire */
const models: Record<string, ModelDef> = {
  organization: {
    relations: {
      users: many("user", "organizationId"),
      theorySessions: many("theorySession", "organizationId"),
      applications: many("permitApplication", "organizationId"),
      invoiceCounters: many("invoiceCounter", "organizationId"),
    },
    defaults: () => ({ settings: {}, stripeAccountId: null }),
  },
  user: {
    relations: {
      organization: one("organization", "organizationId"),
      applications: many("permitApplication", "candidateId"),
      sentMessages: many("message", "senderId"),
      reviewedDocs: many("document", "reviewedById"),
      events: many("applicationEvent", "userId"),
      passwordTokens: many("passwordToken", "userId"),
      createdSessions: many("theorySession", "createdById"),
      sessionRegistrations: many("sessionRegistration", "candidateId"),
    },
    compound: { email_organizationId: ["email", "organizationId"] },
    defaults: () => ({
      role: "CANDIDATE",
      phone: null,
      profilePhotoUrl: null,
      street: null,
      postalCode: null,
      city: null,
      dateOfBirth: null,
      oedippNumber: null,
    }),
  },
  permitApplication: {
    relations: {
      organization: one("organization", "organizationId"),
      candidate: one("user", "candidateId"),
      documents: many("document", "applicationId"),
      payments: many("payment", "applicationId"),
      messages: many("message", "applicationId"),
      events: many("applicationEvent", "applicationId"),
      instructor: one("user", "instructorId"),
      lessons: many("drivingLesson", "applicationId"),
      exams: many("exam", "applicationId"),
    },
    compound: { candidateId_organizationId: ["candidateId", "organizationId"] },
    defaults: () => ({
      permitType: "permis-b",
      status: "DRAFT",
      partnerRate: false,
      partnerCompany: null,
      discountCode: null,
      discountKind: null,
      discountValue: null,
      briefingSeenAt: null,
      totalAmount: null,
      archivedAt: null,
      instructorId: null,
      hoursPlanned: 20,
    }),
  },
  document: {
    relations: {
      application: one("permitApplication", "applicationId"),
      reviewedBy: one("user", "reviewedById"),
    },
    compound: { applicationId_type: ["applicationId", "type"] },
    defaults: () => ({ status: "PENDING", fileKey: null, rejectionReason: null, reviewedById: null, reviewedAt: null }),
  },
  payment: {
    relations: { application: one("permitApplication", "applicationId") },
    defaults: () => ({
      currency: "eur",
      status: "PENDING",
      method: "STRIPE",
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      installmentCount: null,
      installmentIndex: null,
      paidAt: null,
      invoiceNumber: null,
    }),
  },
  invoiceCounter: {
    relations: { organization: one("organization", "organizationId") },
    compound: { organizationId_year: ["organizationId", "year"] },
    defaults: () => ({ value: 0 }),
    noId: true,
    timestamps: false,
  },
  passwordToken: {
    relations: { user: one("user", "userId") },
    defaults: () => ({ usedAt: null }),
  },
  message: {
    relations: {
      application: one("permitApplication", "applicationId"),
      sender: one("user", "senderId"),
    },
    defaults: () => ({ readAt: null }),
  },
  applicationEvent: {
    relations: {
      application: one("permitApplication", "applicationId"),
      user: one("user", "userId"),
    },
    defaults: () => ({ metadata: {}, userId: null }),
  },
  theorySession: {
    relations: {
      organization: one("organization", "organizationId"),
      createdBy: one("user", "createdById"),
      registrations: many("sessionRegistration", "sessionId"),
    },
    defaults: () => ({
      title: "Séance de code",
      durationMinutes: 120,
      notes: null,
      createdById: null,
      attendanceSecret: null,
      attendanceOpenedAt: null,
      attendanceClosedAt: null,
    }),
  },
  vehicle: {
    relations: { lessons: many("drivingLesson", "vehicleId") },
    defaults: () => ({ status: "AVAILABLE", notes: null }),
  },
  drivingLesson: {
    relations: {
      application: one("permitApplication", "applicationId"),
      instructor: one("user", "instructorId"),
      vehicle: one("vehicle", "vehicleId"),
    },
    defaults: () => ({ durationMinutes: 60, status: "PLANNED", vehicleId: null, notes: null }),
  },
  exam: {
    relations: { application: one("permitApplication", "applicationId") },
    defaults: () => ({ result: "PENDING", location: null }),
  },
  task: {
    relations: { assignee: one("user", "assigneeId") },
    defaults: () => ({
      description: null,
      assigneeId: null,
      dueAt: null,
      priority: "NORMAL",
      status: "TODO",
      entityType: null,
      entityId: null,
      entityLabel: null,
      history: [],
      completedAt: null,
    }),
  },
  sessionRegistration: {
    relations: {
      session: one("theorySession", "sessionId"),
      candidate: one("user", "candidateId"),
    },
    compound: { sessionId_candidateId: ["sessionId", "candidateId"] },
    defaults: () => ({ reminder: true, reminderSentAt: null, attendedAt: null, attendanceMethod: null, codeEmailSentAt: null }),
  },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Ligne renvoyée par la base : champs du modèle et relations incluses */
export type DbRow = any;
type Delegate = {
  findMany(args?: any): Promise<DbRow[]>;
  findFirst(args?: any): Promise<DbRow | null>;
  findFirstOrThrow(args?: any): Promise<DbRow>;
  findUnique(args: any): Promise<DbRow | null>;
  findUniqueOrThrow(args: any): Promise<DbRow>;
  count(args?: any): Promise<number>;
  create(args: any): Promise<DbRow>;
  createMany(args: any): Promise<{ count: number }>;
  update(args: any): Promise<DbRow>;
  updateMany(args: any): Promise<{ count: number }>;
  upsert(args: any): Promise<DbRow>;
  delete(args: any): Promise<DbRow>;
  deleteMany(args?: any): Promise<{ count: number }>;
  aggregate(args: any): Promise<any>;
  groupBy(args: any): Promise<any[]>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

function createClient(store: Store) {
  const client = Object.fromEntries(Object.keys(models).map((name) => [name, delegate(store, name)])) as unknown as Record<string, Delegate>;
  return Object.assign(client, {
    /** Tableau de requêtes, ou fonction qui reçoit le client (même API que Prisma) */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async $transaction(input: any): Promise<any> {
      if (typeof input === "function") return input(client);
      return Promise.all(input);
    },
    async $disconnect() {},
  });
}

type Models = {
  organization: Delegate;
  user: Delegate;
  permitApplication: Delegate;
  document: Delegate;
  payment: Delegate;
  invoiceCounter: Delegate;
  passwordToken: Delegate;
  message: Delegate;
  applicationEvent: Delegate;
  theorySession: Delegate;
  sessionRegistration: Delegate;
  vehicle: Delegate;
  drivingLesson: Delegate;
  exam: Delegate;
  task: Delegate;
};
type Client = Models & {
  $transaction<T>(fn: (tx: Models) => Promise<T>): Promise<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction(ops: Promise<unknown>[]): Promise<any[]>;
  $disconnect(): Promise<void>;
};

// une seule base pour tout le serveur, conservée entre deux rechargements à chaud
// si les modèles changent pendant que le serveur tourne, la base de démo est recréée
const globalForDb = globalThis as unknown as { virageDb?: Store; virageDbSchema?: string };
const schema = JSON.stringify(Object.entries(models).map(([name, def]) => [name, Object.keys(def.relations ?? {}), Object.keys(def.defaults?.() ?? {})]));

function getStore() {
  if (!globalForDb.virageDb || globalForDb.virageDbSchema !== schema) {
    const store = new Store(models);
    seed(store);
    globalForDb.virageDb = store;
    globalForDb.virageDbSchema = schema;
  }
  return globalForDb.virageDb;
}

export const prisma = createClient(getStore()) as unknown as Client;
