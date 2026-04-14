# Guide Rapide - WeChat To-Do App

## 🚀 Démarrage en 5 minutes

### Étape 1: Préparation
```bash
# Ouvrir terminal/PowerShell
cd weChat-todo-app/backend
npm install
```

### Étape 2: Démarrer le serveur
```bash
npm start
```
✅ Vous verrez: `Serveur démarré sur le port 3000`

### Étape 3: Importer dans WeChat Developer Tools
1. Télécharger [WeChat Developer Tools](https://developers.weixin.qq.com/community/develop/tools)
2. Ouvrir → "Importer le projet"
3. Sélectionner: `weChat-todo-app/` (le dossier racine)
4. AppID: Entrer un AppID ou cliquer "Test"
5. Cliquer "Importer"

### Étape 4: Configuration (si nécessaire)
Si vous êtes sur **Windows** et que la connexion ne fonctionne pas:
1. Ouvrir `weChat-todo-app/app.js`
2. Trouver: `apiUrl: 'http://localhost:3000/api'`
3. Remplacer par votre IP locale (exemple: `http://192.168.1.100:3000/api`)
4. Pour trouver votre IP: ouvrir PowerShell et taper `ipconfig` → "IPv4 Address"

### Étape 5: Utiliser l'app
1. S'inscrire avec email/mot de passe
2. Ajouter des tâches
3. Cocher pour completer
4. Filtrer les tâches

## 📋 Fichiers Importants

```
✅ FRONTEND (WeChat)
- app.js          → Logique globale, appels API
- pages/login/    → Page d'authentification
- pages/tasks/    → Page de gestion des tâches
- components/     → Composant réutilisable (task-item)

✅ BACKEND (Node.js)
- backend/server.js    → API, authentification, tâches
- backend/package.json → Dépendances
```

## 🔍 Vérifier que tout fonctionne

1. **Serveur démarré?**
   ```
   Ouvrir: http://localhost:3000/api/tasks
   Doit retourner: {"message":"Token manquant"}
   ```

2. **WeChat Developer Tools?**
   - Doit montrer la page login
   - Doit montrer les logs en bas

3. **Inscription?**
   - Entrer email: `test@test.com`
   - Mot de passe: `123456`
   - Cliquer "S'inscrire"

## ⚙️ Configuration Avancée

### Changer les couleurs
Fichier: `app.wxss` et `pages/login/login.wxss`
```css
/* Changer ce gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Changer le port du serveur
Fichier: `backend/.env`
```
PORT=3001  # Changer le numéro
```

### Changer la clé secrète JWT
Fichier: `backend/.env`
```
JWT_SECRET=votre-clé-ultra-secrète
```

## ❌ Problèmes Courants

| Problème | Solution |
|----------|----------|
| Erreur "Cannot find module" | Faire `npm install` dans backend |
| "Connection refused" | Vérifier que serveur est démarré |
| "CORS error" | Vérifier l'URL API dans app.js |
| "Token invalide" | Se déconnecter et se reconnecter |
| WeChat ne charge rien | Redémarrer WeChat Developer Tools |

## 📱 Tester l'App

```
1. Inscription:
   Email: demo@test.com
   Password: Demo123!
   
2. Créer tâche:
   Titre: "Apprendre WeChat"
   Description: "Créer une app mini program"
   Date limite: (optionnel)
   
3. Marquer complétée: Cliquer la checkbox
4. Supprimer: Cliquer 🗑️
5. Filtrer: Utiliser les onglets
```

## 🔒 Points de Sécurité

- ✅ Mots de passe = hashés automatiquement
- ✅ Tokens JWT = générés au login
- ✅ API = protégée par authentification
- ⚠️ **Production** = changer JWT_SECRET dans `.env`

## 📚 Ressources

- [WeChat Mini Program Docs](https://developers.weixin.qq.com/miniprogram/en/dev/index.html)
- [WXML Reference](https://developers.weixin.qq.com/miniprogram/en/dev/reference/wxml/)
- [Express.js Guide](https://expressjs.com/)

---

**Besoin d'aide?** Vérifier les logs:
- WeChat: Console de développement (F12)
- Serveur: Terminal/PowerShell où vous avez démarré `npm start`

Good luck! 🚀
