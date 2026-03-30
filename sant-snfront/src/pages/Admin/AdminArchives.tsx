import React, { useMemo, useState } from 'react';
import { ArchiveRestore, RefreshCcw, Search, Filter, ShieldAlert } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

type ArchiveType = 'all' | 'medecin' | 'secretaire' | 'patient';

interface ArchiveItem {
  type: 'medecin' | 'secretaire' | 'patient';
  id: number;
  userId: number;
  nomComplet: string;
  email: string | null;
  telephone: string;
  archivedAt: string;
  createdAt: string;
  details?: {
    specialite?: string | null;
    medecinAssigne?: string | null;
    groupeSanguin?: string | null;
  };
}

export const AdminArchives: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<ArchiveType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-archives', typeFilter],
    queryFn: async () => {
      try {
        const response = await apiService.get(`/admin/archives?type=${typeFilter}`);
        return response.data || [];
      } catch {
        toast.error('Erreur lors du chargement des archives');
        return [];
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'medecin' | 'secretaire' | 'patient'; id: number }) =>
      apiService.post(`/admin/archives/${type}/${id}/restore`),
    onSuccess: () => {
      toast.success('Élément restauré avec succès');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la restauration');
    },
  });

  const filtered = useMemo(() => {
    const list: ArchiveItem[] = data || [];
    const now = new Date();

    return list.filter((item) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        item.nomComplet.toLowerCase().includes(term) ||
        (item.email || '').toLowerCase().includes(term) ||
        item.telephone.toLowerCase().includes(term);

      const archivedDate = new Date(item.archivedAt);
      const ageInMs = now.getTime() - archivedDate.getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      const matchesDate =
        dateFilter === 'all' ||
        (dateFilter === 'today' &&
          archivedDate.getDate() === now.getDate() &&
          archivedDate.getMonth() === now.getMonth() &&
          archivedDate.getFullYear() === now.getFullYear()) ||
        (dateFilter === 'week' && ageInMs <= 7 * oneDay) ||
        (dateFilter === 'month' && ageInMs <= 30 * oneDay);

      return matchesSearch && matchesDate;
    });
  }, [data, searchTerm, dateFilter]);

  const {
    currentPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedData,
    setCurrentPage,
  } = useTablePagination(filtered);

  const getTypeLabel = (type: ArchiveItem['type']) => {
    if (type === 'medecin') return 'Médecin';
    if (type === 'secretaire') return 'Secrétaire';
    return 'Patient';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <ArchiveRestore className="h-6 w-6 text-amber-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Archives</h1>
            <p className="text-sm text-muted-foreground">
              Restaurez les comptes archivés (médecins, secrétaires et patients)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher nom, email ou téléphone..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ArchiveType)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background"
          >
            <option value="all">Tous les types</option>
            <option value="medecin">Médecins</option>
            <option value="secretaire">Secrétaires</option>
            <option value="patient">Patients</option>
          </select>
        </div>

        <div className="flex gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
            className="w-full px-3 py-2 border border-input rounded-lg bg-background"
          >
            <option value="all">Toutes dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
          </select>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('all');
              setDateFilter('all');
            }}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="text-left px-4 py-3 text-sm font-semibold">Type</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Nom</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Email</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Téléphone</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Archivé le</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Aucune donnée archivée trouvée
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">
                        {getTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{item.nomComplet}</td>
                    <td className="px-4 py-3 text-sm">{item.email || '-'}</td>
                    <td className="px-4 py-3 text-sm">{item.telephone || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {item.archivedAt ? new Date(item.archivedAt).toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        onClick={() => restoreMutation.mutate({ type: item.type, id: item.id })}
                        disabled={restoreMutation.isPending}
                        className="gap-2"
                      >
                        <ArchiveRestore className="h-4 w-4" />
                        Restaurer
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
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

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 mt-0.5 shrink-0" />
        <p>
          Si un email ou un téléphone est déjà utilisé par un compte actif, la restauration est bloquée pour éviter les conflits.
        </p>
      </div>
    </div>
  );
};
