import React, { useEffect, useState } from 'react';
import { ArrowRight, Mail, Palette, ShieldCheck, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileSectionCard, ProfileShell } from '@/components/profile/ProfileShell';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { joinFullName, splitFullName } from '@/lib/user-name';
import { apiService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

type AuthMeResponse = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'medecin' | 'patient' | 'secretaire';
  avatarUrl?: string | null;
};

export const SecretaireProfile: React.FC = () => {
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
  const [passwordData, setPasswordData] = useState({
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
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Impossible de charger le profil');
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [user?.avatar, user?.email, user?.nom, user?.prenom]);

  const handleSaveProfile = async () => {
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

      toast.success('Profil secrétaire mis à jour');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Tous les champs mot de passe sont obligatoires');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setIsSavingPassword(true);
      await apiService.put(API_ENDPOINTS.auth.changePassword, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Mot de passe mis à jour');
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
      role="secretaire"
      title="Profil secrétariat"
      description="Personnalisez votre identité de compte et gardez un accès sécurisé à votre espace de gestion des rendez-vous."
      name={joinFullName(profileData.firstName, profileData.lastName) || 'Secrétaire'}
      email={profileData.email || user?.email || ''}
      avatar={profileData.avatarUrl || user?.avatar || null}
      onAvatarChange={(value) => setProfileData((prev) => ({ ...prev, avatarUrl: value }))}
      avatarDisabled={isSavingProfile}
      onLogout={handleLogout}
      heroStats={[
        { label: 'Rôle', value: 'Secrétariat' },
        { label: 'Photo', value: profileData.avatarUrl ? 'Ajoutée' : 'À compléter' },
        { label: 'Préférences', value: 'Disponibles' },
      ]}
      summaryItems={[
        { icon: Mail, label: 'Email', value: profileData.email || '-' },
        { icon: ShieldCheck, label: 'Accès', value: 'Gestion des rendez-vous' },
        { icon: Palette, label: 'Personnalisation', value: 'Thème et langue' },
      ]}
      helperNote={
        <div className="space-y-3">
          <p>Les réglages d’apparence, de langue et d’interface restent disponibles dans la page paramètres.</p>
          <Button asChild variant="outline" className="w-full rounded-2xl">
            <Link to="/secretaire/parametres">
              Ouvrir les paramètres
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      }
      personalTab={
        <ProfileSectionCard
          icon={User}
          title="Informations du compte"
          description="Mettez à jour votre identité visible dans l’interface de secrétariat et dans la navigation."
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
              <Button className="flex-1 rounded-2xl" disabled={isSavingProfile} onClick={handleSaveProfile}>
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
                <Label htmlFor="secretaire-first-name">Prénom</Label>
                <Input
                  id="secretaire-first-name"
                  className="h-12 rounded-2xl"
                  value={profileData.firstName}
                  onChange={(event) => setProfileData((prev) => ({ ...prev, firstName: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretaire-last-name">Nom</Label>
                <Input
                  id="secretaire-last-name"
                  className="h-12 rounded-2xl"
                  value={profileData.lastName}
                  onChange={(event) => setProfileData((prev) => ({ ...prev, lastName: event.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="secretaire-email">Email</Label>
                <Input
                  id="secretaire-email"
                  type="email"
                  className="h-12 rounded-2xl"
                  value={profileData.email}
                  onChange={(event) => setProfileData((prev) => ({ ...prev, email: event.target.value }))}
                />
              </div>
            </div>
          )}
        </ProfileSectionCard>
      }
      securityTab={
        <ProfileSectionCard
          icon={ShieldCheck}
          title="Sécurité"
          description="Protégez votre accès au secrétariat avec un mot de passe robuste et mis à jour."
          footer={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                disabled={isSavingPassword}
                onClick={() =>
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  })
                }
              >
                Annuler
              </Button>
              <Button className="flex-1 rounded-2xl" disabled={isSavingPassword} onClick={handlePasswordChange}>
                {isSavingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secretaire-current-password">Mot de passe actuel</Label>
              <Input
                id="secretaire-current-password"
                type="password"
                className="h-12 rounded-2xl"
                value={passwordData.currentPassword}
                onChange={(event) =>
                  setPasswordData((prev) => ({ ...prev, currentPassword: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="secretaire-new-password">Nouveau mot de passe</Label>
                <Input
                  id="secretaire-new-password"
                  type="password"
                  className="h-12 rounded-2xl"
                  value={passwordData.newPassword}
                  onChange={(event) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretaire-confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="secretaire-confirm-password"
                  type="password"
                  className="h-12 rounded-2xl"
                  value={passwordData.confirmPassword}
                  onChange={(event) =>
                    setPasswordData((prev) => ({ ...prev, confirmPassword: event.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        </ProfileSectionCard>
      }
    />
  );
};
