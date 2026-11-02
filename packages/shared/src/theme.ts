/**
 * Virage — couleurs communes à l'app mobile et au site admin.
 * Reprises des maquettes : bleu électrique pour l'action, bleu nuit pour le texte,
 * fonds blancs légèrement bleutés. Les couleurs d'état restent discrètes.
 */

export const colors = {
  background: '#F6F7FB',
  card: '#FFFFFF',
  subtle: '#F8FAFD',
  ink: '#14203C',
  text: '#14203C',
  muted: '#5B6B82',
  faint: '#8A99AF',
  border: '#E3EAF4',
  input: '#DBE4F0',

  primary: '#2D50F5',
  primaryStrong: '#1F3BD1',
  primarySoft: '#ECEFFE',
  onPrimary: '#FFFFFF',

  success: '#12865A',
  successSoft: '#E7F6EF',
  warning: '#B45F06',
  warningSoft: '#FDF3E3',
  danger: '#D93F3F',
  dangerSoft: '#FDECEC',
  violet: '#6D4BD8',
  violetSoft: '#F0ECFC',
} as const;

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'violet';

export const toneColors: Record<Tone, { fg: string; bg: string }> = {
  primary: { fg: colors.primary, bg: colors.primarySoft },
  success: { fg: colors.success, bg: colors.successSoft },
  warning: { fg: colors.warning, bg: colors.warningSoft },
  danger: { fg: colors.danger, bg: colors.dangerSoft },
  neutral: { fg: colors.muted, bg: '#EEF2F7' },
  violet: { fg: colors.violet, bg: colors.violetSoft },
};
