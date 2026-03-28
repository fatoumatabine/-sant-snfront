import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CalendarClock, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { extractData } from '@/lib/api-response';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

interface Creneau {
  id: number;
  medecinId: number;
  jour: number;
  heure: string;
  actif: boolean;
}

const JOURS: Record<number, string> = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
};

export const MedecinDisponibilites: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [medecinId, setMedecinId] = useState<number | null>(user?.medecinId || null);
  const [jour, setJour] = useState(1);
  const [heure, setHeure] = useState('08:00');
  const [editId, setEditId] = useState<number | null>(null);
  const [editJour, setEditJour] = useState(1);
  const [editHeure, setEditHeure] = useState('08:00');

  useEffect(() => {
    if (user?.medecinId) {
      setMedecinId(user.medecinId);
    }
  }, [user?.medecinId]);

  useQuery({
    queryKey: ['auth-me-medecin-id'],
    enabled: !medecinId,
    queryFn: async () => {
      const response = await apiService.get(API_ENDPOINTS.auth.me);
      const me = extractData<any>(response);
      if (me?.medecinId) {
        setMedecinId(me.medecinId);
      }
      return me;
    },
  });

  const {
    data: creneaux = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['medecin-creneaux', medecinId],
    enabled: Boolean(medecinId),
    queryFn: async () => {
      const response = await apiService.get(API_ENDPOINTS.creneau.byMedecin(String(medecinId)));
      return extractData<Creneau[]>(response) || [];
    },
  });

  const sortedCreneaux = useMemo(
    () =>
      [...creneaux].sort((a, b) => {
        if (a.jour !== b.jour) return a.jour - b.jour;
        return a.heure.localeCompare(b.heure);
      }),
    [creneaux]
  );

  const {
    currentPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedData,
    setCurrentPage,
  } = useTablePagination(sortedCreneaux);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!medecinId) throw new Error('Médecin introuvable');
      return apiService.post(API_ENDPOINTS.creneau.create, {
        medecinId,
        jour,
        heure,
      });
    },
    onSuccess: () => {
      toast.success('Créneau ajouté');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Impossible d’ajouter ce créneau');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editId) return;
      return apiService.put(API_ENDPOINTS.creneau.update(String(editId)), {
        jour: editJour,
        heure: editHeure,
      });
    },
    onSuccess: () => {
      toast.success('Créneau modifié');
      setEditId(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Impossible de modifier ce créneau');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiService.put(API_ENDPOINTS.creneau.toggle(String(id)));
    },
    onSuccess: () => {
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiService.delete(API_ENDPOINTS.creneau.delete(String(id)));
    },
    onSuccess: () => {
      toast.success('Créneau supprimé');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Suppression impossible');
    },
  });

  if (!medecinId) {
    return (
      <div className="card-health">
        <p className="text-sm text-muted-foreground">Impossible de déterminer le profil médecin connecté.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <CalendarClock className="h-8 w-8" />
          Mes disponibilités
        </h1>
        <p className="text-muted-foreground">Gérez vos créneaux hebdomadaires (jour et heure)</p>
      </div>

      <div className="card-health space-y-4">
        <h2 className="font-semibold">Ajouter un créneau</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <select
            value={jour}
            onChange={(e) => setJour(Number(e.target.value))}
            className="border border-input rounded-lg px-3 py-2 bg-background"
          >
            {Object.entries(JOURS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={heure}
            onChange={(e) => setHeure(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 bg-background"
          />
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      <div className="card-health overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-sm font-semibold">Jour</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Heure</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Statut</th>
              <th className="text-right px-4 py-3 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-center text-sm text-muted-foreground">
                  Chargement...
                </td>
              </tr>
            ) : sortedCreneaux.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-center text-sm text-muted-foreground">
                  Aucun créneau défini.
                </td>
              </tr>
            ) : (
              paginatedData.map((creneau) => {
                const isEditing = editId === creneau.id;
                return (
                  <tr key={creneau.id} className="border-b border-border">
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <select
                          value={editJour}
                          onChange={(e) => setEditJour(Number(e.target.value))}
                          className="border border-input rounded px-2 py-1 bg-background"
                        >
                          {Object.entries(JOURS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        JOURS[creneau.jour]
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="time"
                          value={editHeure}
                          onChange={(e) => setEditHeure(e.target.value)}
                          className="border border-input rounded px-2 py-1 bg-background"
                        />
                      ) : (
                        creneau.heure
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => toggleMutation.mutate(creneau.id)}
                        className={`px-2 py-1 rounded-full text-xs ${
                          creneau.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {creneau.actif ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <Button
                            size="sm"
                            onClick={() => updateMutation.mutate()}
                            disabled={updateMutation.isPending}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Sauver
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditId(creneau.id);
                              setEditJour(creneau.jour);
                              setEditHeure(creneau.heure);
                            }}
                          >
                            Modifier
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => deleteMutation.mutate(creneau.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
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
    </div>
  );
};
