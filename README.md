# Virage — auto-école

Monorepo de l'application **Virage** : l'app mobile (élève, moniteur, administration) et le site d'administration partagent le même code et, bientôt, la même base de données.

```
apps/mobile/      App React Native + Expo (Expo Router)
apps/admin/       Site d'administration (Next.js)
packages/shared/  Code commun : couleurs, formats, données de démonstration
supabase/         Base de données, migrations et fonctions serveur (à venir)
```

## Installer

À la racine du dossier (Node.js 20 ou plus) :

```bash
npm install
```

Une seule installation suffit pour tout le monde : les dépendances sont mises en commun dans `node_modules/` à la racine.

## Lancer

```bash
npm run mobile   # app mobile : QR code à scanner avec Expo Go
npm run admin    # site admin : http://localhost:3000
```

Pour ajouter une librairie à l'app mobile : `cd apps/mobile` puis `npx expo install <librairie>`.

## Code partagé

Tout ce qui doit être identique sur le téléphone et sur le site va dans `packages/shared` et s'importe avec `@virage/shared/...` :

- `theme` : les couleurs de Virage (bleu #2D50F5, texte #14203C, fond #F6F7FB)
- `format` : montants en euros, dates, initiales
- `mock` : les données de démonstration, en attendant Supabase
