import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Filter,
  MessageSquare,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

type DashboardTab = 'general' | 'demandes' | 'planning' | 'paiements' | 'analysis';
type DashboardViewMode = 'overview' | 'quickselect' | 'analysis';
type AppointmentTypeFilter = 'tous' | 'en_ligne' | 'presentiel' | 'prestation';
type AppointmentStatusFilter = 'tous' | 'en_attente' | 'confirme' | 'paye' | 'termine' | 'annule';
type NormalizedStatus = 'en_attente' | 'confirme' | 'paye' | 'termine' | 'annule' | 'autre';

interface DashboardAppointment {
  id: number | string;
  numero?: string;
  date?: string;
  heure?: string;
  type?: string;
  statut?: string;
  motif?: string;
  urgent_ia?: boolean;
  createdAt?: string;
  created_at?: string;
  patient?: {
    id?: number | string;
    prenom?: string;
    nom?: string;
  };
  medecin?: {
    id?: number | string;
    prenom?: string;
    nom?: string;
    specialite?: string;
  };
}

interface DashboardStats {
  totalRendezVous?: number;
  rendezVousAujourdhui?: number;
  demandesEnAttente?: number;
  totalPatients?: number;
}

interface InsightCard {
  id: string;
  title: string;
  description: string;
  count: number;
  tone: 'info' | 'warning' | 'success' | 'neutral';
  icon: React.ElementType;
  tabs: DashboardTab[];
}

const DASHBOARD_TABS: Array<{
  id: DashboardTab;
  label: string;
  subtitle: string;
  icon: React.ElementType;
}> = [
  { id: 'general', label: 'General', subtitle: 'Vue operationnelle du secretariat', icon: Activity },
  { id: 'demandes', label: 'Demandes', subtitle: 'Priorisation des demandes de rendez-vous', icon: ClipboardCheck },
  { id: 'planning', label: 'Planning', subtitle: 'Suivi des rendez-vous du jour', icon: CalendarDays },
  { id: 'paiements', label: 'Paiements', subtitle: 'Etat des validations et paiements', icon: CreditCard },
  { id: 'analysis', label: 'AI Triage', subtitle: 'Alertes et cas urgents detectes', icon: MessageSquare },
];

const DASHBOARD_VIEW_MODES: Array<{ id: DashboardViewMode; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'quickselect', label: 'Quickselect' },
  { id: 'analysis', label: 'AI analysis' },
];

const DEFAULT_VIEW_MODE_BY_TAB: Record<DashboardTab, DashboardViewMode> = {
  general: 'overview',
  demandes: 'quickselect',
  planning: 'quickselect',
  paiements: 'overview',
  analysis: 'analysis',
};

const INSIGHT_TONE_PRIORITY: Record<InsightCard['tone'], number> = {
  warning: 4,
  info: 3,
  success: 2,
  neutral: 1,
};

const STATUS_BADGE_CLASSES: Record<NormalizedStatus, string> = {
  en_attente: 'bg-warning/15 text-warning',
  confirme: 'bg-accent/15 text-accent',
  paye: 'bg-primary/15 text-primary',
  termine: 'bg-primary/15 text-primary',
  annule: 'bg-destructive/15 text-destructive',
  autre: 'bg-muted text-muted-foreground',
};

const INSIGHT_TONE_CLASSES: Record<InsightCard['tone'], { wrapper: string; chip: string; icon: string }> = {
  info: {
    wrapper: 'border-accent/35 bg-accent/10',
    chip: 'bg-accent/20 text-accent',
    icon: 'text-accent',
  },
  warning: {
    wrapper: 'border-warning/35 bg-warning/10',
    chip: 'bg-warning/25 text-warning',
    icon: 'text-warning',
  },
  success: {
    wrapper: 'border-primary/35 bg-primary/10',
    chip: 'bg-primary/20 text-primary',
    icon: 'text-primary',
  },
  neutral: {
    wrapper: 'border-border bg-card',
    chip: 'bg-muted text-muted-foreground',
    icon: 'text-muted-foreground',
  },
};

