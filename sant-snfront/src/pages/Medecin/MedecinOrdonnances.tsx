import React, { useMemo, useState } from 'react';
import { Plus, Search, Edit2, Download, Trash2, X, Filter, RotateCcw, Eye } from 'lucide-react';
import { OrdonnanceDocument } from '@/components/Common/OrdonnanceDocument';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { downloadBlobFile } from '@/lib/downloadFile';
import { extractData } from '@/lib/api-response';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { useAuthStore } from '@/store/authStore';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

interface MedicamentInput {
  nom: string;
  dosage: string;
  frequence: string;
  duree: string;
  instructions?: string;
}

interface ConsultationOption {
  id: number;
  patientId: number;
  patient_name: string;
  date: string;
  statut: string;
}

interface OrdonnanceItem {
  id: string;
  consultationId: number;
  patient_name: string;
  medicamentsCount: number;
  contenu: string;
  date_emission: string;
  statut: 'active';
}

const defaultMedicament: MedicamentInput = {
  nom: '',
  dosage: '',
  frequence: '',
  duree: '',
  instructions: '',
};

const buildContenu = (instructions: string, medicaments: MedicamentInput[]) => {
  const lines: string[] = [];

  if (instructions.trim()) {
    lines.push(`Instructions générales:\n${instructions.trim()}`);
  }

  const meds = medicaments
    .filter((m) => m.nom.trim())
    .map((m, index) => {
      const dosage = m.dosage.trim() || 'dosage non précisé';
      const frequence = m.frequence.trim() || 'fréquence non précisée';
      const duree = m.duree.trim() || 'durée non précisée';
      const note = m.instructions?.trim() ? ` (${m.instructions.trim()})` : '';
      return `${index + 1}. ${m.nom.trim()} - ${dosage} - ${frequence} - ${duree}${note}`;
    });

  if (meds.length) {
    lines.push(`Médicaments:\n${meds.join('\n')}`);
  }

  return lines.join('\n\n').trim() || 'Ordonnance médicale';
};

