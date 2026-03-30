import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * ThemeProvider component that ensures theme CSS variables are applied
 * on initial app load and whenever theme changes
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, isDarkMode } = useSettingsStore();

  useEffect(() => {
    // Apply theme CSS variables
    const root = document.documentElement;
    
    // Apply primary theme colors
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--accent', theme.accent);
    
    // Apply sidebar colors
    if (theme.sidebarBackground) {
      root.style.setProperty('--sidebar-background', theme.sidebarBackground);
    }
    if (theme.sidebarPrimary) {
      root.style.setProperty('--sidebar-primary', theme.sidebarPrimary);
    }
    if (theme.sidebarAccent) {
      root.style.setProperty('--sidebar-accent', theme.sidebarAccent);
    }
    
    // Apply dark mode
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isDarkMode]);

  return <>{children}</>;
};