const unwrapAppointmentList = (payload: unknown): DashboardAppointment[] => {
  let current: unknown = payload;

  for (let index = 0; index < 3; index += 1) {
    if (Array.isArray(current)) {
      return current as DashboardAppointment[];
    }

    if (current && typeof current === 'object' && 'data' in current) {
      current = (current as { data: unknown }).data;
      continue;
    }

    return [];
  }

  return Array.isArray(current) ? (current as DashboardAppointment[]) : [];
};

const unwrapStats = (payload: unknown): DashboardStats | null => {
  let current: unknown = payload;

  for (let index = 0; index < 3; index += 1) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      if ('data' in current) {
        current = (current as { data: unknown }).data;
        continue;
      }
      return current as DashboardStats;
    }
    return null;
  }

  return current && typeof current === 'object' ? (current as DashboardStats) : null;
};

const normalizeStatus = (status?: string): NormalizedStatus => {
  const value = (status || '').toLowerCase();
  if (value === 'pending' || value === 'en_attente') return 'en_attente';
  if (value === 'confirmed' || value === 'confirme') return 'confirme';
  if (value === 'paid' || value === 'paye') return 'paye';
  if (value === 'completed' || value === 'termine') return 'termine';
  if (value === 'cancelled' || value === 'annule') return 'annule';
  return 'autre';
};

const getStatusLabel = (status: NormalizedStatus): string => {
  if (status === 'en_attente') return 'En attente';
  if (status === 'confirme') return 'Confirme';
  if (status === 'paye') return 'Paye';
  if (status === 'termine') return 'Termine';
  if (status === 'annule') return 'Annule';
  return 'Inconnu';
};

const getTypeLabel = (type?: string): string => {
  if (type === 'en_ligne') return 'En ligne';
  if (type === 'presentiel') return 'Presentiel';
  if (type === 'prestation') return 'Prestation';
  return 'Non defini';
};

const isSameCalendarDay = (first: Date, second: Date): boolean =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const parseHourToMinutes = (value?: string): number | null => {
  if (!value) return null;
  const [hour, minute] = value.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
};

const getPatientName = (appointment: DashboardAppointment): string => {
  const prenom = appointment.patient?.prenom || '';
  const nom = appointment.patient?.nom || '';
  const fullName = `${prenom} ${nom}`.trim();
  return fullName || 'Patient';
};

const getMedecinName = (appointment: DashboardAppointment): string => {
  const prenom = appointment.medecin?.prenom || '';
  const nom = appointment.medecin?.nom || '';
  const fullName = `${prenom} ${nom}`.trim();
  return fullName ? `Dr. ${fullName}` : 'Medecin non assigne';
};

const getInitials = (firstName?: string, lastName?: string): string => {
  const first = (firstName || '').trim().charAt(0).toUpperCase();
  const last = (lastName || '').trim().charAt(0).toUpperCase();
  return `${first}${last}` || 'SC';
};

const getNameInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  const first = parts[0]?.charAt(0)?.toUpperCase() || '';
  const second = parts[1]?.charAt(0)?.toUpperCase() || '';
  return `${first}${second}` || 'PT';
};

const isUrgentAppointment = (appointment: DashboardAppointment): boolean =>
  Boolean(appointment.urgent_ia) || String(appointment.motif || '').toUpperCase().includes('[URGENT-IA]');

