Page({
  data: {
    tasks: [],
    showForm: false,
    newTask: {
      title: '',
      description: '',
      dueDate: ''
    },
    loading: false,
    errorMessage: '',
    successMessage: '',
    filterStatus: 'all' // all, completed, pending
  },

  onLoad: function() {
    this.loadTasks();
  },

  // Charger les tâches
  loadTasks: function() {
    this.setData({ loading: true });

    const app = getApp();
    app.request('/tasks', 'GET')
      .then((res) => {
        this.setData({
          tasks: res.tasks || [],
          loading: false
        });
      })
      .catch((err) => {
        this.setData({
          errorMessage: err.message || 'Erreur lors du chargement',
          loading: false
        });
      });
  },

  // Afficher/masquer le formulaire
  toggleForm: function() {
    this.setData({
      showForm: !this.data.showForm,
      newTask: {
        title: '',
        description: '',
        dueDate: ''
      },
      errorMessage: ''
    });
  },

  // Mise à jour du titre
  onTitleInput: function(e) {
    const newTask = this.data.newTask;
    newTask.title = e.detail.value;
    this.setData({ newTask });
  },

  // Mise à jour de la description
  onDescriptionInput: function(e) {
    const newTask = this.data.newTask;
    newTask.description = e.detail.value;
    this.setData({ newTask });
  },

  // Mise à jour de la date
  onDateInput: function(e) {
    const newTask = this.data.newTask;
    newTask.dueDate = e.detail.value;
    this.setData({ newTask });
  },

  // Créer une nouvelle tâche
  createTask: function() {
    const { title, description, dueDate } = this.data.newTask;

    // Validation
    if (!title.trim()) {
      this.setData({ errorMessage: 'Le titre est obligatoire' });
      return;
    }

    if (title.length < 3) {
      this.setData({ errorMessage: 'Le titre doit avoir au moins 3 caractères' });
      return;
    }

    this.setData({ loading: true });

    const app = getApp();
    app.request('/tasks', 'POST', {
      title: title,
      description: description,
      dueDate: dueDate || null
    })
      .then((res) => {
        // Ajouter la tâche à la liste
        const tasks = this.data.tasks;
        tasks.unshift(res.task);

        this.setData({
          tasks: tasks,
          showForm: false,
          newTask: {
            title: '',
            description: '',
            dueDate: ''
          },
          successMessage: 'Tâche créée avec succès!',
          errorMessage: '',
          loading: false
        });

        // Effacer le message de succès après 3 secondes
        setTimeout(() => {
          this.setData({ successMessage: '' });
        }, 3000);
      })
      .catch((err) => {
        this.setData({
          errorMessage: err.message || 'Erreur lors de la création',
          loading: false
        });
      });
  },

  // Marquer une tâche comme complétée
  toggleTaskStatus: function(e) {
    const taskId = e.currentTarget.dataset.id;
    const task = this.data.tasks.find(t => t.id === taskId);

    if (!task) return;

    const app = getApp();
    app.request(`/tasks/${taskId}`, 'PATCH', {
      completed: !task.completed
    })
      .then((res) => {
        // Mettre à jour la tâche dans la liste
        const tasks = this.data.tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, completed: !t.completed };
          }
          return t;
        });

        this.setData({ tasks });
      })
      .catch((err) => {
        this.setData({
          errorMessage: err.message || 'Erreur lors de la mise à jour'
        });
      });
  },

  // Supprimer une tâche
  deleteTask: function(e) {
    const taskId = e.currentTarget.dataset.id;

    wx.showModal({
      title: 'Supprimer la tâche',
      content: 'Êtes-vous sûr de vouloir supprimer cette tâche?',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.request(`/tasks/${taskId}`, 'DELETE')
            .then((res) => {
              // Supprimer la tâche de la liste
              const tasks = this.data.tasks.filter(t => t.id !== taskId);
              this.setData({ tasks });
              this.setData({ successMessage: 'Tâche supprimée avec succès!' });
              setTimeout(() => {
                this.setData({ successMessage: '' });
              }, 3000);
            })
            .catch((err) => {
              this.setData({
                errorMessage: err.message || 'Erreur lors de la suppression'
              });
            });
        }
      }
    });
  },

  // Filtrer les tâches
  filterTasks: function(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ filterStatus: status });
  },

  // Obtenir les tâches filtrées
  getFilteredTasks: function() {
    const { tasks, filterStatus } = this.data;

    if (filterStatus === 'completed') {
      return tasks.filter(t => t.completed);
    } else if (filterStatus === 'pending') {
      return tasks.filter(t => !t.completed);
    }

    return tasks;
  },

  // Déconnexion
  logout: function() {
    wx.showModal({
      title: 'Se déconnecter',
      content: 'Êtes-vous sûr de vouloir vous déconnecter?',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.logout();

          wx.redirectTo({
            url: '/pages/login/login'
          });
        }
      }
    });
  },

  // Vérifier les tâches qui arrivent à échéance
  checkOverdueTasks: function() {
    const today = new Date().toISOString().split('T')[0];
    const tasks = this.data.tasks;

    const overdue = tasks.filter(t => {
      return !t.completed && t.dueDate && t.dueDate < today;
    });

    return overdue.length;
  }
});
