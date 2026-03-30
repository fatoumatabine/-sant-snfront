import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  CheckCheck,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Settings2,
  Sparkles,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarSrc, getRoleLabel, getUserInitials } from '@/lib/avatar';

interface NavbarProps {
  sidebarExpanded?: boolean;
}

const DASHBOARD_ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Vue générale',
  profile: 'Mon profil',
  'rendez-vous': 'Rendez-vous',
  consultations: 'Consultations',
  paiements: 'Paiements',
  notifications: 'Notifications',
  chat: 'Messagerie interne',
  agenda: 'Agenda',
  rapports: 'Rapports',
  parametres: 'Paramètres',
  'dossier-medical': 'Dossier médical',
  'demander-rdv': 'Demande de rendez-vous',
  'ia-evaluation': 'Évaluation IA',
  'video-call': 'Téléconsultation',
  disponibilites: 'Disponibilités',
  ordonnances: 'Ordonnances',
  patients: 'Patients',
  statistiques: 'Statistiques',
  archives: 'Archives',
  'utilisateurs': 'Gestion des utilisateurs',
  'demandes-rdv': 'Demandes de rendez-vous',
  'rdv-en-cours': 'Rendez-vous en cours',
};

const prettifySegment = (segment?: string) => {
  if (!segment) return 'Dashboard';

  return segment
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getDashboardPageLabel = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const contentSegments = segments.slice(1).filter((segment) => !/^\d+$/.test(segment));
  const candidate = contentSegments[contentSegments.length - 1] || contentSegments[0] || 'dashboard';

  return DASHBOARD_ROUTE_LABELS[candidate] || prettifySegment(candidate);
};

const getSettingsPathForRole = (role: string) => {
  if (role === 'admin') return '/admin/parametres';
  if (role === 'secretaire') return '/secretaire/parametres';
  return null;
};

export const Navbar: React.FC<NavbarProps> = ({ sidebarExpanded = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
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
  const currentSectionLabel = useMemo(() => getDashboardPageLabel(location.pathname), [location.pathname]);
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

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(target)) {
        setNotificationsOpen(false);
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

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
    const roleLabel = getRoleLabel(user.role);
    const settingsPath = getSettingsPathForRole(user.role);

    return (
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 px-3 pt-3 transition-[padding-left] duration-300',
          sidebarExpanded ? 'lg:pl-[300px]' : 'lg:pl-[98px]'
        )}
      >
        <div className="relative overflow-hidden rounded-[30px] border border-white/60 bg-card/85 px-4 shadow-[0_26px_60px_-34px_rgba(15,23,42,0.45)] backdrop-blur-xl md:px-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.72))]" />
          <div className="pointer-events-none absolute -right-12 top-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex h-16 items-center justify-between gap-3 md:h-20">
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
              <Avatar className="h-11 w-11 rounded-[18px] border border-white/70 shadow-md">
                <AvatarImage src={getAvatarSrc(user.avatar)} alt={`${user.prenom} ${user.nom}`} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
                  {getUserInitials(user.prenom, user.nom, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-base font-semibold md:text-lg">{currentSectionLabel}</p>
                  <span className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    {roleLabel}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground md:text-sm">
                  {user.prenom} {user.nom} • {dashboardDateLabel}
                </p>
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-background/75 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Espace sécurisé
              </span>
              <span className="rounded-full border border-white/70 bg-background/75 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
                {dashboardDateLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Session active
              </span>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => {
                  setNotificationsOpen(false);
                  setProfileMenuOpen(false);
                  toggleDarkMode();
                }}
                className="rounded-2xl border border-white/60 bg-background/75 p-2.5 text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-background hover:text-foreground"
                title={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4" />}
              </button>

              {notificationsEnabled && (
                <div className="relative" ref={notificationsMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setNotificationsOpen((prev) => !prev);
                    }}
                    aria-haspopup="menu"
                    aria-expanded={notificationsOpen}
                    className="relative rounded-2xl border border-white/60 bg-background/75 p-2.5 text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-background hover:text-foreground"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-[28px] border border-border/70 bg-card/95 shadow-[0_28px_70px_-36px_rgba(15,23,42,0.5)] backdrop-blur-xl">
                      <div className="border-b border-border/70 bg-muted/30 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">Notifications</p>
                            <p className="text-xs text-muted-foreground">
                              {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Boîte à jour'}
                            </p>
                          </div>
                          {unreadCount > 0 ? (
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                              {unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                        <button
                          onClick={async () => {
                            await markAllAsRead();
                            await fetchUnreadCount();
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Tout lire
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notificationsLoading ? (
                          <p className="p-4 text-center text-sm text-muted-foreground">Chargement...</p>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              <Bell className="h-5 w-5" />
                            </div>
                            <p className="mt-3 text-sm font-medium">Aucune notification</p>
                            <p className="mt-1 text-xs text-muted-foreground">Tout est calme pour le moment.</p>
                          </div>
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
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Voir tout
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    setProfileMenuOpen((prev) => !prev);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  className="flex items-center gap-3 rounded-[22px] border border-white/60 bg-background/75 px-3 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-background"
                >
                  <Avatar className="h-9 w-9 rounded-xl border border-border/60">
                    <AvatarImage src={getAvatarSrc(user.avatar)} alt={`${user.prenom} ${user.nom}`} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {getUserInitials(user.prenom, user.nom, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:block text-left">
                    <span className="block max-w-[170px] truncate text-sm font-semibold">
                      {user.prenom} {user.nom}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">{roleLabel}</span>
                  </span>
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', profileMenuOpen && 'rotate-180')} />
                </button>

                {profileMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-3 w-64 overflow-hidden rounded-[28px] border border-border/70 bg-card/95 p-2 shadow-[0_28px_70px_-36px_rgba(15,23,42,0.5)] backdrop-blur-xl"
                  >
                    <div className="rounded-[20px] border border-border/70 bg-muted/25 p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 rounded-2xl border border-white/70 shadow-sm">
                          <AvatarImage src={getAvatarSrc(user.avatar)} alt={`${user.prenom} ${user.nom}`} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
                            {getUserInitials(user.prenom, user.nom, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {user.prenom} {user.nom}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/${user.role}/profile`}
                      className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium hover:bg-muted"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <User className="h-4 w-4 text-primary" />
                      Mon profil
                    </Link>
                    {settingsPath ? (
                      <Link
                        to={settingsPath}
                        className="mt-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium hover:bg-muted"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <Settings2 className="h-4 w-4 text-primary" />
                        Paramètres
                      </Link>
                    ) : null}
                    <button
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
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