export const SecretaireDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<DashboardTab>('analysis');
  const [activeViewMode, setActiveViewMode] = useState<DashboardViewMode>('analysis');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<AppointmentTypeFilter>('tous');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusFilter>('tous');

  const { data: allAppointments = [], isLoading: isLoadingAppointments } = useQuery<DashboardAppointment[]>({
    queryKey: ['secretaire-dashboard-appointments'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/secretaire/dashboard/appointments/all');
        return unwrapAppointmentList(response);
      } catch (error) {
        console.error('Erreur chargement appointments secretaire:', error);
        return [];
      }
    },
  });

  const { data: apiStats, isLoading: isLoadingStats } = useQuery<DashboardStats | null>({
    queryKey: ['secretaire-dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/secretaire/dashboard/stats');
        return unwrapStats(response);
      } catch (error) {
        console.error('Erreur chargement stats secretaire:', error);
        return null;
      }
    },
  });

  const dashboard = useMemo(() => {
    const now = new Date();
    const statusCount: Record<NormalizedStatus, number> = {
      en_attente: 0,
      confirme: 0,
      paye: 0,
      termine: 0,
      annule: 0,
      autre: 0,
    };

    const typeCount = {
      en_ligne: 0,
      presentiel: 0,
      prestation: 0,
      autre: 0,
    };

    const todayAppointments: DashboardAppointment[] = [];
    const uniquePatients = new Set<string>();
    const uniqueMedecins = new Set<string>();
    let urgentCount = 0;

    allAppointments.forEach((appointment) => {
      const status = normalizeStatus(appointment.statut);
      statusCount[status] += 1;

      if (appointment.type === 'en_ligne') typeCount.en_ligne += 1;
      else if (appointment.type === 'presentiel') typeCount.presentiel += 1;
      else if (appointment.type === 'prestation') typeCount.prestation += 1;
      else typeCount.autre += 1;

      const patientKey =
        String(appointment.patient?.id || '').trim() || getPatientName(appointment).toLowerCase();
      if (patientKey) uniquePatients.add(patientKey);

      const medecinKey =
        String(appointment.medecin?.id || '').trim() || getMedecinName(appointment).toLowerCase();
      if (medecinKey) uniqueMedecins.add(medecinKey);

      if (isUrgentAppointment(appointment)) urgentCount += 1;

      if (!appointment.date) return;
      const appointmentDate = new Date(appointment.date);
      if (Number.isNaN(appointmentDate.getTime())) return;
      if (isSameCalendarDay(appointmentDate, now)) {
        todayAppointments.push(appointment);
      }
    });

    const sortedToday = [...todayAppointments].sort((a, b) => {
      const first = parseHourToMinutes(a.heure) ?? 0;
      const second = parseHourToMinutes(b.heure) ?? 0;
      return first - second;
    });

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const nextAppointment =
      sortedToday.find((appointment) => (parseHourToMinutes(appointment.heure) ?? -1) >= currentMinutes) ||
      sortedToday[0] ||
      null;

    return {
      statusCount,
      typeCount,
      todayAppointments: sortedToday,
      uniquePatients: uniquePatients.size,
      uniqueMedecins: uniqueMedecins.size,
      urgentCount,
      nextAppointment,
    };
  }, [allAppointments]);

  const filteredTodayAppointments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return dashboard.todayAppointments.filter((appointment) => {
      const patientName = getPatientName(appointment).toLowerCase();
      const numero = String(appointment.numero || '').toLowerCase();

      const matchSearch =
        normalizedSearch === '' ||
        patientName.includes(normalizedSearch) ||
        numero.includes(normalizedSearch);
      const matchType = typeFilter === 'tous' || appointment.type === typeFilter;
      const matchStatus = statusFilter === 'tous' || normalizeStatus(appointment.statut) === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [dashboard.todayAppointments, searchTerm, typeFilter, statusFilter]);

  const tabScopedTodayAppointments = useMemo(() => {
    const sortedByHour = [...filteredTodayAppointments].sort((a, b) => {
      const first = parseHourToMinutes(a.heure) ?? 0;
      const second = parseHourToMinutes(b.heure) ?? 0;
      return first - second;
    });

    if (activeTab === 'demandes') {
      return sortedByHour.filter((appointment) => normalizeStatus(appointment.statut) === 'en_attente');
    }

    if (activeTab === 'paiements') {
      return sortedByHour.filter((appointment) => normalizeStatus(appointment.statut) === 'paye');
    }

    if (activeTab === 'analysis') {
      const urgentItems = sortedByHour.filter((appointment) => isUrgentAppointment(appointment));
      if (urgentItems.length > 0) return urgentItems;
      return sortedByHour.filter((appointment) => {
        const status = normalizeStatus(appointment.statut);
        return status === 'en_attente' || status === 'annule';
      });
    }

    return sortedByHour;
  }, [activeTab, filteredTodayAppointments]);

  const insightCards = useMemo<InsightCard[]>(
    () => [
      {
        id: 'pending',
        title: 'Demandes a valider',
        description: 'Demandes en attente de confirmation secretaire.',
        count: dashboard.statusCount.en_attente,
        tone: dashboard.statusCount.en_attente > 0 ? 'warning' : 'neutral',
        icon: ClipboardCheck,
        tabs: ['general', 'demandes', 'planning', 'analysis'],
      },
      {
        id: 'urgent',
        title: 'Alertes urgentes IA',
        description: 'Rendez-vous detectes avec marqueur urgent.',
        count: dashboard.urgentCount,
        tone: dashboard.urgentCount > 0 ? 'warning' : 'neutral',
        icon: Activity,
        tabs: ['general', 'demandes', 'analysis'],
      },
      {
        id: 'today',
        title: 'RDV du jour',
        description: 'Volume de coordination a traiter aujourd hui.',
        count: Number(apiStats?.rendezVousAujourdhui ?? dashboard.todayAppointments.length),
        tone: dashboard.todayAppointments.length > 0 ? 'info' : 'neutral',
        icon: CalendarDays,
        tabs: ['general', 'planning', 'analysis'],
      },
      {
        id: 'paid',
        title: 'Rendez-vous payes',
        description: 'Rendez-vous deja valides cote paiement.',
        count: dashboard.statusCount.paye,
        tone: dashboard.statusCount.paye > 0 ? 'success' : 'neutral',
        icon: CreditCard,
        tabs: ['general', 'paiements', 'analysis'],
      },
    ],
    [apiStats?.rendezVousAujourdhui, dashboard]
  );

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setActiveViewMode(DEFAULT_VIEW_MODE_BY_TAB[tab]);
  };

  const tabScopedInsightCards = useMemo(
    () => insightCards.filter((card) => card.tabs.includes(activeTab)),
    [activeTab, insightCards]
  );

  const visibleInsightCards = useMemo(() => {
    if (activeViewMode === 'overview') return tabScopedInsightCards;

    if (activeViewMode === 'quickselect') {
      const prioritised = tabScopedInsightCards.filter((card) => card.count > 0);
      return (prioritised.length > 0 ? prioritised : tabScopedInsightCards).slice(0, 3);
    }

    return [...tabScopedInsightCards]
      .sort(
        (a, b) =>
          INSIGHT_TONE_PRIORITY[b.tone] - INSIGHT_TONE_PRIORITY[a.tone] ||
          b.count - a.count
      )
      .slice(0, 3);
  }, [activeViewMode, tabScopedInsightCards]);

  const visibleTodayAppointments = useMemo(() => {
    if (activeViewMode === 'overview') return tabScopedTodayAppointments;
    if (activeViewMode === 'quickselect') return tabScopedTodayAppointments.slice(0, 4);

    const ranked = [...tabScopedTodayAppointments].sort((a, b) => {
      const getRank = (appointment: DashboardAppointment): number => {
        if (isUrgentAppointment(appointment)) return 4;
        const status = normalizeStatus(appointment.statut);
        if (status === 'en_attente') return 3;
        if (status === 'annule') return 2;
        return 1;
      };
      return getRank(b) - getRank(a);
    });

    return ranked.slice(0, 6);
  }, [activeViewMode, tabScopedTodayAppointments]);

  const activeTabConfig = DASHBOARD_TABS.find((tab) => tab.id === activeTab) || DASHBOARD_TABS[0];
  const secretaryName = `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Secretaire';
  const todayLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const totalRendezVous = Number(apiStats?.totalRendezVous ?? allAppointments.length);
  const demandesEnAttente = Number(apiStats?.demandesEnAttente ?? dashboard.statusCount.en_attente);
  const totalPatients = Number(apiStats?.totalPatients ?? dashboard.uniquePatients);
  const rdvAujourdhui = Number(apiStats?.rendezVousAujourdhui ?? dashboard.todayAppointments.length);

  if (isLoadingAppointments || isLoadingStats) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        Chargement du dashboard secretaire...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <section className="rounded-[30px] border border-border bg-card px-4 py-4 shadow-card sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
              {getInitials(user?.prenom, user?.nom)}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Secretary profile</p>
              <h1 className="text-2xl font-bold font-display">{secretaryName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">Actif</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{todayLabel}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">RDV jour</p>
              <p className="mt-1 text-lg font-bold">{rdvAujourdhui}</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">En attente</p>
              <p className="mt-1 text-lg font-bold text-warning">{demandesEnAttente}</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Patients</p>
              <p className="mt-1 text-lg font-bold text-primary">{totalPatients}</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total RDV</p>
              <p className="mt-1 text-lg font-bold text-accent">{totalRendezVous}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card px-2 py-2">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-5">
          {DASHBOARD_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[26px] border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold font-display">Charts</h2>
            <p className="text-sm text-muted-foreground">{activeTabConfig.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DASHBOARD_VIEW_MODES.map((mode) => {
              const isActive = activeViewMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveViewMode(mode.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,1fr)]">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Patient ou numero..."
                  className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/35"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as AppointmentTypeFilter)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/35"
              >
                <option value="tous">Tous types</option>
                <option value="en_ligne">En ligne</option>
                <option value="presentiel">Presentiel</option>
                <option value="prestation">Prestation</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as AppointmentStatusFilter)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/35"
              >
                <option value="tous">Tous statuts</option>
                <option value="en_attente">En attente</option>
                <option value="confirme">Confirme</option>
                <option value="paye">Paye</option>
                <option value="termine">Termine</option>
                <option value="annule">Annule</option>
              </select>
            </div>

            <div className="relative min-h-[460px] overflow-hidden rounded-[24px] border border-primary/25">
              <img
                src="/scaled.jpg"
                alt="Coordination secretariat"
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-primary/90" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.32),transparent_42%),radial-gradient(circle_at_80%_25%,rgba(255,255,255,0.22),transparent_36%),radial-gradient(circle_at_60%_80%,rgba(255,255,255,0.2),transparent_30%)]" />
              <div className="absolute -left-16 top-12 h-56 w-56 rounded-full border border-white/30" />
              <div className="absolute bottom-10 right-10 h-36 w-36 rounded-full border border-white/25" />

              <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-7">
                <div className="space-y-3 text-white">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                    <Activity className="h-3.5 w-3.5" />
                    Secretarial operations
                  </span>
                  <h3 className="text-3xl font-bold font-display">Coordination des rendez-vous</h3>
                  <p className="max-w-xl text-sm text-white/90">
                    {demandesEnAttente} demandes sont en attente de validation et {rdvAujourdhui} rendez-vous sont
                    programmes aujourd hui.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                    {dashboard.statusCount.confirme} confirmes
                  </span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                    {dashboard.statusCount.paye} payes
                  </span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                    {dashboard.uniqueMedecins} medecins
                  </span>
                </div>
              </div>

              <div className="absolute left-4 top-[46%] z-20 rounded-xl border border-white/30 bg-black/25 px-3 py-2 text-xs text-white backdrop-blur-sm">
                <p className="font-semibold">Demandes en attente</p>
                <p>{demandesEnAttente} a traiter</p>
              </div>
              <div className="absolute right-4 top-[32%] z-20 rounded-xl border border-white/30 bg-black/25 px-3 py-2 text-xs text-white backdrop-blur-sm">
                <p className="font-semibold">Alertes urgentes</p>
                <p>{dashboard.urgentCount} cas signales</p>
              </div>
              <div className="absolute bottom-5 left-8 z-20 rounded-xl border border-white/30 bg-black/25 px-3 py-2 text-xs text-white backdrop-blur-sm">
                <p className="font-semibold">Prochain RDV</p>
                <p>{dashboard.nextAppointment?.heure || '--:--'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">Prochain patient</p>
                <p className="mt-1 text-sm font-semibold">
                  {dashboard.nextAppointment ? getPatientName(dashboard.nextAppointment) : 'Aucun RDV programme'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dashboard.nextAppointment?.heure || '--:--'} • {getTypeLabel(dashboard.nextAppointment?.type)}
                </p>
              </article>
            <article className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs text-muted-foreground">Volume du jour</p>
              <p className="mt-1 text-sm font-semibold">{rdvAujourdhui} rendez-vous</p>
              <p className="text-xs text-muted-foreground">{visibleTodayAppointments.length} visibles</p>
            </article>
              <article className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">Suivi medecins</p>
                <p className="mt-1 text-sm font-semibold">{dashboard.uniqueMedecins} medecins actifs</p>
                <p className="text-xs text-muted-foreground">{dashboard.uniquePatients} patients uniques</p>
              </article>
            </div>
          </div>

          <div className="space-y-3">
            {visibleInsightCards.map((insight) => {
              const styles = INSIGHT_TONE_CLASSES[insight.tone];
              const Icon = insight.icon;
              return (
                <article key={insight.id} className={`rounded-xl border p-3 transition-colors ${styles.wrapper}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{insight.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{insight.description}</p>
                    </div>
                    <div className={`rounded-full p-2 ${styles.chip}`}>
                      <Icon className={`h-4 w-4 ${styles.icon}`} />
                    </div>
                  </div>
                  <div className="mt-3 inline-flex rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">
                    {insight.count} element(s)
                  </div>
                </article>
              );
            })}

            <section className="rounded-xl border border-border bg-card p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Planning du jour</h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                  {visibleTodayAppointments.length}
                </span>
              </div>

              <div className="max-h-[292px] space-y-2 overflow-y-auto pr-1">
                {visibleTodayAppointments.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                    Aucun rendez-vous pour les filtres selectionnes.
                  </p>
                ) : (
                  visibleTodayAppointments.map((appointment) => {
                    const patientName = getPatientName(appointment);
                    const medecinName = getMedecinName(appointment);
                    const status = normalizeStatus(appointment.statut);
                    return (
                      <article key={String(appointment.id)} className="rounded-xl border border-border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {getNameInitials(patientName)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{patientName}</p>
                              <p className="text-xs text-muted-foreground">
                                {appointment.heure || '--:--'} • {getTypeLabel(appointment.type)}
                              </p>
                              <p className="text-xs text-muted-foreground">{medecinName}</p>
                            </div>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${STATUS_BADGE_CLASSES[status]}`}>
                            {getStatusLabel(status)}
                          </span>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              <Link to="/secretaire/rdv-en-cours" className="mt-3 block">
                <Button variant="outline" className="w-full">
                  Voir les rendez-vous en cours
                </Button>
              </Link>
            </section>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold font-display">Actions rapides</h3>
          <Filter className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            to="/secretaire/demandes-rdv"
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <ClipboardCheck className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Valider les demandes</p>
            <p className="text-xs text-muted-foreground">Traiter les demandes patient en attente</p>
          </Link>
          <Link
            to="/secretaire/agenda"
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <CalendarDays className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Agenda</p>
            <p className="text-xs text-muted-foreground">Organiser les rendez-vous du cabinet</p>
          </Link>
          <Link
            to="/secretaire/paiements"
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <CreditCard className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Paiements</p>
            <p className="text-xs text-muted-foreground">Suivre les paiements et confirmations</p>
          </Link>
          <Link
            to="/secretaire/notifications"
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <MessageSquare className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">Verifier les messages de coordination</p>
          </Link>
        </div>
      </section>
    </div>
  );
};
