import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Landmark,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Stethoscope,
} from 'lucide-react';
import { toast } from 'sonner';
import { FacturePatient, type FacturePaiement } from '@/components/Common/FacturePatient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMontant } from '@/lib/currency';
import { downloadBlobFile } from '@/lib/downloadFile';
import { apiService } from '@/services/api';

type RdvStatus = 'en_attente' | 'confirme' | 'annule' | 'termine' | 'paye';
type RdvType = 'en_ligne' | 'presentiel' | 'prestation';
type PaiementStatus = 'en_attente' | 'paye' | 'rembourse' | 'echec' | 'echoue';

interface PatientRdv {
  id: number;
  numero: string;
  date: string;
  heure: string;
  motif?: string;
  type: RdvType;
  statut: RdvStatus;
  medecin?: {
    prenom?: string;
    nom?: string;
    specialite?: string;
    tarif_consultation?: number;
    user?: {
      name?: string;
    };
  };
  consultation?: {
    id: number;
    statut: 'en_attente' | 'en_cours' | 'termine';
  } | null;
}

interface PaiementDetail {
  id: number;
  patientId: number;
  rendezVousId: number;
  montant: number;
  methode: string;
  statut: PaiementStatus;
  transactionId: string | null;
  date_paiement: string | null;
  createdAt: string;
  paymentSession?: {
    provider?: string;
    token?: string;
    status?: string;
    checkoutUrl?: string;
    expiresInSeconds?: number;
  };
  rendezVous?: {
    numero?: string;
    date?: string;
    heure?: string;
    motif?: string;
    type?: RdvType;
    statut?: RdvStatus;
    medecin?: {
      prenom?: string;
      nom?: string;
      specialite?: string;
      user?: {
        name?: string;
      };
    };
  };
}

type PaymentMethodId =
  | 'mobile_money'
  | 'wave'
  | 'orange_money'
  | 'carte_bancaire'
  | 'especes'
  | 'virement';

interface PaymentMethodOption {
  id: PaymentMethodId;
  label: string;
  description: string;
  kind: 'online' | 'offline';
  icon: React.ReactNode;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'mobile_money',
    label: 'Mobile Money',
    description: 'Paiement rapide sur mobile compatible PayDunya.',
    kind: 'online',
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    id: 'wave',
    label: 'Wave',
    description: 'Paiement instantané via Wave Sénégal.',
    kind: 'online',
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    id: 'orange_money',
    label: 'Orange Money',
    description: 'Validation en ligne depuis votre portefeuille Orange Money.',
    kind: 'online',
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    id: 'carte_bancaire',
    label: 'Carte bancaire',
    description: 'Paiement sécurisé par carte sur la passerelle en ligne.',
    kind: 'online',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: 'especes',
    label: 'Espèces',
    description: 'Validation locale avec code de confirmation à 6 chiffres.',
    kind: 'offline',
    icon: <Banknote className="h-5 w-5" />,
  },
  {
    id: 'virement',
    label: 'Virement bancaire',
    description: 'Suivi manuel avec confirmation par code sécurisé.',
    kind: 'offline',
    icon: <Landmark className="h-5 w-5" />,
  },
];

const extractPayload = <T,>(response: unknown): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    const level1 = (response as { data: unknown }).data;
    if (level1 && typeof level1 === 'object' && 'data' in level1) {
      return (level1 as { data: T }).data;
    }
    return level1 as T;
  }
  return response as T;
};

const isPaydunyaActivationError = (message: string) => {
  const lower = message.toLowerCase();
  return (
    (lower.includes('paydunya') && lower.includes('activ')) ||
    (lower.includes('paydunya') && lower.includes('confirm')) ||
    lower.includes('logon to your paydunya account')
  );
};

