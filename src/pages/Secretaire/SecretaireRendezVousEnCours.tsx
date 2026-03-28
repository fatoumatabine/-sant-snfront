import React, { useState, useMemo } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

interface RendezVous {
  id: number;
  numero: string;
  date: string;
  heure: string;
  type: 'en_ligne' | 'presentiel' | 'prestation';
  statut: 'en_attente' | 'confirme' | 'annule' | 'termine';
  patient?: { id: number; prenom: string; nom: string };
  medecin?: { id: number; prenom: string; nom: string; specialite: string };
  created_at?: string;
}

export const SecretaireRendezVousEnCours: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<'' | 'confirme' | 'termine'>('');
  const [filterType, setFilterType] = useState<'' | 'en_ligne' | 'presentiel' | 'prestation'>('');
  const [filterDate, setFilterDate] = useState('');

  const { data: rendezVous = [], isLoading } = useQuery({
    queryKey: ['secretaire-rdv-en-cours'],
    queryFn: async () => {
      const response = await apiService.get('/secretaire/dashboard/appointments/all');
      // Filtrer seulement les RDV confirmés et terminés (en cours)
      return (response.data?.data || []).filter(
        (rdv: any) => rdv.statut === 'confirme' || rdv.statut === 'termine'
      );
    }
  });

  // Appliquer les filtres
  const filtered = useMemo(() => {
    return rendezVous.filter(rdv => {
      // Filtre statut
      if (filterStatut && rdv.statut !== filterStatut) return false;

      // Filtre type
      if (filterType && rdv.type !== filterType) return false;

      // Filtre date
      if (filterDate && !rdv.date.startsWith(filterDate)) return false;

      // Recherche (numéro ou patient)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const patientName = rdv.patient ? `${rdv.patient.prenom} ${rdv.patient.nom}`.toLowerCase() : '';
        const numero = rdv.numero.toLowerCase();
        if (!patientName.includes(searchLower) && !numero.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [rendezVous, filterStatut, filterType, filterDate, searchTerm]);

  const {
    currentPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedData,
    setCurrentPage,
  } = useTablePagination(filtered);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'en_ligne':
        return 'En ligne';
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
      case 'confirme':
        return 'bg-blue-100 text-blue-800';
      case 'termine':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'confirme':
        return 'En cours';
      case 'termine':
        return 'Terminé';
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
          <Calendar className="h-6 w-6" />
          Rendez-vous en cours
        </h1>
        <p className="text-muted-foreground">
          Suivre et gérer les rendez-vous confirmés et en cours
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-health">
          <p className="text-sm text-muted-foreground">Total en cours</p>
          <p className="text-2xl font-bold">{rendezVous.length}</p>
        </div>
        <div className="card-health">
          <p className="text-sm text-muted-foreground">En attente de consultation</p>
          <p className="text-2xl font-bold text-blue-600">
            {rendezVous.filter(r => r.statut === 'confirme').length}
          </p>
        </div>
        <div className="card-health">
          <p className="text-sm text-muted-foreground">Consultations terminées</p>
          <p className="text-2xl font-bold text-green-600">
            {rendezVous.filter(r => r.statut === 'termine').length}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card-health">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h2 className="font-semibold">Filtres</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            onChange={(e) => setFilterStatut(e.target.value as any)}
            className="px-3 py-2 border border-input rounded-lg bg-background text-sm"
          >
            <option value="">Tous statuts</option>
            <option value="confirme">En cours</option>
            <option value="termine">Terminé</option>
          </select>

          {/* Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-input rounded-lg bg-background text-sm"
          >
            <option value="">Tous types</option>
            <option value="en_ligne">En ligne</option>
            <option value="presentiel">Présentiel</option>
            <option value="prestation">Prestation</option>
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
              <th className="text-left px-4 py-3 font-semibold">Médecin</th>
              <th className="text-left px-4 py-3 font-semibold">Type</th>
              <th className="text-left px-4 py-3 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun rendez-vous en cours
                </td>
              </tr>
            ) : (
              paginatedData.map((rdv) => (
                <tr key={rdv.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium font-mono">{rdv.numero}</td>
                  <td className="px-4 py-3">
                    {new Date(rdv.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">{rdv.heure}</td>
                  <td className="px-4 py-3">
                    {rdv.patient
                      ? `${rdv.patient.prenom} ${rdv.patient.nom}`
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    {rdv.medecin
                      ? `Dr. ${rdv.medecin.prenom} ${rdv.medecin.nom}`
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-block px-2 py-1 bg-muted rounded">
                      {getTypeLabel(rdv.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded font-medium text-xs ${getStatutColor(
                        rdv.statut
                      )}`}
                    >
                      {getStatutLabel(rdv.statut)}
                    </span>
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

      {/* Informations */}
      <div className="card-health bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Note :</strong> Un rendez-vous devient "Terminé" uniquement après que la consultation
          soit complétée par le médecin et le patient sans aucun empêchement.
        </p>
      </div>
    </div>
  );
};
