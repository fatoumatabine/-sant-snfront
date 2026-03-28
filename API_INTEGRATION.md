# Intégration API Backend - Frontend

## Vue d'ensemble

Le frontend est majoritairement intégré avec le backend Node.js (Express + Prisma). Les requêtes principales utilisent le service API centralisé qui gère l'authentification, les erreurs et la mise en cache.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend Components                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ imports
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Zustand Stores                               │
│  ├─ authStore      ├─ rendezVousStore  ├─ consultationStore   │
│  ├─ patientStore   ├─ medecinStore     ├─ statistiquesStore   │
│  ├─ paiementStore  └─ iaStore                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ uses
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Service                                   │
│           (src/services/api.ts - Fetch Client)                  │
│  ├─ Gère le token d'authentification                           │
│  ├─ Ajoute les headers automatiquement                         │
│  ├─ Gère les erreurs 401 (redirection login)                  │
│  └─ Expose les méthodes GET, POST, PUT, DELETE                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│            Node.js Backend API                                  │
│         (http://localhost:5000/api/v1)                          │
│  ├─ Controllers                                                  │
│  ├─ Routes                                                       │
│  ├─ Middleware (Auth, Validation)                               │
│  └─ Prisma + PostgreSQL                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration

### Variables d'environnement

Créez un fichier `.env.local`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Pour le développement avec une URL différente:
```env
VITE_API_URL=https://api.example.com/api/v1
```

## Service API

Le service API (`src/services/api.ts`) est le point central pour toutes les requêtes HTTP.

### Utilisation directe

```typescript
import { apiService } from '@/services/api';

// GET
const users = await apiService.get('/users');

// POST
const newUser = await apiService.post('/users', { name: 'John' });

// PUT
const updated = await apiService.put('/users/1', { name: 'Jane' });

// DELETE
await apiService.delete('/users/1');
```

### Gestion du token

Le token est automatiquement:
- Ajouté à chaque requête via le header `Authorization: Bearer <token>`
- Sauvegardé dans localStorage
- Restauré au rechargement de la page
- Supprimé en cas d'erreur 401

```typescript
// Définir le token
apiService.setToken('your-token-here');

// Effacer le token
apiService.setToken(null);
```

## Stores Zustand

Les stores gèrent l'état de l'application et les appels API.

### authStore

```typescript
import { useAuthStore } from '@/store/authStore';

const { login, register, logout, user, isLoading, error } = useAuthStore();

// Connexion
const success = await login('email@example.com', 'password');

// Inscription
const success = await register({
  prenom: 'Jean',
  nom: 'Doe',
  email: 'jean@example.com',
  password: 'securepass',
  telephone: '+221770000000'
});

// Déconnexion
await logout();
```

### rendezVousStore

```typescript
import { useRendezVousStore } from '@/store/rendezVousStore';

const {
  rendezVous,
  fetchMesRendezVous,
  createRendezVous,
  annulerRendezVous,
  validerRendezVous,
  isLoading
} = useRendezVousStore();

// Charger mes RDV
await fetchMesRendezVous();

// Créer un RDV
await createRendezVous({
  medecinId: '1',
  date: '2024-02-15',
  heure: '10:00',
  motif: 'Consultation générale',
  typeConsultation: 'presentiel',
  patientId: 'user-id',
  statut: 'en_attente'
});

// Annuler un RDV
await annulerRendezVous('rdv-id');

// Valider un RDV (médecin)
await validerRendezVous('rdv-id');
```

### patientStore

```typescript
import { usePatientStore } from '@/store/patientStore';

const {
  dashboardData,
  fetchDashboardSummary,
  fetchMesRendezVous,
  fetchDossierMedical,
  updateProfile,
  isLoading
} = usePatientStore();

// Charger le résumé du dashboard
await fetchDashboardSummary();

// Charger le dossier médical
await fetchDossierMedical();

// Mettre à jour le profil
await updateProfile({
  telephone: '+221770000000',
  adresse: '...'
});
```

### consultationStore

```typescript
import { useConsultationStore } from '@/store/consultationStore';

const {
  consultations,
  fetchConsultations,
  createConsultation,
  updateConstantes,
  updateDiagnostic,
  isLoading
} = useConsultationStore();

// Charger les consultations
await fetchConsultations();

// Créer une consultation
await createConsultation({
  rendezVousId: 'rdv-id',
  diagnostic: 'Diagnostic du médecin',
  notes: 'Notes cliniques'
});

// Mettre à jour les constantes vitales
await updateConstantes('consultation-id', {
  tension: '120/80',
  temperature: 37.2,
  poids: 75,
  taille: 180
});

// Mettre à jour le diagnostic
await updateDiagnostic('consultation-id', 'Nouveau diagnostic');
```

### medecinStore

```typescript
import { useMedecinStore } from '@/store/medecinStore';

const {
  medecins,
  specialites,
  fetchMedecins,
  fetchSpecialites,
  fetchMedecinBySpecialite,
  isLoading
} = useMedecinStore();

// Charger tous les médecins
await fetchMedecins();

// Charger les spécialités
await fetchSpecialites();

// Charger les médecins par spécialité
await fetchMedecinBySpecialite('Cardiologue');
```

### statistiquesStore

```typescript
import { useStatistiquesStore } from '@/store/statistiquesStore';

const {
  dashboardData,
  fetchDashboard,
  isLoading
} = useStatistiquesStore();

// Charger le dashboard des stats (admin)
await fetchDashboard();
```

### paiementStore

```typescript
import { usePaiementStore } from '@/store/paiementStore';

const {
  initierPaiement,
  verifierPaiement,
  isLoading
} = usePaiementStore();

// Initier un paiement
const paymentData = await initierPaiement('rdv-id', 5000);

// Vérifier le paiement
const status = await verifierPaiement('paiement-id');
```

### iaStore

```typescript
import { useIAStore } from '@/store/iaStore';

const {
  evaluations,
  evaluer,
  fetchHistorique,
  isLoading
} = useIAStore();

// Évaluer les symptômes
const result = await evaluer('J\'ai une fièvre et mal à la tête');

// Charger l'historique
await fetchHistorique();
```

## Hooks personnalisés

### useAPI

Synchronise le token avec le service API.

```typescript
import { useAPI } from '@/hooks/useAPI';

export const Component = () => {
  const api = useAPI(); // Token automatiquement synchronisé
};
```

### useAsyncData

Hook pour charger les données de manière asynchrone.

```typescript
import { useAsyncData } from '@/hooks/useAsyncData';

export const Component = () => {
  const { data, isLoading, error, refetch } = useAsyncData(
    () => apiService.get('/some-endpoint'),
    [] // dependencies
  );

  return (
    <div>
      {isLoading && <p>Chargement...</p>}
      {error && <p>Erreur: {error}</p>}
      {data && <p>{JSON.stringify(data)}</p>}
      <button onClick={refetch}>Rafraîchir</button>
    </div>
  );
};
```

## Endpoints

Les endpoints sont centralisés dans `src/config/api-endpoints.ts`.

```typescript
import { API_ENDPOINTS } from '@/config/api-endpoints';

// Utilisation
await apiService.post(API_ENDPOINTS.AUTH.LOGIN, { ... });
await apiService.get(API_ENDPOINTS.PATIENT_DASHBOARD.SUMMARY);
```

## Gestion des erreurs

### Dans les stores

Les erreurs sont automatiquement capturées et stockées:

```typescript
const { error } = useRendezVousStore();

if (error) {
  console.error(error);
}
```

### Dans les composants

```typescript
const { error, clearError } = useAuthStore();

useEffect(() => {
  if (error) {
    // Afficher le message d'erreur
    toast.error(error);
    clearError();
  }
}, [error]);
```

### Erreurs 401

En cas de token expiré:
1. Le service API détecte l'erreur 401
2. Le token est supprimé du localStorage
3. L'utilisateur est redirigé vers `/auth/login`

## Démarrage

### Backend Node.js

```bash
cd sante-sn-api-node

# Démarrer le serveur
npm install
npm run dev
```

Par défaut: `http://localhost:5000`

### Frontend React

```bash
cd sant-snfront

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

Par défaut: `http://localhost:5173`

### Variables d'environnement

Créez `.env.local` dans le dossier frontend:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## Tests

### Curl - Test de login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mamadou.diallo@email.sn",
    "password": "patient123"
  }'
