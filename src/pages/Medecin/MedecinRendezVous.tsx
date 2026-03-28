import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Search, Filter, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface RDV {
  id: string | number;
  numero?: string;
  patient?: { prenom?: string; nom?: string };
  date?: string;
  heure?: string;
  type?: 'en_ligne' | 'presentiel' | 'prestation' | string;
  statut?: 'en_attente' | 'confirme' | 'termine' | 'annule' | string;
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

export const MedecinRendezVous: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'tous' | 'en_attente' | 'confirme' | 'termine' | 'annule'>('tous');
  const [typeFilter, setTypeFilter] = useState<'tous' | 'en_ligne' | 'presentiel' | 'prestation'>('tous');
  const [dateFilter, setDateFilter] = useState('');
  const [presenceByConsultation, setPresenceByConsultation] = useState<Record<number, VideoPresence>>({});

  const { data: rdvs = [], isLoading } = useQuery({
    queryKey: ['medecin-rdv'],
    queryFn: async () => {
      try {
        const response = await apiService.get(API_ENDPOINTS.rendezVous.medecin.list);
        return response?.data?.data || response?.data || [];
      } catch (error) {
        console.error('Erreur chargement RDV:', error);
        return [];
      }
    }
  });

  const filtered = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return rdvs.filter((rdv: RDV) => {
      const patientName = `${rdv.patient?.prenom || ''} ${rdv.patient?.nom || ''}`.trim().toLowerCase();
      const numero = (rdv.numero || '').toLowerCase();
      const matchSearch =
        normalizedSearch === '' ||
        patientName.includes(normalizedSearch) ||
        numero.includes(normalizedSearch);
      const matchStatus = statusFilter === 'tous' || rdv.statut === statusFilter;
      const matchType = typeFilter === 'tous' || rdv.type === typeFilter;
      const matchDate = dateFilter === '' || (rdv.date || '').startsWith(dateFilter);
      return matchSearch && matchStatus && matchType && matchDate;
    });
  }, [rdvs, searchTerm, statusFilter, typeFilter, dateFilter]);

  const activeOnlineConsultationIds = useMemo(
    () =>
      filtered
        .filter((rdv: RDV) => rdv.type === 'en_ligne' && rdv.consultation?.id && rdv.consultation?.statut === 'en_cours')
        .map((rdv: RDV) => Number(rdv.consultation!.id)),
    [filtered]
  );

  useEffect(() => {
    if (activeOnlineConsultationIds.length === 0) {
      setPresenceByConsultation({});
      return;
    }

    let cancelled = false;
    const loadPresence = async () => {
      const entries = await Promise.all(
        activeOnlineConsultationIds.map(async (consultationId) => {
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
        setPresenceByConsultation(Object.fromEntries(entries));
      }
    };

    void loadPresence();
    const interval = window.setInterval(loadPresence, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeOnlineConsultationIds]);

  const getPatientName = (rdv: RDV) => {
    const prenom = rdv.patient?.prenom || '';
    const nom = rdv.patient?.nom || '';
    return `${prenom} ${nom}`.trim() || 'Patient';
  };

  const getStatutLabel = (statut?: string) => {
    if (statut === 'en_attente') return 'En attente';
    if (statut === 'confirme') return 'Confirmé';
    if (statut === 'paye') return 'Payé';
    if (statut === 'termine') return 'Terminé';
    if (statut === 'annule') return 'Annulé';
    return 'Inconnu';
  };

  const getTypeLabel = (type?: string) => {
    if (type === 'en_ligne') return 'En ligne';
    if (type === 'presentiel') return 'Présentiel';
    if (type === 'prestation') return 'Prestation';
    return '-';
  };

  const handleStartConsultation = async (rdvId: string | number) => {
    try {
      const response: any = await apiService.post(`/consultations/rendez-vous/${rdvId}/start`, {});
      const consultation = response?.data || response;
      toast.success('Consultation démarrée');
      if (consultation?.id) {
        navigate(`/medecin/video-call?consultationId=${consultation.id}`);
        return;
      }
      navigate('/medecin/consultations');
    } catch (error: any) {
      toast.error(error?.message || 'Impossible de démarrer la consultation');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-8">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Mes rendez-vous
          </h1>
          <p className="text-muted-foreground">Suivre et organiser vos rendez-vous patients</p>
        </div>
      </div>

      <div className="card-health border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filtres de planning
          </h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('tous');
              setTypeFilter('tous');
              setDateFilter('');
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Patient ou numéro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input rounded-xl bg-background text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'tous' | 'en_attente' | 'confirme' | 'termine' | 'annule')}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          >
            <option value="tous">Tous statuts</option>
            <option value="en_attente">En attente</option>
            <option value="confirme">Confirmé</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'tous' | 'en_ligne' | 'presentiel' | 'prestation')}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          >
            <option value="tous">Tous types</option>
            <option value="en_ligne">En ligne</option>
            <option value="presentiel">Présentiel</option>
            <option value="prestation">Prestation</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-health">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-semibold">{rdvs.length}</p>
        </div>
        <div className="card-health">
          <p className="text-xs text-muted-foreground">En attente</p>
          <p className="text-xl font-semibold text-yellow-600">{rdvs.filter((r: RDV) => r.statut === 'en_attente').length}</p>
        </div>
        <div className="card-health">
          <p className="text-xs text-muted-foreground">Confirmés</p>
          <p className="text-xl font-semibold text-blue-600">{rdvs.filter((r: RDV) => r.statut === 'confirme').length}</p>
        </div>
        <div className="card-health">
          <p className="text-xs text-muted-foreground">Terminés</p>
          <p className="text-xl font-semibold text-green-600">{rdvs.filter((r: RDV) => r.statut === 'termine').length}</p>
        </div>
      </div>

      <div className="card-health">
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Aucun rendez-vous</p>
          ) : (
            filtered.map((rdv: RDV) => (
              <div key={String(rdv.id)} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">{getPatientName(rdv)}</p>
                  <p className="text-sm text-muted-foreground">
                    {rdv.date ? new Date(rdv.date).toLocaleDateString('fr-FR') : ''} à {rdv.heure || '-'} • {getTypeLabel(rdv.type)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {rdv.statut === 'paye' && (
                    <Button size="sm" onClick={() => handleStartConsultation(rdv.id)}>
                      Prendre en consultation
                    </Button>
                  )}
                  {rdv.type === 'en_ligne' && rdv.consultation?.id && rdv.consultation.statut === 'en_cours' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/medecin/video-call?consultationId=${rdv.consultation?.id}`)}
                      >
                        Rejoindre l'appel
                      </Button>
                      <span
                        className={`text-xs ${
                          presenceByConsultation[rdv.consultation.id]?.patientOnline ? 'text-green-700' : 'text-gray-500'
                        }`}
                      >
                        Patient {presenceByConsultation[rdv.consultation.id]?.patientOnline ? 'en ligne' : 'hors ligne'}
                      </span>
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    rdv.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                    rdv.statut === 'confirme' ? 'bg-blue-100 text-blue-800' :
                    rdv.statut === 'paye' ? 'bg-emerald-100 text-emerald-800' :
                    rdv.statut === 'termine' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getStatutLabel(rdv.statut)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
