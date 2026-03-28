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

export interface AdminSettingsPayload {
  generalSettings: GeneralSettings;
  notificationSettings: NotificationSettings;
  securitySettings: SecuritySettings;
  systemSettings: SystemSettings;
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
