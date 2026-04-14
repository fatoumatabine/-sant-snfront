import React, { useMemo, useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

type StatutRendezVous = 'en_attente' | 'confirme' | 'annule' | 'termine' | 'paye';
type TypeRendezVous = 'en_ligne' | 'presentiel' | 'prestation';

interface DisponibiliteValidation {
  available: boolean;
  reason: string | null;
  creneauReference?: string | null;
}

interface RendezVousItem {
  id: number;
  numero: string;
  date: string;
  heure: string;
  type: TypeRendezVous;
  statut: StatutRendezVous;
  motif?: string | null;
  urgent_ia?: boolean;
  canValidate?: boolean | null;
  validationReason?: string | null;
  disponibiliteValidation?: DisponibiliteValidation | null;
  patient?: { id: number; prenom: string; nom: string };
  medecin?: { id: number; prenom: string; nom: string; specialite?: string };
}

const unwrapAppointments = (payload: unknown): RendezVousItem[] => {
  if (Array.isArray(payload)) return payload as RendezVousItem[];

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as RendezVousItem[];
    if (data && typeof data === 'object' && 'data' in data) {
      const nested = (data as { data?: unknown }).data;
      if (Array.isArray(nested)) return nested as RendezVousItem[];
    }
  }

  return [];
};

const isUrgent = (rdv: RendezVousItem) =>
  Boolean(rdv.urgent_ia) || String(rdv.motif || '').toUpperCase().includes('[URGENT-IA]');

