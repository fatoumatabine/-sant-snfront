/**
 * Configuration des endpoints API
 * À jour avec les nouveaux endpoints de l'API Santé-Sénégal
 */

export const API_ENDPOINTS = {
  // Authentification
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    me: '/auth/me',
    updateMe: '/auth/me',
    changePassword: '/auth/change-password',
  },

  // Médecins
  medecins: {
    list: '/medecins',
    get: (id: string) => `/medecins/${id}`,
    profileMe: '/medecins/profile/me',
    specialites: '/medecins/specialites',
    bySpecialite: (specialite: string) => `/medecins/specialite/${specialite}`,
  },

  // Rendez-vous
  rendezVous: {
    list: '/rendez-vous',
    get: (id: string) => `/rendez-vous/${id}`,
    create: '/rendez-vous',
    update: (id: string) => `/rendez-vous/${id}`,
    delete: (id: string) => `/rendez-vous/${id}`,
    validate: (id: string) => `/rendez-vous/${id}/confirmer`,
    pay: (id: string) => `/rendez-vous/${id}/payer`,
    medecin: {
      list: '/rendez-vous/medecin/list',
    },
    patient: {
      list: '/rendez-vous/mes-rdv',
    },
  },

  // Consultations
  consultations: {
    list: '/consultations',
    get: (id: string) => `/consultations/${id}`,
    create: '/consultations',
    updateConstantes: (id: string) => `/consultations/${id}/constantes`,
    updateDiagnostic: (id: string) => `/consultations/${id}/diagnostic`,
    createOrdonnance: (id: string) => `/consultations/${id}/ordonnance`,
  },

  // Patients (Auth required)
  patient: {
    mesRdv: '/patient/mes-rendez-vous',
    mesConsultations: '/patient/mes-consultations',
    dossierMedical: '/patient/dossier-medical',
    updateProfile: '/patient/profile',
    triage: {
      list: '/patient/triage-evaluations',
      create: '/patient/triage-evaluations',
      run: '/patient/triage-evaluations/run',
    },
    dashboard: {
      summary: '/patient/dashboard/summary',
      appointments: '/patient/dashboard/appointments',
      consultations: '/patient/dashboard/consultations',
      ordonnances: '/patient/dashboard/ordonnances',
    },
  },
  
  // Admin - Patients
  adminPatients: {
    list: '/admin/patients',
    get: (id: string) => `/admin/patients/${id}`,
    create: '/admin/patients',
    update: (id: string) => `/admin/patients/${id}`,
    delete: (id: string) => `/admin/patients/${id}`,
  },

  // Notifications
  notifications: {
    list: '/notifications',
    unread: '/notifications/unread',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    delete: (id: string) => `/notifications/${id}`,
  },

  // Chat
  chat: {
    contacts: '/chat/contacts',
    threads: '/chat/threads',
    openDirect: (otherUserId: string) => `/chat/threads/direct/${otherUserId}`,
    messages: (threadId: string) => `/chat/threads/${threadId}/messages`,
    markRead: (threadId: string) => `/chat/threads/${threadId}/read`,
  },

  // Dashboard Secrétaire
  dashboardSecretaire: {
    summary: '/secretaire/dashboard/stats',
    appointments: {
      pending: '/secretaire/dashboard/demandes',
      today: '/secretaire/dashboard/appointments/all',
      all: '/secretaire/dashboard/appointments/all',
      get: (id: string) => `/secretaire/rendez-vous/${id}`,
      approve: (id: string) => `/secretaire/demandes/${id}/valider`,
      reject: (id: string) => `/secretaire/demandes/${id}/rejeter`,
    },
    stats: {
      daily: '/secretaire/dashboard/stats',
    },
  },

  // Créneaux disponibles
  creneau: {
    list: '/creneaux',
    create: '/creneaux',
    byMedecin: (medecinId: string) => `/creneaux/medecin/${medecinId}`,
    byMedecinAndDay: (medecinId: string, jour: string) => `/creneaux/medecin/${medecinId}/jour/${jour}`,
    update: (id: string) => `/creneaux/${id}`,
    toggle: (id: string) => `/creneaux/${id}/toggle`,
    delete: (id: string) => `/creneaux/${id}`,
  },

  // Ordonnances
  ordonnances: {
    create: '/ordonnances',
    get: (id: string) => `/ordonnances/${id}`,
    update: (id: string) => `/ordonnances/${id}`,
    delete: (id: string) => `/ordonnances/${id}`,
    byPatient: (patientId: string) => `/ordonnances/patient/${patientId}`,
    byMedecin: '/ordonnances/medecin/list',
    medicaments: {
      list: '/ordonnances/medicaments',
      add: (id: string) => `/ordonnances/${id}/medicaments`,
      remove: (id: string, medId: string) => `/ordonnances/${id}/medicaments/${medId}`,
    },
  },

  // Admin
  admin: {
    users: '/admin/users',
    medecins: '/admin/medecins',
    secretaires: '/admin/secretaires',
    patients: '/admin/patients',
  },

  settings: {
    app: '/settings/app',
    admin: '/settings/admin',
    me: '/settings/me',
  },
};
