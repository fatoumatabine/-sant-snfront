import React, { useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, X, Eye, Phone, Stethoscope, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { validateSenegalPhoneNumber, validateEmail, ValidationMessages } from '@/lib/validation';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

interface Secretaire {
  id: string;
  prenom: string;
  nom: string;
  email?: string;
  telephone: string;
  medecinId?: string;
  medecinAssigne?: string;
  created_at?: string;
}

export const AdminSecretairesCRUD: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [medecinFilter, setMedecinFilter] = useState('');
  const [createdFilter, setCreatedFilter] = useState<'all' | 'today' | 'month' | 'year'>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSecretaire, setSelectedSecretaire] = useState<Secretaire | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    password: '',
    medecinAssigne: ''
  });

  // États pour les erreurs de validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-secretaires'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/admin/secretaires');
        return response.data || [];
      } catch {
        toast.error('Erreur lors du chargement');
        return [];
      }
    }
  });

  const { data: medecins = [] } = useQuery({
    queryKey: ['medecins-list'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/admin/medecins');
        return response.data || [];
      } catch {
        return [];
      }
    }
  });

  const medecinNameById = new Map(
    (medecins || []).map((m: any) => [String(m.id), `Dr. ${m.prenom} ${m.nom}`.trim()])
  );

  const secretaires = (data || []).map((s: any) => ({
    medecinId: s.medecinId ? s.medecinId.toString() : '',
    medecinAssigne:
      (typeof s.medecin?.user?.name === 'string' && s.medecin.user.name.trim()) ||
      ((s.medecin?.prenom || s.medecin?.nom) ? `Dr. ${[s.medecin?.prenom, s.medecin?.nom].filter(Boolean).join(' ')}` : '') ||
      (s.medecinId ? medecinNameById.get(String(s.medecinId)) || '' : ''),
    id: s.id.toString(),
    nom: s.nom,
    prenom: s.prenom,
    email: s.user?.email,
    telephone: s.telephone,
    created_at: s.createdAt || s.user?.createdAt
  }));

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiService.post('/admin/secretaires', data);
    },
    onSuccess: () => {
      toast.success('Secrétaire créée avec succès');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la création');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiService.put(`/admin/secretaires/${selectedSecretaire?.id}`, data);
    },
    onSuccess: () => {
      toast.success('Secrétaire mise à jour avec succès');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiService.delete(`/admin/secretaires/${id}`);
    },
    onSuccess: () => {
      toast.success('Secrétaire supprimée avec succès');
      setDeleteConfirm(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  });

  const medecinsAssignes = [...new Set(secretaires.filter((s) => s.medecinAssigne).map((s) => s.medecinAssigne as string))];

  const filtered = secretaires.filter((s) => {
    const matchesSearch =
      `${s.prenom} ${s.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const isAssigned = !!s.medecinAssigne;
    const matchesAssigned =
      assignedFilter === 'all' ||
      (assignedFilter === 'assigned' && isAssigned) ||
      (assignedFilter === 'unassigned' && !isAssigned);

    const matchesMedecin = !medecinFilter || s.medecinAssigne === medecinFilter;

    const createdAt = s.created_at ? new Date(s.created_at) : null;
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

    return matchesSearch && matchesAssigned && matchesMedecin && matchesCreated;
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
      medecinAssigne: ''
    });
    setFieldErrors({});
    setSelectedSecretaire(null);
    setShowModal(false);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (secretaire: Secretaire) => {
    setSelectedSecretaire(secretaire);
    setFormData({
      prenom: secretaire.prenom,
      nom: secretaire.nom,
      email: secretaire.email || '',
      telephone: secretaire.telephone,
      password: '',
      medecinAssigne: secretaire.medecinId || ''
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const openViewModal = (secretaire: Secretaire) => {
    setSelectedSecretaire(secretaire);
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

    const payload: Record<string, string | null | undefined> = {
      prenom: formData.prenom.trim(),
      nom: formData.nom.trim(),
      email: formData.email.trim().toLowerCase(),
      telephone: formData.telephone.trim(),
      medecinId: formData.medecinAssigne || undefined
    };
    if (formData.password.trim()) {
      payload.password = formData.password;
    }

    if (modalMode === 'create') {
      createMutation.mutate(payload);
    } else if (modalMode === 'edit') {
      if (!formData.medecinAssigne) {
        payload.medecinId = null;
      }
      updateMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total Secrétaires</p>
              <p className="text-3xl font-bold text-foreground">{secretaires.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Users className="h-7 w-7 text-primary" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Avec Médecin</p>
              <p className="text-3xl font-bold text-foreground">{secretaires.filter(s => s.medecinAssigne).length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-sky-100 flex items-center justify-center">
              <Stethoscope className="h-7 w-7 text-sky-700" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Sans Médecin</p>
              <p className="text-3xl font-bold text-foreground">{secretaires.filter(s => !s.medecinAssigne).length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Users className="h-7 w-7 text-amber-700" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Ce Mois</p>
              <p className="text-3xl font-bold text-foreground">{secretaires.filter(s => {
                const created = s.created_at ? new Date(s.created_at) : null;
                const now = new Date();
                return created && created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
              }).length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar className="h-7 w-7 text-emerald-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Header with Glassmorphic Background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-2xl -z-10" />
        
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-display">
                  Gestion des Secrétaires
                </h1>
                <p className="text-muted-foreground">
                  {filtered.length} secrétaire{filtered.length > 1 ? 's' : ''} au total
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={openCreateModal} 
            className="gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Ajouter une secrétaire
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-border focus:border-primary rounded-xl bg-background transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 outline-none"
          />
        </div>
        <select
          value={assignedFilter}
          onChange={(e) => setAssignedFilter(e.target.value as 'all' | 'assigned' | 'unassigned')}
          className="w-full px-3 py-3 border-2 border-border focus:border-primary rounded-xl bg-background"
        >
          <option value="all">Tous statuts</option>
          <option value="assigned">Avec médecin</option>
          <option value="unassigned">Sans médecin</option>
        </select>
        <select
          value={medecinFilter}
          onChange={(e) => setMedecinFilter(e.target.value)}
          className="w-full px-3 py-3 border-2 border-border focus:border-primary rounded-xl bg-background"
        >
          <option value="">Tous médecins</option>
          {medecinsAssignes.map((medecin) => (
            <option key={medecin} value={medecin}>
              {medecin}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <select
            value={createdFilter}
            onChange={(e) => setCreatedFilter(e.target.value as 'all' | 'today' | 'month' | 'year')}
            className="w-full px-3 py-3 border-2 border-border focus:border-primary rounded-xl bg-background"
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
              setAssignedFilter('all');
              setMedecinFilter('');
              setCreatedFilter('all');
            }}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modern Table with Enhanced Design */}
      <div className="rounded-2xl border border-border bg-white shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border bg-muted/30">
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Nom</th>
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Email</th>
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Téléphone</th>
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Médecin assigné</th>
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Date création</th>
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-muted-foreground">Chargement...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Aucune secrétaire trouvée</p>
                        <p className="text-sm text-muted-foreground">Essayez un autre terme de recherche</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((secretaire, idx) => (
                  <tr 
                    key={secretaire.id} 
                    className="border-b border-border hover:bg-primary/5 transition-colors duration-200 group"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                            <span className="font-semibold text-sm">
                              {secretaire.prenom[0]}{secretaire.nom[0]}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{secretaire.prenom} {secretaire.nom}</p>
                          <p className="text-xs text-muted-foreground">Secrétaire médicale</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">{secretaire.email || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{secretaire.telephone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {secretaire.medecinAssigne ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          <Stethoscope className="h-3 w-3" />
                          {secretaire.medecinAssigne}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {secretaire.created_at
                          ? new Date(secretaire.created_at).toLocaleDateString('fr-FR', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => openViewModal(secretaire)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => openEditModal(secretaire)}
                          className="p-2 hover:bg-primary/10 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Éditer"
                        >
                          <Edit2 className="h-4 w-4 text-primary" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(secretaire.id)}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-all duration-200 hover:scale-110"
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

        {/* Table Footer with Pagination */}
        {filtered.length > 0 && (
          <div className="border-t border-border bg-muted/20 px-6 py-4">
            <TablePaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startItem={startItem}
              endItem={endItem}
              onPageChange={setCurrentPage}
              className="mt-0"
            />
          </div>
        )}
      </div>

      {/* Modal Créer/Éditer - Enhanced with Glassmorphism */}
      {showModal && modalMode !== 'view' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-slide-up">
            <div className="sticky top-0 bg-gradient-to-br from-primary to-primary/80 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {modalMode === 'create' ? 'Ajouter une secrétaire' : 'Éditer la secrétaire'}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {modalMode === 'create' ? 'Remplissez les informations ci-dessous' : 'Modifiez les informations'}
                  </p>
                </div>
              </div>
              <button 
                onClick={resetForm} 
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Prénom <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full border-2 border-border focus:border-primary rounded-xl px-4 py-3 bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10 outline-none"
                    placeholder="Entrez le prénom"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Nom <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full border-2 border-border focus:border-primary rounded-xl px-4 py-3 bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10 outline-none"
                    placeholder="Entrez le nom"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border-2 border-border focus:border-primary rounded-xl px-4 py-3 bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10 outline-none"
                    placeholder="exemple@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Téléphone <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full border-2 border-border focus:border-primary rounded-xl px-4 py-3 bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10 outline-none"
                    placeholder="+221 XX XXX XX XX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Mot de passe {modalMode === 'edit' && (
                    <span className="text-muted-foreground font-normal text-xs ml-2">
                      (laisser vide pour ne pas changer)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border-2 border-border focus:border-primary rounded-xl px-4 py-3 bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Médecin assigné
                </label>
                <select
                  value={formData.medecinAssigne}
                  onChange={(e) => setFormData({ ...formData, medecinAssigne: e.target.value })}
                  className="w-full border-2 border-border focus:border-primary rounded-xl px-4 py-3 bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10 outline-none cursor-pointer"
                >
                  <option value="">-- Optionnel --</option>
                  {medecins.map(m => (
                    <option key={m.id} value={m.id}>
                      Dr. {m.prenom} {m.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 bg-muted/30 backdrop-blur-md border-t-2 border-border p-6 flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="hover:scale-105 transition-transform duration-200"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Traitement...
                  </>
                ) : (
                  <>
                    {modalMode === 'create' ? 'Créer la secrétaire' : 'Mettre à jour'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Voir détails - Enhanced */}
      {showModal && modalMode === 'view' && selectedSecretaire && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-slide-up">
            <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 text-white p-8">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <span className="font-bold text-2xl">
                      {selectedSecretaire.prenom[0]}{selectedSecretaire.nom[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-1">
                      {selectedSecretaire.prenom} {selectedSecretaire.nom}
                    </h2>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/20 text-white border-white/30">
                        Secrétaire médicale
                      </Badge>
                      <div className="flex items-center gap-1 text-white/80 text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Active
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={resetForm} 
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Email</p>
                  <p className="font-medium text-foreground">{selectedSecretaire.email || '-'}</p>
                </div>
                <div className="space-y-2 p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Téléphone</p>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    {selectedSecretaire.telephone}
                  </p>
                </div>
              </div>

              <div className="space-y-2 p-4 bg-primary/5 border-2 border-primary/20 rounded-xl">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Médecin assigné
                </p>
                <p className="font-medium text-foreground">
                  {selectedSecretaire.medecinAssigne || (
                    <span className="text-muted-foreground italic">Aucun médecin assigné</span>
                  )}
                </p>
              </div>

              <div className="space-y-2 p-4 bg-muted/30 rounded-xl">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date d'inscription
                </p>
                <p className="font-medium text-foreground">
                  {selectedSecretaire.created_at
                    ? new Date(selectedSecretaire.created_at).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : '-'}
                </p>
              </div>
            </div>

            <div className="border-t-2 border-border p-6 bg-muted/20 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => openEditModal(selectedSecretaire)}
                className="hover:scale-105 transition-transform duration-200"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Éditer
              </Button>
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="hover:scale-105 transition-transform duration-200"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression - Enhanced */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-slide-up">
            <div className="relative bg-gradient-to-br from-destructive to-destructive/80 text-white p-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                  <Trash2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Confirmer la suppression</h2>
                  <p className="text-white/80 text-sm">Cette action est irréversible</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="mb-6 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-xl">
                <p className="text-foreground font-medium mb-2">
                  ⚠️ Attention
                </p>
                <p className="text-muted-foreground text-sm">
                  Vous êtes sur le point de supprimer définitivement cette secrétaire de votre système. 
                  Toutes les données associées seront perdues.
                </p>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Cette action ne peut pas être annulée</p>
                </div>
              </div>
            </div>
            
            <div className="border-t-2 border-border p-6 bg-muted/20 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 hover:scale-105 transition-transform duration-200"
                disabled={deleteMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="flex-1 hover:scale-105 transition-transform duration-200 shadow-lg"
              >
                {deleteMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer définitivement
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
