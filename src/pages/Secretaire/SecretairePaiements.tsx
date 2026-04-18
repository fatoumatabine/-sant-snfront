import React, { useEffect, useMemo, useState } from 'react';
import { FacturePatient, type FacturePaiement } from '@/components/Common/FacturePatient';
import {
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Smartphone,
  Banknote,
  Building,
  Search,
  Download,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/Common/Modal';
import { apiService } from '@/services/api';
import { downloadBlobFile } from '@/lib/downloadFile';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type FilterStatut = 'tous' | 'en_attente' | 'paye' | 'rembourse' | 'echec';
type FilterMethode = 'tous' | 'especes' | 'carte' | 'mobile_money' | 'virement' | 'autre';
type UiStatut = Exclude<FilterStatut, 'tous'>;
type UiMethode = Exclude<FilterMethode, 'tous'>;

interface ApiEnvelope<T> {
  data?: T;
}

interface ApiPaiement {
  id: number;
  montant: number;
  statut: string;
  methode: string;
  transactionId?: string | null;
  createdAt?: string;
  date_paiement?: string | null;
  patientId?: number;
  patient?: {
    prenom?: string;
    nom?: string;
    user?: {
      name?: string;
      email?: string;
    };
  };
  rendezVous?: {
    id?: number;
    numero?: string;
    date?: string;
    heure?: string;
    statut?: string;
    medecin?: {
      prenom?: string;
      nom?: string;
      specialite?: string;
      user?: {
        name?: string;
      };
    } | null;
  } | null;
}

interface UiPaiement {
  id: string;
  montant: number;
  statut: UiStatut;
  methodePaiement: UiMethode;
  date: string;
  reference: string;
  patientName: string;
  patientEmail: string;
  rendezVousNumero: string;
  rendezVousDate: string;
  rendezVousHeure: string;
  rendezVousStatut: string;
  medecinName: string;
  medecinSpecialite: string;
}

const COLORS_PIE: Record<UiMethode, string> = {
  especes: '#10B981',
  carte: '#3B82F6',
  mobile_money: '#F59E0B',
  virement: '#8B5CF6',
  autre: '#6B7280',
};

const COLORS_STATUS: Record<UiStatut, string> = {
  en_attente: '#F59E0B',
  paye: '#10B981',
  rembourse: '#6B7280',
  echec: '#EF4444',
};

const formatMontant = (montant: number): string =>
  new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);

const getMethodePaiementLabel = (methode: UiMethode): string => {
  const labels: Record<UiMethode, string> = {
    especes: 'Espèces',
    carte: 'Carte bancaire',
    mobile_money: 'Mobile Money',
    virement: 'Virement bancaire',
    autre: 'Autre',
  };
  return labels[methode];
};

const getStatutPaiementLabel = (statut: UiStatut): string => {
  const labels: Record<UiStatut, string> = {
    en_attente: 'En attente',
    paye: 'Payé',
    rembourse: 'Remboursé',
    echec: 'Échec',
  };
  return labels[statut];
};

const normalizeStatus = (status: string): UiStatut => {
  if (status === 'paye') return 'paye';
  if (status === 'en_attente') return 'en_attente';
  if (status === 'rembourse') return 'rembourse';
  if (status === 'echoue' || status === 'echec') return 'echec';
  return 'en_attente';
};

const normalizeMethod = (method: string): UiMethode => {
  if (method === 'especes') return 'especes';
  if (method === 'carte' || method === 'carte_bancaire') return 'carte';
  if (method === 'mobile_money' || method === 'wave' || method === 'orange_money') return 'mobile_money';
  if (method === 'virement') return 'virement';
  return 'autre';
};

const toMonthKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const unwrapPaiementList = (payload: ApiEnvelope<ApiPaiement[]> | ApiPaiement[] | unknown): ApiPaiement[] => {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const maybeData = (payload as ApiEnvelope<ApiPaiement[]>).data;
    if (Array.isArray(maybeData)) {
      return maybeData;
    }
  }

  return [];
};

const getPatientName = (paiement: ApiPaiement): string => {
  const explicit = (paiement.patient?.user?.name || '').trim();
  if (explicit) return explicit;

  const prenom = (paiement.patient?.prenom || '').trim();
  const nom = (paiement.patient?.nom || '').trim();
  const fullName = `${prenom} ${nom}`.trim();
  if (fullName) return fullName;

  return `Patient #${paiement.patientId || paiement.id}`;
};

