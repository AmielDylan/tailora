# Firebase

Projet Firebase prod : `tailora-app`

App Web : `Tailora Web`

App ID : `1:564865157855:web:8d752e8d1b560c13f8b76a`

Base Firestore : `(default)` en `europe-west1`

## Variables Vite

Copier les valeurs SDK Firebase Web dans les variables suivantes :

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=tailora-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tailora-app
VITE_FIREBASE_APP_ID=1:564865157855:web:8d752e8d1b560c13f8b76a
VITE_FIREBASE_STORAGE_BUCKET=tailora-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=564865157855
VITE_FIREBASE_PHONE_OTP_ENABLED=false
```

La cle API Firebase Web n'est pas un secret serveur, mais elle doit rester geree via les variables d'environnement de l'application et les restrictions de cle Google Cloud.

## Firestore

Les regles publiees limitent l'acces aux documents situes sous `users/{uid}/...` :

- un utilisateur connecte peut lire et ecrire uniquement son propre espace `users/{uid}`;
- tout autre document est refuse par defaut.

## Synchronisation offline-first

Les donnees metier Tailora sont synchronisees dans Firestore sous :

```txt
users/{uid}/state/app
```

Le document contient les `clients`, les `orders`, un `schemaVersion` et un `updatedAt`.

Comportement applicatif :

- au demarrage, Tailora charge d'abord le cache local `localStorage` pour rester utilisable immediatement ;
- quand Firebase Auth fournit un `uid`, l'application ecoute `users/{uid}/state/app` ;
- si Firestore contient deja des donnees plus recentes, elles remplacent le cache local ;
- si Firestore est vide et que le navigateur a deja des donnees locales, Tailora les pousse vers Firestore ;
- a chaque modification client/commande, Tailora ecrit dans `localStorage` puis dans Firestore ;
- avec le cache persistant Firestore Web, les ecritures hors-ligne sont conservees localement et synchronisees quand la connexion revient.

Le cache Firestore persistant est initialise avec `persistentLocalCache` et un gestionnaire multi-onglets.

## Authentification telephone

Le MVP utilise une connexion numero international + mot de passe. L'OTP SMS Firebase est prepare dans le code, mais reste desactive tant que `VITE_FIREBASE_PHONE_OTP_ENABLED=false`.

Pour rester compatible avec Firebase Auth sans demander d'email aux couturiers, Tailora utilise en interne le provider Firebase Email/Password avec un email technique derive du numero normalise :

```txt
+2290190000000 -> p2290190000000@phone.tailora.app
+221771234567 -> p221771234567@phone.tailora.app
```

Cet email technique n'est pas affiche a l'utilisateur. Un vrai email pourra etre ajoute plus tard dans le profil, comme moyen de contact ou comme option de connexion separee.

A activer dans Firebase Console : Authentication > Sign-in method > Email/Password. Cette option ne declenche pas de SMS.

## OTP SMS Firebase

Pour utiliser les OTP SMS Firebase en production :

- activer Firebase Authentication > Phone dans la console Firebase ;
- lier le projet a Billing/Blaze pour l'envoi SMS ;
- configurer la SMS Region Policy pour autoriser uniquement les pays cibles ;
- verifier que les domaines de deploiement Tailora sont dans Authentication > Settings > Authorized domains ;
- passer `VITE_FIREBASE_PHONE_OTP_ENABLED=true` dans les variables Vercel ;
- redeployer l'application.

Sur le Web, Firebase Phone Auth utilise un `RecaptchaVerifier`. Le formulaire Tailora initialise donc un reCAPTCHA invisible au moment ou l'utilisatrice demande le code SMS.

Important : les SMS OTP ont un cout et doivent etre proteges par une allowlist de regions. Pour le MVP, garder `VITE_FIREBASE_PHONE_OTP_ENABLED=false` tant que les pays cibles et le budget ne sont pas fixes.

Le 26 mai 2026, l'initialisation Auth via API a ete bloquee par Google avec `BILLING_NOT_ENABLED`. Les comptes de facturation visibles depuis le CLI etaient fermes, donc le projet doit d'abord etre lie a un compte Billing/Blaze actif dans Google Cloud ou Firebase Console.

La SMS Region Policy peut ensuite etre configuree par API Identity Toolkit avec une allowlist des pays cibles, ou depuis Firebase Console > Authentication > Settings > SMS region policy.
