import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n/config';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  sidebarBackground?: string;
  sidebarPrimary?: string;
  sidebarAccent?: string;
}

interface SettingsState {
  language: string;
  theme: ThemeColors;
  isDarkMode: boolean;
  
  setLanguage: (lang: string) => void;
  setTheme: (theme: ThemeColors) => void;
  resetTheme: () => void;
  toggleDarkMode: () => void;
}

const getStoredLanguage = (): string => {
  try {
    return localStorage.getItem('language') || 'fr';
  } catch {
    return 'fr';
  }
};

const persistLanguage = (lang: string): void => {
  try {
    localStorage.setItem('language', lang);
  } catch {
    // Ignore storage write errors (private mode, blocked cookies, etc.)
  }
};

const defaultTheme: ThemeColors = {
  primary: '174 87% 47%', // Turquoise (HSL format for CSS variables)
  secondary: '240 4.8% 95.9%',
  accent: '240 4.8% 95.9%',
  sidebarBackground: '174 75% 30%',
  sidebarPrimary: '176 100% 45%',
  sidebarAccent: '174 60% 25%'
};

const presetThemes: Record<string, ThemeColors> = {
  turquoise: {
    primary: '174 87% 47%',
    secondary: '240 4.8% 95.9%',
    accent: '240 4.8% 95.9%',
    sidebarBackground: '174 75% 30%',
    sidebarPrimary: '176 100% 45%',
    sidebarAccent: '174 60% 25%'
  },
  blue: {
    primary: '217 91% 60%',
    secondary: '240 4.8% 95.9%',
    accent: '240 4.8% 95.9%',
    sidebarBackground: '217 75% 35%',
    sidebarPrimary: '217 91% 65%',
    sidebarAccent: '217 60% 30%'
  },
  purple: {
    primary: '262 83% 58%',
    secondary: '240 4.8% 95.9%',
    accent: '240 4.8% 95.9%',
    sidebarBackground: '262 70% 35%',
    sidebarPrimary: '262 83% 65%',
    sidebarAccent: '262 55% 30%'
  },
  green: {
    primary: '142 71% 45%',
    secondary: '240 4.8% 95.9%',
    accent: '240 4.8% 95.9%',
    sidebarBackground: '142 65% 30%',
    sidebarPrimary: '142 71% 55%',
    sidebarAccent: '142 50% 25%'
  },
  orange: {
    primary: '25 95% 53%',
    secondary: '240 4.8% 95.9%',
    accent: '240 4.8% 95.9%',
    sidebarBackground: '25 80% 35%',
    sidebarPrimary: '25 95% 60%',
    sidebarAccent: '25 70% 30%'
  },
  pink: {
    primary: '330 81% 60%',
    secondary: '240 4.8% 95.9%',
    accent: '240 4.8% 95.9%',
    sidebarBackground: '330 70% 35%',
    sidebarPrimary: '330 81% 65%',
    sidebarAccent: '330 60% 30%'
  },
  gray: {
    primary: '220 9% 46%',
    secondary: '240 4.8% 95.9%',
    accent: '240 4.8% 95.9%',
    sidebarBackground: '220 13% 30%',
    sidebarPrimary: '220 9% 55%',
    sidebarAccent: '220 13% 25%'
  },
  lightgray: {
    primary: '220 9% 65%',
    secondary: '240 4.8% 95.9%',
    accent: '240 4.8% 95.9%',
    sidebarBackground: '220 10% 88%',
    sidebarPrimary: '220 9% 70%',
    sidebarAccent: '220 10% 80%'
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: getStoredLanguage(),
      theme: defaultTheme,
      isDarkMode: false,

      setLanguage: (lang: string) => {
        i18n.changeLanguage(lang);
        persistLanguage(lang);
        set({ language: lang });
        
        // Apply language to document
        document.documentElement.lang = lang;
      },

      setTheme: (theme: ThemeColors) => {
        set({ theme });
        
        // Apply theme to CSS variables
        const root = document.documentElement;
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--secondary', theme.secondary);
        root.style.setProperty('--accent', theme.accent);
        
        // Apply sidebar colors if provided
        if (theme.sidebarBackground) {
          root.style.setProperty('--sidebar-background', theme.sidebarBackground);
        }
        if (theme.sidebarPrimary) {
          root.style.setProperty('--sidebar-primary', theme.sidebarPrimary);
        }
        if (theme.sidebarAccent) {
          root.style.setProperty('--sidebar-accent', theme.sidebarAccent);
        }
      },

      resetTheme: () => {
        set({ theme: defaultTheme });
        
        const root = document.documentElement;
        root.style.setProperty('--primary', defaultTheme.primary);
        root.style.setProperty('--secondary', defaultTheme.secondary);
        root.style.setProperty('--accent', defaultTheme.accent);
        
        if (defaultTheme.sidebarBackground) {
          root.style.setProperty('--sidebar-background', defaultTheme.sidebarBackground);
        }
        if (defaultTheme.sidebarPrimary) {
          root.style.setProperty('--sidebar-primary', defaultTheme.sidebarPrimary);
        }
        if (defaultTheme.sidebarAccent) {
          root.style.setProperty('--sidebar-accent', defaultTheme.sidebarAccent);
        }
      },

      toggleDarkMode: () => {
        set((state) => {
          const newDarkMode = !state.isDarkMode;
          
          // Toggle dark class on html element
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          return { isDarkMode: newDarkMode };
        });
      }
    }),
    {
      name: 'settings-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply saved theme on app load
          const root = document.documentElement;
          root.style.setProperty('--primary', state.theme.primary);
          root.style.setProperty('--secondary', state.theme.secondary);
          root.style.setProperty('--accent', state.theme.accent);
          
          if (state.theme.sidebarBackground) {
            root.style.setProperty('--sidebar-background', state.theme.sidebarBackground);
          }
          if (state.theme.sidebarPrimary) {
            root.style.setProperty('--sidebar-primary', state.theme.sidebarPrimary);
          }
          if (state.theme.sidebarAccent) {
            root.style.setProperty('--sidebar-accent', state.theme.sidebarAccent);
          }
          
          // Apply saved language
          i18n.changeLanguage(state.language);
          document.documentElement.lang = state.language;
          
          // Apply dark mode
          if (state.isDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      }
    }
  )
);

export { presetThemes };
