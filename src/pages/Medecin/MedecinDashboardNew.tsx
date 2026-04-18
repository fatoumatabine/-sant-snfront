import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  FlaskConical,
  MessageSquare,
  Search,
  Stethoscope,
  UsersRound,
  Video,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { apiService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

type DashboardTab = 'general' | 'planning' | 'patients' | 'analysis' | 'messages';
type DashboardViewMode = 'overview' | 'quickselect' | 'analysis';
type RvTypeFilter = 'tous' | 'en_ligne' | 'presentiel' | 'prestation';
type NormalizedStatus = 'en_attente' | 'confirme' | 'termine' | 'annule' | 'autre';

interface MedecinRdvItem {
  id: string | number;
  numero?: string;
  patient_name?: string;
  patient_id?: string | number;
  patient?: {
    id?: string | number;
    prenom?: string;
    nom?: string;
  };
  date?: string;
  date_consultation?: string;
  heure?: string;
  type?: string;
  statut?: string;
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
  { id: 'general', label: 'General', subtitle: 'Vue complete des activites', icon: Activity },
  { id: 'planning', label: 'Planning', subtitle: 'Gestion des rendez-vous en cours', icon: CalendarDays },
  { id: 'patients', label: 'Patients', subtitle: 'Suivi des patients et statuts', icon: UsersRound },
  { id: 'analysis', label: 'AI Analysis', subtitle: 'Priorisation des cas medicaux', icon: FlaskConical },
  { id: 'messages', label: 'Messages', subtitle: 'Communication et rappels patients', icon: MessageSquare },
];

const DASHBOARD_VIEW_MODES: Array<{ id: DashboardViewMode; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'quickselect', label: 'Quickselect' },
  { id: 'analysis', label: 'AI analysis' },
];

const DEFAULT_VIEW_MODE_BY_TAB: Record<DashboardTab, DashboardViewMode> = {
  general: 'overview',
  planning: 'quickselect',
  patients: 'overview',
  analysis: 'analysis',
  messages: 'quickselect',
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

const unwrapRdvList = (payload: unknown): MedecinRdvItem[] => {
  let current: unknown = payload;

  for (let index = 0; index < 3; index += 1) {
    if (Array.isArray(current)) {
      return current as MedecinRdvItem[];
    }

    if (current && typeof current === 'object' && 'data' in current) {
      current = (current as { data: unknown }).data;
      continue;
    }

    return [];
  }

  return Array.isArray(current) ? (current as MedecinRdvItem[]) : [];
};

const normalizeStatus = (status?: string): NormalizedStatus => {
  const current = (status || '').toLowerCase();
  if (current === 'pending' || current === 'en_attente') return 'en_attente';
  if (current === 'confirmed' || current === 'confirme') return 'confirme';
  if (current === 'completed' || current === 'termine') return 'termine';
  if (current === 'cancelled' || current === 'annule') return 'annule';
  return 'autre';
};

const getAppointmentDate = (rdv: MedecinRdvItem): string | undefined => rdv.date || rdv.date_consultation;

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

const getPatientName = (rdv: MedecinRdvItem): string => {
  if (rdv.patient_name && rdv.patient_name.trim()) return rdv.patient_name.trim();
  const prenom = rdv.patient?.prenom || '';
  const nom = rdv.patient?.nom || '';
  const fullName = `${prenom} ${nom}`.trim();
  return fullName || 'Patient';
};

const getInitials = (firstName?: string, lastName?: string): string => {
  const first = (firstName || '').trim().charAt(0).toUpperCase();
  const last = (lastName || '').trim().charAt(0).toUpperCase();
  return `${first}${last}` || 'DR';
};

const getNameInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  const first = parts[0]?.charAt(0)?.toUpperCase() || '';
  const second = parts[1]?.charAt(0)?.toUpperCase() || '';
  return `${first}${second}` || 'PT';
};

const getTypeLabel = (type?: string): string => {
  if (type === 'en_ligne') return 'En ligne';
  if (type === 'presentiel') return 'Presentiel';
  if (type === 'prestation') return 'Prestation';
  return 'Non defini';
};

const getStatusLabel = (status: NormalizedStatus): string => {
  if (status === 'en_attente') return 'En attente';
  if (status === 'confirme') return 'Confirme';
  if (status === 'termine') return 'Termine';
  if (status === 'annule') return 'Annule';
  return 'Inconnu';
};

