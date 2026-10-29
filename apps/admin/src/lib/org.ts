import { prisma } from "./prisma";
import {
  DEFAULT_BANK_TRANSFER,
  DEFAULT_COMPANY_PROFILE,
  DEFAULT_ORG_SETTINGS,
  PERMIT_TYPES,
  normalizeDiscountCode,
  type DiscountCode,
  type OrgSettings,
  type PermitBriefings,
  type PermitPrices,
} from "./constants";

export async function getCurrentOrganization() {
  const slug = process.env.DEFAULT_ORG_SLUG ?? "virage";
  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) {
    throw new Error(`Organization not found: ${slug}`);
  }
  return org;
}

function normalizePermitPrices(raw: Partial<OrgSettings>): PermitPrices {
  const fallbackStandard = raw.standardPrice ?? DEFAULT_ORG_SETTINGS.standardPrice;
  const fallbackPartner = raw.partnerPrice ?? DEFAULT_ORG_SETTINGS.partnerPrice;
  const prices: PermitPrices = {};
  for (const permit of PERMIT_TYPES) {
    const stored = raw.permitPrices?.[permit.value];
    prices[permit.value] = {
      standard: typeof stored?.standard === "number" ? stored.standard : fallbackStandard,
      partner: typeof stored?.partner === "number" ? stored.partner : fallbackPartner,
    };
  }
  return prices;
}

function normalizeBriefings(raw: unknown): PermitBriefings {
  const briefings: PermitBriefings = {};
  if (!raw || typeof raw !== "object") return briefings;
  for (const permit of PERMIT_TYPES) {
    const value = (raw as PermitBriefings)[permit.value];
    if (typeof value === "string" && value.trim()) briefings[permit.value] = value.trim().slice(0, 4000);
  }
  return briefings;
}

function normalizeDiscountCodes(raw: unknown): DiscountCode[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const codes: DiscountCode[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Partial<DiscountCode>;
    const code = normalizeDiscountCode(String(entry.code ?? ""));
    const kind = entry.kind;
    const value = entry.value;
    if (code.length < 2 || seen.has(code) || (kind !== "amount" && kind !== "percent")) continue;
    if (typeof value !== "number" || !Number.isInteger(value)) continue;
    if (kind === "percent" && (value < 1 || value > 100)) continue;
    if (kind === "amount" && value < 1) continue;
    seen.add(code);
    codes.push({ code, label: typeof entry.label === "string" ? entry.label : "", kind, value });
  }
  return codes;
}

export function getOrgSettings(settings: unknown): OrgSettings {
  const raw = (settings ?? {}) as Partial<OrgSettings>;
  return {
    ...DEFAULT_ORG_SETTINGS,
    ...raw,
    permitPrices: normalizePermitPrices(raw),
    permitBriefings: normalizeBriefings(raw.permitBriefings),
    discountCodes: normalizeDiscountCodes(raw.discountCodes),
    documentTemplates: raw.documentTemplates ?? {},
    documentGuidance: raw.documentGuidance ?? {},
    bankTransfer: { ...DEFAULT_BANK_TRANSFER, ...raw.bankTransfer },
    company: {
      ...DEFAULT_COMPANY_PROFILE,
      ...raw.company,
    },
  };
}

export async function getCurrentOrgSettings(): Promise<OrgSettings> {
  const org = await getCurrentOrganization();
  return getOrgSettings(org.settings);
}
