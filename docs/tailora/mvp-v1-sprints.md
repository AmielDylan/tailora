# Tailora — cadrage MVP V1

## Hypothèse à valider

Un couturier peut remplacer son cahier papier par Tailora, un carnet de couture digital léger pour enregistrer, suivre et retrouver ses commandes clients.

## Promesse V1

Enregistrer une commande avec le client, les dates, les photos du tissu et du modèle, le statut, le paiement léger, puis la retrouver rapidement.

## Périmètre inclus

- Compte simple pour un couturier ou une couturière.
- Création et modification d'un client.
- Création, modification et suppression confirmée d'une commande.
- Association d'une commande à un client.
- Date de réception du tissu et date prévue de livraison.
- Photo du tissu et photo du modèle demandé.
- Statuts : Reçue, En cours, Terminée, Livrée.
- Notes libres pour le modèle, les mensurations simples ou les remarques.
- Paiement léger : prix total, avance, reste à payer calculé automatiquement.
- Liste des commandes, recherche par nom ou téléphone et filtres simples par statut.
- Tableau de bord : commandes en cours, prochaines livraisons, retards.

## Périmètre exclu

Paiement en ligne, Mobile Money, reçus PDF, notifications avancées, WhatsApp automatique, multi-utilisateurs, gestion d'équipe, stock, comptabilité complète, statistiques avancées, application mobile native obligatoire, hors ligne complet, multi-ateliers et catalogue de modèles.

## Règles métier de base

- Le reste à payer est `max(prix total - avance, 0)`.
- Une commande est en retard si sa date de livraison prévue est passée et si son statut n'est pas `Livrée`.
- Les quatre statuts V1 suffisent pour tester l'usage réel.
- Les informations importantes doivent rester modifiables après création.

## Écrans V1

1. Tableau de bord.
2. Liste des commandes.
3. Ajout / modification de commande.
4. Détail commande.
5. Liste clients.
6. Détail client avec historique des commandes.

## Découpage en sprints courts

### Sprint 0 — Cadrage et prototype basse fidélité

Aligner le périmètre V1, les écrans essentiels, le parcours principal et les règles métier avant de coder.

### Sprint 1 — Socle application et commandes locales

Construire une interface mobile-first avec navigation, création de commande sans photo, liste, détail et changement de statut.

### Sprint 2 — Photos, clients et recherche

Ajouter les photos tissu/modèle, la liste clients, le détail client avec historique et la recherche par nom ou téléphone.

### Sprint 3 — Tableau de bord, paiements légers et retards

Ajouter les indicateurs de priorité, le paiement léger, le calcul du reste à payer, les retards et les filtres par statut.

### Sprint 4 — Stabilisation et test terrain

Préparer une version testable par 3 à 5 couturiers : confirmations, messages simples, données de démonstration, guide de test et collecte des retours.

## Scénario de test terrain

1. Ajouter un nouveau client.
2. Ajouter une commande pour ce client.
3. Prendre ou ajouter une photo du tissu.
4. Ajouter une photo du modèle demandé.
5. Renseigner la date de réception.
6. Renseigner la date de livraison.
7. Ajouter le prix total et l'avance.
8. Retrouver la commande dans la liste.
9. Rechercher la commande par nom ou téléphone.
10. Passer la commande au statut `En cours`.
11. Marquer la commande comme `Terminée`, puis `Livrée`.

## Décisions à verrouiller avant backend

- Nom provisoire du produit.
- Cible exacte de la V1.
- Champs obligatoires d'une commande et d'un client.
- Photos obligatoires ou recommandées.
- Paiement léger indispensable ou optionnel.
- PWA mobile-first ou application native.
- Durée du test terrain et nombre de couturiers testeurs.

## Backlog produit

### Atelier et WhatsApp

- V1 gratuite : liens WhatsApp préremplis pour relancer une livraison, demander les mensurations, signaler une commande prête ou rappeler un solde.
- V2 payante : WhatsApp Cloud API avec templates validés, envoi automatique, relances programmées, statut des messages et historique de conversation.
- V2/V3 payante : modèles de messages par atelier, campagnes simples pour clientes fidèles, rappels saisonniers et suivi après livraison.

### Photos et stockage

- Court terme : compression plus forte, brouillons de formulaire et messages clairs pour les formats mobiles difficiles.
- Si le volume photo augmente : migrer les images vers Firebase Storage et garder dans Firestore uniquement les URLs et métadonnées.

### Apprentissage couture

- V2 : module tutoriel pour débuter en couture, avec fiches courtes, vocabulaire, mesures de base et conseils pratiques.
- V3 : contenus publiés par des couturiers, vidéos de formation, parcours guidés et contenus générés ou assistés par IA.