const getMedecinName = (paiement: ApiPaiement): string => {
  const explicit = (paiement.rendezVous?.medecin?.user?.name || '').trim();
  if (explicit) return explicit;

  const prenom = (paiement.rendezVous?.medecin?.prenom || '').trim();
  const nom = (paiement.rendezVous?.medecin?.nom || '').trim();
  const fullName = `${prenom} ${nom}`.trim();
  return fullName || 'Médecin non défini';
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  const first = parts[0]?.charAt(0)?.toUpperCase() || '';
  const second = parts[1]?.charAt(0)?.toUpperCase() || '';
  return `${first}${second}` || 'PT';
};

const fetchUiPaiements = async (): Promise<UiPaiement[]> => {
  const response = await apiService.get<ApiEnvelope<ApiPaiement[]> | ApiPaiement[]>('/paiements');
  const list = unwrapPaiementList(response);

  return list.map((paiement) => {
    const paymentDate = paiement.date_paiement || paiement.createdAt || new Date().toISOString();
    return {
      id: String(paiement.id),
      montant: Number(paiement.montant) || 0,
      statut: normalizeStatus(paiement.statut),
      methodePaiement: normalizeMethod(paiement.methode),
      date: paymentDate,
      reference: paiement.transactionId || `PAY-${paiement.id}`,
      patientName: getPatientName(paiement),
      patientEmail: paiement.patient?.user?.email || 'N/A',
      rendezVousNumero: paiement.rendezVous?.numero || `RDV-${paiement.rendezVous?.id || paiement.id}`,
      rendezVousDate: paiement.rendezVous?.date || paymentDate,
      rendezVousHeure: paiement.rendezVous?.heure || '--:--',
      rendezVousStatut: paiement.rendezVous?.statut || 'inconnu',
      medecinName: getMedecinName(paiement),
      medecinSpecialite: paiement.rendezVous?.medecin?.specialite || 'Non renseignée',
    };
  });
};

