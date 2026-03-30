import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, CalendarDays, CreditCard, TriangleAlert, Users } from 'lucide-react';
import { apiService } from '@/services/api';

interface DashboardStats {
  totalRendezVous?: number;
  rendezVousAujourdhui?: number;
  demandesEnAttente?: number;
  totalPatients?: number;
}

interface AppointmentItem {
  id: number | string;
  date?: string;
  heure?: string;
  type?: string;
  statut?: string;
  motif?: string;
  urgent_ia?: boolean;
  patient?: {
    prenom?: string;
    nom?: string;
  };
}

const unwrapData = <T,>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const normalizeStatus = (value?: string) => (value || '').toLowerCase();

const getPatientName = (appointment: AppointmentItem) => {
  const prenom = appointment.patient?.prenom || '';
  const nom = appointment.patient?.nom || '';
  return `${prenom} ${nom}`.trim() || 'Patient';
};

export const SecretaireRapports = () => {
  const { data: stats, isLoading: isLoadingStats, error: statsError } = useQuery<DashboardStats>({
    queryKey: ['secretaire-rapports-stats'],
    queryFn: async () => unwrapData<DashboardStats>(await apiService.get('/secretaire/dashboard/stats')),
  });

  const {
    data: appointments = [],
    isLoading: isLoadingAppointments,
    error: appointmentsError,
  } = useQuery<AppointmentItem[]>({
    queryKey: ['secretaire-rapports-appointments'],
    queryFn: async () =>
      unwrapData<AppointmentItem[]>(await apiService.get('/secretaire/dashboard/appointments/all')),
  });

  const insights = useMemo(() => {
    const confirmed = appointments.filter((item) => normalizeStatus(item.statut) === 'confirme').length;
    const paid = appointments.filter((item) => normalizeStatus(item.statut) === 'paye').length;
    const cancelled = appointments.filter((item) => normalizeStatus(item.statut) === 'annule').length;
    const online = appointments.filter((item) => (item.type || '').toLowerCase() === 'en_ligne').length;
    const urgent = appointments.filter((item) => Boolean(item.urgent_ia)).length;

    const recent = [...appointments]
      .sort((first, second) => {
        const firstTime = new Date(first.date || 0).getTime();
        const secondTime = new Date(second.date || 0).getTime();
        return secondTime - firstTime;
      })
      .slice(0, 6);

    return {
      confirmed,
      paid,
      cancelled,
      online,
      urgent,
      recent,
    };
  }, [appointments]);

  if (isLoadingStats || isLoadingAppointments) {
    return <div className="py-10 text-center text-muted-foreground">Chargement des rapports...</div>;
  }

  if (statsError || appointmentsError) {
    return (
      <div className="card-health border border-destructive/20 bg-destructive/5">
        <h1 className="text-2xl font-bold">Rapports</h1>
        <p className="mt-2 text-sm text-destructive">
          {(statsError as Error | undefined)?.message ||
            (appointmentsError as Error | undefined)?.message ||
            'Impossible de charger les rapports.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display">Rapports secrétariat</h1>
        <p className="text-muted-foreground">
          Vue synthétique de l’activité du secrétariat et des rendez-vous suivis.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card-health">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total RDV</p>
              <p className="text-2xl font-semibold">{stats?.totalRendezVous || 0}</p>
            </div>
          </div>
        </div>

        <div className="card-health">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-3 text-accent">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aujourd’hui</p>
              <p className="text-2xl font-semibold">{stats?.rendezVousAujourdhui || 0}</p>
            </div>
          </div>
        </div>

        <div className="card-health">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-warning/10 p-3 text-warning">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Demandes en attente</p>
              <p className="text-2xl font-semibold">{stats?.demandesEnAttente || 0}</p>
            </div>
          </div>
        </div>

        <div className="card-health">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-secondary/80 p-3 text-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patients suivis</p>
              <p className="text-2xl font-semibold">{stats?.totalPatients || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card-health space-y-4">
          <h2 className="text-lg font-semibold">Indicateurs opérationnels</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted-foreground">RDV confirmés</p>
              <p className="mt-1 text-2xl font-semibold">{insights.confirmed}</p>
            </div>

            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted-foreground">RDV payés</p>
              <div className="mt-1 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <p className="text-2xl font-semibold">{insights.paid}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted-foreground">RDV annulés</p>
              <p className="mt-1 text-2xl font-semibold">{insights.cancelled}</p>
            </div>

            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted-foreground">Consultations en ligne</p>
              <p className="mt-1 text-2xl font-semibold">{insights.online}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-warning/20 bg-warning/5 px-4 py-4">
            <p className="text-sm font-medium text-warning">Cas urgents détectés par IA</p>
            <p className="mt-1 text-2xl font-semibold">{insights.urgent}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Utilisez cette vue pour prioriser les appels et les validations qui demandent une réponse rapide.
            </p>
          </div>
        </div>

        <div className="card-health space-y-4">
          <h2 className="text-lg font-semibold">Derniers rendez-vous suivis</h2>

          {insights.recent.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Aucun rendez-vous à afficher.
            </div>
          ) : (
            <div className="space-y-3">
              {insights.recent.map((appointment) => (
                <div key={appointment.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{getPatientName(appointment)}</p>
                      <p className="text-sm text-muted-foreground">
                        {(appointment.type || 'Non défini').replace('_', ' ')} • {appointment.heure || 'Heure à confirmer'}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize text-muted-foreground">
                      {appointment.statut || 'inconnu'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>
                      {appointment.date
                        ? new Date(appointment.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Date à confirmer'}
                    </span>
                    {appointment.motif && <span>{appointment.motif}</span>}
                    {appointment.urgent_ia && (
                      <span className="rounded-full bg-warning/15 px-3 py-1 text-warning">Alerte IA</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
