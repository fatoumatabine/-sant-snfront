# Santé SN - Plateforme de Télémédecine

Application web de télémédecine au Sénégal connectant patients et prestataires de soins.

## À propos

Santé SN est une plateforme moderne de télémédecine qui permet:
- Consultations médicales en ligne 24/7
- Gestion des rendez-vous
- Dossier médical électronique
- Ordonnances numériques
- Évaluation pré-consultation par IA
- Suivi des patients par les médecins

## Démarrage rapide

Les prérequis:
- Node.js & npm - [installer avec nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# Étape 1: Cloner le repository
git clone <YOUR_GIT_URL>

# Étape 2: Naviguer dans le répertoire du projet
cd sant-snfront

# Étape 3: Installer les dépendances
npm i

# Étape 4: Démarrer le serveur de développement
npm run dev
```

## Technologies utilisées

Ce projet est construit avec:

- **Vite** - Build tool rapide
- **TypeScript** - Type safety
- **React** - UI library
- **React Router** - Routing
- **shadcn-ui** - Component library
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching
- **Zustand** - State management

## Architecture

### Structure du projet

```
sant-snfront/
├── src/
│   ├── components/     # Composants réutilisables
│   ├── pages/          # Pages (routes)
│   ├── services/       # Services API
│   ├── store/          # État global (Zustand)
│   ├── types/          # Types TypeScript
│   ├── lib/            # Utilitaires
│   ├── styles/         # Styles globaux
│   └── main.tsx        # Point d'entrée
├── public/             # Fichiers statiques
└── index.html          # HTML principal
```

### Rôles utilisateurs

- **Patient**: Peut prendre rendez-vous, voir consultations, gérer dossier médical
- **Médecin**: Peut voir agenda, consulter patients, prescrire ordonnances
- **Secrétaire**: Peut gérer demandes de rendez-vous, planification
- **Admin**: Gestion complète du système

## Développement

### Build pour la production

```sh
npm run build
```

### Prévisualiser la version de production

```sh
npm run preview
```

## API Backend

L'API Node.js se trouve dans le répertoire `sante-sn-api-node/`.

Endpoints principaux:
- `GET /api/medecins` - Liste des médecins
- `GET /api/medecins/specialites` - Spécialités disponibles
- `POST /api/rendez-vous` - Créer rendez-vous
- `GET /api/patient/mes-rendez-vous` - Rendez-vous du patient
- `POST /api/consultations/{id}` - Créer consultation

## Configuration

### Variables d'environnement

Créez un fichier `.env.local`:

```
VITE_API_URL=http://localhost:5000/api/v1
```

## Authentification

Utilise des tokens **JWT** émis par l'API Node.js.

Endpoints:
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/logout` - Déconnexion

## Déploiement

### Production recommandée

1. Construire l'application:
```sh
npm run build
```

2. Servir avec Nginx ou Apache
3. Configurer le domaine personnalisé
4. Activer HTTPS/SSL
5. Configurer les en-têtes de sécurité

## Sécurité

- Authentification par tokens JWT
- CORS configuré pour origines spécifiques
- Validation des entrées côté client et serveur
- Données sensibles masquées en production

## Support

Pour toute question ou problème, contactez l'équipe de développement.

## Licence

© 2026 Santé SN. Tous droits réservés.
# -sant-snfront
