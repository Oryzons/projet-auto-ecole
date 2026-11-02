/** 1350 → « 1 350 € », 337.5 → « 337,50 € » (sans dépendre de l'Intl du moteur JS) */
export const euro = (n: number) => {
  const [int, dec] = (Number.isInteger(n) ? String(n) : n.toFixed(2)).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}${dec ? `,${dec}` : ''} €`;
};

/** Date → « jeu. 12 nov. » */
export const shortDate = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

/** Initiales pour les avatars : « Lucas Martin » → « LM » */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
