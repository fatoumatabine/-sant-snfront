import React, { useEffect, useState } from 'react';
import { User, Lock, LogOut, Mail, Phone } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ProfileTab = 'personal' | 'security';

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
  };
};

export const PatientProfile: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [profileForm, setProfileForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
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
    });
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      return apiService.put('/patient/profile', {
        prenom: profileForm.prenom.trim(),
        nom: profileForm.nom.trim(),
        email: profileForm.email.trim(),
        telephone: profileForm.telephone.trim(),
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[280px_1fr] gap-6">
        <Card className="h-fit bg-white shadow-sm border-gray-200">
          <div className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${profileForm.email || user?.email}`} />
                <AvatarFallback className="bg-primary text-white text-2xl">
                  {(profileForm.prenom || user?.prenom || '?')[0]}
                  {(profileForm.nom || user?.nom || '?')[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg text-foreground">
                  {profileForm.prenom} {profileForm.nom}
                </h3>
                <p className="text-sm text-muted-foreground capitalize">patient</p>
                <Badge variant="outline" className="mt-2">
                  <Mail className="h-3 w-3 mr-1" />
                  {profileForm.email || '-'}
                </Badge>
              </div>
            </div>

            <Separator />

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('personal')}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'personal' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <User className="h-5 w-5" />
                Informations personnelles
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'security' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Lock className="h-5 w-5" />
                Mot de passe
              </button>
              <Separator className="my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </button>
            </nav>
          </div>
        </Card>

        <Card className="bg-white shadow-sm border-gray-200">
          <div className="p-8 space-y-6">
            {activeTab === 'personal' && (
              <>
                <div>
                  <h2 className="text-xl font-semibold mb-1">Mon profil patient</h2>
                  <p className="text-sm text-muted-foreground">Les informations sont lues et enregistrées depuis la base de données.</p>
                </div>
                <Separator />
                {isLoading ? (
                  <div className="py-10 text-center text-muted-foreground">Chargement du profil...</div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prenom">Prénom</Label>
                        <Input
                          id="prenom"
                          value={profileForm.prenom}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, prenom: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nom">Nom</Label>
                        <Input
                          id="nom"
                          value={profileForm.nom}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, nom: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telephone">Téléphone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="telephone"
                            className="pl-9"
                            value={profileForm.telephone}
                            onChange={(e) => setProfileForm((prev) => ({ ...prev, telephone: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {profile?.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        Compte créé le {new Date(profile.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!profile) return;
                          setProfileForm({
                            prenom: profile.prenom || '',
                            nom: profile.nom || '',
                            email: profile.user?.email || '',
                            telephone: profile.telephone || '',
                          });
                        }}
                        className="flex-1"
                        disabled={updateProfileMutation.isPending}
                      >
                        Annuler
                      </Button>
                      <Button className="flex-1" onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === 'security' && (
              <>
                <div>
                  <h2 className="text-xl font-semibold mb-1">Changer le mot de passe</h2>
                  <p className="text-sm text-muted-foreground">Entrez votre mot de passe actuel pour confirmer.</p>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                      className="flex-1"
                      disabled={changePasswordMutation.isPending}
                    >
                      Annuler
                    </Button>
                    <Button className="flex-1" onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>
                      {changePasswordMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