export const SecretairePaiements: React.FC = () => {
  const [paiements, setPaiements] = useState<UiPaiement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<FilterStatut>('tous');
  const [filterMethode, setFilterMethode] = useState<FilterMethode>('tous');
  const [factureOuverte, setFactureOuverte] = useState<FacturePaiement | null>(null);
  const [paiementSelectionne, setPaiementSelectionne] = useState<UiPaiement | null>(null);
  const [actionPaiementId, setActionPaiementId] = useState<string | null>(null);
  const [actionPaiementType, setActionPaiementType] = useState<'confirm' | 'fail' | null>(null);

  useEffect(() => {
    const fetchPaiements = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const mapped = await fetchUiPaiements();
        setPaiements(mapped);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Impossible de charger les paiements';
        setLoadError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPaiements();
  }, []);

  const syncPaiements = (nextPaiements: UiPaiement[]) => {
    setPaiements(nextPaiements);
    if (paiementSelectionne) {
      setPaiementSelectionne(nextPaiements.find((item) => item.id === paiementSelectionne.id) || null);
    }
  };

  const stats = useMemo(() => ({
    total: paiements.reduce((sum, p) => sum + p.montant, 0),
    paye: paiements.filter((p) => p.statut === 'paye').reduce((sum, p) => sum + p.montant, 0),
    enAttente: paiements.filter((p) => p.statut === 'en_attente').reduce((sum, p) => sum + p.montant, 0),
    echec: paiements.filter((p) => p.statut === 'echec').reduce((sum, p) => sum + p.montant, 0),
    nbTotal: paiements.length,
    nbPaye: paiements.filter((p) => p.statut === 'paye').length,
    nbEnAttente: paiements.filter((p) => p.statut === 'en_attente').length,
    nbEchec: paiements.filter((p) => p.statut === 'echec').length,
  }), [paiements]);

  const methodesData = useMemo(() => {
    const count: Record<UiMethode, number> = {
      mobile_money: 0,
      carte: 0,
      especes: 0,
      virement: 0,
      autre: 0,
    };

    paiements.forEach((paiement) => {
      count[paiement.methodePaiement] += 1;
    });

    return [
      { name: 'Mobile Money', value: count.mobile_money, color: COLORS_PIE.mobile_money },
      { name: 'Carte', value: count.carte, color: COLORS_PIE.carte },
      { name: 'Espèces', value: count.especes, color: COLORS_PIE.especes },
      { name: 'Virement', value: count.virement, color: COLORS_PIE.virement },
      { name: 'Autre', value: count.autre, color: COLORS_PIE.autre },
    ].filter((item) => item.value > 0);
  }, [paiements]);

  const revenusParMois = useMemo(() => {
    const now = new Date();
    const months: Array<{ key: string; mois: string; montant: number }> = [];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: toMonthKey(date),
        mois: date.toLocaleDateString('fr-FR', { month: 'short' }),
        montant: 0,
      });
    }

    const monthMap = new Map(months.map((month) => [month.key, month]));

    paiements.forEach((paiement) => {
      if (paiement.statut !== 'paye') return;
      const date = new Date(paiement.date);
      if (Number.isNaN(date.getTime())) return;

      const key = toMonthKey(date);
      const bucket = monthMap.get(key);
      if (bucket) {
        bucket.montant += paiement.montant;
      }
    });

    return months.map(({ mois, montant }) => ({ mois, montant }));
  }, [paiements]);

  const paiementsFiltres = useMemo(() =>
    paiements.filter((paiement) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        paiement.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paiement.reference.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatut = filterStatut === 'tous' || paiement.statut === filterStatut;
      const matchMethode = filterMethode === 'tous' || paiement.methodePaiement === filterMethode;

      return matchSearch && matchStatut && matchMethode;
    }),
  [paiements, searchTerm, filterStatut, filterMethode]);

  const getPaymentIcon = (methode: UiMethode) => {
    switch (methode) {
      case 'mobile_money':
        return <Smartphone className="h-4 w-4" />;
      case 'carte':
        return <CreditCard className="h-4 w-4" />;
      case 'especes':
        return <Banknote className="h-4 w-4" />;
      case 'virement':
        return <Building className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatutBadge = (statut: UiStatut) => {
    const config: Record<UiStatut, { className: string; icon: React.ReactNode }> = {
      paye: { className: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 className="h-3 w-3" /> },
      en_attente: { className: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Clock className="h-3 w-3" /> },
      echec: { className: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="h-3 w-3" /> },
      rembourse: { className: 'bg-gray-100 text-gray-700 border-gray-200', icon: <RefreshCw className="h-3 w-3" /> },
    };

    return (
      <Badge variant="outline" className={config[statut].className}>
        {config[statut].icon}
        <span className="ml-1">{getStatutPaiementLabel(statut)}</span>
      </Badge>
    );
  };

  const getRendezVousStatusLabel = (statut: string) => {
    if (statut === 'en_attente') return 'RDV en attente';
    if (statut === 'confirme') return 'RDV confirmé';
    if (statut === 'paye') return 'RDV payé';
    if (statut === 'termine') return 'RDV terminé';
    if (statut === 'annule') return 'RDV annulé';
    return 'Statut RDV inconnu';
  };

  const refreshPaiements = async () => {
    const nextPaiements = await fetchUiPaiements();
    syncPaiements(nextPaiements);
  };

  const handleConfirmPayment = async (paiement: UiPaiement) => {
    setActionPaiementId(paiement.id);
    setActionPaiementType('confirm');
    try {
      await apiService.put(`/paiements/${paiement.id}/confirm`);
      toast.success('Paiement vérifié et confirmé');
      await refreshPaiements();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validation impossible';
      toast.error(message);
    } finally {
      setActionPaiementId(null);
      setActionPaiementType(null);
    }
  };

  const handleFailPayment = async (paiement: UiPaiement) => {
    setActionPaiementId(paiement.id);
    setActionPaiementType('fail');
    try {
      await apiService.put(`/paiements/${paiement.id}/fail`);
      toast.success('Paiement marqué comme échoué');
      await refreshPaiements();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mise à jour impossible';
      toast.error(message);
    } finally {
      setActionPaiementId(null);
      setActionPaiementType(null);
    }
  };

  const handleDownloadInvoice = async (paiementId: string) => {
    try {
      const blob = await apiService.getBlob(`/paiements/${paiementId}/facture/download`);
      downloadBlobFile(blob, `FAC-${String(paiementId).padStart(5, '0')}.pdf`);
      toast.success('Facture téléchargée');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Facture indisponible';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-primary rounded-2xl p-6 md:p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display mb-2">Gestion des Paiements 💳</h1>
            <p className="text-white/80">Vérifiez les paiements liés au médecin suivi par le secrétariat</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="secondary" className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/20">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {loadError && (
        <Card className="card-health p-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{loadError}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-health p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <Badge className="bg-green-100 text-green-700 border-0">Total</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Revenus totaux</p>
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

        <Card className="card-health p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Échecs</p>
          <p className="text-2xl font-bold text-red-600">{formatMontant(stats.echec)}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.nbEchec} transactions</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-health p-6">
          <h3 className="text-lg font-semibold mb-4">Revenus mensuels</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenusParMois}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mois" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip
                  formatter={(value: number | string) => formatMontant(Number(value))}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="montant" fill="hsl(174 80% 35%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="card-health p-6">
          <h3 className="text-lg font-semibold mb-4">Méthodes de paiement</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={methodesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {methodesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="card-health p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par patient ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatut} onValueChange={(value) => setFilterStatut(value as FilterStatut)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="paye">Payé</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="echec">Échec</SelectItem>
              <SelectItem value="rembourse">Remboursé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterMethode} onValueChange={(value) => setFilterMethode(value as FilterMethode)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Méthode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Toutes les méthodes</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="carte">Carte</SelectItem>
              <SelectItem value="especes">Espèces</SelectItem>
              <SelectItem value="virement">Virement</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Liste des paiements ({paiementsFiltres.length})</h3>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement des paiements...</p>
            </div>
          ) : paiementsFiltres.length > 0 ? (
            <div className="space-y-3">
              {paiementsFiltres.map((paiement) => (
                <div
                  key={paiement.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors border border-border/50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${paiement.patientEmail}`} />
                      <AvatarFallback className="bg-primary text-white">
                        {getInitials(paiement.patientName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{paiement.patientName}</p>
                        {getStatutBadge(paiement.statut)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {getPaymentIcon(paiement.methodePaiement)}
                          {getMethodePaiementLabel(paiement.methodePaiement)}
                        </span>
                        <span>•</span>
                        <span>{paiement.medecinName}</span>
                        <span>•</span>
                        <span>{paiement.rendezVousNumero}</span>
                        <span>•</span>
                        <span>Réf: {paiement.reference}</span>
                        <span>•</span>
                        <span>{new Date(paiement.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatMontant(paiement.montant)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setPaiementSelectionne(paiement)}
                      >
                        <Eye className="h-4 w-4" />
                        Vérifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() =>
                          setFactureOuverte({
                            id: paiement.id,
                            montant: paiement.montant,
                            methode: paiement.methodePaiement,
                            statut: paiement.statut,
                            transactionId: paiement.reference,
                            date_paiement: paiement.date,
                            createdAt: paiement.date,
                            patientName: paiement.patientName,
                            patientEmail: paiement.patientEmail,
                          })
                        }
                      >
                        <Download className="h-4 w-4" />
                        Aperçu
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Aucun paiement trouvé</p>
              <p className="text-sm text-muted-foreground mt-1">Essayez de modifier vos filtres de recherche</p>
            </div>
          )}
        </div>
      </Card>
      <Modal
        isOpen={Boolean(paiementSelectionne)}
        onClose={() => {
          if (actionPaiementId) return;
          setPaiementSelectionne(null);
        }}
        title={paiementSelectionne ? `Vérification ${paiementSelectionne.rendezVousNumero}` : 'Vérification paiement'}
        size="lg"
      >
        {paiementSelectionne ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Patient</p>
                <p className="mt-1 font-semibold">{paiementSelectionne.patientName}</p>
                <p className="text-sm text-muted-foreground">{paiementSelectionne.patientEmail}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Médecin</p>
                <p className="mt-1 font-semibold">{paiementSelectionne.medecinName}</p>
                <p className="text-sm text-muted-foreground">{paiementSelectionne.medecinSpecialite}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Rendez-vous</p>
                <p className="mt-1 font-semibold">{paiementSelectionne.rendezVousNumero}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(paiementSelectionne.rendezVousDate).toLocaleDateString('fr-FR')} à {paiementSelectionne.rendezVousHeure}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {getRendezVousStatusLabel(paiementSelectionne.rendezVousStatut)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Paiement</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-semibold">{formatMontant(paiementSelectionne.montant)}</p>
                  {getStatutBadge(paiementSelectionne.statut)}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {getMethodePaiementLabel(paiementSelectionne.methodePaiement)}
                </p>
                <p className="text-sm text-muted-foreground">Référence: {paiementSelectionne.reference}</p>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
              Le secrétariat peut confirmer un paiement en attente ou marquer un échec après vérification.
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              {paiementSelectionne.statut !== 'paye' ? (
                <Button
                  variant="outline"
                  onClick={() => handleFailPayment(paiementSelectionne)}
                  disabled={actionPaiementId === paiementSelectionne.id || paiementSelectionne.statut === 'echec'}
                >
                  {actionPaiementId === paiementSelectionne.id &&
                  actionPaiementType === 'fail' &&
                  paiementSelectionne.statut !== 'echec'
                    ? 'Traitement...'
                    : paiementSelectionne.statut === 'echec'
                    ? 'Déjà échoué'
                    : 'Marquer échec'}
                </Button>
              ) : null}
              {paiementSelectionne.statut !== 'paye' ? (
                <Button
                  onClick={() => handleConfirmPayment(paiementSelectionne)}
                  disabled={actionPaiementId === paiementSelectionne.id}
                >
                  {actionPaiementId === paiementSelectionne.id && actionPaiementType === 'confirm'
                    ? 'Validation...'
                    : 'Confirmer le paiement'}
                </Button>
              ) : (
                <Button onClick={() => handleDownloadInvoice(paiementSelectionne.id)}>
                  Télécharger la facture
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
      {factureOuverte && (
        <FacturePatient
          paiement={factureOuverte}
          onClose={() => setFactureOuverte(null)}
        />
      )}
    </div>
  );
};
