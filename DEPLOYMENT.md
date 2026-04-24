# Guide de déploiement Ethnic OS

## Architecture

```
[Code GitHub: Ethnic2017/Ethnic-os]
         │
         ▼ (push sur main)
[GitHub Actions: build + déploie]
         │
         ▼ (FTP)
[OVH /www/ethnic-os-v2/]
         │
         ▼
[ethnic-community.org/ethnic-os-v2/]
         │
         ▼ (quand validé)
[Bascule vers /www/ (racine)]
         │
         ▼
[ethnic-community.org] ← prod
```

## Backend Supabase

- **Projet** : `oliymrqfkpyjjpizjtja`
- **URL** : `https://oliymrqfkpyjjpizjtja.supabase.co`
- **14 tables** créées (people, projects, events, products, orders, etc.)
- **3 storage buckets** (media, products, deco)
- **RLS activé** sur toutes les tables

## Secrets GitHub à configurer

Dans le repo GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Nom du secret | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | `https://oliymrqfkpyjjpizjtja.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (la clé complète) |
| `FTP_SERVER` | `ftp.cluster029.hosting.ovh.net` (à vérifier dans OVH) |
| `FTP_USERNAME` | `ethnicb` |
| `FTP_PASSWORD` | (mot de passe FTP OVH) |

## Comment déployer

1. **Push** sur la branche `main` → déploiement automatique
2. **Manuel** : GitHub → Actions → "Build & Deploy to OVH" → Run workflow

Le site sera accessible sur :
- `https://ethnic-community.org/ethnic-os-v2/` (test)

## Bascule vers la prod

Quand le test est validé :
1. Modifier `.github/workflows/deploy.yml` :
   - Changer `server-dir: /www/ethnic-os-v2/` en `server-dir: /www/`
   - Mettre `dangerous-clean-slate: true` (efface l'ancien site)
2. Push → la nouvelle app remplace l'ancienne sur ethnic-community.org

## Fichiers clés

- `src/api/supabaseClient.js` — wrapper Base44 → Supabase
- `src/lib/AuthContext.jsx` — auth Supabase
- `src/pages/Login.jsx` — page de connexion
- `public/.htaccess` — config Apache OVH (SPA routing + HTTPS)
- `supabase/schema.sql` — schéma complet de la BDD

## Migration des données Base44

À faire séparément :
1. Exporter les données depuis Base44 (dashboard ou API)
2. Transformer en SQL INSERT ou utiliser un script Node
3. Importer dans Supabase via le SQL Editor ou un script
