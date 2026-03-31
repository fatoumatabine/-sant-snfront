# Application WeChat To-Do

Une application complète de gestion de tâches pour WeChat avec login, création de tâches rapide, et composants réutilisables.

## 📋 Fonctionnalités

✅ **Authentification**
- Login/Registration avec email et mot de passe
- Sécurité avec JWT et bcrypt
- Stockage sécurisé des tokens

✅ **Gestion des Tâches**
- Création rapide avec titre, description et date limite
- Marquer les tâches comme complétées
- Supprimer les tâches
- Filtrer par statut (Tout, En attente, Complétées)
- Détection automatique des tâches en retard

✅ **Architecture**
- Composants réutilisables (task-item)
- Styles modernes et responsive
- API RESTful avec Node.js/Express
- Gestion d'état globale

## 🚀 Installation et Démarrage

### Frontend (WeChat Mini Program)

1. **Télécharger WeChat Developer Tools**
   - [WeChat Developer Tools](https://developers.weixin.qq.com/community/develop/tools)

2. **Importer le projet**
   - Ouvrir WeChat Developer Tools
   - Cliquer sur "Importer le projet"
   - Sélectionner le dossier racine (`weChat-todo-app`)
   - Entrer un AppID (ou utiliser le mode de test)

3. **Configuration**
   - Modifier `app.js` pour définir l'URL API correcte
   - Changer `apiUrl: 'http://localhost:3000/api'` par votre serveur

### Backend (Node.js)

1. **Installer les dépendances**
```bash
cd backend
npm install
```

2. **Démarrer le serveur**
```bash
npm start
# ou en mode développement
npm run dev
```

Le serveur sera accessible à `http://localhost:3000`

## 📁 Structure du Projet

```
weChat-todo-app/
├── app.js                          # App globale
├── app.json                        # Configuration
├── app.wxss                        # Styles globaux
├── pages/
│   ├── login/                      # Page de login
│   │   ├── login.js
│   │   ├── login.wxml
│   │   ├── login.wxss
│   │   └── login.json
│   └── tasks/                      # Page des tâches
│       ├── tasks.js
│       ├── tasks.wxml
│       ├── tasks.wxss
│       └── tasks.json
├── components/
│   └── task-item/                  # Composant de tâche
│       ├── task-item.js
│       ├── task-item.wxml
│       ├── task-item.wxss
│       └── task-item.json
└── backend/
    ├── server.js                   # Serveur Express
    ├── package.json
    └── .env
```

## 🔑 Utilisateurs de Test

Après démarrage du serveur, vous pouvez vous inscrire avec n'importe quel email/mot de passe.

**Exemple:**
- Email: `test@example.com`
- Password: `123456`

## 📱 Utilisation

### 1. Se connecter ou s'inscrire
- Remplir les champs email et mot de passe
- Cliquer sur "Se connecter" ou "S'inscrire"

### 2. Ajouter une tâche
- Cliquer sur "+ Ajouter une tâche"
- Remplir le titre (obligatoire)
- Ajouter optionnellement une description et date limite
- Cliquer sur "Créer la tâche"

### 3. Gérer les tâches
- **Cocher**: Marquer comme complétée
- **Supprimer**: Cliquer sur l'icône 🗑️
- **Filtrer**: Utiliser les onglets (Tout, En attente, Complétées)

## 🎨 Personnalisation

### Couleurs
Modifier dans `app.wxss`:
```css
/* Gradient principal */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Textes
Modifier dans les fichiers `.wxml` respectifs

### API URL
Modifier dans `app.js`:
```javascript
apiUrl: 'http://localhost:3000/api' // Votre URL
```

## 🔒 Sécurité

- ✅ Mots de passe hashés avec bcrypt
- ✅ Authentification par JWT
- ✅ CORS activé
- ✅ Validation des entrées
- ⚠️ Changez la clé secrète JWT en production

## 📝 Notes Importantes

1. **Base de données**: Actuellement en mémoire (réinitialisée au redémarrage)
   - Pour la production, connecter une base de données (MongoDB, PostgreSQL)

2. **HTTPS**: WeChat nécessite HTTPS en production
   - Utiliser un certificat SSL valide

3. **API URL**: Doit être accessible depuis l'application
   - Sur Windows, utiliser `http://192.168.x.x:3000` (adresse IP locale)
   - Ne pas utiliser `localhost`

## ✅ Checklist de Déploiement

- [ ] Installer Node.js et npm
- [ ] Installer WeChat Developer Tools
- [ ] Cloner/copier ce projet
- [ ] Installer les dépendances backend (`npm install`)
- [ ] Démarrer le serveur (`npm start`)
- [ ] Importer le projet dans WeChat Developer Tools
- [ ] Modifier l'API URL si nécessaire
- [ ] Tester la création de compte
- [ ] Tester la création de tâche
- [ ] Tester les filtres et suppressions

## 🐛 Troubleshooting

**Erreur de connexion API**
- Vérifier que le serveur est démarré
- Vérifier l'URL API dans `app.js`
- Sur Windows, utiliser l'adresse IP locale, pas `localhost`

**Erreur CORS**
- Vérifier que `cors()` est activé dans `server.js`
- Modifier les paramètres CORS si nécessaire

**WeChat Developer Tools ne charge pas**
- Redémarrer l'application
- Vérifier que `app.json` est valide

## 📞 Support

Pour toute question, vérifier:
1. Les messages d'erreur dans la console
2. Les logs du serveur
3. La structure des fichiers
4. La configuration de l'API URL

---

**Créé pour un projet de soutenance** ✨