export const MedecinDashboardNew: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<DashboardTab>('analysis');
  const [activeViewMode, setActiveViewMode] = useState<DashboardViewMode>('analysis');
  const [todaySearch, setTodaySearch] = useState('');
  const [todayTypeFilter, setTodayTypeFilter] = useState<RvTypeFilter>('tous');

  const { data: allRdv = [], isLoading } = useQuery<MedecinRdvItem[]>({
    queryKey: ['medecin-rdv'],
    queryFn: async () => {
      try {
        const response = await apiService.get(API_ENDPOINTS.rendezVous.medecin.list);
        return unwrapRdvList(response);
      } catch (error) {
        console.error('Erreur chargement dashboard medecin:', error);
        return [];
      }
    },
  });

  const dashboard = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const statusCount: Record<NormalizedStatus, number> = {
      en_attente: 0,
      confirme: 0,
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

    const uniquePatients = new Set<string>();
    const todayRdv: MedecinRdvItem[] = [];
    let monthCompleted = 0;

    allRdv.forEach((rdv) => {
      const status = normalizeStatus(rdv.statut);
      statusCount[status] += 1;

      if (rdv.type === 'en_ligne') typeCount.en_ligne += 1;
      else if (rdv.type === 'presentiel') typeCount.presentiel += 1;
      else if (rdv.type === 'prestation') typeCount.prestation += 1;
      else typeCount.autre += 1;

      const patientKey =
        String(rdv.patient?.id || rdv.patient_id || '').trim() || getPatientName(rdv).toLowerCase();
      if (patientKey) uniquePatients.add(patientKey);

      const dateValue = getAppointmentDate(rdv);
      if (!dateValue) return;
      const rdvDate = new Date(dateValue);
      if (Number.isNaN(rdvDate.getTime())) return;

      if (isSameCalendarDay(rdvDate, now)) {
        todayRdv.push(rdv);
      }

      if (
        rdvDate.getMonth() === currentMonth &&
        rdvDate.getFullYear() === currentYear &&
        status === 'termine'
      ) {
        monthCompleted += 1;
      }
    });

    const sortedToday = [...todayRdv].sort((a, b) => {
      const first = parseHourToMinutes(a.heure) ?? 0;
      const second = parseHourToMinutes(b.heure) ?? 0;
      return first - second;
    });

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const nextAppointment =
      sortedToday.find((rdv) => (parseHourToMinutes(rdv.heure) ?? -1) >= currentMinutes) ||
      sortedToday[0] ||
      null;

    const estimatedRevenue = monthCompleted * 15000;

    return {
      statusCount,
      typeCount,
      uniquePatients: uniquePatients.size,
      todayRdv: sortedToday,
      monthCompleted,
      nextAppointment,
      estimatedRevenue,
    };
  }, [allRdv]);

  const filteredTodayRdv = useMemo(() => {
    const normalizedSearch = todaySearch.trim().toLowerCase();

    return dashboard.todayRdv.filter((rdv) => {
      const patientName = getPatientName(rdv).toLowerCase();
      const matchSearch = normalizedSearch === '' || patientName.includes(normalizedSearch);
      const matchType = todayTypeFilter === 'tous' || rdv.type === todayTypeFilter;
      return matchSearch && matchType;
    });
  }, [dashboard.todayRdv, todaySearch, todayTypeFilter]);

  const tabScopedTodayRdv = useMemo(() => {
    const sortedByHour = [...filteredTodayRdv].sort((a, b) => {
      const first = parseHourToMinutes(a.heure) ?? 0;
      const second = parseHourToMinutes(b.heure) ?? 0;
      return first - second;
    });

    if (activeTab === 'patients') {
      return [...sortedByHour].sort((a, b) =>
        getPatientName(a).localeCompare(getPatientName(b), 'fr', { sensitivity: 'base' })
      );
    }

    if (activeTab === 'analysis') {
      const risky = sortedByHour.filter((rdv) => {
        const status = normalizeStatus(rdv.statut);
        return status === 'en_attente' || status === 'annule';
      });
      return risky.length > 0 ? risky : sortedByHour;
    }

    if (activeTab === 'messages') {
      const remote = sortedByHour.filter((rdv) => rdv.type === 'en_ligne');
      return remote.length > 0 ? remote : sortedByHour;
    }

    return sortedByHour;
  }, [activeTab, filteredTodayRdv]);

  const insightCards = useMemo<InsightCard[]>(
    () => [
      {
        id: 'pending',
        title: 'Flux des confirmations',
        description: 'Demandes en attente de validation manuelle.',
        count: dashboard.statusCount.en_attente,
        tone: dashboard.statusCount.en_attente > 0 ? 'warning' : 'neutral',
        icon: Clock3,
        tabs: ['general', 'planning', 'analysis', 'messages'],
      },
      {
        id: 'online',
        title: 'Teleconsultations',
        description: 'Sessions en ligne planifiees avec les patients.',
        count: dashboard.typeCount.en_ligne,
        tone: dashboard.typeCount.en_ligne > 0 ? 'info' : 'neutral',
        icon: Video,
        tabs: ['general', 'planning', 'analysis', 'messages'],
      },
      {
        id: 'completed',
        title: 'Consultations finalisees',
        description: 'Dossiers clotures et actes termines ce mois.',
        count: dashboard.monthCompleted,
        tone: dashboard.monthCompleted > 0 ? 'success' : 'neutral',
        icon: FlaskConical,
        tabs: ['general', 'planning', 'patients', 'analysis'],
      },
      {
        id: 'revenue',
        title: 'Reference revenus',
        description: 'Estimation basee sur les consultations terminees.',
        count: dashboard.estimatedRevenue,
        tone: dashboard.estimatedRevenue > 0 ? 'success' : 'neutral',
        icon: Wallet,
        tabs: ['general', 'patients'],
      },
    ],
    [dashboard]
  );

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

  const visibleTodayRdv = useMemo(() => {
    if (activeViewMode === 'overview') return tabScopedTodayRdv;
    if (activeViewMode === 'quickselect') return tabScopedTodayRdv.slice(0, 4);

    const analysisRows = tabScopedTodayRdv.filter((rdv) => {
      const status = normalizeStatus(rdv.statut);
      return status === 'en_attente' || status === 'annule';
    });
    return (analysisRows.length > 0 ? analysisRows : tabScopedTodayRdv).slice(0, 6);
  }, [activeViewMode, tabScopedTodayRdv]);

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setActiveViewMode(DEFAULT_VIEW_MODE_BY_TAB[tab]);
  };

  const activeTabConfig = DASHBOARD_TABS.find((tab) => tab.id === activeTab) || DASHBOARD_TABS[0];
  const doctorName = `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Medecin';
  const todayLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        Chargement du dashboard medecin...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="rounded-[30px] border border-border bg-card px-4 py-5 shadow-card sm:px-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
              {getInitials(user?.prenom, user?.nom)}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Doctor profile</p>
              <h1 className="text-2xl font-bold font-display">Dr. {doctorName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">Actif</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{todayLabel}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">RDV jour</p>
              <p className="mt-1 text-lg font-bold">{dashboard.todayRdv.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">En attente</p>
              <p className="mt-1 text-lg font-bold text-warning">{dashboard.statusCount.en_attente}</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Patients</p>
              <p className="mt-1 text-lg font-bold text-primary">{dashboard.uniquePatients}</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Termines</p>
              <p className="mt-1 text-lg font-bold text-accent">{dashboard.monthCompleted}</p>
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

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,1fr)]">
          <div className="space-y-4">
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:w-auto">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={todaySearch}
                  onChange={(event) => setTodaySearch(event.target.value)}
                  placeholder="Rechercher patient..."
                  className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/35"
                />
              </div>
              <select
                value={todayTypeFilter}
                onChange={(event) => setTodayTypeFilter(event.target.value as RvTypeFilter)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/35"
              >
                <option value="tous">Tous les types</option>
                <option value="en_ligne">En ligne</option>
                <option value="presentiel">Presentiel</option>
                <option value="prestation">Prestation</option>
              </select>
            </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-[24px] border border-primary/25">
            <img
              src="/scaled.jpg"
              alt="Teleconsultation"
              className="absolute inset-0 h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-primary/90" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.32),transparent_40%),radial-gradient(circle_at_80%_25%,rgba(255,255,255,0.24),transparent_38%),radial-gradient(circle_at_65%_78%,rgba(255,255,255,0.2),transparent_35%)]" />
            <div className="absolute -left-16 top-12 h-56 w-56 rounded-full border border-white/30" />
            <div className="absolute bottom-10 right-10 h-36 w-36 rounded-full border border-white/25" />

            <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-7">
              <div className="space-y-3 text-white">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                  <Activity className="h-3.5 w-3.5" />
                  Live dashboard insight
                </span>
                <h3 className="text-3xl font-bold font-display">Analyse clinique</h3>
                <p className="max-w-xl text-sm text-white/90">
                  {dashboard.statusCount.en_attente} dossiers necessitent une validation et{' '}
                  {dashboard.typeCount.en_ligne} teleconsultations sont planifiees.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                  {dashboard.statusCount.confirme} confirmes
                </span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                  {dashboard.statusCount.termine} termines
                </span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                  {dashboard.uniquePatients} patients uniques
                </span>
              </div>
            </div>

            <div className="absolute left-4 top-[46%] z-20 rounded-xl border border-white/30 bg-black/25 px-3 py-2 text-xs text-white backdrop-blur-sm">
              <p className="font-semibold">RDV en attente</p>
              <p>{dashboard.statusCount.en_attente} cas prioritaires</p>
            </div>
            <div className="absolute right-4 top-[32%] z-20 rounded-xl border border-white/30 bg-black/25 px-3 py-2 text-xs text-white backdrop-blur-sm">
              <p className="font-semibold">Teleconsultation</p>
              <p>{dashboard.typeCount.en_ligne} sessions</p>
            </div>
            <div className="absolute bottom-5 left-8 z-20 rounded-xl border border-white/30 bg-black/25 px-3 py-2 text-xs text-white backdrop-blur-sm">
              <p className="font-semibold">Suivi finalise</p>
              <p>{dashboard.monthCompleted} dossiers ce mois</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs text-muted-foreground">Prochain RDV</p>
              <p className="mt-1 text-sm font-semibold">
                {dashboard.nextAppointment ? getPatientName(dashboard.nextAppointment) : 'Aucun RDV programme'}
              </p>
              <p className="text-xs text-muted-foreground">
                {dashboard.nextAppointment?.heure || '--:--'} •{' '}
                {getTypeLabel(dashboard.nextAppointment?.type)}
              </p>
            </article>
            <article className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs text-muted-foreground">Volume journalier</p>
              <p className="mt-1 text-sm font-semibold">{dashboard.todayRdv.length} rendez-vous</p>
              <p className="text-xs text-muted-foreground">{visibleTodayRdv.length} visibles</p>
            </article>
            <article className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs text-muted-foreground">Projection revenus</p>
              <p className="mt-1 text-sm font-semibold">
                {dashboard.estimatedRevenue.toLocaleString('fr-FR')} FCFA
              </p>
              <p className="text-xs text-muted-foreground">Base sur consultations terminees</p>
            </article>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Alertes operationnelles
              </h3>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{visibleInsightCards.length}</span>
            </div>

            <div className="space-y-3">
              {visibleInsightCards.map((insight) => {
                const styles = INSIGHT_TONE_CLASSES[insight.tone];
                const Icon = insight.icon;

                return (
                  <article
                    key={insight.id}
                    className={`rounded-xl border p-3 transition-colors ${styles.wrapper}`}
                  >
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
                      {insight.id === 'revenue'
                        ? `${insight.count.toLocaleString('fr-FR')} FCFA`
                        : `${insight.count} element(s)`}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Planning du jour
              </h3>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                {visibleTodayRdv.length}
              </span>
            </div>

            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {visibleTodayRdv.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                  Aucun rendez-vous pour les filtres selectionnes.
                </p>
              ) : (
                visibleTodayRdv.map((rdv) => {
                  const patientName = getPatientName(rdv);
                  const status = normalizeStatus(rdv.statut);
                  return (
                    <article
                      key={String(rdv.id)}
                      className="rounded-xl border border-border bg-background p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {getNameInitials(patientName)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{patientName}</p>
                            <p className="text-xs text-muted-foreground">
                              {rdv.heure || '--:--'} • {getTypeLabel(rdv.type)}
                            </p>
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

            <Link to="/medecin/rendez-vous" className="mt-4 block">
              <Button variant="outline" className="w-full">
                Voir le planning complet
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
            to="/medecin/consultations"
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <Stethoscope className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Nouvelle consultation</p>
            <p className="text-xs text-muted-foreground">Demarrer une consultation depuis un RDV</p>
          </Link>

          <Link
            to="/medecin/patients"
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <UsersRound className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Dossier patient</p>
            <p className="text-xs text-muted-foreground">Acceder a la liste complete des patients</p>
          </Link>

          <Link
            to="/medecin/video-call"
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <Video className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Salle video</p>
            <p className="text-xs text-muted-foreground">Lancer une teleconsultation securisee</p>
          </Link>

          <Link
            to="/medecin/notifications"
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <MessageSquare className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">Suivre les nouveaux messages et alertes</p>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <article className="rounded-xl border border-border bg-card p-3">
          <div className="mb-1 flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span className="text-xs">Total RDV</span>
          </div>
          <p className="text-lg font-semibold">{allRdv.length}</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-3">
          <div className="mb-1 flex items-center gap-2 text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            <span className="text-xs">En attente</span>
          </div>
          <p className="text-lg font-semibold text-warning">{dashboard.statusCount.en_attente}</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-3">
          <div className="mb-1 flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs">Confirmes</span>
          </div>
          <p className="text-lg font-semibold text-accent">{dashboard.statusCount.confirme}</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-3">
          <div className="mb-1 flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span className="text-xs">Termines</span>
          </div>
          <p className="text-lg font-semibold text-primary">{dashboard.statusCount.termine}</p>
        </article>
      </section>
    </div>
  );
};
