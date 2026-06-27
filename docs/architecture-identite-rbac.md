# Architecture — Identité & Accès (RBAC) · Ethnic OS

_Statut : proposition à valider · 2026-06-27_

## 1. Principe central
**Une personne = une seule fiche `people`.** Qu'elle soit contact CRM, membre connecté ou staff.
Le compte de connexion (`auth.users`) se **relie** à sa fiche. Les droits back-office vivent dans `module_permissions`.

```
auth.users (login)  ──linked_user_id──>  people (la personne)  <──linked_contact_id──  module_permissions (accès staff)
        ▲                                     │                                              │
        └──────────────── supabase_user_id ───┴──────────────────────────────────────────────┘
```

Bonne nouvelle : **les 3 champs de liaison existent déjà** en base. Le chantier = les **câbler**, ajouter une **fonction serveur** sécurisée pour les invitations, et poser la **RLS**. Peu de changements de schéma.

## 2. Les 3 profils
| Profil | A un compte ? | Accès |
|---|---|---|
| **Contact** | non | aucune connexion — juste une fiche CRM (la majorité des 3537) |
| **Membre** | oui | son espace : panier, profil, préférences de mailing |
| **Staff** (team/manager/admin) | oui | espace membre **+** modules back-office attribués |

> ⚠️ Distinction clé : un **tag CRM** (« Ethnic Crew ») ≠ un **rôle d'accès** (staff). Tagger = étiquette de segmentation. Donner accès = créer un compte + rôle. L'interface permettra de faire les deux d'un coup (« promouvoir ce contact en staff »).

## 3. Rôles & permissions
- **Rôles** (`module_permissions.account_type`) : `admin`, `manager`, `team_member` (staff), `member`, `customer`.
- **Droits par module** (déjà en place) : `crm_access`, `events_access`, `projects_access`, `souq_access`, `communication_access` — niveaux `no_access / read_only / editor / manager`.
- **Membre** : aucun droit module ; accès à son panier + profil + mailing.

## 4. RLS (la garantie serveur)
- Fonction helper `has_module(module, level)` qui lit le `module_permissions` de `auth.uid()` (via `supabase_user_id`).
- **Tables back-office** (people, projects, events, orders…) : lecture = staff authentifié ; **écriture = `has_module(...)`** (remplace `USING(true)`).
- **Self-service** (panier, préférences, sa propre fiche) : `owner = auth.uid()` (via `people.linked_user_id`).
- `module_permissions` : l'admin écrit ; chaque user lit sa propre ligne.

## 5. Flux & écrans
1. **Login public** (existant) + **inscription membre** (nouveau) + **Google OAuth** (nouveau) + **mot de passe oublié** (natif Supabase).
2. **Inviter un utilisateur** → **Edge Function `manage-user`** (clé service-role) : crée le compte auth → relie/ crée la fiche `people` par email → crée `module_permissions` (rôle + modules). *→ corrige l'invitation cassée.*
3. **Promouvoir un contact en staff** (le cas « Costa → Ethnic Crew + accès ») : depuis le CRM, bouton « Donner un accès » → même Edge Function, relie la fiche existante.
4. **Espace membre** : éditer profil, préférences de mailing, panier/commandes.
5. **Admin · Users & Permissions** : liste des comptes, attribution rôles/modules, lien vers la fiche CRM.

## 6. Pourquoi l'invitation ne peut PAS marcher aujourd'hui
Créer/inviter un utilisateur Supabase exige l'**API admin avec la clé `service_role`**, qui ne doit **jamais** être dans le navigateur. L'appel actuel (`base44.users.inviteUser`) côté client est donc voué à l'échec → il faut une **Edge Function** côté serveur. C'est la Phase 1.

## 7. Migration des données
- Relier l'**admin** existant à une fiche `people` (par `hello@ethnic-community.org`).
- Les **3537 contacts** restent des contacts ; à l'inscription/invitation on **relie par email** (3442 ont un email) pour éviter les doublons.
- `community_members` (artistes/bénévoles) : à la validation, deviennent `people` + membres.
- « Ethnic Crew » : conservé comme **tag** sur `people` (segmentation), indépendant du rôle d'accès.

## 8. Plan de livraison (par phases, déployables une par une)
| Phase | Contenu | Corrige |
|---|---|---|
| **1 — Comptes & liaison** | Edge Function `manage-user` (inviter/promouvoir) + câblage UserManagement + lien `people` ↔ compte | « impossible d'ajouter un user », contacts non liés, Costa→crew |
| **2 — RLS écriture** | droits par module appliqués côté serveur | faille « tout user connecté peut tout modifier » |
| **3 — Espace membre** | profil, préférences mailing, panier (RLS propriétaire) | self-service membre |
| **4 — Connexions** | Google OAuth + inscription publique + mot de passe oublié | login Google, autonomie des comptes |
| **5 — Config** | externaliser modules/menu, contenu, catégories mailing | sortir la config du code |
