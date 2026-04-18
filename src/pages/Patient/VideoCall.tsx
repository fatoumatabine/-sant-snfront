import React, { useEffect, useMemo, useState } from 'react';
import { Video, ExternalLink, PhoneOff, AlertCircle, Calendar, Clock, FileEdit, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/config/api-endpoints';

interface VideoSession {
  room: string;
  joinUrl: string;
}

interface VideoPresence {
  timeoutSeconds: number;
  patientOnline: boolean;
  medecinOnline: boolean;
  patientLastSeenAt: string | null;
  medecinLastSeenAt: string | null;
}

interface VideoCallAppointment {
  rendezVousId: number;
  consultationId: number | null;
  consultationStatus: 'en_attente' | 'en_cours' | 'termine' | null;
  rendezVousStatus: string;
  dateLabel: string;
  heureLabel: string;
  counterpartLabel: string;
  scheduledAt: number;
}

interface DiscoveryState {
  isLookingUp: boolean;
  nextOnlineAppointment: VideoCallAppointment | null;
  startableAppointment: VideoCallAppointment | null;
  message: string | null;
}

const unwrapApiData = <T,>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

const unwrapApiList = (payload: any): any[] => {
  const data = unwrapApiData<unknown>(payload);
  return Array.isArray(data) ? data : [];
};

const resolveDisplayName = (entity: any, fallback: string): string => {
  if (!entity || typeof entity !== 'object') {
    return fallback;
  }

  const prenom = typeof entity.prenom === 'string' ? entity.prenom.trim() : '';
  const nom = typeof entity.nom === 'string' ? entity.nom.trim() : '';
  const fullName = `${prenom} ${nom}`.trim();

  if (fullName) {
    return fullName;
  }

  const userName = typeof entity.user?.name === 'string' ? entity.user.name.trim() : '';
  return userName || fallback;
};

const buildCurrentUserDisplayName = (user: any, isMedecin: boolean): string => {
  const prenom = typeof user?.prenom === 'string' ? user.prenom.trim() : '';
  const nom = typeof user?.nom === 'string' ? user.nom.trim() : '';
  const fullName = `${prenom} ${nom}`.trim();

  if (!fullName) {
    return isMedecin ? 'Médecin' : 'Patient';
  }

  return isMedecin ? `Dr. ${fullName}` : fullName;
};

const buildJitsiUrl = (joinUrl: string, params: { displayName: string; email?: string | null }): string => {
  const url = new URL(joinUrl);
  const hashParams = [
    'config.prejoinPageEnabled=false',
    'config.requireDisplayName=false',
    'config.disableDeepLinking=true',
    `userInfo.displayName=${encodeURIComponent(JSON.stringify(params.displayName))}`,
  ];

  if (params.email) {
    hashParams.push(`userInfo.email=${encodeURIComponent(JSON.stringify(params.email))}`);
  }

  url.hash = hashParams.join('&');
  return url.toString();
};

const toTimestamp = (dateValue?: string, heureValue?: string): number => {
  if (!dateValue) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(`${dateValue}T${heureValue || '00:00'}`).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
};

const normalizeVideoAppointments = (items: any[], isMedecin: boolean): VideoCallAppointment[] =>
  items
    .filter((item) => item?.type === 'en_ligne')
    .map((item) => ({
      rendezVousId: Number(item.id),
      consultationId:
        typeof item.consultation?.id === 'number' ? item.consultation.id : null,
      consultationStatus:
        item.consultation?.statut === 'en_attente' ||
        item.consultation?.statut === 'en_cours' ||
        item.consultation?.statut === 'termine'
          ? item.consultation.statut
          : null,
      rendezVousStatus: typeof item.statut === 'string' ? item.statut : '',
      dateLabel: typeof item.date === 'string' ? item.date : '',
      heureLabel: typeof item.heure === 'string' ? item.heure : '',
      counterpartLabel: isMedecin
        ? resolveDisplayName(item.patient, 'Patient')
        : resolveDisplayName(item.medecin, 'Médecin'),
      scheduledAt: toTimestamp(item.date, item.heure),
    }))
    .filter((item) => Number.isFinite(item.rendezVousId))
    .sort((first, second) => first.scheduledAt - second.scheduledAt);

export const VideoCall: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const consultationId = searchParams.get('consultationId');
  const [session, setSession] = useState<VideoSession | null>(null);
  const [presence, setPresence] = useState<VideoPresence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmbeddedMeeting, setShowEmbeddedMeeting] = useState(false);
  const [discovery, setDiscovery] = useState<DiscoveryState>({
    isLookingUp: false,
    nextOnlineAppointment: null,
    startableAppointment: null,
    message: null,
  });

  const isMedecin = user?.role === 'medecin';
  const pageTitle = useMemo(() => (isMedecin ? 'Téléconsultation médecin' : 'Appel vidéo patient'), [isMedecin]);
  const baseVideoPath = isMedecin ? '/medecin/video-call' : '/patient/video-call';
  const appointmentsPath = isMedecin ? '/medecin/rendez-vous' : '/patient/rendez-vous';
  const contextAppointment = discovery.startableAppointment || discovery.nextOnlineAppointment;
  const participantDisplayName = useMemo(() => buildCurrentUserDisplayName(user, isMedecin), [isMedecin, user]);
  const isLocalSession = typeof window !== 'undefined'
    && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  const effectiveJoinUrl = useMemo(() => {
    if (!session?.joinUrl) return null;
    return buildJitsiUrl(session.joinUrl, {
      displayName: participantDisplayName,
      email: user?.email || null,
    });
  }, [participantDisplayName, session?.joinUrl, user?.email]);

  const openMeetingInNewTab = () => {
    if (!effectiveJoinUrl) return;
    const openedWindow = window.open(effectiveJoinUrl, '_blank', 'noopener,noreferrer');
    if (!openedWindow) {
      window.location.href = effectiveJoinUrl;
    }
  };

  const discoverActiveCall = async () => {
    setIsLoading(true);
    setError(null);
    setDiscovery({
      isLookingUp: true,
      nextOnlineAppointment: null,
      startableAppointment: null,
      message: null,
    });

    try {
      const endpoint = isMedecin
        ? API_ENDPOINTS.rendezVous.medecin.list
        : API_ENDPOINTS.rendezVous.patient.list;

      const response = await apiService.get(endpoint);
      const appointments = normalizeVideoAppointments(unwrapApiList(response), isMedecin);
      const activeAppointment = appointments.find(
        (appointment) =>
          appointment.consultationId !== null && appointment.consultationStatus === 'en_cours'
      );

      if (activeAppointment?.consultationId) {
        navigate(`${baseVideoPath}?consultationId=${activeAppointment.consultationId}`, {
          replace: true,
        });
        return;
      }

      const startableAppointment = isMedecin
        ? appointments.find(
            (appointment) =>
              appointment.rendezVousStatus === 'paye' &&
              (appointment.consultationId === null || appointment.consultationStatus === 'en_attente')
          ) || null
        : null;

      const nextOnlineAppointment = appointments[0] || null;

      let message: string;
      if (!nextOnlineAppointment) {
        message = "Aucune consultation vidéo active ou planifiée n'a été trouvée.";
      } else if (isMedecin && startableAppointment) {
        message = `Aucun appel actif. Vous pouvez démarrer la consultation de ${startableAppointment.counterpartLabel}.`;
      } else if (!isMedecin && nextOnlineAppointment.rendezVousStatus === 'paye') {
        message = 'Le médecin doit démarrer la consultation avant que vous puissiez rejoindre la salle.';
      } else if (nextOnlineAppointment.rendezVousStatus === 'confirme') {
        message = "Ce rendez-vous en ligne doit encore être payé avant l'ouverture de la salle vidéo.";
      } else if (nextOnlineAppointment.rendezVousStatus === 'en_attente') {
        message = 'Le rendez-vous en ligne est encore en attente de validation.';
      } else {
        message = "Aucun appel vidéo actif n'est disponible actuellement.";
      }

      setDiscovery({
        isLookingUp: false,
        nextOnlineAppointment,
        startableAppointment,
        message,
      });
    } catch (err: any) {
      const message = err?.message || 'Impossible de retrouver une consultation vidéo active';
      setError(message);
      setDiscovery({
        isLookingUp: false,
        nextOnlineAppointment: null,
        startableAppointment: null,
        message: null,
      });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async () => {
    if (!consultationId) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const endpoint = isMedecin
        ? `/consultations/${consultationId}/video-session/start`
        : `/consultations/${consultationId}/video-session`;
      const response: any = isMedecin
        ? await apiService.post(endpoint, {})
        : await apiService.get(endpoint);
      const data = unwrapApiData<VideoSession>(response);
      if (!data?.joinUrl) {
        throw new Error('Session vidéo non disponible');
      }
      setSession(data);
      setShowEmbeddedMeeting(!isLocalSession);
    } catch (err: any) {
      const message = err?.message || 'Impossible de charger la session vidéo';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConsultation = async () => {
    if (!discovery.startableAppointment) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: any = await apiService.post(
        `/consultations/rendez-vous/${discovery.startableAppointment.rendezVousId}/start`,
        {}
      );
      const data = unwrapApiData<{ id?: number }>(response);
      if (!data?.id) {
        throw new Error('Consultation vidéo introuvable après démarrage');
      }

      navigate(`${baseVideoPath}?consultationId=${data.id}`, { replace: true });
    } catch (err: any) {
      const message = err?.message || 'Impossible de démarrer la consultation vidéo';
      setError(message);
      toast.error(message);
      setIsLoading(false);
    }
  };

  const refreshPresence = async () => {
    if (!consultationId) return;
    try {
      await apiService.post(`/consultations/${consultationId}/video-session/ping`, {});
      const response: any = await apiService.get(`/consultations/${consultationId}/video-session/presence`);
      const data = unwrapApiData<VideoPresence>(response);
      setPresence(data);
    } catch {
      // silent polling failure
    }
  };

  useEffect(() => {
    if (!consultationId) {
      void discoverActiveCall();
      return;
    }

    setDiscovery({
      isLookingUp: false,
      nextOnlineAppointment: null,
      startableAppointment: null,
      message: null,
    });
    void loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId, isMedecin]);

  useEffect(() => {
    if (!consultationId) return;
    refreshPresence();
    const interval = window.setInterval(refreshPresence, 5000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display">{pageTitle}</h1>
        <p className="text-muted-foreground">
          Consultation ID: {consultationId || 'N/A'}
        </p>
      </div>

      <div className="card-health max-w-4xl mx-auto">
        <div className="flex items-start gap-3 mb-4">
          <Video className="h-5 w-5 text-primary mt-1" />
          <div>
            <p className="font-semibold">Session vidéo sécurisée</p>
            <p className="text-sm text-muted-foreground">
              La session est liée à la consultation active.
            </p>
          </div>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Chargement de la session...</p>}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!consultationId && !error && (
          <div className="space-y-4">
            {discovery.isLookingUp && (
              <p className="text-sm text-muted-foreground">Recherche d'une consultation vidéo active...</p>
            )}

            {!discovery.isLookingUp && discovery.message && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span>{discovery.message}</span>
              </div>
            )}

            {!discovery.isLookingUp && contextAppointment && (
              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="font-semibold">
                  {isMedecin ? 'Prochaine téléconsultation' : 'Rendez-vous vidéo détecté'}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {contextAppointment.dateLabel || 'Date non disponible'}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {contextAppointment.heureLabel || 'Heure non disponible'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isMedecin ? 'Patient' : 'Médecin'}: {contextAppointment.counterpartLabel}
                </p>
              </div>
            )}

            {!discovery.isLookingUp && (
              <div className="flex flex-wrap gap-2">
                {isMedecin && discovery.startableAppointment && (
                  <Button onClick={handleStartConsultation} disabled={isLoading} className="gap-2">
                    <Video className="h-4 w-4" />
                    Démarrer la consultation
                  </Button>
                )}
                <Button
                  variant={isMedecin && discovery.startableAppointment ? 'outline' : 'default'}
                  onClick={() => navigate(appointmentsPath)}
                >
                  Voir les rendez-vous
                </Button>
              </div>
            )}
          </div>
        )}

        {session?.joinUrl && (
          <div className="space-y-4">
            {presence && (
            <div className="rounded-lg border border-border p-3 text-sm flex flex-wrap gap-3">
                <span className={presence.medecinOnline ? 'text-green-700' : 'text-gray-500'}>
                  Médecin: {presence.medecinOnline ? 'En ligne' : 'Hors ligne'}
                </span>
                <span className={presence.patientOnline ? 'text-green-700' : 'text-gray-500'}>
                  Patient: {presence.patientOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
            )}

            {!showEmbeddedMeeting && effectiveJoinUrl && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div className="flex items-start gap-2 text-sm text-amber-900">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Connexion recommandée dans un nouvel onglet</p>
                    <p>
                      Sur l'environnement local, Jitsi est plus fiable en ouverture directe qu'en iframe intégrée.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={openMeetingInNewTab} className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir la salle vidéo
                  </Button>
                  <Button variant="outline" onClick={() => setShowEmbeddedMeeting(true)}>
                    Afficher dans cette page
                  </Button>
                </div>
              </div>
            )}

            {showEmbeddedMeeting && effectiveJoinUrl && (
              <div className="rounded-lg border border-border overflow-hidden">
                <iframe
                  title="Teleconsultation"
                  src={effectiveJoinUrl}
                  className="w-full h-[70vh]"
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <a href={effectiveJoinUrl || session.joinUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir dans un nouvel onglet
                </Button>
              </a>
              {showEmbeddedMeeting && (
                <Button variant="outline" onClick={() => setShowEmbeddedMeeting(false)}>
                  Revenir au mode conseillé
                </Button>
              )}
              <Button variant="destructive" onClick={() => window.history.back()} className="gap-2">
                <PhoneOff className="h-4 w-4" />
                Quitter l'appel
              </Button>
            </div>

            {isMedecin && consultationId && (
              <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Actions post-consultation</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => navigate(`/medecin/ordonnances?consultationId=${consultationId}`)}
                    className="gap-2"
                  >
                    <FileEdit className="h-4 w-4" />
                    Prescrire une ordonnance
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/medecin/patients')}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Voir mes patients
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
