import React, { useMemo, useState } from 'react';
import { Stethoscope, Plus, Search, Eye, Edit2, Trash2, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { extractData } from '@/lib/api-response';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import {
  ResponsiveHeader,
  ResponsiveCard,
} from '@/components/Responsive/ResponsiveDashboard';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

interface Consultation {
  id: string;
  patient_name: string;
  patient_id: string;
  date: string;
  diagnostic: string;
  statut: 'en_attente' | 'en_cours' | 'termine';
  type?: 'en_ligne' | 'presentiel' | 'prestation' | string;
  constantes?: any;
  medicaments?: any;
}

const STATUS_LABELS: Record<Consultation['statut'], string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  termine: 'Terminée',
};

const STATUS_BADGES: Record<Consultation['statut'], string> = {
  en_attente: 'bg-yellow-100 text-yellow-800',
  en_cours: 'bg-blue-100 text-blue-800',
  termine: 'bg-green-100 text-green-800',
};

export const MedecinConsultations: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'tous' | Consultation['statut']>('tous');
  const [dateFilter, setDateFilter] = useState('');

  const { data: consultations = [], isLoading, refetch } = useQuery({
    queryKey: ['consultations-list'],
    queryFn: async () => {
      try {
        const response = await apiService.get(API_ENDPOINTS.consultations.list);
        const data = extractData<any[]>(response) || [];
        return data.map((item: any): Consultation => {
          const patient = item?.patient;
          const status = String(item?.statut || 'en_attente');
          const mappedStatus: Consultation['statut'] =
            status === 'termine' || status === 'en_cours' ? status : 'en_attente';

          return {
            id: String(item?.id),
            patient_name: `${patient?.prenom || ''} ${patient?.nom || ''}`.trim() || 'Patient',
            patient_id: String(item?.patientId || patient?.id || ''),
            date: item?.date || new Date().toISOString(),
            diagnostic: item?.diagnostic || '-',
            statut: mappedStatus,
            type: item?.type,
            constantes: item?.constantes,
          };
        });
      } catch (error) {
        console.error('Erreur chargement consultations:', error);
        return [];
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiService.delete(`/consultations/${id}`);
    },
    onSuccess: () => {
      toast.success('Consultation supprimée');
      refetch();
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const filtered = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return consultations.filter((c) => {
      const matchSearch = normalizedSearch === '' || c.patient_name.toLowerCase().includes(normalizedSearch);
      const matchStatus = statusFilter === 'tous' || c.statut === statusFilter;
      const matchDate = dateFilter === '' || c.date.startsWith(dateFilter);
      return matchSearch && matchStatus && matchDate;
    });
  }, [consultations, searchTerm, statusFilter, dateFilter]);

  const {
    currentPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedData,
    setCurrentPage,
  } = useTablePagination(filtered);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 md:px-6 lg:px-8 py-4">
        <ResponsiveHeader
          title="Mes consultations"
          subtitle="Enregistrer et consulter les dossiers patients"
          icon={<Stethoscope size={24} />}
          actions={
            <Button
              onClick={() => navigate('/medecin/consultations/nouvelle')}
              className="w-full md:w-auto gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouvelle consultation
            </Button>
          }
        />
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-4">
        {/* Filters */}
        <ResponsiveCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Filtres
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('tous');
                setDateFilter('');
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm md:text-base"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'tous' | Consultation['statut'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="tous">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminée</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            />
          </div>
        </ResponsiveCard>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 md:px-6 py-3 font-semibold text-xs md:text-sm text-gray-900">Patient</th>
              <th className="text-left px-3 md:px-6 py-3 font-semibold text-xs md:text-sm text-gray-900">Date</th>
              <th className="hidden md:table-cell text-left px-3 md:px-6 py-3 font-semibold text-xs md:text-sm text-gray-900">Diagnostic</th>
              <th className="text-left px-3 md:px-6 py-3 font-semibold text-xs md:text-sm text-gray-900">Statut</th>
              <th className="text-right px-3 md:px-6 py-3 font-semibold text-xs md:text-sm text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 md:px-6 py-4 text-center text-sm text-gray-600">
                  Chargement...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 md:px-6 py-4 text-center text-sm text-gray-600">
                  Aucune consultation trouvée
                </td>
              </tr>
            ) : (
              paginatedData.map(consultation => (
                <tr key={consultation.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm text-gray-900">{consultation.patient_name}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">{new Date(consultation.date).toLocaleDateString('fr-FR')}</td>
                  <td className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">{consultation.diagnostic}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGES[consultation.statut]}`}>
                      {STATUS_LABELS[consultation.statut]}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div className="flex gap-1 md:gap-2 justify-end">
                      <button
                        onClick={() => navigate(`/medecin/consultations/${consultation.id}`)}
                        className="p-1 md:p-2 hover:bg-gray-200 rounded transition"
                        title="Voir"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/medecin/consultations/${consultation.id}/edit`)}
                        className="p-1 md:p-2 hover:bg-gray-200 rounded transition"
                        title="Éditer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {(consultation.type === 'en_ligne' && (consultation.statut === 'en_cours' || consultation.statut === 'termine')) && (
                        <button
                          onClick={() => navigate(`/medecin/video-call?consultationId=${consultation.id}`)}
                          className="p-1 md:p-2 hover:bg-blue-100 rounded text-blue-600 transition"
                          title="Rejoindre l'appel"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(consultation.id)}
                        className="p-1 md:p-2 hover:bg-red-100 rounded text-red-600 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="border-t border-gray-100 px-4 md:px-6 pb-4">
          <TablePaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            onPageChange={setCurrentPage}
          />
        </div>
        </div>
      </div>
    </div>
  );
};
