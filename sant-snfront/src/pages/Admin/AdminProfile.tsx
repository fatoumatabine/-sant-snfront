import React, { useEffect, useState } from 'react';
import { BadgeCheck, Mail, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileSectionCard, ProfileShell } from '@/components/profile/ProfileShell';
import { useAuthStore } from '@/store/authStore';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { toast } from 'sonner';
import { joinFullName, splitFullName } from '@/lib/user-name';

type AuthMeResponse = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'medecin' | 'patient' | 'secretaire';
  avatarUrl?: string | null;
};

export const AdminProfile: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.prenom || '',
    lastName: user?.nom || '',
    email: user?.email || '',
    avatarUrl: user?.avatar || null,
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.get(API_ENDPOINTS.auth.me);
        const data = (response.data || response) as AuthMeResponse;
        const parsedName = splitFullName(data.name);

        setProfileData({
          firstName: parsedName.firstName || user?.prenom || '',
          lastName: parsedName.lastName || user?.nom || '',
          email: data.email || user?.email || '',
          avatarUrl: data.avatarUrl || user?.avatar || null,
        });
      } catch {
        toast.error('Impossible de charger le profil');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.email, user?.nom, user?.prenom]);

  const handleSaveChanges = async () => {
    if (!profileData.firstName.trim() || !profileData.lastName.trim() || !profileData.email.trim()) {
      toast.error('Prénom, nom et email sont obligatoires');
      return;
    }

    try {
      setIsSavingProfile(true);
      const payload = {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email.trim(),
        avatarUrl: profileData.avatarUrl,
      };

      const response = await apiService.put(API_ENDPOINTS.auth.updateMe, payload);
      const updated = (response.data || response) as AuthMeResponse;
      const parsedName = splitFullName(updated.name || joinFullName(payload.firstName, payload.lastName));

      if (user) {
        setUser({
          ...user,
          email: updated.email,
          prenom: parsedName.firstName || payload.firstName,
          nom: parsedName.lastName || payload.lastName,
          avatar: updated.avatarUrl || undefined,
        });
      }

      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword) {
      toast.error('Tous les champs mot de passe sont obligatoires');
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (securityData.newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setIsSavingPassword(true);
      await apiService.put(API_ENDPOINTS.auth.changePassword, {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
      });

      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Mot de passe modifié avec succès');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie');
  };

  return (
    <ProfileShell
      role="admin"
      title="Profil administrateur"
      description="Gardez vos informations de compte à jour et sécurisez l’accès à l’espace d’administration."
      name={joinFullName(profileData.firstName, profileData.lastName) || 'Administrateur'}
      email={profileData.email || user?.email || ''}
      avatar={profileData.avatarUrl || user?.avatar || null}
      onAvatarChange={(value) => setProfileData((prev) => ({ ...prev, avatarUrl: value }))}
      avatarDisabled={isSavingProfile}
      onLogout={handleLogout}
      heroStats={[
        { label: 'Accès', value: 'Administration' },
        { label: 'Photo', value: profileData.avatarUrl ? 'Ajoutée' : 'À compléter' },
        { label: 'Sécurité', value: 'Compte protégé' },
      ]}
      summaryItems={[
        { icon: Mail, label: 'Email', value: profileData.email || '-' },
        { icon: BadgeCheck, label: 'Rôle', value: 'Administrateur' },
        { icon: ShieldCheck, label: 'Statut', value: 'Accès complet' },
      ]}
      helperNote={
        <p>
          Cette photo est reprise dans la navigation et facilite l’identification visuelle dans tout l’espace
          d’administration.
        </p>
      }
      personalTab={
        <ProfileSectionCard
          icon={User}
          title="Informations du compte"
          description="Modifiez votre identité et votre photo sans quitter l’espace d’administration."
          footer={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                disabled={isSavingProfile}
                onClick={() =>
                  setProfileData({
                    firstName: user?.prenom || '',
                    lastName: user?.nom || '',
                    email: user?.email || '',
                    avatarUrl: user?.avatar || null,
                  })
                }
              >
                Annuler
              </Button>
              <Button className="flex-1 rounded-2xl" onClick={handleSaveChanges} disabled={isSavingProfile}>
                {isSavingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          }
        >
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Chargement du profil...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-firstName">Prénom</Label>
                <Input
                  id="admin-firstName"
                  className="h-12 rounded-2xl"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-lastName">Nom</Label>
                <Input
                  id="admin-lastName"
                  className="h-12 rounded-2xl"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  className="h-12 rounded-2xl"
                  value={profileData.email}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          )}
        </ProfileSectionCard>
      }
      securityTab={
        <ProfileSectionCard
          icon={ShieldCheck}
          title="Sécurité et accès"
          description="Utilisez votre mot de passe actuel pour confirmer toute mise à jour sensible."
          footer={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                className="flex-1 rounded-2xl"
                disabled={isSavingPassword}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 rounded-2xl"
                onClick={handlePasswordChange}
                disabled={isSavingPassword}
              >
                {isSavingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-current-password">Mot de passe actuel</Label>
              <Input
                id="admin-current-password"
                type="password"
                className="h-12 rounded-2xl"
                value={securityData.currentPassword}
                onChange={(e) => setSecurityData((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-new-password">Nouveau mot de passe</Label>
                <Input
                  id="admin-new-password"
                  type="password"
                  className="h-12 rounded-2xl"
                  value={securityData.newPassword}
                  onChange={(e) => setSecurityData((prev) => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="admin-confirm-password"
                  type="password"
                  className="h-12 rounded-2xl"
                  value={securityData.confirmPassword}
                  onChange={(e) => setSecurityData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </ProfileSectionCard>
      }
    />
  );
};
