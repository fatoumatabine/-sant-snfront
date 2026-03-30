import React, { useMemo, useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { SecretaireStats } from '@/components/Admin/SecretaireStats';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

interface Secretaire {
  id: string;
  prenom: string;
  nom: string;
  email?: string;
  telephone: string;
  medecinAssigne?: string;
  created_at?: string;
}

export const AdminSecretaires: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assignationFilter, setAssignationFilter] = useState<'tous' | 'assignes' | 'non_assignes'>('tous');
  const [sortOrder, setSortOrder] = useState<'recent' | 'ancien'>('recent');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-secretaires'],
    queryFn: async () => {
      const response = await apiService.get('/admin/secretaires');
      return response.data || [];
    }
  });

  const secretaires = data || [];

  const filtered = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return [...secretaires]
      .filter((s: Secretaire) => {
        const matchSearch =
          normalizedSearch === '' ||
          `${s.prenom} ${s.nom}`.toLowerCase().includes(normalizedSearch) ||
          (s.email && s.email.toLowerCase().includes(normalizedSearch));
        const isAssigned = Boolean(s.medecinAssigne);
        const matchAssignation =
          assignationFilter === 'tous' ||
          (assignationFilter === 'assignes' && isAssigned) ||
          (assignationFilter === 'non_assignes' && !isAssigned);
        return matchSearch && matchAssignation;
      })
      .sort((a: Secretaire, b: Secretaire) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
      });
  }, [secretaires, searchTerm, assignationFilter, sortOrder]);

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
          Erreur lors du chargement des secrétaires
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
            <Users className="h-6 w-6" />
            Gestion des Secrétaires
          </h1>
          <p className="text-muted-foreground">Gérer et superviser les secrétaires du système</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <SecretaireStats />

      {/* Header Actions */}
      <div className="flex justify-end">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter une secrétaire
        </Button>
      </div>

      {/* Filters */}
      <div className="card-health border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
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
              setAssignationFilter('tous');
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
              placeholder="Nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input rounded-xl bg-background text-sm"
            />
          </div>
          <select
            value={assignationFilter}
            onChange={(e) => setAssignationFilter(e.target.value as 'tous' | 'assignes' | 'non_assignes')}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          >
            <option value="tous">Toutes les secrétaires</option>
            <option value="assignes">Avec médecin assigné</option>
            <option value="non_assignes">Non assignées</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'recent' | 'ancien')}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          >
            <option value="recent">Plus récentes</option>
            <option value="ancien">Plus anciennes</option>
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
              <th className="text-left px-4 py-3 font-semibold text-sm">Médecin assigné</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Téléphone</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Date création</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((secretaire) => (
              <tr key={secretaire.id} className="border-b border-border hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-primary">
                        {secretaire.prenom[0]}{secretaire.nom[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{secretaire.prenom} {secretaire.nom}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{secretaire.email || '-'}</td>
                <td className="px-4 py-3 text-sm">{secretaire.medecinAssigne || '-'}</td>
                <td className="px-4 py-3 text-sm">{secretaire.telephone}</td>
                <td className="px-4 py-3 text-sm">{secretaire.created_at ? new Date(secretaire.created_at).toLocaleDateString('fr-FR') : '-'}</td>
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
          Aucune secrétaire trouvée
        </div>
      )}
    </div>
  );
};
