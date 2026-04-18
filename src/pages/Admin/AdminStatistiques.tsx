import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, TrendingUp, Filter, RotateCcw, Search } from 'lucide-react';
import { StatCard } from '@/components/Common/StatCard';
import { apiService } from '@/services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface ApiEnvelope<T> {
  data?: T;
}

interface DashboardStats {
  totalPatients: number;
  totalMedecins: number;
  totalRendezVous: number;
  totalConsultations: number;
  rdvCeMois: number;
  consultationsCeMois: number;
}

interface GraphPoint {
  mois: string;
  count: number;
}

interface StatusPoint {
  statut: string;
  count: number;
}

interface GraphStats {
  consultationsParMois: GraphPoint[];
  rendezVousParMois: GraphPoint[];
  rendezVousParStatut: StatusPoint[];
}

interface AdminMedecin {
  id: number;
  prenom?: string;
  nom?: string;
  user?: {
    name?: string;
  };
}

interface ConsultationItem {
  medecinId?: number;
}

interface MedecinPerformance {
  name: string;
  consultations: number;
  satisfaction: number;
}

const emptyDashboardStats: DashboardStats = {
  totalPatients: 0,
  totalMedecins: 0,
  totalRendezVous: 0,
  totalConsultations: 0,
  rdvCeMois: 0,
  consultationsCeMois: 0,
};

const emptyGraphStats: GraphStats = {
  consultationsParMois: [],
  rendezVousParMois: [],
  rendezVousParStatut: [],
};

const unwrapValue = <T,>(payload: unknown, fallback: T): T => {
  let current: unknown = payload;

  for (let index = 0; index < 3; index += 1) {
    if (Array.isArray(current)) {
      return current as T;
    }

    if (current && typeof current === 'object') {
      if ('data' in current) {
        current = (current as ApiEnvelope<unknown>).data;
        continue;
      }
      return current as T;
    }

    return fallback;
  }

  return fallback;
};

const formatMontant = (montant: number): string =>
  new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);

const normalizeStatus = (status: string): string => status.toLowerCase();

const getMedecinName = (medecin: AdminMedecin): string => {
  const explicit = (medecin.user?.name || '').trim();
  if (explicit) return explicit;
  const full = `${medecin.prenom || ''} ${medecin.nom || ''}`.trim();
  return full ? `Dr. ${full}` : `Médecin #${medecin.id}`;
};

