import {
  PERMIT_TYPES,
  normalizeDiscountCode,
  priceForChoice,
  quotePermitPrice,
  type OrgSettings,
  type PermitTypeValue,
} from "@/lib/constants";

export type SignupAdvantage = "none" | "partner" | "code";

export type SignupChoice = {
  permitType: PermitTypeValue;
  partnerRate: boolean;
  partnerCompany: string | null;
  discountCode: string | null;
  discountKind: string | null;
  discountValue: number | null;
  totalAmount: number;
  discountLabel: string | null;
};

export function offeredPermits(settings: OrgSettings) {
  return PERMIT_TYPES.filter((permit) => settings.permitTypes.includes(permit.value)).map((permit) => ({
    value: permit.value,
    label: permit.label,
    standard: quotePermitPrice(settings, permit.value, false),
    partner: quotePermitPrice(settings, permit.value, true),
  }));
}

export function resolveSignupChoice(
  settings: OrgSettings,
  input: { permitType: string; advantage: SignupAdvantage; code?: string; partnerCompany?: string },
): SignupChoice | { error: string } {
  const permit = PERMIT_TYPES.find((item) => item.value === input.permitType);
  if (!permit || !settings.permitTypes.includes(permit.value)) {
    return { error: "Ce permis n'est pas proposé." };
  }

  if (input.advantage === "partner") {
    const company = input.partnerCompany?.trim() ?? "";
    return {
      permitType: permit.value,
      partnerRate: true,
      partnerCompany: company ? company.slice(0, 120) : null,
      discountCode: null,
      discountKind: null,
      discountValue: null,
      totalAmount: quotePermitPrice(settings, permit.value, true),
      discountLabel: null,
    };
  }

  if (input.advantage === "code") {
    const normalized = normalizeDiscountCode(input.code ?? "");
    const found = settings.discountCodes.find((code) => code.code === normalized);
    if (!found) return { error: "Ce code de réduction n'est pas reconnu." };
    return {
      permitType: permit.value,
      partnerRate: false,
      partnerCompany: null,
      discountCode: found.code,
      discountKind: found.kind,
      discountValue: found.value,
      totalAmount: priceForChoice(settings, permit.value, false, found),
      discountLabel: found.label || null,
    };
  }

  return {
    permitType: permit.value,
    partnerRate: false,
    partnerCompany: null,
    discountCode: null,
    discountKind: null,
    discountValue: null,
    totalAmount: quotePermitPrice(settings, permit.value, false),
    discountLabel: null,
  };
}
