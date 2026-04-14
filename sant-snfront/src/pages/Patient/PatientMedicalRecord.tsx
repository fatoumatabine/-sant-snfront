import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, ClipboardList, HeartPulse, Pill, ShieldAlert, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';

interface MedicalRecordPayload {
  patient: {
    id: number;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    adresse?: string | null;
    dateNaissance?: string | null;
    groupeSanguin?: string | null;
    diabete: boolean;
    hypertension: boolean;
    hepatite: boolean;
    autresPathologies?: string | null;
  };
  summary: {
    consultationsCount: number;
    ordonnancesCount: number;
    upcomingAppointmentsCount: number;
    triageCount: number;
    lastConsultationAt?: string | null;
  };
  recentConsultations: Array<{
    id: string;
    date: string;
    diagnostic?: string | null;
    notes?: string | null;
    ordonnanceId?: number | null;
    medecin: {
      prenom: string;
      nom: string;
      specialite: string;
    } | null;
  }>;
}

const unwrapData = <T,>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Non renseigné';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const PatientMedicalRecord = () => {
  const [record, setRecord] = useState<MedicalRecordPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecord = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.get(API_ENDPOINTS.patient.dossierMedical);
      setRecord(unwrapData<MedicalRecordPayload>(response));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger le dossier médical');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecord();
  }, [loadRecord]);

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Chargement du dossier médical...</div>;
  }

  if (error || !record) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="card-health border border-destructive/20 bg-destructive/5">
          <h1 className="text-2xl font-bold">Dossier médical</h1>
          <p className="mt-2 text-sm text-destructive">{error || 'Le dossier médical est indisponible.'}</p>
        </div>
        <Button onClick={() => void loadRecord()} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  const conditions = [
    record.patient.diabete ? 'Diabète' : null,
    record.patient.hypertension ? 'Hypertension' : null,
    record.patient.hepatite ? 'Hépatite' : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Dossier médical</h1>
          <p className="text-muted-foreground">
            Vue synthétique de votre profil de santé et de vos dernières consultations.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/patient/consultations">Voir tout l’historique</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card-health">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Consultations</p>
              <p className="text-2xl font-semibold">{record.summary.consultationsCount}</p>
            </div>
          </div>
        </div>

        <div className="card-health">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-3 text-accent">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ordonnances</p>
              <p className="text-2xl font-semibold">{record.summary.ordonnancesCount}</p>
            </div>
          </div>
        </div>

        <div className="card-health">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-warning/10 p-3 text-warning">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">RDV à venir</p>
              <p className="text-2xl font-semibold">{record.summary.upcomingAppointmentsCount}</p>
            </div>
          </div>
        </div>

        <div className="card-health">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-destructive/10 p-3 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Évaluations IA</p>
              <p className="text-2xl font-semibold">{record.summary.triageCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card-health space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Profil de santé</h2>
              <p className="text-sm text-muted-foreground">Informations utiles pour vos prochains soins.</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Nom complet</p>
              <p className="font-medium">{record.patient.prenom} {record.patient.nom}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Date de naissance</p>
              <p className="font-medium">{formatDate(record.patient.dateNaissance)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Groupe sanguin</p>
              <p className="font-medium">{record.patient.groupeSanguin || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Téléphone</p>
              <p className="font-medium">{record.patient.telephone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
              <p className="font-medium">{record.patient.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Dernière consultation</p>
              <p className="font-medium">{formatDate(record.summary.lastConsultationAt)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Adresse</p>
            <p className="font-medium">{record.patient.adresse || 'Non renseignée'}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pathologies suivies</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {conditions.length === 0 && !record.patient.autresPathologies && (
                <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                  Aucun antécédent déclaré
                </span>
              )}
              {conditions.map((condition) => (
                <span key={condition} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                  {condition}
                </span>
              ))}
              {record.patient.autresPathologies && (
                <span className="rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">
                  {record.patient.autresPathologies}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="card-health space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-3 text-accent">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Consultations récentes</h2>
              <p className="text-sm text-muted-foreground">Les 5 dernières consultations enregistrées.</p>
            </div>
          </div>

          {record.recentConsultations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Aucune consultation enregistrée pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {record.recentConsultations.map((consultation) => (
                <div key={consultation.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {consultation.medecin
                          ? `Dr. ${consultation.medecin.prenom} ${consultation.medecin.nom}`
                          : 'Médecin non renseigné'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {consultation.medecin?.specialite || 'Spécialité indisponible'}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(consultation.date)}</span>
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Diagnostic:</span>{' '}
                      {consultation.diagnostic || 'Non renseigné'}
                    </p>
                    {consultation.notes && (
                      <p className="text-muted-foreground">{consultation.notes}</p>
                    )}
                    {consultation.ordonnanceId && (
                      <p className="text-primary">Ordonnance liée à cette consultation</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
