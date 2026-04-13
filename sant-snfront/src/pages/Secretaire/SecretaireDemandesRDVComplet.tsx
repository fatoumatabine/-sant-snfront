import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { DemandeDetailModal } from '@/components/Secretaire/DemandeDetailModal';
import { toast } from 'sonner';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

interface Demande {
  id: number;
  numero: string;
  date: string;
  heure: string;
  motif?: string;
  urgent_ia?: boolean;
  type: 'en_ligne' | 'presentiel' | 'prestation';
  statut: 'en_attente' | 'confirme' | 'annule' | 'termine' | 'paye';
  patient?: {
    id: number;
    prenom: string;
    nom: string;
    diabete?: boolean;
    hypertension?: boolean;
    hepatite?: boolean;
    autres_pathologies?: string;
    user?: {
      email: string;
    };
  };
  medecin?: { id: number; prenom: string; nom: string; specialite: string };
  consultation?: {
    id: number;
    statut: 'en_attente' | 'en_cours' | 'termine';
  } | null;
  created_at?: string;
  createdAt?: string;
  canValidate?: boolean | null;
  validationReason?: string | null;
  disponibiliteValidation?: DisponibiliteValidation | null;
}

interface VideoPresence {
  patientOnline: boolean;
  medecinOnline: boolean;
}

interface DisponibiliteValidation {
  available: boolean;
  reason: string | null;
  creneaux: string[];
  creneauxDisponibles?: string[];
  heureDemandeeDisponible: boolean;
  conflictCount: number;
  creneauReference?: string | null;
}

const unwrapApiData = <T,>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

