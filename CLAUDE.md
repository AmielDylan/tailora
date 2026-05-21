# Tailora — Instructions de développement

## Projet

PWA mobile-first pour remplacer le cahier papier d'un couturier. Un seul utilisateur (compte unique), données locales en `localStorage`, photos encodées localement.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- shadcn/ui + Radix UI
- `@tanstack/react-table` pour les listes
- `nuqs` pour les query params
- `vite-plugin-pwa` pour le mode PWA

## Workflow Git

### develop
- **Jamais de modification directe sur `develop`.**
- Pour chaque tâche, créer une branche feature depuis `develop` :
  ```bash
  git checkout -b feature/<nom> develop
  ```
- Faire les commits sur la branche feature.
- Merger en no-ff dans `develop`, puis supprimer la branche :
  ```bash
  git checkout develop
  git merge --no-ff feature/<nom>
  git branch -d feature/<nom>
  ```

### main
- **Jamais de modification directe sur `main`.**
- Après les modifications sur `develop`, ouvrir une PR `develop → main` :
  ```bash
  gh pr create --base main --head develop --title "..." --body "..."
  gh pr merge --auto --merge
  ```

## Commandes

```bash
npm run dev     # démarrer en dev (expose 0.0.0.0 pour accès mobile)
npm run build   # validation technique (tsc + vite build) — seul contrôle CI
```

Pas de suite de tests. La validation se fait via `npm run build` + test terrain.

## Règles métier

- **Reste à payer** = `max(prix total − avance, 0)`
- **Retard** = date de livraison prévue dépassée ET statut ≠ `Livrée`
- **Statuts** (dans l'ordre) : `Reçue` → `En cours` → `Terminée` → `Livrée`
- Toutes les informations restent modifiables après création

## Périmètre V1 — inclus

Commandes (création/modification/suppression), clients (liste + détail + historique), photos tissu/modèle, statuts, paiement léger, recherche par nom/téléphone, filtres par statut, tableau de bord (en cours, prochaines livraisons, retards).

## Périmètre V1 — exclu

Paiement en ligne, Mobile Money, PDF, notifications push, WhatsApp automatique, multi-utilisateurs, stock, comptabilité, statistiques avancées, mode hors-ligne complet, multi-ateliers, catalogue de modèles.

## Design system (DESIGN.md)

Le repo inclut un système de design éditorial monochrome inspiré de Runwai. Principes à respecter :

### Couleurs
- Monochromatique : pas de couleur d'accent (pas de bleu, vert, rouge)
- `primary` = `#000000` — uniquement pour les actions primaires et le footer
- Texte : utiliser les palettes neutres (`ink`, `graphite`, `slate`, `mute`)
- Profondeur via la photographie et les surfaces tonales, jamais via des ombres

### Typographie
- Police unique : `abcNormal` (remplacée par Geist dans le code actuel)
- Tracking négatif sur les titres display (`-0.9px` à `-1.2px`)
- Majuscules réservées aux `eyebrow` (14px) et `micro-caps` (11px) uniquement
- Corps de texte toujours aligné à gauche

### Boutons
- **Primaire** : fond `#000000`, texte blanc, `border-radius: 9999px` (pill pleine)
- **Ghost** : fond blanc, texte `ink`, border 1px `ink`, même pill
- **Texte/lien** : sans fond, texte `ink`, souligné au survol
- Un seul bouton primaire visible par viewport — le reste devient ghost

### Composants
- Cartes : sans ombre, séparées par des règles hairline (`1px`)
- Champs de formulaire : `border-radius: 0` (carrés), rule inférieure seulement
- Tier mis en avant : fond `hairline` (#e7eaf0), jamais une bordure colorée
- Photos : pleine largeur dans les heroes, `border-radius: 8px` dans les modules contenus

### Mobile-first
- Tous les écrans sont conçus pour mobile d'abord
- Boutons primaires : hauteur 48px sur mobile (44px desktop)
- Touch targets ≥ 44×44px
- Navigation bottom bar sur mobile

## Conventions code

- Composants dans `src/components/`, pages dans `src/pages/`
- Données dans `src/lib/storage.ts` (localStorage)
- Types dans `src/types.ts`
- Utilitaires dans `src/helpers.ts` et `src/lib/`
- Pas de commentaires sauf si le "pourquoi" est non-évident
- Pas de gestion d'erreur pour des cas impossibles
- Pas de feature flags ni de shims de compatibilité
