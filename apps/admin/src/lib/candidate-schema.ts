import { z } from "zod";

/** Date AAAA-MM-JJ réelle, dans le passé et après 1900. */
export function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  if (date.toISOString().slice(0, 10) !== value) return false;
  return date.getUTCFullYear() >= 1900 && date.getTime() < Date.now();
}

/** Numéro NEPH : 12 chiffres, facultatif. */
export const OEDIPP_LENGTH = 12;
export const OEDIPP_ERROR = "Le numéro NEPH doit contenir 12 chiffres";

export function isValidOedipp(value: string) {
  return value === "" || /^\d{12}$/.test(value);
}

/** Ne garde que les chiffres, dans la limite de 8 (saisie des formulaires). */
export function cleanOedipp(value: string) {
  return value.replace(/\D/g, "").slice(0, OEDIPP_LENGTH);
}

export const oedippSchema = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine(isValidOedipp, OEDIPP_ERROR);

export const createCandidateSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis").max(80),
  lastName: z.string().trim().min(1, "Le nom est requis").max(80),
  email: z.string().trim().toLowerCase().email("Email invalide").max(200),
  phone: z.string().trim().max(30, "Le téléphone est trop long").optional(),
  street: z.string().trim().min(1, "La rue est requise").max(160),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres"),
  city: z.string().trim().min(1, "La ville est requise").max(80),
  dateOfBirth: z
    .string()
    .min(1, "La date de naissance est requise")
    .refine(isValidBirthDate, "La date de naissance est invalide"),
  oedippNumber: oedippSchema,
  permitType: z.enum(["permis-b", "permis-b-auto", "aac", "a2"]),
  partnerRate: z.boolean(),
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;

export interface CandidateFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  dateOfBirth: string;
  oedippNumber: string;
  permitType: "permis-b" | "permis-b-auto" | "aac" | "a2";
  partnerRate: boolean;
}

export const emptyCandidateForm: CandidateFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  postalCode: "",
  city: "",
  dateOfBirth: "",
  oedippNumber: "",
  permitType: "permis-b",
  partnerRate: false,
};

export function formatCandidateAddress(data: {
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
}) {
  const parts = [
    data.street?.trim(),
    [data.postalCode?.trim(), data.city?.trim()].filter(Boolean).join(" "),
  ].filter(Boolean);

  return parts.join(", ");
}
