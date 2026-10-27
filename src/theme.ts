/**
 * Virage — design system
 * Couleurs reprises des maquettes Figma : un bleu électrique pour l'action, un bleu nuit
 * pour le texte, des fonds blancs légèrement bleutés. Les couleurs d'état restent discrètes.
 * Toutes les couleurs de l'app passent par ce fichier.
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

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const font = {
  title: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.6, color: colors.ink },
  h2: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, color: colors.ink },
  h3: { fontSize: 15, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.muted },
  tiny: { fontSize: 11, color: colors.muted },
};

export const shadow = {
  card: {
    shadowColor: '#0F2854',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  primary: {
    shadowColor: '#2D50F5',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
};
