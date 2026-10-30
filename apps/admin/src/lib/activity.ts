/** Au-delà de 8 h sans activité, la session est fermée et il faut se reconnecter. */
export const INACTIVITY_LIMIT_MS = 8 * 3_600_000;

/** Intervalle minimal entre deux signaux d'activité envoyés au serveur. */
export const ACTIVITY_PING_MS = 2 * 60_000;

/** Posé à la connexion : le récap « depuis votre dernière visite » s'ouvre une fois sur le plan. */
export const RECAP_FLAG = "virage:recap";

/** Dernière interaction dans ce navigateur (partagée entre les onglets). */
export const LAST_ACTIVE_KEY = "virage:last-active";

/** Événement qui rouvre le récap (menu du compte). */
export const RECAP_EVENT = "virage:recap";
