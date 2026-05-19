# Tailora

Tailora est un carnet de couture digital mobile-first pour remplacer le cahier papier d'un couturier ou d'une couturière.

## Objectifs MVP

Enregistrer une commande avec le client, les dates, les photos du tissu et du modèle, le statut, le paiement léger, puis la retrouver rapidement.

## Stack

- PWA web mobile-first avec React, TypeScript et Vite.
- Données locales dans `localStorage` pour tester rapidement le parcours terrain avant d'ajouter un backend.
- Photos encodées localement pour valider l'usage tissu/modèle sans stockage distant.

## Fonctionnalités incluses dans ce squelette

- Tableau de bord : commandes en cours, prochaines livraisons et retards.
- Création, modification et suppression confirmée d'une commande.
- Association automatique ou manuelle d'une commande à un client.
- Photos du tissu et du modèle.
- Statuts : Reçue, En cours, Terminée, Livrée.
- Paiement léger avec reste à payer calculé automatiquement.
- Liste des commandes avec recherche par nom ou téléphone et filtre par statut.
- Liste clients avec historique des commandes.

## Commandes

```bash
npm install
npm run dev
npm run build
```

## Tests

À ce stade du MVP, le dépôt ne contient pas d'implémentation de tests end-to-end navigateur. La priorité reste la validation terrain du parcours Tailora, avec un contrôle technique minimal via `npm run build`.
