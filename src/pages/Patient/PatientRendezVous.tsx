import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Video, MapPin, Plus, AlertCircle, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';

type RdvStatus = 'en_attente' | 'confirme' | 'annule' | 'termine' | 'paye';
type RdvType = 'en_ligne' | 'presentiel' | 'prestation';

interface PatientRdvItem {
  id: number;
  numero: string;
  date: string;
  heure: string;
  motif?: string;
  urgent_ia?: boolean;
  type: RdvType;
  statut: RdvStatus;
  medecin?: {
    prenom?: string;
    nom?: string;
    specialite?: string;
    user?: {
      name?: string;
      email?: string;
    };
  };
  consultation?: {
    id: number;
    statut: 'en_attente' | 'en_cours' | 'termine';
  } | null;
}

interface VideoPresence {
  patientOnline: boolean;
  medecinOnline: boolean;
}

const unwrapApiData = <T,>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

const isNetworkUnavailableError = (error: unknown): boolean =>
  error instanceof Error &&
  /failed to fetch|networkerror|network request failed|load failed/i.test(error.message);

const isSamePresenceMap = (
  current: Record<number, VideoPresence>,
  next: Record<number, VideoPresence>
) => {
  const currentKeys = Object.keys(current);
  const nextKeys = Object.keys(next);
  if (currentKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of nextKeys) {
    const consultationId = Number(key);
    const currentValue = current[consultationId];
    const nextValue = next[consultationId];
    if (
      !currentValue ||
      currentValue.patientOnline !== nextValue.patientOnline ||
      currentValue.medecinOnline !== nextValue.medecinOnline
    ) {
      return false;
    }
  }

  return true;
};

