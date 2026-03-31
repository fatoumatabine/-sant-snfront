Page({
  data: {
    email: '',
    password: '',
    loading: false,
    errorMessage: '',
    isLogin: true // true pour login, false pour register
  },

  onLoad: function() {
    // Vérifier si l'utilisateur est déjà connecté
    const token = wx.getStorageSync('token');
    if (token) {
      wx.redirectTo({
        url: '/pages/tasks/tasks'
      });
    }
  },

  // Mise à jour du champ email
  onEmailInput: function(e) {
    this.setData({
      email: e.detail.value,
      errorMessage: ''
    });
  },

  // Mise à jour du champ mot de passe
  onPasswordInput: function(e) {
    this.setData({
      password: e.detail.value,
      errorMessage: ''
    });
  },

  // Basculer entre login et register
  toggleMode: function() {
    this.setData({
      isLogin: !this.data.isLogin,
      email: '',
      password: '',
      errorMessage: ''
    });
  },

  // Fonction de login
  onLogin: function() {
    const { email, password } = this.data;

    // Validation
    if (!email) {
      this.setData({ errorMessage: 'Veuillez entrer votre email' });
      return;
    }

    if (!password) {
      this.setData({ errorMessage: 'Veuillez entrer votre mot de passe' });
      return;
    }

    if (!this.isValidEmail(email)) {
      this.setData({ errorMessage: 'Email invalide' });
      return;
    }

    this.setData({ loading: true });

    const app = getApp();
    app.request('/auth/login', 'POST', {
      email: email,
      password: password
    })
      .then((res) => {
        // Sauvegarder les données
        wx.setStorageSync('token', res.token);
        wx.setStorageSync('userInfo', res.user);

        app.globalData.token = res.token;
        app.globalData.userInfo = res.user;

        // Rediriger vers la page des tâches
        wx.redirectTo({
          url: '/pages/tasks/tasks'
        });
      })
      .catch((err) => {
        this.setData({
          errorMessage: err.message || 'Erreur de connexion',
          loading: false
        });
      });
  },

  // Fonction de registration
  onRegister: function() {
    const { email, password } = this.data;

    // Validation
    if (!email) {
      this.setData({ errorMessage: 'Veuillez entrer votre email' });
      return;
    }

    if (!password) {
      this.setData({ errorMessage: 'Veuillez entrer votre mot de passe' });
      return;
    }

    if (password.length < 6) {
      this.setData({ errorMessage: 'Le mot de passe doit avoir au moins 6 caractères' });
      return;
    }

    if (!this.isValidEmail(email)) {
      this.setData({ errorMessage: 'Email invalide' });
      return;
    }

    this.setData({ loading: true });

    const app = getApp();
    app.request('/auth/register', 'POST', {
      email: email,
      password: password
    })
      .then((res) => {
        // Sauvegarder les données
        wx.setStorageSync('token', res.token);
        wx.setStorageSync('userInfo', res.user);

        app.globalData.token = res.token;
        app.globalData.userInfo = res.user;

        // Rediriger vers la page des tâches
        wx.redirectTo({
          url: '/pages/tasks/tasks'
        });
      })
      .catch((err) => {
        this.setData({
          errorMessage: err.message || 'Erreur d\'inscription',
          loading: false
        });
      });
  },

  // Validation email
  isValidEmail: function(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
});
