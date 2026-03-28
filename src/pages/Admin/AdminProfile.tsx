import React, { useEffect, useState } from 'react';
import { User, Lock, LogOut, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ProfileTab = 'personal' | 'security';

export const AdminProfile: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.prenom || '',
    lastName: user?.nom || '',
    email: user?.email || '',
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
        const data = response.data || response;

        const fullName = data.name || '';
        const [firstName, ...rest] = fullName.split(' ');
        const lastName = rest.join(' ');

        setProfileData({
          firstName: firstName || user?.prenom || '',
          lastName: lastName || user?.nom || '',
          email: data.email || user?.email || '',
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
      setIsSaving(true);
      const payload = {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email.trim(),
      };

      const response = await apiService.put(API_ENDPOINTS.auth.updateMe, payload);
      const updated = (response.data || response) as {
        id: string;
        email: string;
        name: string;
        role: 'admin' | 'medecin' | 'patient' | 'secretaire';
      };

      const fullName = updated.name || `${payload.firstName} ${payload.lastName}`;
      const [firstName, ...rest] = fullName.split(' ');
      const lastName = rest.join(' ');

      if (user) {
        setUser({
          ...user,
          email: updated.email,
          prenom: firstName || payload.firstName,
          nom: lastName || payload.lastName,
        });
      }

      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
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

    try {
      setIsSaving(true);
      await apiService.put(API_ENDPOINTS.auth.changePassword, {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
      });

      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Mot de passe modifié avec succès');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setIsSaving(false);
    }
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
                <AvatarImage src={`https://i.pravatar.cc/150?u=${user?.email}`} />
                <AvatarFallback className="bg-primary text-white text-2xl">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{user?.prenom} {user?.nom}</h3>
                <p className="text-sm text-muted-foreground capitalize">{user?.role || 'admin'}</p>
                <Badge variant="outline" className="mt-2"><Mail className="h-3 w-3 mr-1" />{user?.email}</Badge>
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
                  <h2 className="text-xl font-semibold mb-1">Profil administrateur</h2>
                  <p className="text-sm text-muted-foreground">Modifiez vos informations et sauvegardez.</p>
                </div>
                <Separator />
                {isLoading ? (
                  <div className="py-10 text-center text-muted-foreground">Chargement du profil...</div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setProfileData({
                            firstName: user?.prenom || '',
                            lastName: user?.nom || '',
                            email: user?.email || '',
                          });
                        }}
                        className="flex-1"
                        disabled={isSaving}
                      >
                        Annuler
                      </Button>
                      <Button className="flex-1" onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
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
                  <p className="text-sm text-muted-foreground">Utilisez votre mot de passe actuel pour confirmer.</p>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={securityData.currentPassword}
                      onChange={(e) => setSecurityData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData((prev) => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                      className="flex-1"
                      disabled={isSaving}
                    >
                      Annuler
                    </Button>
                    <Button className="flex-1" onClick={handlePasswordChange} disabled={isSaving}>
                      {isSaving ? 'Mise à jour...' : 'Mettre à jour'}
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
