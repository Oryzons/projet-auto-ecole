import type { Tone } from "@/lib/crm";

/** Couleurs fonctionnelles du plan, identiques à celles de l'interface. */
export const TONE_HEX: Record<Tone, string> = {
  neutral: "#64748b",
  active: "#2d50f5",
  success: "#16a34a",
  warning: "#ea8a0c",
  danger: "#e5484d",
};

/** Classes Tailwind pour les pastilles et les points de statut. */
export const TONE_CLASS: Record<Tone, { dot: string; soft: string; text: string }> = {
  neutral: { dot: "bg-slate-400", soft: "bg-slate-100 text-slate-600", text: "text-slate-600" },
  active: { dot: "bg-primary", soft: "bg-primary-soft text-primary", text: "text-primary" },
  success: { dot: "bg-emerald-500", soft: "bg-emerald-50 text-emerald-700", text: "text-emerald-700" },
  warning: { dot: "bg-amber-500", soft: "bg-amber-50 text-amber-700", text: "text-amber-700" },
  danger: { dot: "bg-red-500", soft: "bg-red-50 text-red-600", text: "text-red-600" },
};
