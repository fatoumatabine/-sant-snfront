import React, { useMemo, useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye, Phone, Calendar, Search, Filter, RotateCcw } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Demande {
  id: string;
  patient_id: string;
  medecin_id: string;
  date: string;
  heure: string;
  type: 'video' | 'presentiel';
  statut: 'en_attente' | 'confirme' | 'annule';
  created_at: string;
  patient?: {
    prenom: string;
    nom: string;
    telephone: string;
  };
  medecin?: {
    prenom: string;
    nom: string;
    specialite: string;
  };
  canValidate?: boolean | null;
  validationReason?: string | null;
}

export const SecretaireDemandesRDV: React.FC = () => {
  const [filter, setFilter] = useState<'en_attente' | 'tous'>('en_attente');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'tous' | 'video' | 'presentiel'>('tous');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: demandes = [], isLoading, refetch } = useQuery({
    queryKey: ['secretaire-demandes', filter],
    queryFn: async () => {
      try {
        const response = await apiService.get('/secretaire/dashboard/appointments/all');
        let data = response.data?.data || [];
        
        if (filter === 'en_attente') {
          data = data.filter((d: Demande) => d.statut === 'en_attente');
        }
        
        return data;
      } catch {
        toast.error('Erreur lors du chargement');
        return [];
      }
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiService.post(`/secretaire/demandes/${id}/approuver`, {});
    },
    onSuccess: () => {
      toast.success('Demande confirmée');
      setShowModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la confirmation');
    }
  });

  const confirmWithAvailability = async (demande: Demande) => {
    try {
      const response = await apiService.get(`/secretaire/demandes/${demande.id}/disponibilite`);
      const dispo = response?.data?.data || response?.data || response;
      if (dispo && dispo.available === false) {
        const reason = dispo.reason || 'Médecin indisponible sur ce créneau';
        toast.error(`Validation impossible: ${reason}`);
        return;
      }
      approveMutation.mutate(String(demande.id));
    } catch (error: any) {
      toast.error(error.message || 'Impossible de vérifier la disponibilité du médecin');
    }
  };

  const rejectMutation = useMutation({
    mutationFn: async ({ id, raison }: { id: string; raison: string }) => {
      return apiService.post(`/secretaire/demandes/${id}/refuser`, { raison });
    },
    onSuccess: () => {
      toast.success('Demande refusée');
      setShowModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors du refus');
    }
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return <span className="badge-warning flex items-center gap-1"><Clock className="h-3 w-3" />En attente</span>;
      case 'confirme':
        return <span className="badge-success flex items-center gap-1"><CheckCircle className="h-3 w-3" />Confirmé</span>;
      case 'annule':
        return <span className="badge-destructive flex items-center gap-1"><XCircle className="h-3 w-3" />Annulé</span>;
      default:
        return <span className="badge-default">{statut}</span>;
    }
  };

  const getValidationBadge = (demande: Demande) => {
    if (demande.statut !== 'en_attente') return null;
    if (demande.canValidate === true) {
      return <span className="badge-success">Créneau libre</span>;
    }
    if (demande.canValidate === false) {
      return (
        <div className="space-y-1">
          <span className="badge-destructive">Créneau indisponible</span>
          {demande.validationReason ? (
            <p className="text-xs text-red-600">{demande.validationReason}</p>
          ) : null}
        </div>
      );
    }
    return null;
  };

  const filteredDemandes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return demandes.filter((demande: Demande) => {
      const patientName = `${demande.patient?.prenom || ''} ${demande.patient?.nom || ''}`.trim().toLowerCase();
      const matchSearch = normalizedSearch === '' || patientName.includes(normalizedSearch);
      const matchType = typeFilter === 'tous' || demande.type === typeFilter;
      const matchDate = dateFilter === '' || demande.date.startsWith(dateFilter);
      return matchSearch && matchType && matchDate;
    });
  }, [demandes, searchTerm, typeFilter, dateFilter]);

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">Demandes de Rendez-vous</h1>
        <p className="text-muted-foreground">Approuver ou refuser les demandes des patients</p>
      </div>

      {/* Filters */}
      <div className="card-health border border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filtres des demandes
          </h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setFilter('en_attente');
              setSearchTerm('');
              setTypeFilter('tous');
              setDateFilter('');
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input rounded-xl bg-background text-sm"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'en_attente' | 'tous')}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          >
            <option value="en_attente">En attente</option>
            <option value="tous">Toutes</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'tous' | 'video' | 'presentiel')}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          >
            <option value="tous">Tous les types</option>
            <option value="video">En ligne</option>
            <option value="presentiel">Présentiel</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredDemandes.length === 0 ? (
          <div className="card-health text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">Aucune demande en attente</p>
          </div>
        ) : (
          filteredDemandes.map((demande: Demande) => (
            <div key={demande.id} className="card-health p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-semibold">
                        {demande.patient?.prenom?.[0]}{demande.patient?.nom?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">
                        {demande.patient?.prenom} {demande.patient?.nom}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Dr. {demande.medecin?.prenom} {demande.medecin?.nom} ({demande.medecin?.specialite})
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mt-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(demande.date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {demande.heure}
                    </div>
                    <div className="flex items-center gap-2">
                      {demande.type === 'video' ? (
                        <Phone className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-green-500" />
                      )}
                      {demande.type === 'video' ? 'En ligne' : 'Présentiel'}
                    </div>
                  </div>

                  <div className="mt-3">
                    {getStatutBadge(demande.statut)}
                    <div className="mt-2">{getValidationBadge(demande)}</div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {demande.statut === 'en_attente' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDemande(demande);
                          setShowModal(true);
                        }}
                        variant="default"
                        className="gap-1"
                        disabled={demande.canValidate === false}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Confirmer
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const raison = window.prompt('Motif du refus (obligatoire):', '');
                          if (!raison || !raison.trim()) return;
                          rejectMutation.mutate({ id: demande.id, raison: raison.trim() });
                        }}
                        variant="destructive"
                        className="gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Refuser
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {demande.patient?.telephone && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Téléphone: <span className="font-medium text-foreground">{demande.patient.telephone}</span>
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Confirmation */}
      {showModal && selectedDemande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Confirmer cette demande?</h2>
            <div className="space-y-3 mb-6 text-sm">
              <p>
                <span className="text-muted-foreground">Patient:</span>
                <br />
                <span className="font-medium">{selectedDemande.patient?.prenom} {selectedDemande.patient?.nom}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Médecin:</span>
                <br />
                <span className="font-medium">Dr. {selectedDemande.medecin?.prenom} {selectedDemande.medecin?.nom}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Date & Heure:</span>
                <br />
                <span className="font-medium">{new Date(selectedDemande.date).toLocaleDateString('fr-FR')} à {selectedDemande.heure}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={() => confirmWithAvailability(selectedDemande)}
                disabled={approveMutation.isPending}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