const getPaiementStatusBadge = (statut: PaiementStatus) => {
  const config = {
    paye: {
      label: 'Payé',
      className: 'border-green-200 bg-green-100 text-green-700',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    en_attente: {
      label: 'En attente',
      className: 'border-orange-200 bg-orange-100 text-orange-700',
      icon: <Clock3 className="h-3.5 w-3.5" />,
    },
    echec: {
      label: 'Échec',
      className: 'border-red-200 bg-red-100 text-red-700',
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
    echoue: {
      label: 'Échec',
      className: 'border-red-200 bg-red-100 text-red-700',
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
    rembourse: {
      label: 'Remboursé',
      className: 'border-slate-200 bg-slate-100 text-slate-700',
      icon: <RefreshCw className="h-3.5 w-3.5" />,
    },
  } satisfies Record<PaiementStatus, { label: string; className: string; icon: React.ReactNode }>;

  const current = config[statut] || config.en_attente;

  return (
    <Badge variant="outline" className={`gap-1 ${current.className}`}>
      {current.icon}
      {current.label}
    </Badge>
  );
};

const getRdvStatusBadge = (statut: RdvStatus) => {
  switch (statut) {
    case 'confirme':
      return <span className="badge-success">Confirmé</span>;
    case 'en_attente':
      return <span className="badge-warning">En attente</span>;
    case 'termine':
      return <span className="badge-info">Terminé</span>;
    case 'annule':
      return <span className="badge-danger">Annulé</span>;
    case 'paye':
      return <span className="badge-info">Payé</span>;
    default:
      return <span className="badge-warning">{statut}</span>;
  }
};

export const PatientPaiementCheckout: React.FC = () => {
  const { rendezVousId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const handledReturnRef = useRef(false);

  const numericRendezVousId = Number(rendezVousId);
  const isValidRendezVousId = Number.isInteger(numericRendezVousId) && numericRendezVousId > 0;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('mobile_money');
  const [hasManualMethodSelection, setHasManualMethodSelection] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('123456');
  const [forceAlreadyPaid, setForceAlreadyPaid] = useState(false);
  const [currentSession, setCurrentSession] = useState<{
    id: number;
    methode: string;
    provider?: string;
    checkoutUrl?: string;
  } | null>(null);
  const [factureOuverte, setFactureOuverte] = useState<FacturePaiement | null>(null);
  const [providerIssue, setProviderIssue] = useState<string | null>(null);

  const {
    data: rendezVous,
    isLoading: isLoadingRendezVous,
    error: rendezVousError,
    refetch: refetchRendezVous,
  } = useQuery({
    queryKey: ['patient-payment-rendez-vous', numericRendezVousId],
    enabled: isValidRendezVousId,
    queryFn: async () => {
      const response = await apiService.get(`/rendez-vous/${numericRendezVousId}`);
      return extractPayload<PatientRdv>(response);
    },
    retry: false,
  });

  const {
    data: paiements = [],
    isLoading: isLoadingPaiements,
    error: paiementsError,
    refetch: refetchPaiements,
  } = useQuery({
    queryKey: ['patient-payment-list-for-checkout'],
    enabled: isValidRendezVousId,
    queryFn: async () => {
      const response = await apiService.get('/patient/mes-paiements');
      return extractPayload<PaiementDetail[]>(response);
    },
  });

  const paiement = useMemo(
    () => paiements.find((item) => item.rendezVousId === numericRendezVousId) || null,
    [numericRendezVousId, paiements]
  );

  const resolvedRendezVous = useMemo<PatientRdv | null>(() => {
    if (rendezVous) {
      return rendezVous;
    }

    if (!paiement?.rendezVous) {
      return null;
    }

    return {
      id: paiement.rendezVousId,
      numero: paiement.rendezVous.numero || `RDV-${paiement.rendezVousId}`,
      date: paiement.rendezVous.date || paiement.createdAt,
      heure: paiement.rendezVous.heure || '--:--',
      motif: paiement.rendezVous.motif,
      type: paiement.rendezVous.type || 'presentiel',
      statut:
        paiement.rendezVous.statut ||
        (paiement.statut === 'paye' ? 'paye' : 'confirme'),
      medecin: {
        prenom: paiement.rendezVous.medecin?.prenom,
        nom: paiement.rendezVous.medecin?.nom,
        specialite: paiement.rendezVous.medecin?.specialite,
        user: {
          name: paiement.rendezVous.medecin?.user?.name,
        },
      },
      consultation: null,
    };
  }, [paiement, rendezVous]);

  useEffect(() => {
    if (!hasManualMethodSelection && paiement?.methode) {
      setSelectedMethod(paiement.methode as PaymentMethodId);
    }
  }, [hasManualMethodSelection, paiement?.methode]);

  const methodOption = useMemo(
    () => PAYMENT_METHODS.find((option) => option.id === selectedMethod) || PAYMENT_METHODS[0],
    [selectedMethod]
  );

  const isOnlineMethod = methodOption.kind === 'online';
  const activePaiementId = paiement?.id ?? currentSession?.id ?? null;
  const currentCheckoutUrl =
    currentSession?.methode === selectedMethod ? currentSession.checkoutUrl : undefined;
  const isOnlineSimulationSession =
    currentSession?.methode === selectedMethod && currentSession?.provider === 'online-simulator';
  const montant = paiement?.montant ?? resolvedRendezVous?.medecin?.tarif_consultation ?? 15000;
  const medecinNom =
    resolvedRendezVous?.medecin?.prenom && resolvedRendezVous?.medecin?.nom
      ? `Dr. ${resolvedRendezVous.medecin.prenom} ${resolvedRendezVous.medecin.nom}`
      : resolvedRendezVous?.medecin?.user?.name || 'Médecin';
  const videoCallHref =
    resolvedRendezVous?.consultation?.id && resolvedRendezVous.consultation.statut === 'en_cours'
      ? `/patient/video-call?consultationId=${resolvedRendezVous.consultation.id}`
      : '/patient/video-call';

  const paymentSummary: FacturePaiement | null = paiement
    ? {
        id: paiement.id,
        montant: paiement.montant,
        methode: paiement.methode,
        statut: paiement.statut,
        transactionId: paiement.transactionId,
        date_paiement: paiement.date_paiement,
        createdAt: paiement.createdAt,
        rendezVous: {
          date: resolvedRendezVous?.date || paiement.rendezVous?.date || paiement.createdAt,
          heure: resolvedRendezVous?.heure || paiement.rendezVous?.heure || '--:--',
          motif: resolvedRendezVous?.motif || paiement.rendezVous?.motif || 'Consultation médicale',
          medecin: {
            user: {
              name: medecinNom,
            },
            specialite:
              resolvedRendezVous?.medecin?.specialite ||
              paiement.rendezVous?.medecin?.specialite ||
              'Consultation médicale',
          },
        },
      }
    : null;

  const initiateMutation = useMutation({
    mutationFn: async (methode: PaymentMethodId) =>
      apiService.post('/paiements/initier', {
        rendezVousId: numericRendezVousId,
        methode,
      }),
    onSuccess: (response) => {
      const data = extractPayload<PaiementDetail>(response);
      const nextSession = {
        id: Number(data.id),
        methode: data.methode,
        provider: data.paymentSession?.provider,
        checkoutUrl: data.paymentSession?.checkoutUrl,
      };
      setCurrentSession(nextSession);
      setProviderIssue(null);
      if (data.paymentSession?.provider === 'online-simulator' && data.paymentSession?.checkoutUrl) {
        toast.success('Simulation de paiement prête. Redirection en cours...');
        window.location.assign(data.paymentSession.checkoutUrl);
        return;
      }

      toast.success(
        methodOption.kind === 'online'
          ? 'Session de paiement prête'
          : 'Paiement préparé. Vous pouvez confirmer avec le code à 6 chiffres.'
      );
      void refetchPaiements();
      void refetchRendezVous();
    },
    onError: (error: Error, methode) => {
      if (/déjà payé/i.test(error.message)) {
        setForceAlreadyPaid(true);
        toast.info('Ce rendez-vous est déjà payé. Mise à jour de la page en cours.');
        void refetchPaiements();
        void refetchRendezVous();
        return;
      }

      const isOnlineAttempt = PAYMENT_METHODS.find((option) => option.id === methode)?.kind === 'online';
      if (isOnlineAttempt && isPaydunyaActivationError(error.message || '')) {
        setProviderIssue(error.message);
      } else if (isOnlineAttempt) {
        setProviderIssue(null);
      }

      toast.error(error.message || 'Impossible d’initialiser le paiement');
    },
  });

  const verifyOnlineMutation = useMutation({
    mutationFn: async (paiementId: number) => apiService.post(`/paiements/${paiementId}/payer`, {}),
    onSuccess: (response) => {
      const data = extractPayload<PaiementDetail>(response);

      if (data.statut === 'paye') {
        toast.success('Paiement confirmé avec succès');
      } else if (data.statut === 'echoue' || data.statut === 'echec') {
        toast.error('Le paiement en ligne a échoué ou a été annulé');
      } else {
        toast.info('Le paiement est toujours en attente de confirmation');
      }

      void refetchPaiements();
      void refetchRendezVous();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Impossible de vérifier le statut du paiement');
    },
  });

  const confirmOfflineMutation = useMutation({
    mutationFn: async ({ paiementId, code }: { paiementId: number; code: string }) =>
      apiService.post(`/paiements/${paiementId}/payer`, { confirmationCode: code }),
    onSuccess: () => {
      toast.success('Paiement confirmé');
      void refetchPaiements();
      void refetchRendezVous();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Paiement refusé');
    },
  });

  const simulateMutation = useMutation({
    mutationFn: async () =>
      apiService.post('/paiements/simuler', { rendezVousId: numericRendezVousId }),
    onSuccess: () => {
      toast.success('Paiement simulé avec succès');
      void refetchPaiements();
      void refetchRendezVous();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Simulation échouée');
    },
  });

  useEffect(() => {
    if (handledReturnRef.current) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const paymentResult = params.get('payment');

    if (!paymentResult) {
      return;
    }

    const paiementIdFromQuery = Number(params.get('paiementId'));
    const targetPaiementId =
      Number.isInteger(paiementIdFromQuery) && paiementIdFromQuery > 0
        ? paiementIdFromQuery
        : activePaiementId;

    if (paymentResult === 'success' && !targetPaiementId) {
      return;
    }

    handledReturnRef.current = true;
    navigate(location.pathname, { replace: true });

    if (paymentResult === 'cancelled') {
      toast.error('Paiement annulé. Vous pouvez reprendre le processus depuis cette page.');
      void refetchPaiements();
      return;
    }

    if (paymentResult === 'success' && targetPaiementId) {
      verifyOnlineMutation.mutate(targetPaiementId);
    }
  }, [
    activePaiementId,
    location.pathname,
    location.search,
    navigate,
    refetchPaiements,
    verifyOnlineMutation,
  ]);

  const handleInitPayment = () => {
    initiateMutation.mutate(selectedMethod);
  };

  const handleContinueToCheckout = () => {
    if (!currentCheckoutUrl) {
      toast.error('Aucune URL de paiement disponible pour cette session');
      return;
    }

    window.location.assign(currentCheckoutUrl);
  };

  const handleVerifyOnlinePayment = () => {
    if (!activePaiementId) {
      toast.error('Initialisez d’abord le paiement');
      return;
    }

    verifyOnlineMutation.mutate(activePaiementId);
  };

  const handleConfirmOfflinePayment = () => {
    if (!activePaiementId) {
      toast.error('Préparez d’abord le paiement hors ligne');
      return;
    }

    if (!/^\d{6}$/.test(confirmationCode)) {
      toast.error('Le code de confirmation doit contenir 6 chiffres');
      return;
    }

    confirmOfflineMutation.mutate({
      paiementId: activePaiementId,
      code: confirmationCode,
    });
  };

  const handleDownloadInvoice = async () => {
    if (!paiement) {
      toast.error('Facture indisponible');
      return;
    }

    try {
      const blob = await apiService.getBlob(`/paiements/${paiement.id}/facture/download`);
      downloadBlobFile(blob, `facture-${paiement.id}.pdf`);
      toast.success('Facture téléchargée');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Téléchargement impossible');
    }
  };

  useEffect(() => {
    if (!isOnlineMethod && providerIssue) {
      setProviderIssue(null);
    }
  }, [isOnlineMethod, providerIssue]);

  if (!isValidRendezVousId) {
    return (
      <Card className="card-health p-8">
        <h1 className="text-xl font-semibold">Paiement introuvable</h1>
        <p className="mt-2 text-muted-foreground">
          Le rendez-vous demandé est invalide. Revenez à vos rendez-vous pour relancer le paiement.
        </p>
        <div className="mt-6">
          <Link to="/patient/rendez-vous">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour aux rendez-vous
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (isLoadingRendezVous || isLoadingPaiements) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-primary rounded-2xl p-6 md:p-8 text-white">
          <Skeleton className="h-8 w-72 bg-white/20" />
          <Skeleton className="mt-3 h-4 w-96 bg-white/15" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="card-health p-6">
            <Skeleton className="h-56 w-full" />
          </Card>
          <Card className="card-health p-6">
            <Skeleton className="h-[420px] w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if ((rendezVousError && !resolvedRendezVous) || !resolvedRendezVous) {
    return (
      <Card className="card-health p-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
          <div>
            <h1 className="text-xl font-semibold">Impossible de charger cette page de paiement</h1>
            <p className="mt-2 text-muted-foreground">
              {(rendezVousError as Error | undefined)?.message ||
                (!paiement ? 'Rendez-vous introuvable' : null) ||
                'Une erreur est survenue pendant le chargement.'}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => {
            void refetchRendezVous();
          }}>
            Réessayer
          </Button>
          <Link to="/patient/rendez-vous">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour aux rendez-vous
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const displayRendezVous = resolvedRendezVous;
  const isAlreadyPaid = forceAlreadyPaid || paiement?.statut === 'paye' || displayRendezVous.statut === 'paye';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-primary rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-white/25 bg-white/10 text-white">
                Paiement patient
              </Badge>
              {paiement ? getPaiementStatusBadge(paiement.statut) : <span className="badge-warning">À configurer</span>}
              {getRdvStatusBadge(displayRendezVous.statut)}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Paiement du rendez-vous #{displayRendezVous.numero}
              </h1>
              <p className="mt-2 text-white/80">
                Gérez toute la transaction depuis cette page sans popup: choix du mode, confirmation et suivi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/patient/rendez-vous">
              <Button variant="secondary" className="gap-2 border-white/20 bg-white text-primary hover:bg-white/90">
                <ArrowLeft className="h-4 w-4" />
                Mes rendez-vous
              </Button>
            </Link>
            <Link to="/patient/paiements">
              <Button variant="outline" className="gap-2 border-white/30 bg-transparent text-white hover:bg-white/10">
                <Receipt className="h-4 w-4" />
                Historique
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="card-health p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Résumé du rendez-vous</p>
              <h2 className="mt-1 text-xl font-semibold">{medecinNom}</h2>
              <p className="text-sm text-muted-foreground">
                {displayRendezVous.medecin?.specialite || 'Consultation médicale'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Stethoscope className="h-6 w-6" />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm font-medium">
                {new Date(displayRendezVous.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Heure</span>
              <span className="text-sm font-medium">{displayRendezVous.heure}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="text-sm font-medium capitalize">{displayRendezVous.type.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Montant</span>
              <span className="text-lg font-bold text-primary">{formatMontant(montant)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{displayRendezVous.motif || 'Consultation médicale standard'}</span>
            </div>
            {paiement?.transactionId && (
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-primary/70">Référence transaction</p>
                <p className="mt-1 font-mono text-sm">{paiement.transactionId}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">Espace de paiement sécurisé</p>
                <p className="mt-1 text-emerald-700/90">
                  Toutes les actions de paiement sont centralisées ici, avec suivi du statut et justificatif.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {paiementsError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Les détails du paiement existant n’ont pas pu être relus automatiquement. Vous pouvez tout de même
              poursuivre depuis cette page.
            </div>
          ) : null}

          {isAlreadyPaid ? (
            <Card className="card-health p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-4 inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    Paiement finalisé
                  </div>
                  <h2 className="text-2xl font-semibold">Votre rendez-vous est déjà réglé</h2>
                  <p className="mt-2 text-muted-foreground">
                    Vous pouvez maintenant consulter le reçu, télécharger la facture ou revenir à l’historique de vos paiements.
                  </p>
                  {displayRendezVous.type === 'en_ligne' ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      La vidéo est disponible dès que le médecin démarre la consultation. En attendant, vous pouvez ouvrir l’espace vidéo pour suivre l’état de la session.
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3">
                  {displayRendezVous.type === 'en_ligne' ? (
                    <Link to={videoCallHref}>
                      <Button variant="outline" className="gap-2">
                        <Stethoscope className="h-4 w-4" />
                        {displayRendezVous.consultation?.id && displayRendezVous.consultation.statut === 'en_cours'
                          ? 'Rejoindre la vidéo'
                          : 'Ouvrir la salle d’attente'}
                      </Button>
                    </Link>
                  ) : null}
                  <Button variant="outline" className="gap-2" onClick={() => paymentSummary && setFactureOuverte(paymentSummary)}>
                    <Receipt className="h-4 w-4" />
                    Voir la facture
                  </Button>
                  <Button className="gap-2" onClick={handleDownloadInvoice}>
                    <CreditCard className="h-4 w-4" />
                    Télécharger le PDF
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <Card className="card-health p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-primary">Étape 1</p>
                    <h2 className="mt-1 text-2xl font-semibold">Choisissez votre mode de paiement</h2>
                    <p className="mt-2 text-muted-foreground">
                      Sélectionnez le canal qui vous convient. La suite du parcours reste entièrement sur cette page.
                    </p>
                  </div>
                  <div className="hidden rounded-2xl bg-primary/10 p-3 text-primary md:flex">
                    <CreditCard className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {PAYMENT_METHODS.map((option) => {
                    const isActive = selectedMethod === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedMethod(option.id);
                          setHasManualMethodSelection(true);
                          setProviderIssue(null);
                        }}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          isActive
                            ? 'border-primary bg-primary/10 shadow-[0_18px_36px_-24px_rgba(13,148,136,0.85)]'
                            : 'border-border/60 bg-background hover:border-primary/35 hover:bg-primary/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                              isActive ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {option.icon}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              option.kind === 'online'
                                ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                                : 'border-amber-200 bg-amber-50 text-amber-700'
                            }
                          >
                            {option.kind === 'online' ? 'En ligne' : 'Hors ligne'}
                          </Badge>
                        </div>
                        <h3 className="mt-4 font-semibold">{option.label}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="card-health p-6 md:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-sm font-medium text-primary">Étape 2</p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      {isOnlineMethod ? 'Finalisez le paiement sécurisé' : 'Confirmez le règlement hors ligne'}
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      {isOnlineMethod
                        ? 'Une session de paiement sera préparée pour vous rediriger vers la plateforme sécurisée ou la simulation locale.'
                        : 'Préparez le paiement, puis entrez le code de confirmation à 6 chiffres pour le valider.'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isOnlineMethod
                        ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }
                  >
                    {methodOption.label}
                  </Badge>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          {methodOption.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{methodOption.label}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{methodOption.description}</p>
                        </div>
                      </div>
                    </div>

                    {paiement?.statut === 'echoue' || paiement?.statut === 'echec' ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        La dernière tentative a échoué. Vous pouvez relancer le paiement avec cette page.
                      </div>
                    ) : null}

                    {isOnlineMethod ? (
                      <div className="space-y-4 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="mt-0.5 h-5 w-5 text-cyan-700" />
                        <div>
                          <h3 className="font-semibold text-cyan-900">Paiement en ligne sécurisé</h3>
                          <p className="mt-1 text-sm text-cyan-800/90">
                            {isOnlineSimulationSession
                              ? 'Le mode simulation locale prépare un paiement en ligne simplifié pour vos tests.'
                              : 'La page prépare la session, puis vous redirige vers la plateforme partenaire pour payer.'}
                          </p>
                        </div>
                      </div>

                        {providerIssue ? (
                          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                            <p className="font-medium">Configuration du compte PayDunya requise</p>
                            <p className="mt-1">{providerIssue}</p>
                          </div>
                        ) : null}

                        {currentCheckoutUrl ? (
                          <div className="rounded-xl border border-cyan-200 bg-white p-4">
                            <p className="text-sm font-medium text-cyan-900">
                              {isOnlineSimulationSession ? 'Simulation prête' : 'Session prête'}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {isOnlineSimulationSession
                                ? 'Le parcours de test est prêt. Continuez pour valider le paiement en ligne simulé.'
                                : 'Votre lien de paiement est actif. Continuez pour ouvrir la plateforme sécurisée.'}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-3">
                              <Button
                                className="gap-2"
                                onClick={handleContinueToCheckout}
                                disabled={initiateMutation.isPending}
                              >
                                <ExternalLink className="h-4 w-4" />
                                {isOnlineSimulationSession ? 'Lancer la simulation' : 'Continuer vers la plateforme'}
                              </Button>
                              {activePaiementId ? (
                                <Button
                                  variant="outline"
                                  className="gap-2"
                                  onClick={handleVerifyOnlinePayment}
                                  disabled={verifyOnlineMutation.isPending}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                  Vérifier le statut
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-cyan-300 bg-white/70 p-4 text-sm text-cyan-900">
                            Initialisez d’abord la transaction pour générer la session de paiement.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
                        <div className="flex items-start gap-3">
                          <Banknote className="mt-0.5 h-5 w-5 text-amber-700" />
                          <div>
                            <h3 className="font-semibold text-amber-900">Validation avec code sécurisé</h3>
                            <p className="mt-1 text-sm text-amber-800/90">
                              Une fois la méthode préparée, saisissez le code reçu pour finaliser le paiement sans boîte système.
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-white p-4">
                          <label htmlFor="confirmation-code" className="text-sm font-medium text-slate-900">
                            Code de confirmation
                          </label>
                          <Input
                            id="confirmation-code"
                            value={confirmationCode}
                            onChange={(event) => setConfirmationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="123456"
                            className="mt-3 h-12 bg-white text-base tracking-[0.32em]"
                          />
                          <p className="mt-2 text-xs text-muted-foreground">
                            Le code doit contenir exactement 6 chiffres.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
                      <h3 className="font-semibold text-primary">Actions disponibles</h3>
                      <div className="mt-4 space-y-3">
                        <Button
                          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => simulateMutation.mutate()}
                          disabled={simulateMutation.isPending || displayRendezVous.statut !== 'confirme'}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {simulateMutation.isPending ? 'Simulation...' : 'Simuler le paiement (1 clic)'}
                        </Button>

                        <div className="border-t border-border/40 pt-3">
                          <p className="text-xs text-muted-foreground mb-3">Ou via le flux complet :</p>
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={handleInitPayment}
                            disabled={initiateMutation.isPending || displayRendezVous.statut !== 'confirme'}
                          >
                            <CreditCard className="h-4 w-4" />
                            {isOnlineMethod ? 'Initialiser le paiement en ligne' : 'Préparer le paiement'}
                          </Button>
                        </div>

                        {isOnlineMethod && activePaiementId ? (
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={handleVerifyOnlinePayment}
                            disabled={verifyOnlineMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4" />
                            Vérifier le statut
                          </Button>
                        ) : null}

                        {!isOnlineMethod ? (
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={handleConfirmOfflinePayment}
                            disabled={confirmOfflineMutation.isPending || displayRendezVous.statut !== 'confirme'}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Confirmer le paiement
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background p-5">
                      <h3 className="font-semibold">Informations utiles</h3>
                      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                          <span>Les méthodes en ligne passent par PayDunya avec retour automatique sur cette page.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Receipt className="mt-0.5 h-4 w-4 text-primary" />
                          <span>Une facture est disponible dès que le règlement est confirmé.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 text-primary" />
                          <span>Le paiement reste possible uniquement pour un rendez-vous au statut confirmé.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {displayRendezVous.statut !== 'confirme' ? (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Le rendez-vous doit être <strong>confirmé</strong> avant toute action de paiement.
                  </div>
                ) : null}
              </Card>
            </>
          )}
        </div>
      </div>

      {factureOuverte ? (
        <FacturePatient paiement={factureOuverte} onClose={() => setFactureOuverte(null)} />
      ) : null}
    </div>
  );
};