```

### Curl - Test de rendez-vous avec token

```bash
TOKEN="votre-token-ici"

curl -X GET http://localhost:5000/api/v1/rendez-vous/mes-rdv \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## Débogage

### Afficher les requêtes API

Activez le débogage dans `src/services/api.ts`:

```typescript
// Dans handleResponse
console.log('Request:', endpoint);
console.log('Response:', data);
```

### Afficher l'état des stores

```typescript
import { useRendezVousStore } from '@/store/rendezVousStore';

export const Component = () => {
  const state = useRendezVousStore();
  console.log('Store state:', state);
};
```

### DevTools

Utilisez les React DevTools pour inspecter les stores Zustand.

## Checklist d'intégration

- [ ] Backend Node.js en cours d'exécution (`npm run dev`)
- [ ] CORS configuré sur le backend (accepte `http://localhost:5173`)
- [ ] `.env.local` créé avec `VITE_API_URL`
- [ ] Comptes de test créés dans la base de données
- [ ] Tokens JWT générés correctement
- [ ] Les erreurs 401 redirigent vers login
- [ ] Les stores chargent les données correctement
- [ ] Les mocks ne sont plus utilisés

## Migration depuis les mocks

Pour migrer un composant des mocks à l'API:

1. Remplacez `mockData` par des appels au store
2. Utilisez `useEffect` pour charger les données
3. Gestion de `isLoading` et `error`
4. Remplacez les mutations locales par les actions du store

**Avant (avec mocks):**
```typescript
const { rendezVous } = useRendezVousStore(); // mock data
```

**Après (avec API):**
```typescript
const { rendezVous, fetchMesRendezVous, isLoading } = useRendezVousStore();

useEffect(() => {
  fetchMesRendezVous();
}, []);
```

## Support

Pour toute question ou problème:
1. Vérifiez que le backend fonctionne
2. Vérifiez que CORS est configuré
3. Vérifiez le token dans localStorage
4. Consultez la console pour les erreurs