export const AdminStatistiques: React.FC = () => {
  const [periodFilter, setPeriodFilter] = useState<'12m' | '6m' | '3m'>('12m');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [minSatisfaction, setMinSatisfaction] = useState(0);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(emptyDashboardStats);
  const [graphStats, setGraphStats] = useState<GraphStats>(emptyGraphStats);
  const [medecinsPerformance, setMedecinsPerformance] = useState<MedecinPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [dashboardResponse, graphResponse, medecinsResponse, consultationsResponse] = await Promise.all([
          apiService.get('/stats/dashboard'),
          apiService.get('/stats/graphiques'),
          apiService.get('/admin/medecins'),
          apiService.get('/consultations'),
        ]);

        const dashboard = unwrapValue<DashboardStats>(dashboardResponse, emptyDashboardStats);
        const graphs = unwrapValue<GraphStats>(graphResponse, emptyGraphStats);
        const medecins = unwrapValue<AdminMedecin[]>(medecinsResponse, []);
        const consultations = unwrapValue<ConsultationItem[]>(consultationsResponse, []);

        const medecinConsultCount = new Map<number, number>();
        consultations.forEach((consultation) => {
          if (!consultation.medecinId) return;
          medecinConsultCount.set(
            consultation.medecinId,
            (medecinConsultCount.get(consultation.medecinId) || 0) + 1,
          );
        });

        const maxConsultations = Math.max(
          1,
          ...medecins.map((medecin) => medecinConsultCount.get(medecin.id) || 0),
        );

        const performance = medecins
          .map((medecin) => {
            const consultationsCount = medecinConsultCount.get(medecin.id) || 0;
            const activityRatio = consultationsCount / maxConsultations;
            const satisfaction = Math.round(75 + activityRatio * 23);

            return {
              name: getMedecinName(medecin),
              consultations: consultationsCount,
              satisfaction,
            };
          })
          .sort((a, b) => b.consultations - a.consultations);

        setDashboardStats({
          totalPatients: Number(dashboard.totalPatients || 0),
          totalMedecins: Number(dashboard.totalMedecins || 0),
          totalRendezVous: Number(dashboard.totalRendezVous || 0),
          totalConsultations: Number(dashboard.totalConsultations || 0),
          rdvCeMois: Number(dashboard.rdvCeMois || 0),
          consultationsCeMois: Number(dashboard.consultationsCeMois || 0),
        });

        setGraphStats({
          consultationsParMois: Array.isArray(graphs.consultationsParMois) ? graphs.consultationsParMois : [],
          rendezVousParMois: Array.isArray(graphs.rendezVousParMois) ? graphs.rendezVousParMois : [],
          rendezVousParStatut: Array.isArray(graphs.rendezVousParStatut) ? graphs.rendezVousParStatut : [],
        });

        setMedecinsPerformance(performance);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Impossible de charger les statistiques';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStats();
  }, []);

  const consultationsChartData = useMemo(() => {
    const base = graphStats.consultationsParMois;
    if (periodFilter === '3m') return base.slice(-3);
    if (periodFilter === '6m') return base.slice(-6);
    return base;
  }, [graphStats.consultationsParMois, periodFilter]);

  const revenusChartData = useMemo(() => {
    const estimatedConsultationPrice = 15000;
    return consultationsChartData.map((item) => ({
      mois: item.mois,
      montant: item.count * estimatedConsultationPrice,
    }));
  }, [consultationsChartData]);

  const filteredMedecins = useMemo(() => {
    const normalizedSearch = doctorSearch.trim().toLowerCase();
    return medecinsPerformance.filter((medecin) => {
      const matchName = normalizedSearch === '' || medecin.name.toLowerCase().includes(normalizedSearch);
      const matchSatisfaction = medecin.satisfaction >= minSatisfaction;
      return matchName && matchSatisfaction;
    });
  }, [doctorSearch, medecinsPerformance, minSatisfaction]);

  const statusTotals = useMemo(() => {
    const totals = graphStats.rendezVousParStatut.reduce(
      (acc, item) => {
        const status = normalizeStatus(item.statut);
        acc.total += item.count;
        if (status === 'confirme' || status === 'paye' || status === 'termine') {
          acc.occupes += item.count;
        }
        return acc;
      },
      { total: 0, occupes: 0 },
    );

    const occupancyRate = totals.total > 0 ? Math.round((totals.occupes / totals.total) * 100) : 0;
    return { ...totals, occupancyRate };
  }, [graphStats.rendezVousParStatut]);

  const averageSatisfaction = useMemo(() => {
    if (medecinsPerformance.length === 0) return 0;
    const total = medecinsPerformance.reduce((sum, medecin) => sum + medecin.satisfaction, 0);
    return Math.round(total / medecinsPerformance.length);
  }, [medecinsPerformance]);

  const totalEstimatedRevenue = useMemo(
    () => revenusChartData.reduce((sum, item) => sum + item.montant, 0),
    [revenusChartData],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Statistiques avancées
        </h1>
        <p className="text-muted-foreground">Analyses détaillées et rapports du système</p>
      </div>

      {loadError && (
        <div className="card-health border border-destructive/30 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      <div className="card-health border border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filtres analytiques
          </h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setPeriodFilter('12m');
              setDoctorSearch('');
              setMinSatisfaction(0);
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as '12m' | '6m' | '3m')}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          >
            <option value="12m">12 derniers mois</option>
            <option value="6m">6 derniers mois</option>
            <option value="3m">3 derniers mois</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un médecin..."
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input rounded-xl bg-background text-sm"
            />
          </div>
          <select
            value={String(minSatisfaction)}
            onChange={(e) => setMinSatisfaction(Number(e.target.value))}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          >
            <option value="0">Indice activité: tous</option>
            <option value="80">Indice &gt;= 80%</option>
            <option value="90">Indice &gt;= 90%</option>
            <option value="95">Indice &gt;= 95%</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Taux d'occupation" value={`${statusTotals.occupancyRate}%`} icon={TrendingUp} variant="primary" />
        <StatCard
          title="Total patients"
          value={dashboardStats.totalPatients}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Consultations ce mois"
          value={dashboardStats.consultationsCeMois}
          icon={TrendingUp}
          variant="warning"
        />
        <StatCard
          title="Indice activité"
          value={`${averageSatisfaction}%`}
          icon={TrendingUp}
          variant="default"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-health">
          <h2 className="text-lg font-semibold font-display mb-4">Consultations par mois</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consultationsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mois" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Consultations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-health">
          <h2 className="text-lg font-semibold font-display mb-4">Revenus estimés par mois</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mois" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  formatter={(value: number | string) => formatMontant(Number(value))}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="montant"
                  stroke="#10b981"
                  name="Revenus estimés"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Total estimé: {formatMontant(totalEstimatedRevenue)}</p>
        </div>
      </div>

      <div className="card-health">
        <h2 className="text-lg font-semibold font-display mb-4">Performance des médecins</h2>
        <div className="space-y-4">
          {filteredMedecins.map((medecin) => (
            <div key={medecin.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{medecin.name}</span>
                <span className="text-sm text-muted-foreground">
                  {medecin.consultations} consultations • indice {medecin.satisfaction}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${medecin.satisfaction}%` }} />
              </div>
            </div>
          ))}
          {filteredMedecins.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun médecin ne correspond aux filtres actuels.
            </p>
          )}
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement des statistiques...</p>}
    </div>
  );
};
