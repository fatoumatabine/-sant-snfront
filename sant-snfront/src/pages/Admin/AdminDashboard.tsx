import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Filter,
  MessageSquare,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

import { AdminSecretaires } from './AdminSecretaires';
import { AdminMedecins } from './AdminMedecins';
import { AdminPatients } from './AdminPatients';
import { AdminStatistiques } from './AdminStatistiques';

type DashboardTab = 'general' | 'users' | 'appointments' | 'finance' | 'analysis';
type DashboardViewMode = 'overview' | 'quickselect' | 'analysis';

interface AdminStats {
  totalPatients?: number;
  totalMedecins?: number;
  totalConsultations?: number;
  totalRendezVous?: number;
  revenus?: number;
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

interface OperationRow {
  id: string;
  title: string;
  meta: string;
  status: string;
  priority: number;
  tabs: DashboardTab[];
}

const DASHBOARD_TABS: Array<{
  id: DashboardTab;
  label: string;
  subtitle: string;
  icon: React.ElementType;
}> = [
  { id: 'general', label: 'General', subtitle: 'Vue globale de la plateforme', icon: Activity },
  { id: 'users', label: 'Utilisateurs', subtitle: 'Suivi des patients et medecins', icon: Users },
  { id: 'appointments', label: 'Rendez-vous', subtitle: 'Pilotage du flux des consultations', icon: CalendarDays },
  { id: 'finance', label: 'Finance', subtitle: 'Suivi des revenus et paiements', icon: CreditCard },
  { id: 'analysis', label: 'AI Analysis', subtitle: 'Priorisation et risques operationnels', icon: MessageSquare },
];

const DASHBOARD_VIEW_MODES: Array<{ id: DashboardViewMode; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'quickselect', label: 'Quickselect' },
  { id: 'analysis', label: 'AI analysis' },
];

const DEFAULT_VIEW_MODE_BY_TAB: Record<DashboardTab, DashboardViewMode> = {
  general: 'overview',
  users: 'quickselect',
  appointments: 'quickselect',
  finance: 'overview',
  analysis: 'analysis',
};

const INSIGHT_TONE_PRIORITY: Record<InsightCard['tone'], number> = {
  warning: 4,
  info: 3,
  success: 2,
  neutral: 1,
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

const unwrapStats = (payload: unknown): AdminStats => {
  let current: unknown = payload;

  for (let index = 0; index < 3; index += 1) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      if ('data' in current) {
        current = (current as { data: unknown }).data;
        continue;
      }
      return current as AdminStats;
    }
    return {};
  }

  return current && typeof current === 'object' ? (current as AdminStats) : {};
};

const getInitials = (firstName?: string, lastName?: string): string => {
  const first = (firstName || '').trim().charAt(0).toUpperCase();
  const last = (lastName || '').trim().charAt(0).toUpperCase();
  return `${first}${last}` || 'AD';
};

