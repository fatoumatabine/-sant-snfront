App({
  globalData: {
    userInfo: null,
    token: null,
    tasks: [],
    apiUrl: 'http://192.168.1.54:3000/api'
  },

  onLaunch: function() {
    // Vérifier si l'utilisateur est connecté
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      wx.redirectTo({
        url: '/pages/tasks/tasks'
      });
    } else {
      wx.redirectTo({
        url: '/pages/login/login'
      });
    }
  },

  // Fonction globale pour faire des appels API
  request: function(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const token = this.globalData.token;
      const header = {
        'Content-Type': 'application/json'
      };

      if (token) {
        header['Authorization'] = `Bearer ${token}`;
      }

      wx.request({
        url: this.globalData.apiUrl + url,
        method: method,
        data: data,
        header: header,
        success: (res) => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || 'Erreur API'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  logout: function() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    this.globalData.tasks = [];
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  }
});
