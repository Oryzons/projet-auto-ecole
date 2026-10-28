# Virage — application mobile pour auto-écoles

Application mobile (React Native + Expo) inspirée de [Nautiflow](https://github.com/Oryzons/Nautiflow), pensée pour les auto-écoles.
Cette première version contient **uniquement l'interface** : toutes les données sont fictives (`packages/shared/src/mock.ts`) et aucun backend n'est branché.

## Tester sur son téléphone (Expo Go)

1. Installer **Expo Go** sur le téléphone (App Store ou Google Play).
2. Sur l'ordinateur (Node.js 20 ou plus) :
   ```bash
   npm install
   npx expo start
   ```
3. Scanner le QR code affiché dans le terminal :
   - **iPhone** : avec l'appareil photo, puis ouvrir le lien dans Expo Go ;
   - **Android** : depuis l'onglet « Scan QR code » d'Expo Go.

Le téléphone et l'ordinateur doivent être sur le même réseau Wi-Fi. Sinon, lancer `npx expo start --tunnel`.
Chaque modification du code se recharge instantanément sur le téléphone.

`npx expo start --web` ouvre aussi l'app dans le navigateur, pratique pour un aperçu rapide.

## Les trois espaces

L'écran d'accueil mène à l'espace **élève** (« Créer mon dossier » ou « J'ai déjà un compte »).
En bas de l'accueil, les boutons **Démo · Moniteur / Administration** ouvrent les deux autres espaces.

| Espace | Écrans | Fonctionnalités prévues couvertes |
| --- | --- | --- |
| **Élève** (`src/app/eleve`) | Accueil, Leçons, Formation, Messages, Réglages, Pièces justificatives, Contrat, Paiements, Progression REMC | Inscription et dossier, dépôt de pièces, signature du contrat, suivi des documents acceptés / refusés, forfait et heures restantes, paiement et factures, messagerie, réservation / annulation, progression pédagogique, réglages de notifications |
| **Moniteur** (`src/app/moniteur`) | Planning du jour, Mes élèves, Disponibilités, Messages, Profil, Compte rendu de leçon, Fiche élève | Calendrier personnel, accès limité aux élèves planifiés, compte rendu après chaque leçon, compétences REMC, disponibilités et absences, notifications |
| **Administration** (`src/app/admin`) | Tableau de bord, Élèves, Planning, Finances, Plus (Tarifs, Équipe, Examens, Rôles, Messagerie), Fiche élève | CA et impayés, gestion des élèves, validation / refus des pièces, tarifs / forfaits / promotions, factures / devis / avoirs / échéanciers, encaissements / remboursements / paiements fractionnés, moniteurs et véhicules, planning multi-moniteurs et multi-véhicules, examens et résultats, rôles et permissions |
| Parcours d'entrée (`src/app/inscription`, `src/app/connexion`) | Bienvenue, Inscription en 3 étapes, Confirmation, Connexion e-mail / mot de passe | — |

## Organisation du code

```
src/
  app/            Écrans (Expo Router : un fichier = un écran)
  components/     Composants partagés (ui, barre d'onglets, messagerie, grille REMC)
  data/mock.ts    Données fictives, futur contrat avec l'API
  theme.ts        Couleurs, typographie, rayons : à ajuster pour coller aux maquettes Figma
```

## Commandes utiles

```bash
npx tsc --noEmit        # vérification des types
npx expo install <pkg>  # ajouter une dépendance compatible avec le SDK Expo
```