export const PatientRendezVous: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [presenceByConsultation, setPresenceByConsultation] = useState<Record<number, VideoPresence>>({});

  const {
    data: rendezVous = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['patient-rendez-vous'],
    queryFn: async () => {
      const response = await apiService.get('/rendez-vous/mes-rdv');
      return (response?.data?.data || response?.data || []) as PatientRdvItem[];
    },
    retry: (failureCount, error) => {
      if (isNetworkUnavailableError(error)) {
        return false;
      }
      return failureCount < 2;
    },
    refetchInterval: (query) => (query.state.error ? false : 5000),
    refetchIntervalInBackground: true,
  });

  const cancelMutation = useMutation({
    mutationFn: async (rdvId: number) => apiService.delete(`/rendez-vous/${rdvId}`),
    onSuccess: () => {
      toast.success('Rendez-vous annulé');
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Impossible d’annuler ce rendez-vous');
    },
  });

  const filteredRdv = useMemo(() => {
    const sorted = [...rendezVous].sort(
      (a, b) => new Date(`${b.date}T${b.heure}`).getTime() - new Date(`${a.date}T${a.heure}`).getTime()
    );

    return sorted.filter((rdv) => {
      if (filter === 'upcoming') {
        return rdv.statut === 'confirme' || rdv.statut === 'en_attente' || rdv.statut === 'paye';
      }
      if (filter === 'past') {
        return rdv.statut === 'termine' || rdv.statut === 'annule';
      }
      return true;
    });
  }, [rendezVous, filter]);

  const activeOnlineConsultationIds = useMemo(
    () =>
      filteredRdv
        .filter((rdv) => rdv.type === 'en_ligne' && rdv.consultation?.id && rdv.consultation?.statut === 'en_cours')
        .map((rdv) => Number(rdv.consultation!.id)),
    [filteredRdv]
  );

  const activeOnlineConsultationIdsKey = useMemo(
    () => [...activeOnlineConsultationIds].sort((a, b) => a - b).join(','),
    [activeOnlineConsultationIds]
  );

  useEffect(() => {
    if (!activeOnlineConsultationIdsKey) {
      setPresenceByConsultation((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    let cancelled = false;
    const consultationIds = activeOnlineConsultationIdsKey
      .split(',')
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    const loadPresence = async () => {
      const entries = await Promise.all(
        consultationIds.map(async (consultationId) => {
          try {
            const response = await apiService.get(`/consultations/${consultationId}/video-session/presence`);
            const data = unwrapApiData<VideoPresence>(response);
            return [consultationId, data] as const;
          } catch {
            return [consultationId, { patientOnline: false, medecinOnline: false }] as const;
          }
        })
      );

      if (!cancelled) {
        const nextMap = Object.fromEntries(entries) as Record<number, VideoPresence>;
        setPresenceByConsultation((prev) => (isSamePresenceMap(prev, nextMap) ? prev : nextMap));
      }
    };

    void loadPresence();
    const interval = window.setInterval(loadPresence, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeOnlineConsultationIdsKey]);

  const getStatutBadge = (statut: RdvStatus) => {
    switch (statut) {
      case 'confirme':
        return <span className="badge-success">Confirmé</span>;
      case 'en_attente':
        return <span className="badge-warning">En attente</span>;
      case 'termine':
        return <span className="badge-info">Terminé</span>;
      case 'annule':
        return <span className="badge-danger">Annulé</span>;
      case 'paye':
        return <span className="badge-info">Payé</span>;
      default:
        return <span className="badge-warning">{statut}</span>;
    }
  };

  const getTypeBadge = (type: RdvType) => {
    if (type === 'en_ligne') {
      return (
        <span className="badge-info">
          <Video className="h-3 w-3" />
          En ligne
        </span>
      );
    }

    if (type === 'prestation') {
      return (
        <span className="badge-warning">
          <CreditCard className="h-3 w-3" />
          Prestation
        </span>
      );
    }

    return (
      <span className="badge-success">
        <MapPin className="h-3 w-3" />
        Présentiel
      </span>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Mes rendez-vous</h1>
          <p className="text-muted-foreground">
            Le statut se met à jour automatiquement après traitement par la secrétaire
          </p>
        </div>
        <Link to="/patient/demander-rdv">
          <Button className="btn-health-primary gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle demande
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'upcoming', 'past'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'upcoming' ? 'À venir' : 'Passés'}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredRdv.length === 0 ? (
          <div className="card-health text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Aucun rendez-vous trouvé</p>
          </div>
        ) : (
          filteredRdv.map((rdv) => {
            const medecinName =
              rdv.medecin?.prenom && rdv.medecin?.nom
                ? `Dr. ${rdv.medecin.prenom} ${rdv.medecin.nom}`
                : rdv.medecin?.user?.name || 'Médecin';

            return (
              <div key={rdv.id} className="card-health">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                      {medecinName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{medecinName}</h3>
                      <p className="text-sm text-primary">{rdv.medecin?.specialite || 'Consultation médicale'}</p>
                      <p className="text-sm text-muted-foreground mt-1">{rdv.motif || 'Aucun motif saisi'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(rdv.date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {rdv.heure}
                    </div>
                    {getTypeBadge(rdv.type)}
                    {getStatutBadge(rdv.statut)}
                    {rdv.urgent_ia && (
                      <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold">
                        Urgent IA
                      </span>
                    )}
                  </div>

                  {rdv.statut === 'paye' && (
                    <div className="flex gap-2">
                      {rdv.type === 'en_ligne' && rdv.consultation?.id && rdv.consultation?.statut === 'en_cours' && (
                        <div className="flex items-center gap-2">
                          <Link to={`/patient/video-call?consultationId=${rdv.consultation.id}`}>
                            <Button size="sm" className="gap-1">
                              <Video className="h-4 w-4" />
                              Rejoindre
                            </Button>
                          </Link>
                          <span
                            className={`text-xs ${
                              presenceByConsultation[rdv.consultation.id]?.medecinOnline ? 'text-green-700' : 'text-gray-500'
                            }`}
                          >
                            Médecin {presenceByConsultation[rdv.consultation.id]?.medecinOnline ? 'en ligne' : 'hors ligne'}
                          </span>
                        </div>
                      )}
                      {rdv.type === 'en_ligne' && (!rdv.consultation || rdv.consultation.statut !== 'en_cours') && (
                        <Link to="/patient/video-call">
                          <Button size="sm" variant="outline">
                            Salle d’attente
                          </Button>
                        </Link>
                      )}
                      {rdv.type === 'prestation' && (
                        <Link to="/patient/paiements">
                          <Button size="sm" variant="outline" className="gap-1">
                            <CreditCard className="h-4 w-4" />
                            Prestation
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}

                  {rdv.statut === 'confirme' && (
                    <Link to={`/patient/paiements/rendez-vous/${rdv.id}`}>
                      <Button size="sm" className="gap-1">
                        <CreditCard className="h-4 w-4" />
                        Payer maintenant
                      </Button>
                    </Link>
                  )}

                  {(rdv.statut === 'en_attente' || rdv.statut === 'confirme') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                      onClick={() => cancelMutation.mutate(rdv.id)}
                      disabled={cancelMutation.isPending}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
        <span>
          Les demandes restent <strong>en attente</strong> jusqu’à validation du secrétariat.
          Dès acceptation, le statut passe automatiquement à <strong>confirmé</strong> sans recharger la page.
        </span>
      </div>
    </div>
  );
};
