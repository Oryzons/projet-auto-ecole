# Supabase

Base de données commune à l'app mobile et au site admin (Postgres, comptes, fichiers, temps réel).

Pas encore branché : l'app et le site utilisent pour l'instant les données de démonstration de `packages/shared/src/mock.ts`.

## Démarrer en local (Docker)

```bash
npx supabase init     # crée supabase/config.toml
npx supabase start    # lance Postgres, l'authentification, le stockage et le temps réel dans Docker
```

Ce dossier contiendra :

- `migrations/` : le schéma de la base (élèves, leçons, paiements, documents…), versionné
- `functions/` : les fonctions serveur (envoi d'e-mails avec Resend, rappels d'examen…)
- `seed.sql` : les données de démonstration
