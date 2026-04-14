import { useEffect, useState } from 'react';
import {
  BriefcaseMedical,
  CreditCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProfileSectionCard, ProfileShell } from '@/components/profile/ProfileShell';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { useAuthStore } from '@/store/authStore';

interface MedecinProfilePayload {
  id: number;
  prenom: string;
  nom: string;
  specialite: string;
  telephone: string;
  adresse?: string | null;
  tarif_consultation?: number | null;
  user?: {
    email?: string;
    avatarUrl?: string | null;
  };
}

const unwrapData = <T,>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

export const MedecinProfile = () => {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<MedecinProfilePayload | null>(null);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    specialite: '',
    telephone: '',
    adresse: '',
    tarif_consultation: '',
    avatarUrl: null as string | null,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiService.get(API_ENDPOINTS.medecins.profileMe);
        const payload = unwrapData<MedecinProfilePayload>(response);
        setProfile(payload);
        setFormData({
          prenom: payload.prenom || '',
          nom: payload.nom || '',
          email: payload.user?.email || user?.email || '',
          specialite: payload.specialite || '',
          telephone: payload.telephone || '',
          adresse: payload.adresse || '',
          tarif_consultation:
            payload.tarif_consultation !== null && payload.tarif_consultation !== undefined
              ? String(payload.tarif_consultation)
              : '',
          avatarUrl: payload.user?.avatarUrl || user?.avatar || null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de charger le profil');
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await apiService.put(`/medecins/${profile.id}`, {
        prenom: formData.prenom.trim(),
        nom: formData.nom.trim(),
        email: formData.email.trim(),
        specialite: formData.specialite.trim(),
        telephone: formData.telephone.trim(),
        adresse: formData.adresse.trim() || undefined,
        tarif_consultation: formData.tarif_consultation.trim()
          ? Number(formData.tarif_consultation)
          : undefined,
        avatarUrl: formData.avatarUrl,
      });

      const updatedProfile = unwrapData<Partial<MedecinProfilePayload>>(response);
      setProfile((current) => (current ? { ...current, ...updatedProfile } : current));

      if (user) {
        setUser({
          ...user,
          prenom: formData.prenom.trim(),
          nom: formData.nom.trim(),
          email: formData.email.trim(),
          telephone: formData.telephone.trim(),
          avatar: formData.avatarUrl || undefined,
        });
      }

      toast.success('Profil médecin mis à jour');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de mettre à jour le profil';
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (avatarUrl: string | null) => {
    if (!profile) {
      return;
    }

    const previousAvatar = formData.avatarUrl || user?.avatar || null;

    setFormData((current) => ({ ...current, avatarUrl }));

    if (user) {
      setUser({
        ...user,
        avatar: avatarUrl || undefined,
      });
    }

    try {
      setIsSavingAvatar(true);
      setError(null);

      const response = await apiService.put(`/medecins/${profile.id}`, {
        avatarUrl,
      });

      const updatedProfile = unwrapData<Partial<MedecinProfilePayload>>(response);
      const storedAvatar = updatedProfile.user?.avatarUrl || null;

      setProfile((current) => (current ? { ...current, ...updatedProfile } : current));
      setFormData((current) => ({ ...current, avatarUrl: storedAvatar }));

      if (user) {
        setUser({
          ...user,
          avatar: storedAvatar || undefined,
        });
      }

      toast.success(storedAvatar ? 'Photo de profil mise à jour' : 'Photo de profil supprimée');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de mettre à jour la photo';
      setError(message);
      setFormData((current) => ({ ...current, avatarUrl: previousAvatar }));

      if (user) {
        setUser({
          ...user,
          avatar: previousAvatar || undefined,
        });
      }

      toast.error(message);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
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
      setIsChangingPassword(true);
      await apiService.put(API_ENDPOINTS.auth.changePassword, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Mot de passe modifié');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de modifier le mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Chargement du profil médecin...</div>;
  }

  if (error && !profile) {
    return (
      <div className="card-health border border-destructive/20 bg-destructive/5">
        <h1 className="text-2xl font-bold">Profil médecin</h1>
        <p className="mt-2 text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <ProfileShell
      role="medecin"
      title="Profil médecin"
      description="Mettez à jour votre identité, votre photo et les informations professionnelles visibles dans tout votre espace de consultation."
      name={`${formData.prenom} ${formData.nom}`.trim() || `${user?.prenom || ''} ${user?.nom || ''}`.trim()}
      email={formData.email || user?.email || ''}
      avatar={formData.avatarUrl || user?.avatar || null}
      onAvatarChange={handleAvatarChange}
      avatarDisabled={isSaving || isSavingAvatar}
      heroStats={[
        { label: 'Spécialité', value: formData.specialite || 'À renseigner' },
        {
          label: 'Tarif',
          value: formData.tarif_consultation ? `${formData.tarif_consultation} FCFA` : 'Non défini',
        },
        { label: 'Photo', value: formData.avatarUrl ? 'Ajoutée' : 'À compléter' },
      ]}
      summaryItems={[
        { icon: Mail, label: 'Email', value: formData.email || '-' },
        { icon: Phone, label: 'Téléphone', value: formData.telephone || '-' },
        { icon: BriefcaseMedical, label: 'Spécialité', value: formData.specialite || '-' },
      ]}
      helperNote={
        <p>
          Votre photo et votre identité sont réutilisées dans le catalogue médecin, la navigation et les échanges
          internes.
        </p>
      }
      personalTab={
        <ProfileSectionCard
          icon={User}
          title="Informations du praticien"
          description="Nom, contact, spécialité et informations de cabinet visibles dans votre espace."
          footer={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                disabled={isSaving || isSavingAvatar || !profile}
                onClick={() => {
                  if (!profile) return;
                  setFormData({
                    prenom: profile.prenom || '',
                    nom: profile.nom || '',
                    email: profile.user?.email || user?.email || '',
                    specialite: profile.specialite || '',
                    telephone: profile.telephone || '',
                    adresse: profile.adresse || '',
                    tarif_consultation:
                      profile.tarif_consultation !== null && profile.tarif_consultation !== undefined
                        ? String(profile.tarif_consultation)
                        : '',
                    avatarUrl: profile.user?.avatarUrl || user?.avatar || null,
                  });
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || isSavingAvatar || !profile}
                className="flex-1 rounded-2xl"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="medecin-prenom">Prénom</Label>
                <Input
                  id="medecin-prenom"
                  className="h-12 rounded-2xl"
                  value={formData.prenom}
                  onChange={(event) => setFormData((current) => ({ ...current, prenom: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medecin-nom">Nom</Label>
                <Input
                  id="medecin-nom"
                  className="h-12 rounded-2xl"
                  value={formData.nom}
                  onChange={(event) => setFormData((current) => ({ ...current, nom: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medecin-email">Email du compte</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="medecin-email"
                    className="h-12 rounded-2xl pl-10"
                    value={formData.email}
                    onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medecin-telephone">Téléphone</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="medecin-telephone"
                    value={formData.telephone}
                    className="h-12 rounded-2xl pl-10"
                    onChange={(event) => setFormData((current) => ({ ...current, telephone: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medecin-specialite">Spécialité</Label>
                <div className="relative">
                  <BriefcaseMedical className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="medecin-specialite"
                    className="h-12 rounded-2xl pl-10"
                    value={formData.specialite}
                    onChange={(event) => setFormData((current) => ({ ...current, specialite: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medecin-tarif">Tarif consultation</Label>
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="medecin-tarif"
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-12 rounded-2xl pl-10"
                    value={formData.tarif_consultation}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, tarif_consultation: event.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medecin-adresse">Adresse du cabinet</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="medecin-adresse"
                  className="min-h-[126px] rounded-2xl pl-10"
                  value={formData.adresse}
                  onChange={(event) => setFormData((current) => ({ ...current, adresse: event.target.value }))}
                  rows={4}
                />
              </div>
            </div>
          </div>
        </ProfileSectionCard>
      }
      securityTab={
        <ProfileSectionCard
          icon={ShieldCheck}
          title="Sécurité du praticien"
          description="Changez votre mot de passe pour sécuriser vos accès au planning, aux consultations et aux ordonnances."
          footer={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                disabled={isChangingPassword}
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
              <Button
                className="flex-1 rounded-2xl"
                disabled={isChangingPassword}
                onClick={handleChangePassword}
              >
                {isChangingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medecin-current-password">Mot de passe actuel</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="medecin-current-password"
                  type="password"
                  className="h-12 rounded-2xl pl-10"
                  value={passwordData.currentPassword}
                  onChange={(event) =>
                    setPasswordData((current) => ({ ...current, currentPassword: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="medecin-new-password">Nouveau mot de passe</Label>
                <Input
                  id="medecin-new-password"
                  type="password"
                  className="h-12 rounded-2xl"
                  value={passwordData.newPassword}
                  onChange={(event) =>
                    setPasswordData((current) => ({ ...current, newPassword: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medecin-confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="medecin-confirm-password"
                  type="password"
                  className="h-12 rounded-2xl"
                  value={passwordData.confirmPassword}
                  onChange={(event) =>
                    setPasswordData((current) => ({ ...current, confirmPassword: event.target.value }))
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
