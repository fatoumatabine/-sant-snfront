import React, { useMemo, useState } from 'react';
import { Users, Search, Edit2, Trash2, Eye, Filter, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { PatientStats } from '@/components/Admin/PatientStats';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

interface Patient {
  id: string;
  prenom: string;
  nom: string;
  email?: string;
  telephone?: string;
  date_naissance?: string;
  created_at?: string;
}

export const AdminPatients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneFilter, setPhoneFilter] = useState<'tous' | 'avec' | 'sans'>('tous');
  const [sortOrder, setSortOrder] = useState<'recent' | 'ancien'>('recent');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-patients'],
    queryFn: async () => {
      const response = await apiService.get('/admin/patients');
      return response.data || [];
    }
  });

  const patients = data || [];

  const filtered = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return [...patients]
      .filter((p: Patient) => {
        const matchSearch =
          normalizedSearch === '' ||
          `${p.prenom} ${p.nom}`.toLowerCase().includes(normalizedSearch) ||
          (p.email && p.email.toLowerCase().includes(normalizedSearch));
        const hasPhone = Boolean(p.telephone && p.telephone.trim());
        const matchPhone =
          phoneFilter === 'tous' ||
          (phoneFilter === 'avec' && hasPhone) ||
          (phoneFilter === 'sans' && !hasPhone);
        return matchSearch && matchPhone;
      })
      .sort((a: Patient, b: Patient) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
      });
  }, [patients, searchTerm, phoneFilter, sortOrder]);

  const {
    currentPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedData,
    setCurrentPage,
  } = useTablePagination(filtered);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-8">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-8 text-destructive">
          Erreur lors du chargement des patients
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Users className="h-6 w-6" />
          Gestion des Patients
        </h1>
        <p className="text-muted-foreground">Consulter et gérer les dossiers patients</p>
      </div>

      {/* Statistics Cards */}
      <PatientStats />

      {/* Filters */}
      <div className="card-health border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filtres avancés
          </h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              setSearchTerm('');
              setPhoneFilter('tous');
              setSortOrder('recent');
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input rounded-xl bg-background text-sm"
            />
          </div>
          <select
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value as 'tous' | 'avec' | 'sans')}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          >
            <option value="tous">Tous les téléphones</option>
            <option value="avec">Avec téléphone</option>
            <option value="sans">Sans téléphone</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'recent' | 'ancien')}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          >
            <option value="recent">Inscrits récemment</option>
            <option value="ancien">Inscrits anciennement</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card-health overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-sm">Nom</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Téléphone</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Date naissance</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Date inscription</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((patient) => (
              <tr key={patient.id} className="border-b border-border hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-blue-700">
                        {patient.prenom[0]}{patient.nom[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{patient.prenom} {patient.nom}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{patient.email || '-'}</td>
                <td className="px-4 py-3 text-sm">{patient.telephone || '-'}</td>
                <td className="px-4 py-3 text-sm">{patient.date_naissance ? new Date(patient.date_naissance).toLocaleDateString('fr-FR') : '-'}</td>
                <td className="px-4 py-3 text-sm">{patient.created_at ? new Date(patient.created_at).toLocaleDateString('fr-FR') : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </button>
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Edit2 className="h-4 w-4 text-primary" />
                    </button>
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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

      {filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Aucun patient trouvé
        </div>
      )}
    </div>
  );
};