export const SecretaireRendezVousEnCours: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<'' | StatutRendezVous>('');
  const [filterType, setFilterType] = useState<'' | TypeRendezVous>('');
  const [filterUrgence, setFilterUrgence] = useState<'' | 'urgent' | 'normal'>('');
  const [filterDate, setFilterDate] = useState('');

  const { data: rendezVous = [], isLoading } = useQuery<RendezVousItem[]>({
    queryKey: ['secretaire-rendez-vous-all'],
    queryFn: async () => unwrapAppointments(await apiService.get('/secretaire/dashboard/appointments/all')),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const filtered = useMemo(() => {
    const rows = rendezVous.filter((rdv) => {
      if (filterStatut && rdv.statut !== filterStatut) return false;
      if (filterType && rdv.type !== filterType) return false;
      if (filterUrgence === 'urgent' && !isUrgent(rdv)) return false;
      if (filterUrgence === 'normal' && isUrgent(rdv)) return false;
      if (filterDate && !String(rdv.date || '').startsWith(filterDate)) return false;

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const patientName = `${rdv.patient?.prenom || ''} ${rdv.patient?.nom || ''}`.toLowerCase();
        const doctorName = `${rdv.medecin?.prenom || ''} ${rdv.medecin?.nom || ''}`.toLowerCase();
        const numero = String(rdv.numero || '').toLowerCase();
        if (!patientName.includes(query) && !doctorName.includes(query) && !numero.includes(query)) {
          return false;
        }
      }

      return true;
    });

    return rows.sort((a, b) => {
      const firstDate = new Date(`${a.date}T${a.heure || '00:00'}`).getTime();
      const secondDate = new Date(`${b.date}T${b.heure || '00:00'}`).getTime();
      return secondDate - firstDate;
    });
  }, [filterDate, filterStatut, filterType, filterUrgence, rendezVous, searchTerm]);

  const {
    currentPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedData,
    setCurrentPage,
  } = useTablePagination(filtered);

  const stats = useMemo(
    () => ({
      total: rendezVous.length,
      pending: rendezVous.filter((rdv) => rdv.statut === 'en_attente').length,
      planned: rendezVous.filter((rdv) => rdv.statut === 'confirme' || rdv.statut === 'paye').length,
      closed: rendezVous.filter((rdv) => rdv.statut === 'termine' || rdv.statut === 'annule').length,
    }),
    [rendezVous],
  );

  const getTypeLabel = (type: TypeRendezVous) => {
    if (type === 'en_ligne') return 'En ligne';
    if (type === 'presentiel') return 'Présentiel';
    return 'Prestation';
  };

  const getStatutColor = (statut: StatutRendezVous) => {
    if (statut === 'en_attente') return 'bg-yellow-100 text-yellow-800';
    if (statut === 'confirme') return 'bg-blue-100 text-blue-800';
    if (statut === 'paye') return 'bg-emerald-100 text-emerald-800';
    if (statut === 'termine') return 'bg-green-100 text-green-800';
    if (statut === 'annule') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatutLabel = (statut: StatutRendezVous) => {
    if (statut === 'en_attente') return 'En attente';
    if (statut === 'confirme') return 'Confirmé';
    if (statut === 'paye') return 'Payé';
    if (statut === 'termine') return 'Terminé';
    return 'Annulé';
  };

  const renderDisponibilite = (rdv: RendezVousItem) => {
    if (rdv.statut !== 'en_attente') {
      return <span className="text-muted-foreground">Créneau traité</span>;
    }

    if (rdv.canValidate === true || rdv.disponibiliteValidation?.available) {
      return (
        <div className="space-y-1">
          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            Disponible
          </span>
          {rdv.disponibiliteValidation?.creneauReference ? (
            <p className="text-[11px] text-green-700">
              Créneau: {rdv.disponibiliteValidation.creneauReference}
            </p>
          ) : null}
        </div>
      );
    }

    if (rdv.canValidate === false || rdv.disponibiliteValidation?.available === false) {
      return (
        <div className="space-y-1">
          <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
            Indisponible
          </span>
          <p className="text-[11px] text-red-700">
            {rdv.validationReason || rdv.disponibiliteValidation?.reason || 'Créneau à reprogrammer'}
          </p>
        </div>
      );
    }

    return <span className="text-muted-foreground">À vérifier</span>;
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
      <div>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Tous les rendez-vous
        </h1>
        <p className="text-muted-foreground">
          Voir l’ensemble des rendez-vous, leur statut et la disponibilité du médecin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-health">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="card-health">
          <p className="text-sm text-muted-foreground">En attente</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="card-health">
          <p className="text-sm text-muted-foreground">Confirmés / payés</p>
          <p className="text-2xl font-bold text-blue-600">{stats.planned}</p>
        </div>
        <div className="card-health">
          <p className="text-sm text-muted-foreground">Clôturés</p>
          <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
        </div>
      </div>

      <div className="card-health">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h2 className="font-semibold">Filtres</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Numéro, patient ou médecin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-input rounded-lg bg-background text-sm"
          />

          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value as '' | StatutRendezVous)}
            className="px-3 py-2 border border-input rounded-lg bg-background text-sm"
          >
            <option value="">Tous statuts</option>
            <option value="en_attente">En attente</option>
            <option value="confirme">Confirmé</option>
            <option value="paye">Payé</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as '' | TypeRendezVous)}
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

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-input rounded-lg bg-background text-sm"
          />

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

      <div className="card-health overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-semibold">Numéro</th>
              <th className="text-left px-4 py-3 font-semibold">Date</th>
              <th className="text-left px-4 py-3 font-semibold">Horaire</th>
              <th className="text-left px-4 py-3 font-semibold">Patient</th>
              <th className="text-left px-4 py-3 font-semibold">Médecin</th>
              <th className="text-left px-4 py-3 font-semibold">Type</th>
              <th className="text-left px-4 py-3 font-semibold">Disponibilité</th>
              <th className="text-left px-4 py-3 font-semibold">Statut</th>
              <th className="text-left px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-muted-foreground">
                  Aucun rendez-vous trouvé
                </td>
              </tr>
            ) : (
              paginatedData.map((rdv) => (
                <tr key={rdv.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium font-mono">{rdv.numero}</td>
                  <td className="px-4 py-3">{new Date(rdv.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">{rdv.heure}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{rdv.patient ? `${rdv.patient.prenom} ${rdv.patient.nom}` : 'N/A'}</span>
                      {isUrgent(rdv) ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Urgent IA
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {rdv.medecin ? `Dr. ${rdv.medecin.prenom} ${rdv.medecin.nom}` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-block px-2 py-1 bg-muted rounded">{getTypeLabel(rdv.type)}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">{renderDisponibilite(rdv)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded font-medium text-xs ${getStatutColor(rdv.statut)}`}
                    >
                      {getStatutLabel(rdv.statut)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {rdv.statut === 'en_attente' ? (
                      <Button size="sm" variant="outline" onClick={() => navigate('/secretaire/demandes-rdv')}>
                        Traiter
                      </Button>
                    ) : rdv.statut === 'paye' ? (
                      <Button size="sm" variant="outline" onClick={() => navigate('/secretaire/paiements')}>
                        Paiement
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => navigate('/secretaire/agenda')}>
                        Agenda
                      </Button>
                    )}
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

      <div className="card-health bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Note :</strong> les validations se font depuis `Demandes RDV`, les vérifications de paiement
          depuis `Paiements`, et cette page sert de vue globale de tous les rendez-vous.
        </p>
      </div>
    </div>
  );
};