export const SecretaireDemandesRDVComplet: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<'' | 'en_attente' | 'confirme' | 'annule' | 'termine' | 'paye'>('');
  const [filterType, setFilterType] = useState<'' | 'en_ligne' | 'presentiel' | 'prestation'>('');
  const [filterUrgence, setFilterUrgence] = useState<'' | 'urgent' | 'normal'>('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [disponibiliteValidation, setDisponibiliteValidation] = useState<DisponibiliteValidation | null>(null);
  const [isCheckingDisponibilite, setIsCheckingDisponibilite] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const { data: demandes = [], isLoading, refetch } = useQuery<Demande[]>({
    queryKey: ['secretaire-demandes-complet'],
    queryFn: async () => {
      const response = await apiService.get('/secretaire/dashboard/demandes');
      if (Array.isArray(response?.data)) return response.data as Demande[];
      return (response?.data?.data || []) as Demande[];
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const isUrgent = (demande: Pick<Demande, 'urgent_ia' | 'motif'>) =>
    Boolean(demande.urgent_ia) || String(demande.motif || '').toUpperCase().includes('[URGENT-IA]');

  const getValidationHint = (demande: Demande) => {
    if (demande.statut !== 'en_attente') return null;
    if (demande.canValidate === true) {
      return (
        <span className="mt-2 inline-flex rounded-full bg-green-100 px-2 py-1 text-[11px] font-medium text-green-800">
          Créneau validable
        </span>
      );
    }

    if (demande.canValidate === false) {
      return (
        <div className="mt-2">
          <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-[11px] font-medium text-red-800">
            Validation bloquée
          </span>
          {demande.validationReason ? (
            <p className="mt-1 text-[11px] text-red-700">{demande.validationReason}</p>
          ) : null}
        </div>
      );
    }

    return null;
  };

  // Appliquer les filtres
  const filtered = useMemo(() => {
    const rows = demandes.filter(d => {
      // Filtre statut
      if (filterStatut && d.statut !== filterStatut) return false;

      // Filtre type
      if (filterType && d.type !== filterType) return false;

      // Filtre urgence
      if (filterUrgence === 'urgent' && !isUrgent(d)) return false;
      if (filterUrgence === 'normal' && isUrgent(d)) return false;

      // Filtre date
      if (filterDate && !d.date.startsWith(filterDate)) return false;

      // Recherche (numéro ou patient)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const patientName = d.patient ? `${d.patient.prenom} ${d.patient.nom}`.toLowerCase() : '';
        const numero = d.numero.toLowerCase();
        if (!patientName.includes(searchLower) && !numero.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
    return rows.sort((a, b) => {
      const urgencyDiff = Number(isUrgent(b)) - Number(isUrgent(a));
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(b.createdAt || b.created_at || b.date).getTime() - new Date(a.createdAt || a.created_at || a.date).getTime();
    });
  }, [demandes, filterStatut, filterType, filterUrgence, filterDate, searchTerm]);

  const {
    currentPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedData,
    setCurrentPage,
  } = useTablePagination(filtered);
  const [presenceByConsultation, setPresenceByConsultation] = useState<Record<number, VideoPresence>>({});

  const activeOnlineConsultationIds = useMemo(() => {
    const ids = paginatedData
      .filter((demande) => demande.type === 'en_ligne' && demande.consultation?.id && demande.consultation?.statut === 'en_cours')
      .map((demande) => Number(demande.consultation!.id))
      .filter((id) => Number.isFinite(id));

    ids.sort((a, b) => a - b);
    return ids;
  }, [paginatedData]);

  const activeOnlineConsultationIdsKey = useMemo(() => activeOnlineConsultationIds.join(','), [activeOnlineConsultationIds]);

  useEffect(() => {
    if (!activeOnlineConsultationIdsKey) {
      setPresenceByConsultation((current) => (Object.keys(current).length === 0 ? current : {}));
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
        setPresenceByConsultation(Object.fromEntries(entries));
      }
    };

    void loadPresence();
    const interval = window.setInterval(loadPresence, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeOnlineConsultationIdsKey]);

  const openDetailModal = (demande: Demande) => {
    setSelectedDemande(demande);
    setDisponibiliteValidation(demande.disponibiliteValidation || null);
    setIsSubmittingAction(false);
    setShowModal(true);
  };

  useEffect(() => {
    if (!showModal || !selectedDemande) return;

    const freshDemande = demandes.find((demande) => demande.id === selectedDemande.id);
    if (!freshDemande) {
      setShowModal(false);
      setSelectedDemande(null);
      setDisponibiliteValidation(null);
      setIsSubmittingAction(false);
      return;
    }

    setSelectedDemande(freshDemande);
    setDisponibiliteValidation(freshDemande.disponibiliteValidation || null);
  }, [demandes, selectedDemande, showModal]);

  useEffect(() => {
    if (!showModal || !selectedDemande || selectedDemande.statut !== 'en_attente') return;
    if (selectedDemande.disponibiliteValidation) {
      setDisponibiliteValidation(selectedDemande.disponibiliteValidation);
      setIsCheckingDisponibilite(false);
      return;
    }

    let cancelled = false;
    const loadDisponibilite = async () => {
      setIsCheckingDisponibilite(true);
      try {
        const response = await apiService.get(`/secretaire/demandes/${selectedDemande.id}/disponibilite`);
        const data = unwrapApiData<DisponibiliteValidation>(response);
        if (!cancelled) {
          setDisponibiliteValidation(data);
        }
      } catch {
        if (!cancelled) {
          setDisponibiliteValidation(null);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingDisponibilite(false);
        }
      }
    };

    void loadDisponibilite();
    return () => {
      cancelled = true;
    };
  }, [showModal, selectedDemande]);

  const handleApprove = async () => {
    if (!selectedDemande || isSubmittingAction) return;
    setIsSubmittingAction(true);
    try {
      let dispoData = disponibiliteValidation || selectedDemande.disponibiliteValidation || null;
      if (!dispoData) {
        const dispoResponse = await apiService.get(`/secretaire/demandes/${selectedDemande.id}/disponibilite`);
        dispoData = unwrapApiData<DisponibiliteValidation>(dispoResponse);
        setDisponibiliteValidation(dispoData);
      }
      if (dispoData && dispoData.available === false) {
        const reason = dispoData.reason || 'Médecin indisponible sur ce créneau';
        toast.error(`Validation impossible: ${reason}`);
        return;
      }

      await apiService.post(`/secretaire/demandes/${selectedDemande.id}/approuver`);
      toast.success('Demande approuvée avec succès.');
      await refetch();
      void queryClient.invalidateQueries({ queryKey: ['secretaire-rendez-vous-all'] });
      setShowModal(false);
      setSelectedDemande(null);
      setDisponibiliteValidation(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible d’approuver cette demande';
      if (message.toLowerCase().includes('déjà au statut confirme')) {
        toast.info('Cette demande a déjà été confirmée. La liste a été actualisée.');
        await refetch();
        setShowModal(false);
        setSelectedDemande(null);
        setDisponibiliteValidation(null);
      } else {
        toast.error(message);
      }
      console.error(error);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReject = async (raison: string) => {
    if (!selectedDemande || isSubmittingAction) return;
    setIsSubmittingAction(true);
    try {
      await apiService.post(`/secretaire/demandes/${selectedDemande.id}/refuser`, { raison });
      toast.success('Demande refusée.');
      await refetch();
      void queryClient.invalidateQueries({ queryKey: ['secretaire-rendez-vous-all'] });
      setShowModal(false);
      setSelectedDemande(null);
      setDisponibiliteValidation(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de refuser cette demande';
      toast.error(message);
      console.error(error);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'en_ligne':
        return 'Consultation en ligne';
      case 'presentiel':
        return 'Présentiel';
      case 'prestation':
        return 'Prestation';
      default:
        return type;
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirme':
        return 'bg-green-100 text-green-800';
      case 'termine':
        return 'bg-blue-100 text-blue-800';
      case 'paye':
        return 'bg-emerald-100 text-emerald-800';
      case 'annule':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return 'En attente';
      case 'confirme':
        return 'Confirmé';
      case 'termine':
        return 'Terminé';
      case 'paye':
        return 'Payé';
      case 'annule':
        return 'Annulé';
      default:
        return statut;
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Demandes de rendez-vous
        </h1>
        <p className="text-muted-foreground">Gérer et traiter les demandes des patients</p>
      </div>

      {/* Filtres */}
      <div className="card-health">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h2 className="font-semibold">Filtres</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Recherche */}
          <input
            type="text"
            placeholder="Numéro ou patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-input rounded-lg bg-background text-sm"
          />

          {/* Statut */}
          <select
            value={filterStatut}
            onChange={(e) =>
              setFilterStatut(e.target.value as '' | 'en_attente' | 'confirme' | 'annule' | 'termine' | 'paye')
            }
            className="px-3 py-2 border border-input rounded-lg bg-background text-sm"
          >
            <option value="">Tous statuts</option>
            <option value="en_attente">En attente</option>
            <option value="confirme">Confirmé</option>
            <option value="paye">Payé</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>

          {/* Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as '' | 'en_ligne' | 'presentiel' | 'prestation')}
            className="px-3 py-2 border border-input rounded-lg bg-background text-sm"
          >
            <option value="">Tous types</option>
            <option value="en_ligne">En ligne</option>
            <option value="presentiel">Présentiel</option>
            <option value="prestation">Prestation</option>
          </select>

          <select
            value={filterUrgence}
            onChange={(e) => setFilterUrgence(e.target.value as '' | 'urgent' | 'normal')}
            className="px-3 py-2 border border-input rounded-lg bg-background text-sm"
          >
            <option value="">Toutes urgences</option>
            <option value="urgent">Urgent IA</option>
            <option value="normal">Normal</option>
          </select>

          {/* Date */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-input rounded-lg bg-background text-sm"
          />

          {/* Bouton réinitialiser */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setFilterStatut('');
              setFilterType('');
              setFilterUrgence('');
              setFilterDate('');
            }}
            className="w-full"
          >
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Tableau */}
      <div className="card-health overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-semibold">Numéro</th>
              <th className="text-left px-4 py-3 font-semibold">Date</th>
              <th className="text-left px-4 py-3 font-semibold">Horaire</th>
              <th className="text-left px-4 py-3 font-semibold">Patient</th>
              <th className="text-left px-4 py-3 font-semibold">Type</th>
              <th className="text-left px-4 py-3 font-semibold">Disponibilité</th>
              <th className="text-left px-4 py-3 font-semibold">Statut</th>
              <th className="text-left px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucune demande trouvée
                </td>
              </tr>
            ) : (
              paginatedData.map((demande) => (
                <tr key={demande.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{demande.numero}</td>
                  <td className="px-4 py-3">{new Date(demande.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">{demande.heure}</td>
                  <td className="px-4 py-3">
                    {demande.patient
                      ? (
                        <div className="flex items-center gap-2">
                          <span>{demande.patient.prenom} {demande.patient.nom}</span>
                          {isUrgent(demande) && (
                            <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold">
                              Urgent IA
                            </span>
                          )}
                        </div>
                      )
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-xs">{getTypeLabel(demande.type)}</td>
                  <td className="px-4 py-3 text-xs">
                    {demande.statut === 'en_attente' ? (
                      demande.canValidate === true ? (
                        <div className="space-y-1">
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            Médecin disponible
                          </span>
                          {demande.disponibiliteValidation?.creneauReference ? (
                            <p className="text-[11px] text-green-700">
                              Créneau: {demande.disponibiliteValidation.creneauReference}
                            </p>
                          ) : null}
                        </div>
                      ) : demande.canValidate === false ? (
                        <div className="space-y-1">
                          <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                            Indisponible
                          </span>
                          <p className="text-[11px] text-red-700">
                            {demande.validationReason || 'Créneau à revoir'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Vérification en cours...</span>
                      )
                    ) : demande.type === 'en_ligne' && demande.consultation?.id && demande.consultation.statut === 'en_cours' ? (
                      <div className="flex flex-col">
                        <span className={presenceByConsultation[demande.consultation.id]?.medecinOnline ? 'text-green-700' : 'text-gray-500'}>
                          Médecin {presenceByConsultation[demande.consultation.id]?.medecinOnline ? 'en ligne' : 'hors ligne'}
                        </span>
                        <span className={presenceByConsultation[demande.consultation.id]?.patientOnline ? 'text-green-700' : 'text-gray-500'}>
                          Patient {presenceByConsultation[demande.consultation.id]?.patientOnline ? 'en ligne' : 'hors ligne'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatutColor(demande.statut)}`}>
                      {getStatutLabel(demande.statut)}
                    </span>
                    {getValidationHint(demande)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDetailModal(demande)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Détails
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        startItem={startItem}
        endItem={endItem}
        onPageChange={setCurrentPage}
      />

      {/* Modal Détails */}
      {showModal && selectedDemande && (
        <DemandeDetailModal
          demande={selectedDemande}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => {
            setShowModal(false);
            setSelectedDemande(null);
            setDisponibiliteValidation(null);
            setIsSubmittingAction(false);
          }}
          disponibilite={disponibiliteValidation}
          isCheckingDisponibilite={isCheckingDisponibilite}
          isSubmittingAction={isSubmittingAction}
        />
      )}
    </div>
  );
};
