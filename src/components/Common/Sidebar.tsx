import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { TFunction } from 'i18next';
import {
  Archive, BarChart3, Bell, Brain, Calendar, CalendarClock,
  ChevronsLeft, ChevronsRight, ClipboardList, CreditCard,
  FileEdit, FileText, FolderHeart, LayoutDashboard, MessageSquare,
  Plus, Settings, Stethoscope, User, Users, Video, X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarSrc, getUserInitials } from '@/lib/avatar';

interface SidebarLink { to: string; icon: React.ReactNode; label: string; }

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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Called when the desktop hover-expand state changes */
  onHoverChange?: (expanded: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse, onHoverChange }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const { t } = useTranslation();
  if (!user) return null;
  const links = getLinksByRole(t)[user.role];

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        onMouseEnter={() => onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
        className={cn(
          'group/sb fixed inset-y-0 left-0 z-50 w-72 overflow-hidden border-r border-white/10 bg-sidebar text-sidebar-foreground transition-[transform,width] duration-300 lg:z-40 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed && 'lg:w-[72px] lg:hover:w-72 lg:focus-within:w-72'
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-white/5" />
        <div className="pointer-events-none absolute -left-8 top-20 h-36 w-36 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-white/10 px-4 py-4 lg:px-3">
            <div className="flex items-center justify-between gap-3">
              <Link
                to={`/${user.role}/dashboard`}
                onClick={onClose}
                className={cn(
                  'flex min-w-0 items-center gap-3',
                  isCollapsed && 'lg:w-full lg:justify-center lg:group-hover/sb:justify-start lg:group-focus-within/sb:justify-start'
                )}
              >
                <img src="/Sante sn.png" alt="Santé SN" className="h-11 w-11 shrink-0 rounded-2xl object-contain" />
                <div className={cn('min-w-0 transition-[max-width,opacity] duration-200', isCollapsed && 'lg:max-w-0 lg:overflow-hidden lg:opacity-0 lg:group-hover/sb:max-w-[160px] lg:group-hover/sb:opacity-100 lg:group-focus-within/sb:max-w-[160px] lg:group-focus-within/sb:opacity-100')}>
                  <p className="whitespace-nowrap text-sm font-semibold text-white">Santé SN</p>
                  <p className="whitespace-nowrap text-xs text-white/60">Tableau de bord médical</p>
                </div>
              </Link>
              <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 lg:hidden" aria-label="Fermer le menu">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* User card */}
            <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/10">
              <div className={cn('flex min-w-0 items-center gap-3', isCollapsed && 'lg:flex-col lg:items-center lg:justify-center lg:gap-0 lg:group-hover/sb:flex-row lg:group-hover/sb:justify-start lg:group-hover/sb:gap-3 lg:group-focus-within/sb:flex-row lg:group-focus-within/sb:justify-start lg:group-focus-within/sb:gap-3')}>
                <Avatar className="h-12 w-12 shrink-0 rounded-2xl border border-white/15 shadow-md">
                  <AvatarImage src={getAvatarSrc(user.avatar)} alt={`${user.prenom} ${user.nom}`} className="object-cover" />
                  <AvatarFallback className="bg-primary text-lg font-bold text-white">{getUserInitials(user.prenom, user.nom, user.email)}</AvatarFallback>
                </Avatar>
                <div className={cn('min-w-0 transition-[max-width,max-height,opacity] duration-200', isCollapsed && 'lg:max-h-0 lg:max-w-0 lg:overflow-hidden lg:opacity-0 lg:group-hover/sb:max-h-20 lg:group-hover/sb:max-w-[170px] lg:group-hover/sb:opacity-100 lg:group-focus-within/sb:max-h-20 lg:group-focus-within/sb:max-w-[170px] lg:group-focus-within/sb:opacity-100')}>
                  <p className="whitespace-nowrap truncate text-sm font-semibold text-white">{user.prenom} {user.nom}</p>
                  <p className="whitespace-nowrap truncate text-xs text-white/60">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className={cn('flex-1 overflow-y-auto py-4 transition-[padding] duration-300', isCollapsed ? 'lg:px-2 lg:group-hover/sb:px-3 lg:group-focus-within/sb:px-3' : 'px-3')}>
            <ul className="space-y-1.5">
              {links.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={onClose}
                      title={link.label}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        'text-white/70 hover:border-white/10 hover:bg-white/10 hover:text-white',
                        isActive && 'border-white/10 bg-white text-slate-900 shadow-[0_4px_20px_-8px_rgba(255,255,255,0.5)] hover:bg-white hover:text-slate-900',
                        isCollapsed && 'lg:h-12 lg:w-12 lg:justify-center lg:gap-0 lg:px-0 lg:mx-auto lg:group-hover/sb:w-full lg:group-hover/sb:justify-start lg:group-hover/sb:gap-3 lg:group-hover/sb:px-3 lg:group-focus-within/sb:w-full lg:group-focus-within/sb:justify-start lg:group-focus-within/sb:gap-3 lg:group-focus-within/sb:px-3'
                      )}
                    >
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors', isActive ? 'border-slate-900/10 bg-slate-900/5 text-slate-900' : 'border-white/10 bg-white/10 text-white/85')}>
                        {link.icon}
                      </span>
                      <span className={cn('truncate transition-[max-width,opacity] duration-200', isCollapsed && 'lg:max-w-0 lg:overflow-hidden lg:opacity-0 lg:group-hover/sb:max-w-[160px] lg:group-hover/sb:opacity-100 lg:group-focus-within/sb:max-w-[160px] lg:group-focus-within/sb:opacity-100')}>
                        {link.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Collapse toggle */}
          {onToggleCollapse && (
            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={onToggleCollapse}
                title={isCollapsed ? 'Étendre le menu' : 'Réduire le menu'}
                aria-label={isCollapsed ? 'Étendre le menu' : 'Réduire le menu'}
                className={cn(
                  'hidden lg:flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium w-full',
                  'text-white/70 hover:border-white/10 hover:bg-white/10 hover:text-white transition-all duration-200',
                  isCollapsed && 'lg:h-12 lg:w-12 lg:justify-center lg:gap-0 lg:px-0 lg:mx-auto lg:group-hover/sb:w-full lg:group-hover/sb:justify-start lg:group-hover/sb:gap-3 lg:group-hover/sb:px-3 lg:group-focus-within/sb:w-full lg:group-focus-within/sb:justify-start lg:group-focus-within/sb:gap-3 lg:group-focus-within/sb:px-3'
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                  {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                </span>
                <span className={cn('truncate transition-[max-width,opacity] duration-200', isCollapsed && 'lg:max-w-0 lg:overflow-hidden lg:opacity-0 lg:group-hover/sb:max-w-[160px] lg:group-hover/sb:opacity-100 lg:group-focus-within/sb:max-w-[160px] lg:group-focus-within/sb:opacity-100')}>
                  {isCollapsed ? 'Étendre le menu' : 'Réduire le menu'}
                </span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
