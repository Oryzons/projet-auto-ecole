/**
 * Session fictive : se souvient si cet appareil a déjà été vérifié par code.
 * La première connexion demande un code à 4 chiffres, les suivantes non.
 */
let deviceVerified = false;

export const isDeviceVerified = () => deviceVerified;
export const markDeviceVerified = () => {
  deviceVerified = true;
};
