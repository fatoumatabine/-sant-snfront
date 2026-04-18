import React, { useMemo, useState } from 'react';
import { Stethoscope, Plus, Search, Edit2, Trash2, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { MedecinStats } from '@/components/Admin/MedecinStats';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

interface Medecin {
  id: string;
  prenom: string;
  nom: string;
  specialite: string;
  email?: string;
  telephone: string;
  created_at?: string;
}

export const AdminMedecins: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialiteFilter, setSpecialiteFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'ancien'>('recent');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-medecins'],
    queryFn: async () => {
      const response = await apiService.get('/admin/medecins');
      return response.data || [];
    }
  });

  const medecins = data || [];
  const specialites = useMemo(
    () => [...new Set(medecins.map((m: Medecin) => m.specialite).filter(Boolean))],
    [medecins]
  );

  const filtered = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return [...medecins]
      .filter((m: Medecin) => {
        const matchSearch =
          normalizedSearch === '' ||
          `${m.prenom} ${m.nom}`.toLowerCase().includes(normalizedSearch) ||
          (m.email && m.email.toLowerCase().includes(normalizedSearch)) ||
          m.specialite.toLowerCase().includes(normalizedSearch);
        const matchSpecialite = specialiteFilter === '' || m.specialite === specialiteFilter;
        return matchSearch && matchSpecialite;
      })
      .sort((a: Medecin, b: Medecin) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
      });
  }, [medecins, searchTerm, specialiteFilter, sortOrder]);

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
          Erreur lors du chargement des médecins
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Stethoscope className="h-6 w-6" />
            Gestion des Médecins
          </h1>
          <p className="text-muted-foreground">Gérer et superviser les médecins du système</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <MedecinStats />

      {/* Header Actions */}
      <div className="flex justify-end">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un médecin
        </Button>
      </div>

      {/* Filters */}
      <div className="card-health border border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filtres avancés
          </h2>
          <Button
            size="sm"
            variant="ghost"
            className="gap-2"
            onClick={() => {
              setSearchTerm('');
              setSpecialiteFilter('');
              setSortOrder('recent');
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Nom, email ou spécialité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input rounded-xl bg-background text-sm"
            />
          </div>
          <select
            value={specialiteFilter}
            onChange={(e) => setSpecialiteFilter(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          >
            <option value="">Toutes les spécialités</option>
            {specialites.map((specialite) => (
              <option key={specialite} value={specialite}>
                {specialite}
              </option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'recent' | 'ancien')}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          >
            <option value="recent">Plus récents</option>
            <option value="ancien">Plus anciens</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card-health overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-sm">Nom</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Spécialité</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Téléphone</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Date création</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((medecin) => (
              <tr key={medecin.id} className="border-b border-border hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-green-700">
                        {medecin.prenom[0]}{medecin.nom[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{medecin.prenom} {medecin.nom}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{medecin.specialite}</td>
                <td className="px-4 py-3 text-sm">{medecin.email || '-'}</td>
                <td className="px-4 py-3 text-sm">{medecin.telephone}</td>
                <td className="px-4 py-3 text-sm">{medecin.created_at ? new Date(medecin.created_at).toLocaleDateString('fr-FR') : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
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
          Aucun médecin trouvé
        </div>
      )}
    </div>
  );
};
