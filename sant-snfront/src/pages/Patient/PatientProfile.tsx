import React, { useEffect, useState } from 'react';
import { CalendarDays, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileSectionCard, ProfileShell } from '@/components/profile/ProfileShell';
import { apiService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { toast } from 'sonner';

type PatientProfileApi = {
  id: number;
  prenom: string;
  nom: string;
  telephone: string;
  createdAt: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: 'patient' | 'medecin' | 'secretaire' | 'admin';
    avatarUrl?: string | null;
  };
};

export const PatientProfile: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const [profileForm, setProfileForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    avatarUrl: null as string | null,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const {
    data: profile,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: async () => {
      const response: any = await apiService.get('/patient/profile');
      return (response.data || response) as PatientProfileApi;
    },
  });

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      prenom: profile.prenom || '',
      nom: profile.nom || '',
      email: profile.user?.email || '',
      telephone: profile.telephone || '',
      avatarUrl: profile.user?.avatarUrl || null,
    });
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      return apiService.put('/patient/profile', {
        prenom: profileForm.prenom.trim(),
        nom: profileForm.nom.trim(),
        email: profileForm.email.trim(),
        telephone: profileForm.telephone.trim(),
        avatarUrl: profileForm.avatarUrl,
      });
    },
    onSuccess: (response: any) => {
      const updated = (response?.data || response) as PatientProfileApi;
      if (user) {
        setUser({
          ...user,
          prenom: updated.prenom,
          nom: updated.nom,
          email: updated.user?.email || profileForm.email,
          telephone: updated.telephone,
          avatar: updated.user?.avatarUrl || undefined,
        });
      }
      toast.success('Profil mis à jour');
      refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      return apiService.put(API_ENDPOINTS.auth.changePassword, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
    },
    onSuccess: () => {
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Mot de passe modifié');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe');
    },
  });

  const handleSaveProfile = () => {
    if (!profileForm.prenom.trim() || !profileForm.nom.trim() || !profileForm.email.trim() || !profileForm.telephone.trim()) {
      toast.error('Prénom, nom, email et téléphone sont obligatoires');
      return;
    }
    updateProfileMutation.mutate();
  };

  const handleChangePassword = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Tous les champs mot de passe sont obligatoires');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    changePasswordMutation.mutate();
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie');
  };

  const createdAtLabel = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Compte en cours de chargement';

  return (
    <ProfileShell
      role="patient"
      title="Mon espace profil"
      description="Mettez à jour vos informations personnelles, ajoutez votre photo et gardez votre accès sécurisé depuis un seul écran."
      name={`${profileForm.prenom} ${profileForm.nom}`.trim() || `${user?.prenom || ''} ${user?.nom || ''}`.trim()}
      email={profileForm.email || user?.email || ''}
      avatar={profileForm.avatarUrl || user?.avatar || null}
      onAvatarChange={(value) => setProfileForm((prev) => ({ ...prev, avatarUrl: value }))}
      avatarDisabled={updateProfileMutation.isPending}
      onLogout={handleLogout}
      heroStats={[
        { label: 'Rôle', value: 'Patient' },
        { label: 'Photo', value: profileForm.avatarUrl ? 'Ajoutée' : 'À compléter' },
        { label: 'Inscription', value: createdAtLabel },
      ]}
      summaryItems={[
        { icon: Mail, label: 'Email du compte', value: profileForm.email || '-' },
        { icon: Phone, label: 'Téléphone', value: profileForm.telephone || '-' },
        { icon: CalendarDays, label: 'Créé le', value: createdAtLabel },
      ]}
      helperNote={
        <p>
          Votre photo de profil sera réutilisée dans le tableau de bord, la barre de navigation et les échanges
          internes.
        </p>
      }
      personalTab={
        <ProfileSectionCard
          icon={User}
          title="Informations personnelles"
          description="Ces données sont enregistrées dans votre dossier utilisateur et servent à personnaliser toute l’interface."
          footer={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  if (!profile) return;
                  setProfileForm({
                    prenom: profile.prenom || '',
                    nom: profile.nom || '',
                    email: profile.user?.email || '',
                    telephone: profile.telephone || '',
                    avatarUrl: profile.user?.avatarUrl || null,
                  });
                }}
                className="flex-1 rounded-2xl"
                disabled={updateProfileMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 rounded-2xl"
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          }
        >
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Chargement du profil...</div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={profileForm.prenom}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, prenom: e.target.value }))}
                    className="h-12 rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={profileForm.nom}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, nom: e.target.value }))}
                    className="h-12 rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="h-12 rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="telephone"
                      className="h-12 rounded-2xl pl-10"
                      value={profileForm.telephone}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, telephone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </ProfileSectionCard>
      }
      securityTab={
        <ProfileSectionCard
          icon={ShieldCheck}
          title="Sécurité du compte"
          description="Confirmez votre mot de passe actuel pour sécuriser tout changement important."
          footer={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                className="flex-1 rounded-2xl"
                disabled={changePasswordMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 rounded-2xl"
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                className="h-12 rounded-2xl"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  className="h-12 rounded-2xl"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="h-12 rounded-2xl"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </ProfileSectionCard>
      }
    />
  );
};
