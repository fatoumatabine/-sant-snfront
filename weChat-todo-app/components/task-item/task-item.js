Component({
  properties: {
    task: {
      type: Object,
      value: {},
      observer: function(newVal) {
        this.setData({ task: newVal });
      }
    }
  },

  data: {
    task: {}
  },

  methods: {
    // Marquer comme complétée
    toggleStatus: function() {
      this.triggerEvent('toggle-status', { id: this.data.task.id });
    },

    // Supprimer la tâche
    delete: function() {
      this.triggerEvent('delete', { id: this.data.task.id });
    },

    // Formater la date
    formatDate: function(dateString) {
      if (!dateString) return '';

      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Aujourd\'hui';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Demain';
      } else {
        return date.toLocaleDateString('fr-FR', {
          month: 'short',
          day: 'numeric'
        });
      }
    },

    // Vérifier si la tâche est en retard
    isOverdue: function() {
      if (this.data.task.completed || !this.data.task.dueDate) {
        return false;
      }

      const dueDate = new Date(this.data.task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return dueDate < today;
    }
  },

  lifetimes: {
    created: function() {
      // Initialiser les données
    }
  }
});
