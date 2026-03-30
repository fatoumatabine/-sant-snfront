export const ADMIN_SETTINGS_KEY = 'admin-system-settings-v1';

export interface GeneralSettings {
  appName: string;
  appDescription: string;
  timezone: string;
  language: string;
  itemsPerPage: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  systemAlerts: boolean;
  reminderTime: string;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: string;
  passwordExpiry: string;
  maxLoginAttempts: string;
  requireStrongPassword: boolean;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  logRetention: string;
  debugMode: boolean;
}

export interface MarketingAboutSettings {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroBadge: string;
  missionTitle: string;
  missionDescription: string;
  missionPoint1: string;
  missionPoint2: string;
  missionPoint3: string;
  missionPoint4: string;
  humanityDescription: string;
  trustDescription: string;
  simplicityDescription: string;
}

export interface MarketingContactSettings {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroBadge: string;
  phone: string;
  email: string;
  location: string;
  hours: string;
  formIntro: string;
  responseTime: string;
}

export interface MarketingSettingsPayload {
  about: MarketingAboutSettings;
  contact: MarketingContactSettings;
}

export interface AdminSettingsPayload {
  generalSettings: GeneralSettings;
  notificationSettings: NotificationSettings;
  securitySettings: SecuritySettings;
  systemSettings: SystemSettings;
  marketingSettings: MarketingSettingsPayload;
  updatedAt?: string;
}

export interface PublicSiteSettingsPayload {
  generalSettings: Pick<GeneralSettings, 'appName' | 'appDescription' | 'language'>;
  marketingSettings: MarketingSettingsPayload;
  updatedAt?: string;
}

export const defaultAdminSettings: AdminSettingsPayload = {
  generalSettings: {
    appName: 'Santé SN',
    appDescription: 'Plateforme de gestion des rendez-vous médicaux',
    timezone: 'Africa/Dakar',
    language: 'fr',
    itemsPerPage: '20',
  },
  notificationSettings: {
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    systemAlerts: true,
    reminderTime: '24',
  },
  securitySettings: {
    twoFactorAuth: false,
    sessionTimeout: '60',
    passwordExpiry: '90',
    maxLoginAttempts: '5',
    requireStrongPassword: true,
  },
  systemSettings: {
    maintenanceMode: false,
    autoBackup: true,
    backupFrequency: 'daily',
    logRetention: '30',
    debugMode: false,
  },
  marketingSettings: {
    about: {
      heroEyebrow: 'À propos de Santé SN',
      heroTitle: 'Une plateforme pensée pour moderniser le soin sans perdre sa dimension humaine.',
      heroDescription:
        'Notre ambition est simple : construire un environnement de santé numérique crédible, élégant et utile pour les patients comme pour les professionnels.',
      heroBadge: 'Santé numérique, mais toujours profondément humaine',
      missionTitle: 'Concevoir une expérience de santé qui inspire immédiatement confiance.',
      missionDescription:
        'Nous voulons qu’un patient comprenne rapidement où aller, comment être aidé et ce qu’il se passera ensuite. Cette clarté change profondément la perception du service.',
      missionPoint1: 'Rendre la consultation accessible depuis n’importe où',
      missionPoint2: 'Réduire les zones de flou entre prise de rendez-vous et suivi',
      missionPoint3: 'Mieux préparer les médecins grâce à un contexte structuré',
      missionPoint4: 'Créer une interface moderne sans perdre la chaleur humaine',
      humanityDescription:
        'Nous cherchons à rendre la relation de soin plus proche, plus douce et plus claire à chaque étape.',
      trustDescription:
        'La plateforme doit inspirer le sérieux, protéger les données et clarifier les décisions médicales.',
      simplicityDescription:
        'Nous simplifions les parcours complexes pour que l’utilisateur sache toujours où cliquer et quoi faire.',
    },
    contact: {
      heroEyebrow: 'Contact Santé SN',
      heroTitle: 'Une page de contact complète, claire et immédiatement exploitable.',
      heroDescription:
        'Que vous vouliez réserver, poser une question ou parler d’un partenariat, nous avons structuré cette page pour rendre le premier échange simple et rassurant.',
      heroBadge: 'Contact pensé pour rassurer avant même le premier échange',
      phone: '+221 33 123 45 67',
      email: 'contact@santesn.sn',
      location: 'Dakar, Sénégal',
      hours: 'Lun - Ven / 8h00 - 18h00',
      formIntro:
        'Ce formulaire ouvre votre application email avec un message déjà préparé. C’est simple, rapide et suffisant pour une première prise de contact.',
      responseTime: '< 24h',
    },
  },
};

const asObject = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};

export const mergeAdminSettings = (input: unknown): AdminSettingsPayload => {
  const parsed = asObject(input);
  return {
    generalSettings: {
      ...defaultAdminSettings.generalSettings,
      ...asObject(parsed.generalSettings),
    },
    notificationSettings: {
      ...defaultAdminSettings.notificationSettings,
      ...asObject(parsed.notificationSettings),
    },
    securitySettings: {
      ...defaultAdminSettings.securitySettings,
      ...asObject(parsed.securitySettings),
    },
    systemSettings: {
      ...defaultAdminSettings.systemSettings,
      ...asObject(parsed.systemSettings),
    },
    marketingSettings: {
      about: {
        ...defaultAdminSettings.marketingSettings.about,
        ...asObject(asObject(parsed.marketingSettings).about),
      },
      contact: {
        ...defaultAdminSettings.marketingSettings.contact,
        ...asObject(asObject(parsed.marketingSettings).contact),
      },
    },
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : undefined,
  };
};

export const readAdminSettings = (): AdminSettingsPayload => {
  try {
    const raw = localStorage.getItem(ADMIN_SETTINGS_KEY);
    if (!raw) return defaultAdminSettings;
    return mergeAdminSettings(JSON.parse(raw));
  } catch {
    return defaultAdminSettings;
  }
};

export const writeAdminSettings = (payload: unknown): AdminSettingsPayload => {
  const normalized = mergeAdminSettings(payload);
  localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(normalized));
  return normalized;
};
