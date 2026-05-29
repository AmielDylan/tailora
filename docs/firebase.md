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
```

La cle API Firebase Web n'est pas un secret serveur, mais elle doit rester geree via les variables d'environnement de l'application et les restrictions de cle Google Cloud.

## Firestore

Les regles publiees limitent l'acces aux documents situes sous `users/{uid}/...` :

- un utilisateur connecte peut lire et ecrire uniquement son propre espace `users/{uid}`;
- tout autre document est refuse par defaut.

## Authentification telephone

Le MVP utilise une connexion numero international + mot de passe, sans OTP SMS.

Pour rester compatible avec Firebase Auth sans demander d'email aux couturiers, Tailora utilise en interne le provider Firebase Email/Password avec un email technique derive du numero normalise :

```txt
+2290190000000 -> p2290190000000@phone.tailora.app
+221771234567 -> p221771234567@phone.tailora.app
```

Cet email technique n'est pas affiche a l'utilisateur. Un vrai email pourra etre ajoute plus tard dans le profil, comme moyen de contact ou comme option de connexion separee.

A activer dans Firebase Console : Authentication > Sign-in method > Email/Password. Cette option ne declenche pas de SMS.

Pour utiliser les OTP SMS Firebase :

- activer Firebase Authentication > Phone dans la console Firebase ;
- lier le projet a Billing/Blaze pour l'envoi SMS ;
- configurer la SMS Region Policy pour autoriser uniquement les pays cibles.

Le 26 mai 2026, l'initialisation Auth via API a ete bloquee par Google avec `BILLING_NOT_ENABLED`. Les comptes de facturation visibles depuis le CLI etaient fermes, donc le projet doit d'abord etre lie a un compte Billing/Blaze actif dans Google Cloud ou Firebase Console.

La SMS Region Policy peut ensuite etre configuree par API Identity Toolkit avec une allowlist des pays cibles, ou depuis Firebase Console > Authentication > Settings > SMS region policy.
