import React, { useState } from 'react';
import { Stethoscope, Plus, Search, Edit2, Trash2, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { validateSenegalPhoneNumber, validateEmail, ValidationMessages } from '@/lib/validation';
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
  numeroOrdre?: string;
  experience?: number;
  biographie?: string;
}

export const AdminMedecinsCRUD: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialiteFilter, setSpecialiteFilter] = useState('');
  const [createdFilter, setCreatedFilter] = useState<'all' | 'today' | 'month' | 'year'>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedMedecin, setSelectedMedecin] = useState<Medecin | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    specialite: '',
    email: '',
    telephone: '',
    password: '',
    numeroOrdre: '',
    experience: '',
    biographie: ''
  });

  // États pour les erreurs de validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-medecins'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/admin/medecins');
        return response.data || [];
      } catch {
        toast.error('Erreur lors du chargement');
        return [];
      }
    }
  });

  const medecins = (data || []).map((m: any) => ({
    id: m.id.toString(),
    nom: m.nom,
    prenom: m.prenom,
    specialite: m.specialite,
    email: m.user?.email,
    telephone: m.telephone,
    created_at: m.createdAt || m.user?.createdAt,
    numeroOrdre: m.numeroOrdre,
    experience: m.experience,
    biographie: m.biographie
  }));

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiService.post('/admin/medecins', data);
    },
    onSuccess: () => {
      toast.success('Médecin créé avec succès');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la création');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiService.put(`/admin/medecins/${selectedMedecin?.id}`, data);
    },
    onSuccess: () => {
      toast.success('Médecin mis à jour avec succès');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiService.delete(`/admin/medecins/${id}`);
    },
    onSuccess: () => {
      toast.success('Médecin supprimé avec succès');
      setDeleteConfirm(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  });

  const filtered = medecins.filter(m => {
    const matchesSearch = 
      `${m.prenom} ${m.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.specialite.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialite = !specialiteFilter || m.specialite === specialiteFilter;
    const createdAt = m.created_at ? new Date(m.created_at) : null;
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

    return matchesSearch && matchesSpecialite && matchesCreated;
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

  // Get unique specialites for filter
  const uniqueSpecialites = [...new Set(medecins.map(m => m.specialite))];

  const resetForm = () => {
    setFormData({
      prenom: '',
      nom: '',
      specialite: '',
      email: '',
      telephone: '',
      password: '',
      numeroOrdre: '',
      experience: '',
      biographie: ''
    });
    setFieldErrors({});
    setSelectedMedecin(null);
    setShowModal(false);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (medecin: Medecin) => {
    setSelectedMedecin(medecin);
    setFormData({
      prenom: medecin.prenom,
      nom: medecin.nom,
      specialite: medecin.specialite,
      email: medecin.email || '',
      telephone: medecin.telephone,
      password: '',
      numeroOrdre: medecin.numeroOrdre || '',
      experience: medecin.experience?.toString() || '',
      biographie: medecin.biographie || ''
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const openViewModal = (medecin: Medecin) => {
    setSelectedMedecin(medecin);
    setModalMode('view');
    setShowModal(true);
  };

  const handleSubmit = () => {
    // Réinitialiser les erreurs
    setFieldErrors({});
    
    const errors: Record<string, string> = {};
    
    // Validation du prénom
    if (!formData.prenom || formData.prenom.trim().length < 2) {
      errors.prenom = 'Le prénom doit contenir au moins 2 caractères';
    }
    
    // Validation du nom
    if (!formData.nom || formData.nom.trim().length < 2) {
      errors.nom = 'Le nom doit contenir au moins 2 caractères';
    }
    
    // Validation de l'email
    if (!formData.email) {
      errors.email = 'L\'email est obligatoire';
    } else if (!validateEmail(formData.email)) {
      errors.email = ValidationMessages.invalidEmail;
    }
    
    // Validation du téléphone
    if (!formData.telephone) {
      errors.telephone = 'Le téléphone est obligatoire';
    } else if (!validateSenegalPhoneNumber(formData.telephone)) {
      errors.telephone = ValidationMessages.invalidPhone;
    }
    
    // Validation de la spéciauxité
    if (!formData.specialite) {
      errors.specialite = 'La spécialité est obligatoire';
    }
    
    // Validation du mot de passe pour la création
    if (modalMode === 'create') {
      if (!formData.password) {
        errors.password = 'Le mot de passe est obligatoire';
      } else if (formData.password.length < 8) {
        errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
      }
    }
    
    // Afficher le premier erreur si existent
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Afficher le premier message d'erreur
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    if (modalMode === 'create') {
      createMutation.mutate(formData);
    } else if (modalMode === 'edit') {
      const updateData: Record<string, string> = {
        prenom: formData.prenom.trim(),
        nom: formData.nom.trim(),
        specialite: formData.specialite.trim(),
        email: formData.email.trim().toLowerCase(),
        telephone: formData.telephone.trim()
      };
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }
      updateMutation.mutate(updateData);
    }
  };

  const specialites = [
    'Généraliste',
    'Cardiologie',
    'Dermatologie',
    'Neurologie',
    'Gastroentérologie',
    'Pneumologie',
    'Gynécologie',
    'Ophtalmologie',
    'Orthopédie',
    'Psychiatrie'
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-primary/20 bg-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total Médecins</p>
              <p className="text-3xl font-bold text-foreground">{medecins.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Stethoscope className="h-7 w-7 text-primary" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Cardiologues</p>
              <p className="text-3xl font-bold text-foreground">{medecins.filter(m => m.specialite === 'Cardiologie').length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Stethoscope className="h-7 w-7 text-emerald-700" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-indigo-200 bg-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Dermatologues</p>
              <p className="text-3xl font-bold text-foreground">{medecins.filter(m => m.specialite === 'Dermatologie').length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Stethoscope className="h-7 w-7 text-indigo-700" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Généralistes</p>
              <p className="text-3xl font-bold text-foreground">{medecins.filter(m => m.specialite === 'Généraliste').length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Stethoscope className="h-7 w-7 text-amber-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Stethoscope className="h-6 w-6" />
            Gestion des Médecins
          </h1>
          <p className="text-muted-foreground">Gérer et superviser les médecins du système</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un médecin
        </Button>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou spécialité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background"
          />
        </div>
        <select
          value={specialiteFilter}
          onChange={(e) => setSpecialiteFilter(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg bg-background"
        >
          <option value="">Toutes les spécialités</option>
          {uniqueSpecialites.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
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
              setSpecialiteFilter('');
              setCreatedFilter('all');
            }}
            className="shrink-0"
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
              <th className="text-left px-4 py-3 font-semibold text-sm">Spécialité</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Téléphone</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Date création</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-center text-muted-foreground">
                  Chargement...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-center text-muted-foreground">
                  Aucun médecin trouvé
                </td>
              </tr>
            ) : (
              paginatedData.map((medecin) => (
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
                  <td className="px-4 py-3 text-sm">
                    {medecin.created_at
                      ? new Date(medecin.created_at).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openViewModal(medecin)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Voir"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => openEditModal(medecin)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Éditer"
                      >
                        <Edit2 className="h-4 w-4 text-primary" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(medecin.id)}
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
          <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {modalMode === 'create' ? 'Ajouter un médecin' : 'Éditer le médecin'}
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
                  <label className="block text-sm font-medium mb-1">Spécialité *</label>
                  <select
                    value={formData.specialite}
                    onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                    className="w-full border border-input rounded-lg p-2 bg-background text-sm"
                  >
                    <option value="">-- Sélectionner --</option>
                    {specialites.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => {
                      setFormData({ ...formData, telephone: e.target.value });
                      // Effacer l'erreur quand l'utilisateur tape
                      if (fieldErrors.telephone) {
                        setFieldErrors({ ...fieldErrors, telephone: '' });
                      }
                    }}
                    className={`w-full border rounded-lg p-2 bg-background text-sm ${fieldErrors.telephone ? 'border-red-500' : 'border-input'}`}
                    placeholder="+221 77 123 45 67"
                  />
                  {fieldErrors.telephone && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.telephone}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      // Effacer l'erreur quand l'utilisateur tape
                      if (fieldErrors.email) {
                        setFieldErrors({ ...fieldErrors, email: '' });
                      }
                    }}
                    className={`w-full border rounded-lg p-2 bg-background text-sm ${fieldErrors.email ? 'border-red-500' : 'border-input'}`}
                    placeholder="email@exemple.com"
                  />
                  {fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mot de passe {modalMode === 'edit' && '(laisser vide pour ne pas changer)'} {modalMode === 'create' && '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      // Effacer l'erreur quand l'utilisateur tape
                      if (fieldErrors.password) {
                        setFieldErrors({ ...fieldErrors, password: '' });
                      }
                    }}
                    className={`w-full border rounded-lg p-2 bg-background text-sm ${fieldErrors.password ? 'border-red-500' : 'border-input'}`}
                    placeholder="Mot de passe"
                  />
                  {fieldErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">N° d'ordre</label>
                  <input
                    type="text"
                    value={formData.numeroOrdre}
                    onChange={(e) => setFormData({ ...formData, numeroOrdre: e.target.value })}
                    className="w-full border border-input rounded-lg p-2 bg-background text-sm"
                    placeholder="N° d'ordre du conseil"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Années d'expérience</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full border border-input rounded-lg p-2 bg-background text-sm"
                    placeholder="Années"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Biographie</label>
                <textarea
                  value={formData.biographie}
                  onChange={(e) => setFormData({ ...formData, biographie: e.target.value })}
                  className="w-full border border-input rounded-lg p-2 bg-background resize-none h-20 text-sm"
                  placeholder="Biographie du médecin"
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
      {showModal && modalMode === 'view' && selectedMedecin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="bg-green-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Dr. {selectedMedecin.prenom} {selectedMedecin.nom}
                </h2>
                <p className="text-green-100">{selectedMedecin.specialite}</p>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-green-800 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedMedecin.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{selectedMedecin.telephone}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">N° d'ordre</p>
                  <p className="font-medium">{selectedMedecin.numeroOrdre || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expérience</p>
                  <p className="font-medium">{selectedMedecin.experience ? `${selectedMedecin.experience} ans` : '-'}</p>
                </div>
              </div>

              {selectedMedecin.biographie && (
                <div>
                  <p className="text-sm text-muted-foreground">Biographie</p>
                  <p className="font-medium">{selectedMedecin.biographie}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Date d'inscription</p>
                <p className="font-medium">
                  {selectedMedecin.created_at
                    ? new Date(selectedMedecin.created_at).toLocaleDateString('fr-FR')
                    : '-'}
                </p>
              </div>
            </div>

            <div className="border-t p-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => openEditModal(selectedMedecin)}>
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
                Êtes-vous sûr de vouloir supprimer ce médecin ? Cette action ne peut pas être annulée.
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
