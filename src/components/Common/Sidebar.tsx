import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Archive,
  BarChart3,
  Bell,
  Brain,
  Calendar,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileEdit,
  FileText,
  FolderHeart,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Settings,
  Stethoscope,
  User,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';
import { useTranslation } from 'react-i18next';

interface SidebarLink {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const getLinksByRole = (t: any): Record<UserRole, SidebarLink[]> => ({
  patient: [
    { to: '/patient/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: t('nav.dashboard') },
    { to: '/patient/demander-rdv', icon: <Plus className="h-5 w-5" />, label: t('nav.requestAppointment') },
    { to: '/patient/rendez-vous', icon: <Calendar className="h-5 w-5" />, label: t('nav.myAppointments') },
    { to: '/patient/consultations', icon: <FileText className="h-5 w-5" />, label: t('nav.consultations') },
    { to: '/patient/dossier-medical', icon: <FolderHeart className="h-5 w-5" />, label: t('nav.medicalRecord') },
    { to: '/patient/paiements', icon: <CreditCard className="h-5 w-5" />, label: t('nav.payments') },
    { to: '/patient/notifications', icon: <Bell className="h-5 w-5" />, label: t('nav.notifications') },
    { to: '/patient/chat', icon: <MessageSquare className="h-5 w-5" />, label: 'Chat interne' },
    { to: '/patient/ia-evaluation', icon: <Brain className="h-5 w-5" />, label: t('nav.aiEvaluation') },
    { to: '/patient/video-call', icon: <Video className="h-5 w-5" />, label: t('nav.videoCall') },
    { to: '/patient/profile', icon: <User className="h-5 w-5" />, label: t('nav.profile') },
  ],
  medecin: [
    { to: '/medecin/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: t('nav.dashboard') },
    { to: '/medecin/rendez-vous', icon: <Calendar className="h-5 w-5" />, label: t('nav.appointments') },
    { to: '/medecin/consultations', icon: <Stethoscope className="h-5 w-5" />, label: t('nav.consultations') },
    { to: '/medecin/disponibilites', icon: <CalendarClock className="h-5 w-5" />, label: 'Disponibilités' },
    { to: '/medecin/ordonnances', icon: <FileEdit className="h-5 w-5" />, label: t('nav.prescriptions') },
    { to: '/medecin/patients', icon: <Users className="h-5 w-5" />, label: t('nav.myPatients') },
    { to: '/medecin/notifications', icon: <Bell className="h-5 w-5" />, label: t('nav.notifications') },
    { to: '/medecin/chat', icon: <MessageSquare className="h-5 w-5" />, label: 'Chat interne' },
    { to: '/medecin/video-call', icon: <Video className="h-5 w-5" />, label: t('nav.videoCall') },
    { to: '/medecin/profile', icon: <User className="h-5 w-5" />, label: t('nav.profile') },
  ],
  secretaire: [
    { to: '/secretaire/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: t('nav.dashboard') },
    { to: '/secretaire/demandes-rdv', icon: <ClipboardList className="h-5 w-5" />, label: t('nav.appointmentRequests') },
    { to: '/secretaire/rdv-en-cours', icon: <Calendar className="h-5 w-5" />, label: t('nav.ongoingAppointments') },
    { to: '/secretaire/agenda', icon: <Calendar className="h-5 w-5" />, label: t('nav.calendar') },
    { to: '/secretaire/paiements', icon: <CreditCard className="h-5 w-5" />, label: t('nav.payments') },
    { to: '/secretaire/notifications', icon: <Bell className="h-5 w-5" />, label: t('nav.notifications') },
    { to: '/secretaire/chat', icon: <MessageSquare className="h-5 w-5" />, label: 'Chat interne' },
    { to: '/secretaire/parametres', icon: <Settings className="h-5 w-5" />, label: t('nav.settings') },
    { to: '/secretaire/rapports', icon: <BarChart3 className="h-5 w-5" />, label: t('nav.reports') },
  ],
  admin: [
    { to: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: t('nav.dashboard') },
    { to: '/admin/utilisateurs/medecins', icon: <Stethoscope className="h-5 w-5" />, label: t('nav.doctors') },
    { to: '/admin/utilisateurs/secretaires', icon: <Users className="h-5 w-5" />, label: t('nav.secretaries') },
    { to: '/admin/utilisateurs/patients', icon: <Users className="h-5 w-5" />, label: t('nav.patients') },
    { to: '/admin/archives', icon: <Archive className="h-5 w-5" />, label: t('nav.archives') },
    { to: '/admin/notifications', icon: <Bell className="h-5 w-5" />, label: t('nav.notifications') },
    { to: '/admin/chat', icon: <MessageSquare className="h-5 w-5" />, label: 'Chat interne' },
    { to: '/admin/statistiques', icon: <BarChart3 className="h-5 w-5" />, label: t('nav.statistics') },
    { to: '/admin/profile', icon: <User className="h-5 w-5" />, label: t('nav.profile') },
    { to: '/admin/parametres', icon: <Settings className="h-5 w-5" />, label: t('nav.settings') },
  ],
});

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onDesktopHoverChange?: (hovered: boolean) => void;
  onDesktopFocusChange?: (focused: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onDesktopHoverChange,
  onDesktopFocusChange,
}) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const { t } = useTranslation();

  if (!user) return null;

  const links = getLinksByRole(t)[user.role];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        onMouseEnter={() => onDesktopHoverChange?.(true)}
        onMouseLeave={() => onDesktopHoverChange?.(false)}
        onFocusCapture={() => onDesktopFocusChange?.(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            onDesktopFocusChange?.(false);
          }
        }}
        className={cn(
          'group/sidebar fixed inset-y-0 left-0 z-50 overflow-hidden border-r border-border bg-card/95 backdrop-blur-sm transition-[transform,width] duration-300 lg:z-40',
          'w-72 -translate-x-full lg:w-[86px] lg:translate-x-0 lg:hover:w-72 lg:focus-within:w-72',
          isOpen && 'translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 lg:px-3">
            <div className="flex min-w-0 items-center gap-3 lg:w-full lg:flex-col lg:items-center lg:justify-center lg:gap-0 lg:group-hover/sidebar:flex-row lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-focus-within/sidebar:flex-row lg:group-focus-within/sidebar:justify-start lg:group-focus-within/sidebar:gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-lg font-bold text-white">
                S
              </div>
              <div className="min-w-0 lg:max-h-0 lg:max-w-0 lg:overflow-hidden lg:opacity-0 lg:transition-[max-width,max-height,opacity] lg:duration-200 lg:group-hover/sidebar:max-h-16 lg:group-hover/sidebar:max-w-[160px] lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:max-h-16 lg:group-focus-within/sidebar:max-w-[160px] lg:group-focus-within/sidebar:opacity-100">
                <p className="font-semibold">{user.prenom} {user.nom}</p>
                <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Fermer le menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 lg:px-2 lg:transition-[padding] lg:duration-300 lg:group-hover/sidebar:px-3 lg:group-focus-within/sidebar:px-3">
            <ul className="space-y-2">
              {links.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={onClose}
                      title={link.label}
                      className={cn(
                        'group/nav-item relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-[width,padding,gap,background-color,color] duration-200',
                        'text-muted-foreground hover:bg-muted hover:text-foreground',
                        'lg:mx-auto lg:h-11 lg:w-11 lg:justify-center lg:gap-0 lg:px-0',
                        'lg:group-hover/sidebar:w-full lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-hover/sidebar:px-3',
                        'lg:group-focus-within/sidebar:w-full lg:group-focus-within/sidebar:justify-start lg:group-focus-within/sidebar:gap-3 lg:group-focus-within/sidebar:px-3',
                        isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                      )}
                    >
                      <span className="shrink-0">{link.icon}</span>
                      <span className="truncate lg:max-w-0 lg:overflow-hidden lg:opacity-0 lg:transition-[max-width,opacity] lg:duration-200 lg:group-hover/sidebar:max-w-[160px] lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:max-w-[160px] lg:group-focus-within/sidebar:opacity-100">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground lg:px-2 lg:text-center">
            <span className="lg:hidden">{t('nav.lastConnection')}: {t('nav.today')}</span>
            <span className="hidden lg:inline">v1</span>
          </div>
        </div>
      </aside>
    </>
  );
};
