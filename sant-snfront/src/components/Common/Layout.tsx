import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Menu } from 'lucide-react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { readAdminSettings } from '@/lib/adminSettings';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  allowedRoles: UserRole[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ allowedRoles }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [sidebarFocused, setSidebarFocused] = useState(false);
  const { user, isAuthenticated, hasHydrated, token, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const inactivityTimeoutRef = useRef<number | null>(null);
  const isSidebarExpanded = sidebarHovered || sidebarFocused;

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated || !user || !token) {
      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current);
      }
      return;
    }

    const startInactivityTimer = () => {
      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current);
      }

      const settings = readAdminSettings();
      const timeoutMinutes = Number(settings.securitySettings.sessionTimeout || '60');
      const timeoutMs = Math.max(1, timeoutMinutes) * 60 * 1000;

      inactivityTimeoutRef.current = window.setTimeout(async () => {
        await logout();
        navigate('/auth/login', { replace: true });
      }, timeoutMs);
    };

    const onActivity = () => startInactivityTimer();
    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    startInactivityTimer();
    events.forEach((eventName) => window.addEventListener(eventName, onActivity));
    window.addEventListener('focus', startInactivityTimer);
    window.addEventListener('storage', startInactivityTimer);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, onActivity));
      window.removeEventListener('focus', startInactivityTimer);
      window.removeEventListener('storage', startInactivityTimer);
      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };
  }, [hasHydrated, isAuthenticated, user, token, logout, navigate]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Chargement...
      </div>
    );
  }

  // Redirect to login if not authenticated or if token is missing
  if (!isAuthenticated || !user || !token) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Redirect to correct dashboard if role doesn't match
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  const maintenanceMode = readAdminSettings().systemSettings.maintenanceMode;
  if (maintenanceMode && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-2xl border border-amber-300 bg-amber-50 p-8 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-amber-700" />
          </div>
          <h1 className="text-2xl font-bold">Maintenance en cours</h1>
          <p className="text-muted-foreground mt-2">
            La plateforme est temporairement indisponible. Veuillez réessayer plus tard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.10),transparent_24%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_18%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent_24%)]" />
      <Navbar sidebarExpanded={isSidebarExpanded} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onDesktopHoverChange={setSidebarHovered}
        onDesktopFocusChange={setSidebarFocused}
      />
      
      <div
        className={cn(
          'relative min-h-screen pt-[86px] transition-[margin-left] duration-300 md:pt-[100px]',
          isSidebarExpanded ? 'lg:ml-72' : 'lg:ml-[86px]'
        )}
      >
        {/* Mobile Header with Menu Toggle */}
        <div className="lg:hidden sticky top-[86px] md:top-[100px] z-30 px-4 py-3">
          <div className="rounded-2xl border border-white/60 bg-card/85 px-4 py-3 shadow-sm backdrop-blur-xl">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
              <span>Ouvrir le menu</span>
            </button>
          </div>
        </div>

        {/* Page Content */}
        <main className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, hasHydrated, user } = useAuthStore();

  if (!hasHydrated) {
    return null;
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, hasHydrated, user } = useAuthStore();
  const location = useLocation();
  const hideNavbarOnAuthPages = ['/auth/login', '/auth/register'].includes(location.pathname);

  if (!hasHydrated) {
    return null;
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  if (hideNavbarOnAuthPages) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};
