import type { BankTransferSettings } from "@/lib/constants";

/** Retire espaces et tirets, passe en majuscules. */
export function normalizeIban(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

/** Contrôle de format et clé ISO 13616 (modulo 97). */
export function isValidIban(value: string) {
  const iban = normalizeIban(value);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const digits = /\d/.test(char) ? char : String(char.charCodeAt(0) - 55);
    for (const digit of digits) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

export function isValidBic(value: string) {
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value.trim().toUpperCase());
}

/** IBAN lisible, par groupes de 4. */
export function formatIban(value: string) {
  return normalizeIban(value).replace(/(.{4})/g, "$1 ").trim();
}

/** Référence à indiquer dans le libellé du virement, propre au dossier. */
export function transferReference(applicationId: string) {
  return `PERMIS-${applicationId.slice(-8).toUpperCase()}`;
}

/** Le virement n'est proposé que s'il est activé et que l'IBAN est valide. */
export function isBankTransferReady(settings: BankTransferSettings | undefined) {
  return Boolean(
    settings?.enabled && settings.holder.trim() && isValidIban(settings.iban),
  );
}
