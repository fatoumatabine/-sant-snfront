import { useEffect, useState } from 'react';
import { BriefcaseMedical, Mail, Phone, Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    specialite: '',
    telephone: '',
    adresse: '',
    tarif_consultation: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
          specialite: payload.specialite || '',
          telephone: payload.telephone || '',
          adresse: payload.adresse || '',
          tarif_consultation:
            payload.tarif_consultation !== null && payload.tarif_consultation !== undefined
              ? String(payload.tarif_consultation)
              : '',
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
        specialite: formData.specialite.trim(),
        telephone: formData.telephone.trim(),
        adresse: formData.adresse.trim() || undefined,
        tarif_consultation: formData.tarif_consultation.trim()
          ? Number(formData.tarif_consultation)
          : undefined,
      });

      const updatedProfile = unwrapData<Partial<MedecinProfilePayload>>(response);
      setProfile((current) => (current ? { ...current, ...updatedProfile } : current));

      if (user) {
        setUser({
          ...user,
          prenom: formData.prenom.trim(),
          nom: formData.nom.trim(),
          telephone: formData.telephone.trim(),
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display">Profil médecin</h1>
        <p className="text-muted-foreground">
          Gérez les informations professionnelles visibles dans votre espace.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="card-health space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Informations personnelles</h2>
              <p className="text-sm text-muted-foreground">Nom affiché, contact et identité du compte.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="medecin-prenom">Prénom</Label>
              <Input
                id="medecin-prenom"
                value={formData.prenom}
                onChange={(event) => setFormData((current) => ({ ...current, prenom: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medecin-nom">Nom</Label>
              <Input
                id="medecin-nom"
                value={formData.nom}
                onChange={(event) => setFormData((current) => ({ ...current, nom: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medecin-email">Email du compte</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="medecin-email"
                  value={profile?.user?.email || user?.email || ''}
                  className="pl-9"
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medecin-telephone">Téléphone</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="medecin-telephone"
                  value={formData.telephone}
                  className="pl-9"
                  onChange={(event) => setFormData((current) => ({ ...current, telephone: event.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card-health space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-3 text-accent">
              <BriefcaseMedical className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Informations professionnelles</h2>
              <p className="text-sm text-muted-foreground">Spécialité, tarif et adresse du cabinet.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medecin-specialite">Spécialité</Label>
              <Input
                id="medecin-specialite"
                value={formData.specialite}
                onChange={(event) => setFormData((current) => ({ ...current, specialite: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medecin-tarif">Tarif consultation</Label>
              <Input
                id="medecin-tarif"
                type="number"
                min="0"
                step="0.01"
                value={formData.tarif_consultation}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, tarif_consultation: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medecin-adresse">Adresse</Label>
              <Textarea
                id="medecin-adresse"
                value={formData.adresse}
                onChange={(event) => setFormData((current) => ({ ...current, adresse: event.target.value }))}
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isSaving || !profile} className="gap-2">
        <Save className="h-4 w-4" />
        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
      </Button>
    </div>
  );
};