const DashboardAccueil: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<DashboardTab>('analysis');
  const [activeViewMode, setActiveViewMode] = useState<DashboardViewMode>('analysis');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: stats = {}, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/stats/dashboard');
        return unwrapStats(response);
      } catch (error) {
        console.error('Erreur chargement stats admin:', error);
        return {};
      }
    },
  });

  const totalPatients = Number(stats?.totalPatients ?? 0);
  const totalMedecins = Number(stats?.totalMedecins ?? 0);
  const totalConsultations = Number(stats?.totalConsultations ?? 0);
  const totalRendezVous = Number(stats?.totalRendezVous ?? 0);
  const revenus = Number(stats?.revenus ?? 0);

  const adminName = `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Administrateur';
  const todayLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const pendingQueue = Math.max(totalRendezVous - totalConsultations, 0);
  const coverageRate = totalRendezVous > 0 ? Math.round((totalConsultations / totalRendezVous) * 100) : 0;
  const activeTabConfig = DASHBOARD_TABS.find((tab) => tab.id === activeTab) || DASHBOARD_TABS[0];

  const insightCards = useMemo<InsightCard[]>(
    () => [
      {
        id: 'patients',
        title: 'Patients actifs',
        description: 'Base totale des patients enregistres.',
        count: totalPatients,
        tone: totalPatients > 0 ? 'info' : 'neutral',
        icon: Users,
        tabs: ['general', 'users', 'analysis'],
      },
      {
        id: 'medecins',
        title: 'Medecins actifs',
        description: 'Praticiens disponibles sur la plateforme.',
        count: totalMedecins,
        tone: totalMedecins > 0 ? 'success' : 'neutral',
        icon: Stethoscope,
        tabs: ['general', 'users', 'analysis'],
      },
      {
        id: 'queue',
        title: 'File operationnelle',
        description: 'Rendez-vous a convertir en consultations.',
        count: pendingQueue,
        tone: pendingQueue > 0 ? 'warning' : 'neutral',
        icon: ClipboardCheck,
        tabs: ['general', 'appointments', 'analysis'],
      },
      {
        id: 'revenus',
        title: 'Revenus globaux',
        description: 'Montant cumule de la plateforme.',
        count: revenus,
        tone: revenus > 0 ? 'success' : 'neutral',
        icon: CreditCard,
        tabs: ['general', 'finance', 'analysis'],
      },
    ],
    [pendingQueue, revenus, totalMedecins, totalPatients]
  );

  const operationRows = useMemo<OperationRow[]>(
    () => [
      {
        id: 'ops-1',
        title: 'Suivi des validations secretaire',
        meta: `${pendingQueue} element(s) en file`,
        status: pendingQueue > 0 ? 'Attention' : 'Stable',
        priority: pendingQueue > 0 ? 3 : 1,
        tabs: ['general', 'appointments', 'analysis'],
      },
      {
        id: 'ops-2',
        title: 'Couverture consultations',
        meta: `${coverageRate}% des RDV convertis`,
        status: coverageRate < 60 ? 'A renforcer' : 'Bon niveau',
        priority: coverageRate < 60 ? 4 : 2,
        tabs: ['general', 'appointments', 'analysis'],
      },
      {
        id: 'ops-3',
        title: 'Pilotage medecins',
        meta: `${totalMedecins} medecin(s) actifs`,
        status: totalMedecins === 0 ? 'A lancer' : 'Operationnel',
        priority: totalMedecins === 0 ? 3 : 1,
        tabs: ['general', 'users', 'analysis'],
      },
      {
        id: 'ops-4',
        title: 'Suivi financier',
        meta: `${revenus.toLocaleString('fr-FR')} FCFA cumules`,
        status: revenus > 0 ? 'En croissance' : 'A relancer',
        priority: revenus > 0 ? 2 : 3,
        tabs: ['general', 'finance', 'analysis'],
      },
    ],
    [coverageRate, pendingQueue, revenus, totalMedecins]
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

  const tabScopedOps = useMemo(
    () => operationRows.filter((row) => row.tabs.includes(activeTab)),
    [activeTab, operationRows]
  );

  const filteredOps = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return tabScopedOps;
    return tabScopedOps.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.meta.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
    );
  }, [searchTerm, tabScopedOps]);

  const visibleOps = useMemo(() => {
    if (activeViewMode === 'overview') return filteredOps;
    if (activeViewMode === 'quickselect') return filteredOps.slice(0, 3);
    return [...filteredOps].sort((a, b) => b.priority - a.priority).slice(0, 3);
  }, [activeViewMode, filteredOps]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        Chargement du dashboard admin...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <section className="rounded-[30px] border border-border bg-card px-4 py-4 shadow-card sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-bold text-white">
              {getInitials(user?.prenom, user?.nom)}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Admin profile</p>
              <h1 className="text-2xl font-bold font-display">{adminName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">Actif</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{todayLabel}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Patients</p>
              <p className="mt-1 text-lg font-bold">{totalPatients}</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Medecins</p>
              <p className="mt-1 text-lg font-bold text-primary">{totalMedecins}</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">RDV</p>
              <p className="mt-1 text-lg font-bold text-accent">{totalRendezVous}</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Consultations</p>
              <p className="mt-1 text-lg font-bold text-warning">{totalConsultations}</p>
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
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Recherche operationnelle..."
                  className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/35"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Couverture actuelle: {coverageRate}%
              </div>
            </div>

            <div className="relative min-h-[460px] overflow-hidden rounded-[24px] border border-primary/25">
              <img
                src="/scaled.jpg"
                alt="Pilotage administratif"
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/85 to-accent/90" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.32),transparent_42%),radial-gradient(circle_at_80%_25%,rgba(255,255,255,0.22),transparent_36%),radial-gradient(circle_at_60%_80%,rgba(255,255,255,0.2),transparent_30%)]" />
              <div className="absolute -left-16 top-12 h-56 w-56 rounded-full border border-white/30" />
              <div className="absolute bottom-10 right-10 h-36 w-36 rounded-full border border-white/25" />

              <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-7">
                <div className="space-y-3 text-white">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Governance center
                  </span>
                  <h3 className="text-3xl font-bold font-display">Pilotage de la plateforme</h3>
                  <p className="max-w-xl text-sm text-white/90">
                    {totalRendezVous} rendez-vous, {totalConsultations} consultations et {totalPatients} patients
                    suivis par l equipe medicale.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                    {totalMedecins} medecins
                  </span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                    {pendingQueue} en file
                  </span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                    {revenus.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              <div className="absolute left-4 top-[46%] z-20 rounded-xl border border-white/30 bg-black/25 px-3 py-2 text-xs text-white backdrop-blur-sm">
                <p className="font-semibold">File operationnelle</p>
                <p>{pendingQueue} element(s) a traiter</p>
              </div>
              <div className="absolute right-4 top-[32%] z-20 rounded-xl border border-white/30 bg-black/25 px-3 py-2 text-xs text-white backdrop-blur-sm">
                <p className="font-semibold">Couverture</p>
                <p>{coverageRate}% de conversion</p>
              </div>
              <div className="absolute bottom-5 left-8 z-20 rounded-xl border border-white/30 bg-black/25 px-3 py-2 text-xs text-white backdrop-blur-sm">
                <p className="font-semibold">Revenus</p>
                <p>{revenus.toLocaleString('fr-FR')} FCFA</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">Couverture plateforme</p>
                <p className="mt-1 text-sm font-semibold">{coverageRate}%</p>
                <p className="text-xs text-muted-foreground">Consultations / rendez-vous</p>
              </article>
              <article className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">Revenus cumules</p>
                <p className="mt-1 text-sm font-semibold">{revenus.toLocaleString('fr-FR')} FCFA</p>
                <p className="text-xs text-muted-foreground">Source: dashboard stats</p>
              </article>
              <article className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">Capacite medecins</p>
                <p className="mt-1 text-sm font-semibold">{totalMedecins} medecins actifs</p>
                <p className="text-xs text-muted-foreground">{totalPatients} patients suivis</p>
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
                    {insight.id === 'revenus' ? `${insight.count.toLocaleString('fr-FR')} FCFA` : `${insight.count} element(s)`}
                  </div>
                </article>
              );
            })}

            <section className="rounded-xl border border-border bg-card p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Operations critiques
                </h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                  {visibleOps.length}
                </span>
              </div>

              <div className="space-y-2">
                {visibleOps.map((row) => (
                  <article key={row.id} className="rounded-lg border border-border bg-background p-3">
                    <p className="text-sm font-semibold">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.meta}</p>
                    <p className="mt-1 text-[11px] text-primary">{row.status}</p>
                  </article>
                ))}
              </div>
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
            to="/admin/utilisateurs/medecins"
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <Stethoscope className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Gerer medecins</p>
            <p className="text-xs text-muted-foreground">Administration des comptes medecins</p>
          </Link>
          <Link
            to="/admin/utilisateurs/secretaires"
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <Users className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Gerer secretaires</p>
            <p className="text-xs text-muted-foreground">Gestion equipe support</p>
          </Link>
          <Link
            to="/admin/utilisateurs/patients"
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <ClipboardCheck className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Superviser patients</p>
            <p className="text-xs text-muted-foreground">Controle des comptes patients</p>
          </Link>
          <Link
            to="/admin/statistiques"
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <BarChart3 className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Statistiques detaillees</p>
            <p className="text-xs text-muted-foreground">Rapports avancees</p>
          </Link>
        </div>
      </section>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  if (currentPath.includes('/admin/utilisateurs/secretaires')) {
    return <AdminSecretaires />;
  }

  if (currentPath.includes('/admin/utilisateurs/medecins')) {
    return <AdminMedecins />;
  }

  if (currentPath.includes('/admin/utilisateurs/patients')) {
    return <AdminPatients />;
  }

  if (currentPath.includes('/admin/statistiques')) {
    return <AdminStatistiques />;
  }

  return <DashboardAccueil />;
};