export const MedecinOrdonnances: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'tous' | 'active'>('tous');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [medicaments, setMedicaments] = useState<MedicamentInput[]>([defaultMedicament]);
  const [formData, setFormData] = useState({
    consultation_id: '',
    patient_name: '',
    instructions: '',
  });

  const currentUser = useAuthStore((state) => state.user);

  const { data: ordonnances = [], isLoading, refetch } = useQuery({
    queryKey: ['ordonnances'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/ordonnances');
        const data = extractData<any[]>(response) || [];

        return data.map((item): OrdonnanceItem => ({
          id: String(item.id),
          consultationId: Number(item.consultationId),
          patient_name:
            `${item?.patient?.prenom || ''} ${item?.patient?.nom || ''}`.trim() ||
            item?.patient?.user?.name ||
            `Patient #${item?.patientId || ''}`,
          medicamentsCount: Array.isArray(item?.medicaments) ? item.medicaments.length : 0,
          contenu: item?.contenu || '',
          date_emission: item?.date_creation || item?.createdAt || new Date().toISOString(),
          statut: 'active',
        }));
      } catch {
        return [];
      }
    },
  });

  const { data: consultations = [] } = useQuery({
    queryKey: ['medecin-consultations-for-ordonnance', currentUser?.id, currentUser?.medecinId],
    queryFn: async () => {
      try {
        const response = await apiService.get(API_ENDPOINTS.consultations.list);
        const rows = extractData<any[]>(response) || [];

        return rows
          .filter((row) => {
            if (currentUser?.medecinId && Number(row?.medecinId) !== Number(currentUser.medecinId)) {
              return false;
            }

            if (!currentUser?.medecinId && currentUser?.id) {
              const ownerUserId = row?.medecin?.user?.id;
              return ownerUserId ? String(ownerUserId) === String(currentUser.id) : true;
            }

            return true;
          })
          .map((row): ConsultationOption => ({
            id: Number(row.id),
            patientId: Number(row.patientId),
            patient_name: `${row?.patient?.prenom || ''} ${row?.patient?.nom || ''}`.trim() || `Patient #${row?.patientId}`,
            date: row?.date || new Date().toISOString(),
            statut: row?.statut || 'en_attente',
          }));
      } catch {
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const consultationId = Number(formData.consultation_id);
      const contenu = buildContenu(formData.instructions, medicaments);
      return apiService.post('/ordonnances', {
        consultationId,
        contenu,
      });
    },
    onSuccess: () => {
      toast.success('Ordonnance créée avec succès');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la création de l\'ordonnance');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const contenu = buildContenu(formData.instructions, medicaments);
      return apiService.put(`/ordonnances/${editingId}`, {
        contenu,
      });
    },
    onSuccess: () => {
      toast.success('Ordonnance mise à jour avec succès');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiService.delete(`/ordonnances/${id}`);
    },
    onSuccess: () => {
      toast.success('Ordonnance supprimée');
      refetch();
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const handleDownloadOrdonnance = async (ordonnanceId: string) => {
    try {
      const blob = await apiService.getBlob(`/ordonnances/${ordonnanceId}/download`);
      downloadBlobFile(blob, `ordonnance-${ordonnanceId}.pdf`);
      toast.success('Ordonnance téléchargée');
    } catch (error: any) {
      toast.error(error.message || 'Téléchargement impossible');
    }
  };

  const resetForm = () => {
    setFormData({
      consultation_id: '',
      patient_name: '',
      instructions: '',
    });
    setMedicaments([defaultMedicament]);
    setEditingId(null);
    setShowModal(false);
  };

  const handleAddMedicament = () => {
    setMedicaments([...medicaments, defaultMedicament]);
  };

  const handleRemoveMedicament = (index: number) => {
    setMedicaments(medicaments.filter((_, i) => i !== index));
  };

  const handleMedicamentChange = (index: number, field: string, value: string) => {
    const updated = [...medicaments];
    updated[index] = { ...updated[index], [field]: value };
    setMedicaments(updated);
  };

  const handleSelectConsultation = (consultationId: string) => {
    const selectedConsultation = consultations.find((c) => String(c.id) === consultationId);
    setFormData({
      ...formData,
      consultation_id: consultationId,
      patient_name: selectedConsultation?.patient_name || '',
    });
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ consultation_id: '', patient_name: '', instructions: '' });
    setMedicaments([defaultMedicament]);
    setShowModal(true);
  };

  const handleOpenEdit = (ordonnance: OrdonnanceItem) => {
    setEditingId(ordonnance.id);
    setFormData({
      consultation_id: String(ordonnance.consultationId),
      patient_name: ordonnance.patient_name,
      instructions: ordonnance.contenu || '',
    });
    setMedicaments([defaultMedicament]);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.consultation_id) {
      toast.error('Veuillez sélectionner une consultation');
      return;
    }

    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const usedConsultationIds = useMemo(() => {
    const set = new Set<number>();
    ordonnances.forEach((o) => set.add(o.consultationId));
    return set;
  }, [ordonnances]);

  const consultationOptions = useMemo(() => {
    return consultations.filter((c) => {
      if (editingId && Number(formData.consultation_id) === c.id) {
        return true;
      }
      return !usedConsultationIds.has(c.id);
    });
  }, [consultations, usedConsultationIds, editingId, formData.consultation_id]);

  const filtered = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return ordonnances.filter((o) => {
      const matchSearch = normalizedSearch === '' || o.patient_name.toLowerCase().includes(normalizedSearch);
      const matchStatus = statusFilter === 'tous' || o.statut === statusFilter;
      const matchDate = dateFilter === '' || o.date_emission.startsWith(dateFilter);
      return matchSearch && matchStatus && matchDate;
    });
  }, [ordonnances, searchTerm, statusFilter, dateFilter]);

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Ordonnances</h1>
          <p className="text-muted-foreground">Créer et gérer les ordonnances médicales</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle ordonnance
        </Button>
      </div>

      <div className="card-health border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filtres ordonnances
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
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input rounded-xl bg-background text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'tous' | 'active')}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          >
            <option value="tous">Tous statuts</option>
            <option value="active">Actives</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm"
          />
        </div>
      </div>

      <div className="card-health overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-sm">Patient</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Médicaments</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Statut</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-center text-muted-foreground">
                  Chargement...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-center text-muted-foreground">
                  Aucune ordonnance trouvée
                </td>
              </tr>
            ) : (
              paginatedData.map((ordonnance) => (
                <tr key={ordonnance.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{ordonnance.patient_name}</td>
                  <td className="px-4 py-3 text-sm">{ordonnance.medicamentsCount} médicament(s)</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(ordonnance.date_emission).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                      <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewId(ordonnance.id)}
                        className="p-1 hover:bg-muted rounded text-primary"
                        title="Aperçu"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadOrdonnance(ordonnance.id)}
                        className="p-1 hover:bg-muted rounded"
                        title="Télécharger PDF serveur"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(ordonnance)}
                        className="p-1 hover:bg-muted rounded"
                        title="Éditer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(ordonnance.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
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
      </div>
      <TablePaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        startItem={startItem}
        endItem={endItem}
        onPageChange={setCurrentPage}
      />

      {/* Viewer ordonnance */}
      {previewId && (
        <OrdonnanceDocument
          ordonnanceId={previewId}
          onClose={() => setPreviewId(null)}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingId ? 'Modifier l\'ordonnance' : 'Nouvelle ordonnance'}</h2>
              <button onClick={resetForm} className="p-1 hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Consultation</label>
                <select
                  value={formData.consultation_id}
                  onChange={(e) => handleSelectConsultation(e.target.value)}
                  disabled={Boolean(editingId)}
                  className="w-full border border-input rounded-lg p-2 bg-background disabled:opacity-70"
                >
                  <option value="">Sélectionner une consultation</option>
                  {consultationOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id} - {c.patient_name} ({new Date(c.date).toLocaleDateString('fr-FR')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Patient</label>
                <input
                  value={formData.patient_name}
                  readOnly
                  className="w-full border border-input rounded-lg p-2 bg-muted text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Médicaments (optionnel)</label>
                <div className="space-y-3">
                  {medicaments.map((med, idx) => (
                    <div key={idx} className="border border-input rounded-lg p-3 space-y-2">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <input
                          placeholder="Nom du médicament"
                          value={med.nom}
                          onChange={(e) => handleMedicamentChange(idx, 'nom', e.target.value)}
                          className="border border-input rounded p-2 text-sm bg-background"
                        />
                        <input
                          placeholder="Dosage"
                          value={med.dosage}
                          onChange={(e) => handleMedicamentChange(idx, 'dosage', e.target.value)}
                          className="border border-input rounded p-2 text-sm bg-background"
                        />
                        <input
                          placeholder="Fréquence"
                          value={med.frequence}
                          onChange={(e) => handleMedicamentChange(idx, 'frequence', e.target.value)}
                          className="border border-input rounded p-2 text-sm bg-background"
                        />
                        <input
                          placeholder="Durée"
                          value={med.duree}
                          onChange={(e) => handleMedicamentChange(idx, 'duree', e.target.value)}
                          className="border border-input rounded p-2 text-sm bg-background"
                        />
                      </div>
                      {medicaments.length > 1 && (
                        <button
                          onClick={() => handleRemoveMedicament(idx)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <Button onClick={handleAddMedicament} variant="outline" className="w-full mt-2 text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un médicament
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Instructions générales</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Instructions générales..."
                  className="w-full border border-input rounded-lg p-2 bg-background resize-none h-24"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
