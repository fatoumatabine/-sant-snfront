import React, { useMemo, useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, X, Eye, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

interface Patient {
  id: string;
  prenom: string;
  nom: string;
  email?: string;
  telephone: string;
  date_naissance?: string;
  adresse?: string;
  groupe_sanguin?: string;
  created_at?: string;
}

export const AdminPatientsCRUD: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState<'all' | 'minor' | 'adult' | 'senior'>('all');
  const [createdFilter, setCreatedFilter] = useState<'all' | 'today' | 'month' | 'year'>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    password: '',
    dateNaissance: '',
    adresse: '',
    groupeSanguin: ''
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-patients'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/admin/patients');
        return response.data || response.data?.data || [];
      } catch {
        toast.error('Erreur lors du chargement');
        return [];
      }
    }
  });

  const patients: Patient[] = (Array.isArray(data) ? data : []).map((p: any) => ({
    id: String(p.id),
    prenom: p.prenom,
    nom: p.nom,
    email: p.user?.email || p.email || '',
    telephone: p.telephone,
    date_naissance: p.date_naissance || p.dateNaissance || undefined,
    adresse: p.adresse || undefined,
    groupe_sanguin: p.groupe_sanguin || undefined,
    created_at: p.createdAt || p.user?.createdAt || undefined
  }));

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiService.post('/admin/patients', data);
    },
    onSuccess: () => {
      toast.success('Patient créé avec succès');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la création');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiService.put(`/admin/patients/${selectedPatient?.id}`, data);
    },
    onSuccess: () => {
      toast.success('Patient mis à jour avec succès');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiService.delete(`/admin/patients/${id}`);
    },
    onSuccess: () => {
      toast.success('Patient supprimé avec succès');
      setDeleteConfirm(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  });

  const filtered = patients.filter((p) => {
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !search ||
      `${p.prenom} ${p.nom}`.toLowerCase().includes(search) ||
      (p.email && p.email.toLowerCase().includes(search)) ||
      p.telephone.includes(search);

    const matchesBlood = !bloodFilter || p.groupe_sanguin === bloodFilter;

    const age = Number(calculateAge(p.date_naissance));
    const matchesAge =
      ageFilter === 'all' ||
      (ageFilter === 'minor' && !Number.isNaN(age) && age < 18) ||
      (ageFilter === 'adult' && !Number.isNaN(age) && age >= 18 && age < 60) ||
      (ageFilter === 'senior' && !Number.isNaN(age) && age >= 60);

    const createdAt = p.created_at ? new Date(p.created_at) : null;
    const now = new Date();
    const matchesCreated =
      createdFilter === 'all' ||
      (createdFilter === 'today' &&
        createdAt &&
        createdAt.getDate() === now.getDate() &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()) ||
      (createdFilter === 'month' &&
        createdAt &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()) ||
      (createdFilter === 'year' && createdAt && createdAt.getFullYear() === now.getFullYear());

    return matchesSearch && matchesBlood && matchesAge && matchesCreated;
  });

  const {
    currentPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedData,
    setCurrentPage,
  } = useTablePagination(filtered);

  const resetForm = () => {
    setFormData({
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      password: '',
      dateNaissance: '',
      adresse: '',
      groupeSanguin: ''
    });
    setSelectedPatient(null);
    setShowModal(false);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      prenom: patient.prenom,
      nom: patient.nom,
      email: patient.email || '',
      telephone: patient.telephone,
      password: '',
      dateNaissance: patient.date_naissance || '',
      adresse: patient.adresse || '',
      groupeSanguin: patient.groupe_sanguin || ''
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const openViewModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setModalMode('view');
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.prenom || !formData.nom || !formData.email || !formData.telephone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (modalMode === 'create') {
      if (!formData.password) {
        toast.error('Le mot de passe est obligatoire pour la création');
        return;
      }
      createMutation.mutate(formData);
    } else if (modalMode === 'edit') {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete (updateData as any).password;
      }
      updateMutation.mutate(updateData);
    }
  };

  function calculateAge(birthDate?: string) {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  const groupeSanguins = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return patients.filter((p) => {
      if (!p.created_at) return false;
      const date = new Date(p.created_at);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
  }, [patients]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total Patients</p>
              <p className="text-3xl font-bold text-foreground">{patients.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Users className="h-7 w-7 text-primary" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Inscrits ce mois</p>
              <p className="text-3xl font-bold text-foreground">{thisMonthCount}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar className="h-7 w-7 text-emerald-700" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Majeurs</p>
              <p className="text-3xl font-bold text-foreground">
                {patients.filter((p) => Number(calculateAge(p.date_naissance)) >= 18).length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Filter className="h-7 w-7 text-violet-700" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Avec groupe sanguin</p>
              <p className="text-3xl font-bold text-foreground">
                {patients.filter((p) => !!p.groupe_sanguin).length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Users className="h-7 w-7 text-amber-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestion des Patients
          </h1>
          <p className="text-muted-foreground">Gérer les dossiers des patients</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un patient
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background"
          />
        </div>
        <select
          value={bloodFilter}
          onChange={(e) => setBloodFilter(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg bg-background"
        >
          <option value="">Tous groupes sanguins</option>
          {groupeSanguins.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={ageFilter}
          onChange={(e) => setAgeFilter(e.target.value as 'all' | 'minor' | 'adult' | 'senior')}
          className="w-full px-3 py-2 border border-input rounded-lg bg-background"
        >
          <option value="all">Tous les âges</option>
          <option value="minor">Mineurs (&lt;18)</option>
          <option value="adult">Adultes (18-59)</option>
          <option value="senior">Seniors (60+)</option>
        </select>
        <div className="flex gap-2">
          <select
            value={createdFilter}
            onChange={(e) => setCreatedFilter(e.target.value as 'all' | 'today' | 'month' | 'year')}
            className="w-full px-3 py-2 border border-input rounded-lg bg-background"
          >
            <option value="all">Toutes dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setBloodFilter('');
              setAgeFilter('all');
              setCreatedFilter('all');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
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
              <th className="text-left px-4 py-3 font-semibold text-sm">Âge</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Groupe sanguin</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Date création</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-3 text-center text-muted-foreground">
                  Chargement...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-3 text-center text-muted-foreground">
                  Aucun patient trouvé
                </td>
              </tr>
            ) : (
              paginatedData.map((patient) => (
                <tr key={patient.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-purple-700">
                          {patient.prenom[0]}{patient.nom[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{patient.prenom} {patient.nom}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{patient.email || '-'}</td>
                   <td className="px-4 py-3 text-sm">{patient.telephone}</td>
                   <td className="px-4 py-3 text-sm">{calculateAge(patient.date_naissance)} ans</td>
                   <td className="px-4 py-3 text-sm font-medium">{patient.groupe_sanguin || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {patient.created_at
                      ? new Date(patient.created_at).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openViewModal(patient)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Voir"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => openEditModal(patient)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Éditer"
                      >
                        <Edit2 className="h-4 w-4 text-primary" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(patient.id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Modal Créer/Éditer */}
      {showModal && modalMode !== 'view' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {modalMode === 'create' ? 'Ajouter un patient' : 'Éditer le patient'}
              </h2>
              <button onClick={resetForm} className="p-1 hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full border border-input rounded-lg p-2 bg-background text-sm"
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full border border-input rounded-lg p-2 bg-background text-sm"
                    placeholder="Nom"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-input rounded-lg p-2 bg-background text-sm"
                    placeholder="Email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full border border-input rounded-lg p-2 bg-background text-sm"
                    placeholder="Téléphone"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Mot de passe {modalMode === 'edit' && '(laisser vide pour ne pas changer)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-input rounded-lg p-2 bg-background text-sm"
                  placeholder="Mot de passe"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date de naissance</label>
                  <input
                    type="date"
                    value={formData.dateNaissance}
                    onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                    className="w-full border border-input rounded-lg p-2 bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Groupe sanguin</label>
                  <select
                    value={formData.groupeSanguin}
                    onChange={(e) => setFormData({ ...formData, groupeSanguin: e.target.value })}
                    className="w-full border border-input rounded-lg p-2 bg-background text-sm"
                  >
                    <option value="">-- Sélectionner --</option>
                    {groupeSanguins.map(gs => (
                      <option key={gs} value={gs}>{gs}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full border border-input rounded-lg p-2 bg-background text-sm"
                  placeholder="Adresse"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {modalMode === 'create' ? 'Créer' : 'Mettre à jour'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Voir détails */}
      {showModal && modalMode === 'view' && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedPatient.prenom} {selectedPatient.nom}
                </h2>
                <p className="text-purple-100">{calculateAge(selectedPatient.dateNaissance)} ans</p>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-purple-800 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedPatient.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{selectedPatient.telephone}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                 <div>
                   <p className="text-sm text-muted-foreground">Groupe sanguin</p>
                   <p className="font-medium text-lg">{selectedPatient.groupe_sanguin || '-'}</p>
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Date de naissance</p>
                   <p className="font-medium">
                     {selectedPatient.date_naissance
                       ? new Date(selectedPatient.date_naissance).toLocaleDateString('fr-FR')
                       : '-'}
                   </p>
                 </div>
               </div>

              {selectedPatient.adresse && (
                <div>
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p className="font-medium">{selectedPatient.adresse}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Date d'inscription</p>
                <p className="font-medium">
                  {selectedPatient.created_at
                    ? new Date(selectedPatient.created_at).toLocaleDateString('fr-FR')
                    : '-'}
                </p>
              </div>
            </div>

            <div className="border-t p-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => openEditModal(selectedPatient)}>
                Éditer
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="bg-red-50 border-b border-red-200 p-6">
              <h2 className="text-lg font-bold text-red-900">Confirmer la suppression</h2>
            </div>
            <div className="p-6">
              <p className="text-muted-foreground mb-4">
                Êtes-vous sûr de vouloir supprimer ce patient ? Cette action ne peut pas être annulée.
              </p>
            </div>
            <div className="border-t p-4 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
