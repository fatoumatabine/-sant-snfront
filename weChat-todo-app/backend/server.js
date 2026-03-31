const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Clé secrète pour JWT (doit être définie dans .env en production)
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in .env file');
}

// Base de données simulée
const users = {};
const tasks = {};
let userIdCounter = 1;
let taskIdCounter = 1;

// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

// Routes d'authentification

/**
 * POST /api/auth/register
 * Créer un nouvel utilisateur
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    // Vérifier si l'utilisateur existe
    if (Object.values(users).some(u => u.email === email)) {
      return res.status(400).json({ message: 'Cet email existe déjà' });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const userId = userIdCounter++;
    const user = {
      id: userId,
      email: email,
      password: hashedPassword,
      createdAt: new Date()
    };

    users[userId] = user;
    tasks[userId] = [];

    // Créer le token
    const token = jwt.sign({ userId: userId }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token: token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    // Trouver l'utilisateur
    const user = Object.values(users).find(u => u.email === email);

    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Créer le token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token: token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
});

// Routes des tâches

/**
 * GET /api/tasks
 * Obtenir toutes les tâches de l'utilisateur
 */
app.get('/api/tasks', authMiddleware, (req, res) => {
  try {
    const userTasks = tasks[req.userId] || [];
    res.json({
      tasks: userTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
});

/**
 * POST /api/tasks
 * Créer une nouvelle tâche
 */
app.post('/api/tasks', authMiddleware, (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    // Validation
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ message: 'Le titre est requis (minimum 3 caractères)' });
    }

    // Créer la tâche
    const taskId = taskIdCounter++;
    const task = {
      id: taskId,
      title: title,
      description: description || '',
      dueDate: dueDate || null,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!tasks[req.userId]) {
      tasks[req.userId] = [];
    }

    tasks[req.userId].push(task);

    res.status(201).json({ task: task });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
});

/**
 * PATCH /api/tasks/:id
 * Mettre à jour une tâche
 */
app.patch('/api/tasks/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { completed, title, description, dueDate } = req.body;

    const userTasks = tasks[req.userId];
    const task = userTasks.find(t => t.id === parseInt(id));

    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }

    // Mettre à jour les champs
    if (completed !== undefined) task.completed = completed;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    task.updatedAt = new Date();

    res.json({ task: task });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
});

/**
 * DELETE /api/tasks/:id
 * Supprimer une tâche
 */
app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const userTasks = tasks[req.userId];
    const index = userTasks.findIndex(t => t.id === parseInt(id));

    if (index === -1) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }

    const deletedTask = userTasks.splice(index, 1);

    res.json({ message: 'Tâche supprimée', task: deletedTask[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Erreur du serveur', error: err.message });
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
