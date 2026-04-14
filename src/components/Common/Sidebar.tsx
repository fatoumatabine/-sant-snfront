import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { TFunction } from 'i18next';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarSrc, getRoleLabel, getUserInitials } from '@/lib/avatar';

interface SidebarLink {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const getLinksByRole = (t: TFunction): Record<UserRole, SidebarLink[]> => ({
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
    { to: '/secretaire/profile', icon: <User className="h-5 w-5" />, label: t('nav.profile') },
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
  const roleLabel = getRoleLabel(user.role);

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
          'group/sidebar fixed inset-y-0 left-0 z-50 overflow-hidden border-r border-white/10 text-sidebar-foreground shadow-[0_24px_70px_-30px_rgba(15,23,42,0.75)] transition-[transform,width] duration-300 lg:z-40',
          'bg-[linear-gradient(180deg,hsl(var(--sidebar-background))_0%,hsl(220_50%_10%)_100%)]',
          'w-72 -translate-x-full lg:w-[86px] lg:translate-x-0 lg:hover:w-72 lg:focus-within:w-72',
          isOpen && 'translate-x-0'
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_24%)]" />
        <div className="pointer-events-none absolute -left-8 top-20 h-36 w-36 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex h-full flex-col">
          <div className="border-b border-white/10 px-4 py-4 lg:px-3">
            <div className="flex items-center justify-between gap-3">
              <Link
                to={`/${user.role}/dashboard`}
                onClick={onClose}
                className="flex min-w-0 items-center gap-3 lg:w-full lg:justify-center lg:group-hover/sidebar:justify-start lg:group-focus-within/sidebar:justify-start"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-base font-bold text-white shadow-[0_10px_30px_-18px_rgba(255,255,255,0.45)]">
                  S
                </div>
                <div className="min-w-0 lg:max-w-0 lg:overflow-hidden lg:opacity-0 lg:transition-[max-width,opacity] lg:duration-200 lg:group-hover/sidebar:max-w-[160px] lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:max-w-[160px] lg:group-focus-within/sidebar:opacity-100">
                  <p className="text-sm font-semibold text-white">Santé SN</p>
                  <p className="text-xs text-white/60">Tableau de bord médical</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 lg:hidden"
                aria-label="Fermer le menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/10">
              <div className="flex min-w-0 items-center gap-3 lg:flex-col lg:items-center lg:justify-center lg:gap-0 lg:group-hover/sidebar:flex-row lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-focus-within/sidebar:flex-row lg:group-focus-within/sidebar:justify-start lg:group-focus-within/sidebar:gap-3">
                <Avatar className="h-12 w-12 rounded-2xl border border-white/15 shadow-md">
                  <AvatarImage src={getAvatarSrc(user.avatar)} alt={`${user.prenom} ${user.nom}`} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-lg font-bold text-white">
                    {getUserInitials(user.prenom, user.nom, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 lg:max-h-0 lg:max-w-0 lg:overflow-hidden lg:opacity-0 lg:transition-[max-width,max-height,opacity] lg:duration-200 lg:group-hover/sidebar:max-h-20 lg:group-hover/sidebar:max-w-[170px] lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:max-h-20 lg:group-focus-within/sidebar:max-w-[170px] lg:group-focus-within/sidebar:opacity-100">
                  <p className="truncate text-sm font-semibold text-white">
                    {user.prenom} {user.nom}
                  </p>
                  <p className="truncate text-xs text-white/60">{user.email}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:transition-[max-height,opacity] lg:duration-200 lg:group-hover/sidebar:max-h-20 lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:max-h-20 lg:group-focus-within/sidebar:opacity-100">
                <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                  {roleLabel}
                </span>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-100">
                  Connecté
                </span>
              </div>
            </div>
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
                        'group/nav-item relative flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-medium transition-[width,padding,gap,background-color,color,border-color,transform] duration-200',
                        'text-white/70 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/10 hover:text-white',
                        'lg:mx-auto lg:h-12 lg:w-12 lg:justify-center lg:gap-0 lg:px-0',
                        'lg:group-hover/sidebar:w-full lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-hover/sidebar:px-3',
                        'lg:group-focus-within/sidebar:w-full lg:group-focus-within/sidebar:justify-start lg:group-focus-within/sidebar:gap-3 lg:group-focus-within/sidebar:px-3',
                        isActive &&
                          'border-white/10 bg-white text-slate-900 shadow-[0_22px_45px_-28px_rgba(255,255,255,0.85)] hover:bg-white hover:text-slate-900'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
                          isActive
                            ? 'border-slate-900/10 bg-slate-900/5 text-slate-900'
                            : 'border-white/10 bg-white/10 text-white/85'
                        )}
                      >
                        {link.icon}
                      </span>
                      <span className="truncate lg:max-w-0 lg:overflow-hidden lg:opacity-0 lg:transition-[max-width,opacity] lg:duration-200 lg:group-hover/sidebar:max-w-[160px] lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:max-w-[160px] lg:group-focus-within/sidebar:opacity-100">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-white/10 px-4 py-4 lg:px-3">
            <div className="rounded-[22px] border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/70">
              <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-center lg:justify-center lg:group-hover/sidebar:flex-row lg:group-hover/sidebar:items-start lg:group-hover/sidebar:justify-between lg:group-focus-within/sidebar:flex-row lg:group-focus-within/sidebar:items-start lg:group-focus-within/sidebar:justify-between">
                <div className="lg:max-w-0 lg:overflow-hidden lg:opacity-0 lg:transition-[max-width,opacity] lg:duration-200 lg:group-hover/sidebar:max-w-[140px] lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:max-w-[140px] lg:group-focus-within/sidebar:opacity-100">
                  <p className="font-semibold text-white/90">Navigation sécurisée</p>
                  <p className="mt-1 text-[11px] text-white/60">{t('nav.lastConnection')}: {t('nav.today')}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/90">
                  v1
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
