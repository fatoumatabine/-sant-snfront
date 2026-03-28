import React, { useState } from 'react';
import {
  CreditCard,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Smartphone,
  Banknote,
  Building,
  TrendingUp,
  Receipt,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { FacturePatient, type FacturePaiement } from '@/components/Common/FacturePatient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { formatMontant } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { downloadBlobFile } from '@/lib/downloadFile';

interface Paiement {
  id: number;
  patientId: number;
  rendezVousId: number;
  montant: number;
  methode: string;
  statut: 'en_attente' | 'paye' | 'rembourse' | 'echec' | 'echoue';
  transactionId: string | null;
  date_paiement: string | null;
  createdAt: string;
  rendezVous: {
    date: string;
    heure: string;
    motif: string;
    medecin: {
      user: {
        name: string;
      };
      specialite: string;
    };
  };
}

const getMethodeLabel = (methode: string) => {
  const labels: Record<string, string> = {
    especes: 'Espèces',
    carte_bancaire: 'Carte bancaire',
    mobile_money: 'Mobile Money',
    virement: 'Virement bancaire',
    wave: 'Wave',
    orange_money: 'Orange Money'
  };
  return labels[methode] || methode;
};

const getMethodeIcon = (methode: string) => {
  switch (methode) {
    case 'mobile_money':
    case 'wave':
    case 'orange_money':
      return <Smartphone className="h-4 w-4" />;
    case 'carte_bancaire':
      return <CreditCard className="h-4 w-4" />;
    case 'especes':
      return <Banknote className="h-4 w-4" />;
    case 'virement':
      return <Building className="h-4 w-4" />;
    default:
      return <CreditCard className="h-4 w-4" />;
  }
};

const getStatutBadge = (statut: string) => {
  const config = {
    paye: {
      className: 'bg-green-100 text-green-700 border-green-200',
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: 'Payé'
    },
    en_attente: {
      className: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: <Clock className="h-3 w-3" />,
      label: 'En attente'
    },
    echec: {
      className: 'bg-red-100 text-red-700 border-red-200',
      icon: <XCircle className="h-3 w-3" />,
      label: 'Échec'
    },
    echoue: {
      className: 'bg-red-100 text-red-700 border-red-200',
      icon: <XCircle className="h-3 w-3" />,
      label: 'Échec'
    },
    rembourse: {
      className: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: <Receipt className="h-3 w-3" />,
      label: 'Remboursé'
    }
  };

  const { className, icon, label } = config[statut as keyof typeof config] || config.en_attente;

  return (
    <Badge variant="outline" className={className}>
      {icon}
      <span className="ml-1">{label}</span>
    </Badge>
  );
};

export const PatientPaiements: React.FC = () => {
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [factureOuverte, setFactureOuverte] = useState<FacturePaiement | null>(null);
  const onlineMethods = ['mobile_money', 'wave', 'orange_money', 'carte_bancaire'];

  const extractPayload = <T,>(response: any): T => {
    if (response && typeof response === 'object' && 'data' in response) {
      const level1 = (response as any).data;
      if (level1 && typeof level1 === 'object' && 'data' in level1) {
        return level1.data as T;
      }
      return level1 as T;
    }
    return response as T;
  };

  // Récupérer les paiements depuis l'API
  const { data: paiements = [], isLoading, error, refetch } = useQuery({
    queryKey: ['patient-paiements'],
    queryFn: async () => {
      const response = await apiService.get('/patient/mes-paiements');
      return (Array.isArray(response?.data) ? response.data : response?.data?.data || []) as Paiement[];
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const payMutation = useMutation({
    mutationFn: async (payload: { id: number; confirmationCode?: string }) =>
      apiService.post(`/paiements/${payload.id}/payer`, payload.confirmationCode ? { confirmationCode: payload.confirmationCode } : {}),
    onSuccess: (response) => {
      const data = extractPayload<any>(response);
      if (data?.paymentSession?.status && data?.statut !== 'paye') {
        toast.info('Paiement en attente de confirmation');
      } else {
        toast.success('Paiement confirmé');
      }
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Paiement refusé');
    },
  });

  const initOnlineMutation = useMutation({
    mutationFn: async (payload: { rendezVousId: number; methode: string }) =>
      apiService.post('/paiements/initier', payload),
  });

  const handlePayPending = async (paiement: Paiement) => {
    const isOnline = onlineMethods.includes(paiement.methode);

    if (isOnline) {
      const verifyResponse: any = await payMutation.mutateAsync({ id: paiement.id });
      const verifiedData = extractPayload<any>(verifyResponse);
      if (verifiedData?.statut === 'paye') {
        return;
      }

      const initResponse: any = await initOnlineMutation.mutateAsync({
        rendezVousId: paiement.rendezVousId,
        methode: paiement.methode,
      });
      const initData = extractPayload<any>(initResponse);
      const checkoutUrl = initData?.paymentSession?.checkoutUrl;

      if (!checkoutUrl) {
        toast.error('Impossible de récupérer une URL de paiement.');
        return;
      }

      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
      toast.success('Page de paiement ouverte. Revenez ensuite vérifier le statut.');
      return;
    }

    const code = window.prompt('Entrez le code de confirmation (6 chiffres)', '123456');
    if (!code) return;
    await payMutation.mutateAsync({ id: paiement.id, confirmationCode: code });
  };

  const handleDownloadInvoice = async (paiement: Paiement) => {
    try {
      const blob = await apiService.getBlob(`/paiements/${paiement.id}/facture/download`);
      downloadBlobFile(blob, `facture-${paiement.id}.pdf`);
      toast.success('Facture téléchargée');
    } catch (error: any) {
      toast.error(error.message || 'Téléchargement impossible');
    }
  };

  // Calculer les statistiques
  const stats = {
    total: paiements.reduce((sum, p) => sum + p.montant, 0),
    paye: paiements.filter(p => p.statut === 'paye').reduce((sum, p) => sum + p.montant, 0),
    enAttente: paiements.filter(p => p.statut === 'en_attente').reduce((sum, p) => sum + p.montant, 0),
    nbTotal: paiements.length,
    nbPaye: paiements.filter(p => p.statut === 'paye').length,
    nbEnAttente: paiements.filter(p => p.statut === 'en_attente').length
  };

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-primary rounded-2xl p-6 md:p-8 text-white">
          <h1 className="text-2xl md:text-3xl font-bold font-display mb-2">
            Mes Paiements 💳
          </h1>
          <p className="text-white/80">Gérez vos paiements et consultez l'historique</p>
        </div>

        <Card className="card-health p-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground">
              Impossible de charger vos paiements. Veuillez réessayer plus tard.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-primary rounded-2xl p-6 md:p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display mb-2">
              Mes Paiements 💳
            </h1>
            <p className="text-white/80">
              Gérez vos paiements et consultez l'historique de vos transactions
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="card-health p-6">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="card-health p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total dépensé</p>
            <p className="text-2xl font-bold">{formatMontant(stats.total)}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.nbTotal} paiements</p>
          </Card>

          <Card className="card-health p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Paiements réussis</p>
            <p className="text-2xl font-bold text-green-600">{formatMontant(stats.paye)}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.nbPaye} transactions</p>
          </Card>

          <Card className="card-health p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">En attente</p>
            <p className="text-2xl font-bold text-orange-600">{formatMontant(stats.enAttente)}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.nbEnAttente} paiements</p>
          </Card>
        </div>
      )}

      {/* Liste des paiements */}
      <Card className="card-health p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            Historique des paiements ({paiements.length})
          </h3>
          {paiements.length > 0 && (
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : paiements.length > 0 ? (
          <div className="space-y-3">
            {paiements.map((paiement) => (
              <div
                key={paiement.id}
                className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors border border-border/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">
                        {paiement.rendezVous.medecin.user.name}
                      </h4>
                      {getStatutBadge(paiement.statut)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(paiement.rendezVous.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {getMethodeIcon(paiement.methode)}
                        <span>{getMethodeLabel(paiement.methode)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        <span className="text-xs">
                          {paiement.rendezVous.medecin.specialite || 'Consultation'}
                        </span>
                      </div>

                      {paiement.transactionId && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Réf: {paiement.transactionId}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {paiement.rendezVous.motif}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-xl font-bold">{formatMontant(paiement.montant)}</p>
                    {paiement.date_paiement && (
                      <p className="text-xs text-muted-foreground">
                        Payé le {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setSelectedPaiement(paiement)}
                      >
                        <Eye className="h-4 w-4" />
                        Détails
                      </Button>
                      {paiement.statut === 'paye' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            setFactureOuverte({
                              id: paiement.id,
                              montant: paiement.montant,
                              methode: paiement.methode,
                              statut: paiement.statut,
                              transactionId: paiement.transactionId,
                              date_paiement: paiement.date_paiement,
                              createdAt: paiement.createdAt,
                              rendezVous: paiement.rendezVous,
                            })
                          }
                        >
                          <Download className="h-4 w-4" />
                          Facture
                        </Button>
                      )}
                    </div>
                    {paiement.statut === 'en_attente' && (
                      <Button
                        size="sm"
                        className="gap-2"
                        disabled={payMutation.isPending}
                        onClick={() => handlePayPending(paiement)}
                      >
                        <CreditCard className="h-4 w-4" />
                        Payer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Aucun paiement</h3>
            <p className="text-muted-foreground">
              Vous n'avez effectué aucun paiement pour le moment
            </p>
          </div>
        )}
      </Card>

      {/* Facture patient */}
      {factureOuverte && (
        <FacturePatient
          paiement={factureOuverte}
          onClose={() => setFactureOuverte(null)}
        />
      )}

      {/* Modal détails */}
      {selectedPaiement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6 relative">
            <button
              onClick={() => setSelectedPaiement(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <XCircle className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-semibold mb-4">Détails du paiement</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Montant</p>
                <p className="text-2xl font-bold">{formatMontant(selectedPaiement.montant)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <div className="mt-1">{getStatutBadge(selectedPaiement.statut)}</div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Méthode</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getMethodeIcon(selectedPaiement.methode)}
                    <span className="text-sm">{getMethodeLabel(selectedPaiement.methode)}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Médecin</p>
                <p className="font-medium">{selectedPaiement.rendezVous.medecin.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPaiement.rendezVous.medecin.specialite || 'Médecin généraliste'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Date de consultation</p>
                <p className="font-medium">
                  {new Date(selectedPaiement.rendezVous.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {selectedPaiement.transactionId && (
                <div>
                  <p className="text-sm text-muted-foreground">Référence transaction</p>
                  <p className="font-mono text-sm">{selectedPaiement.transactionId}</p>
                </div>
              )}

              {selectedPaiement.date_paiement && (
                <div>
                  <p className="text-sm text-muted-foreground">Date de paiement</p>
                  <p className="font-medium">
                    {new Date(selectedPaiement.date_paiement).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              <Button className="w-full mt-4" onClick={() => setSelectedPaiement(null)}>
                Fermer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
