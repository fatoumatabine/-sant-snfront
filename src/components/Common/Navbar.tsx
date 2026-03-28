import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Sun,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useSettingsStore } from '@/store/settingsStore';
import { cn } from '@/lib/utils';
import { readAdminSettings } from '@/lib/adminSettings';

interface NavbarProps {
  sidebarExpanded?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarExpanded = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    reset: resetNotifications,
  } = useNotificationStore();
  const { isDarkMode, toggleDarkMode } = useSettingsStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicPage = ['/', '/auth/login', '/auth/register', '/auth/forgot-password'].includes(location.pathname);
  const dashboardDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }).format(new Date()),
    [location.pathname]
  );

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const syncSettings = () => {
      const settings = readAdminSettings();
      const enabled =
        settings.notificationSettings.emailNotifications ||
        settings.notificationSettings.smsNotifications ||
        settings.notificationSettings.appointmentReminders ||
        settings.notificationSettings.systemAlerts;
      setNotificationsEnabled(enabled);
    };

    syncSettings();
    window.addEventListener('storage', syncSettings);
    window.addEventListener('focus', syncSettings);
    return () => {
      window.removeEventListener('storage', syncSettings);
      window.removeEventListener('focus', syncSettings);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      resetNotifications();
      return;
    }

    if (!notificationsEnabled) {
      resetNotifications();
      return;
    }

    fetchNotifications();
    fetchUnreadCount();

    const interval = window.setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [isAuthenticated, notificationsEnabled, fetchNotifications, fetchUnreadCount, resetNotifications]);

  const handleLogout = async () => {
    await logout();
    resetNotifications();
    navigate('/');
  };

  const handleScrollToSection = (selector: string) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  if (!isPublicPage && !isAuthenticated) {
    return null;
  }

  if (isAuthenticated && user && !isPublicPage) {
    return (
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 px-3 pt-3 transition-[padding-left] duration-300',
          sidebarExpanded ? 'lg:pl-[300px]' : 'lg:pl-[98px]'
        )}
      >
        <div className="h-16 md:h-20 rounded-[26px] border border-border bg-card/95 backdrop-blur px-4 md:px-5 shadow-sm">
          <div className="flex h-full items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
                {user.prenom[0]}{user.nom[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{user.prenom} {user.nom}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role} • {dashboardDateLabel}
                </p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Dashboard</span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Live</span>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={toggleDarkMode}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4" />}
              </button>

              {notificationsEnabled && (
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen((prev) => !prev)}
                    className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
                      <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold">Notifications</p>
                        <button
                          onClick={async () => {
                            await markAllAsRead();
                            await fetchUnreadCount();
                          }}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Tout lire
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notificationsLoading ? (
                          <p className="p-4 text-center text-sm text-muted-foreground">Chargement...</p>
                        ) : notifications.length === 0 ? (
                          <p className="p-4 text-center text-sm text-muted-foreground">Aucune notification</p>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={cn(
                                'border-b border-border px-4 py-3 hover:bg-muted/40 transition-colors',
                                notification.lu && 'opacity-70'
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!notification.lu) {
                                      await markAsRead(notification.id);
                                      await fetchUnreadCount();
                                    }
                                  }}
                                  className="flex-1 text-left"
                                >
                                  <p className="text-sm font-medium">{notification.titre}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                                  <p className="mt-2 text-[11px] text-muted-foreground">{notification.date}</p>
                                </button>
                                <button
                                  onClick={async () => {
                                    await deleteNotification(notification.id);
                                    await fetchUnreadCount();
                                  }}
                                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="border-t border-border bg-muted/20 px-4 py-2">
                        <Link
                          to={`/${user.role}/notifications`}
                          onClick={() => setNotificationsOpen(false)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Voir tout
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                    {user.prenom[0]}{user.nom[0]}
                  </div>
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', profileMenuOpen && 'rotate-180')} />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl border border-border bg-card p-2 shadow-lg">
                    <Link
                      to={`/${user.role}/profile`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <User className="h-4 w-4 text-primary" />
                      Mon profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Deconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white font-bold">
              S
            </div>
            <span className="font-display text-lg font-bold">
              Sante <span className="text-primary">SN</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <Link to="/" className={cn('rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted', location.pathname === '/' && 'bg-muted text-primary')}>
              Accueil
            </Link>
            <button onClick={() => handleScrollToSection('#services')} className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted">
              Services
            </button>
            <button onClick={() => handleScrollToSection('#medecins')} className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted">
              Medecins
            </button>
            <button onClick={() => handleScrollToSection('#contact')} className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted">
              Contact
            </button>
            <Link to="/auth/login" className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground">
              Connexion
            </Link>
            <Link to="/auth/register" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Inscription
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 hover:bg-muted md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">
              Accueil
            </Link>
            <button onClick={() => handleScrollToSection('#services')} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">
              Services
            </button>
            <button onClick={() => handleScrollToSection('#medecins')} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">
              Medecins
            </button>
            <button onClick={() => handleScrollToSection('#contact')} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">
              Contact
            </button>
            <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg border border-primary px-3 py-2 text-sm text-primary hover:bg-primary hover:text-primary-foreground">
              Connexion
            </Link>
            <Link to="/auth/register" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">
              Inscription
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
