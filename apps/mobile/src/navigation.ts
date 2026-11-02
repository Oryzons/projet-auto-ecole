import { colors } from '@/theme';

/**
 * Transitions communes à toutes les piles : glissement façon iOS (sur iOS et Android),
 * retour en glissant vers la droite depuis n'importe où sur la page (iOS).
 */
export const stackOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
  animation: 'ios_from_right',
  animationDuration: 320,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
} as const;

/** Entrée dans un espace (élève, moniteur, admin) : fondu doux plutôt qu'un glissement */
export const fadeOptions = { animation: 'fade', animationDuration: 280 } as const;

