import React, { useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  FileText, 
  CreditCard,
  ChevronRight,
  Video,
  Bell,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  DollarSign,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useRendezVousStore } from '@/store/rendezVousStore';
import { useConsultationStore } from '@/store/consultationStore';
import { useMedecinStore } from '@/store/medecinStore';
import { usePatientStore } from '@/store/patientStore';
import { StatCard } from '@/components/Common/StatCard';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { formatMontant } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

interface Paiement {
  id: number;
  patientId: number;
  rendezVousId: number;
  montant: number;
  methode: string;
  statut: 'en_attente' | 'paye' | 'rembourse' | 'echec';
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

export const PatientDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { rendezVous, fetchMesRendezVous, isLoading: rdvLoading } = useRendezVousStore();
  const { consultations, fetchConsultations, isLoading: consultLoading } = useConsultationStore();
  const { medecins, fetchMedecins } = useMedecinStore();
  const { dashboardData, fetchDashboardSummary } = usePatientStore();

  // Récupérer les paiements
  const { data: paiements = [], isLoading: paiementsLoading } = useQuery({
    queryKey: ['patient-paiements'],
    queryFn: async () => {
      const response = await apiService.get('/patient/mes-paiements');
      return response.data as Paiement[];
    }
  });
  
  // Charger les données au montage
  useEffect(() => {
    if (user?.id) {
      console.log('Chargement des données du patient:', user.id);
      fetchDashboardSummary().catch(err => console.error('Erreur fetchDashboardSummary:', err));
      fetchMesRendezVous().catch(err => console.error('Erreur fetchMesRendezVous:', err));
      fetchConsultations().catch(err => console.error('Erreur fetchConsultations:', err));
      fetchMedecins().catch(err => console.error('Erreur fetchMedecins:', err));
    }
  }, [user?.id]);

  // Calculer les statistiques de paiements
  const paiementStats = {
    total: paiements.reduce((sum, p) => sum + p.montant, 0),
    paye: paiements.filter(p => p.statut === 'paye').length,
    enAttente: paiements.filter(p => p.statut === 'en_attente').length,
    derniersMois: paiements.filter(p => {
      const date = new Date(p.createdAt);
      const now = new Date();
      const monthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return date >= monthsAgo;
    }).reduce((sum, p) => sum + p.montant, 0)
  };

  // Filtrer les rendez-vous à venir
  const rendezVousAVenir = rendezVous.filter(
    rdv => rdv.statut !== 'termine' && rdv.statut !== 'annule'
  );
  
  const prochainRdv = rendezVousAVenir[0];
  const medecinProchain = prochainRdv 
    ? medecins.find(m => m.id === prochainRdv.medecinId)
    : null;

  // Consulter les consultations du patient (avec pagination)
  const mesConsultations = consultations;

  const {
    currentPage: consultationsCurrentPage,
    totalPages: consultationsTotalPages,
    totalItems: consultationsTotalItems,
    startItem: consultationsStartItem,
    endItem: consultationsEndItem,
    paginatedData: paginatedConsultations,
    setCurrentPage: setConsultationsCurrentPage,
  } = useTablePagination(mesConsultations, { itemsPerPage: 3 });

  // Derniers paiements (3 plus récents)
  const derniersPaiements = paiements.slice(0, 3);

  const isLoading = rdvLoading || consultLoading;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const getStatutBadge = (statut: string) => {
    const config = {
      paye: {
        className: 'bg-green-100 text-green-700 border-green-200',
        label: 'Payé'
      },
      en_attente: {
        className: 'bg-orange-100 text-orange-700 border-orange-200',
        label: 'En attente'
      },
      echec: {
        className: 'bg-red-100 text-red-700 border-red-200',
        label: 'Échec'
      }
    };

    const { className, label } = config[statut as keyof typeof config] || config.en_attente;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-primary rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display mb-2">
              {t('patient.dashboard.welcome', { name: user?.prenom })} 👋
            </h1>
            <p className="text-white/80">
              {t('patient.dashboard.subtitle')}
            </p>
          </div>
          <Link
            to="/patient/demander-rdv"
            className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors"
          >
            <Calendar className="h-5 w-5" />
            {t('patient.dashboard.bookAppointment')}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rendez-vous total */}
        <div className="card-health p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">{t('patient.dashboard.totalAppointments')}</p>
          <p className="text-2xl font-bold">{dashboardData?.totalRendezVous || rendezVous.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {dashboardData?.upcomingRendezVous || rendezVousAVenir.length} {t('patient.dashboard.upcomingAppointments')}
          </p>
        </div>

        {/* Consultations */}
        <div className="card-health p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">{t('patient.dashboard.consultations')}</p>
          <p className="text-2xl font-bold">{dashboardData?.consultationsCount || consultations.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('patient.dashboard.noData')}</p>
        </div>

        {/* Paiements Total */}
        <div className="card-health p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">{t('patient.dashboard.totalSpent')}</p>
          <p className="text-2xl font-bold">{formatMontant(paiementStats.total)}</p>
          <p className="text-xs text-muted-foreground mt-1">{paiements.length} {t('patient.dashboard.payments')}</p>
        </div>

        {/* Paiements ce mois */}
        <div className="card-health p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">{t('patient.dashboard.lastMonth')}</p>
          <p className="text-2xl font-bold">{formatMontant(paiementStats.derniersMois)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {paiementStats.paye} {t('patient.dashboard.paid')}, {paiementStats.enAttente} {t('patient.dashboard.pending')}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Prochain RDV */}
        <div className="card-health">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-display">{t('patient.dashboard.nextAppointment')}</h2>
            <Link to="/patient/rendez-vous" className="text-sm text-primary hover:underline flex items-center gap-1">
              {t('common.viewAll')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {prochainRdv && medecinProchain ? (
            <div className="bg-primary/10 rounded-xl p-5 border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-primary-foreground font-bold text-lg">
                    {medecinProchain.prenom?.[0]}{medecinProchain.nom?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">
                    Dr. {medecinProchain.prenom} {medecinProchain.nom}
                  </h3>
                  <p className="text-sm text-primary font-medium">{medecinProchain.specialite}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg">
                      <Calendar className="h-4 w-4" />
                      {new Date(prochainRdv.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg">
                      <Clock className="h-4 w-4" />
                      {prochainRdv.heure}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {prochainRdv.typeConsultation === 'video' ? (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        <Video className="h-3 w-3 mr-1" />
                        Vidéo
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 border-green-200">Présentiel</Badge>
                    )}
                    <Badge className={cn(
                      prochainRdv.statut === 'confirme' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-orange-100 text-orange-700 border-orange-200'
                    )}>
                      {prochainRdv.statut === 'confirme' ? 'Confirmé' : 'En attente'}
                    </Badge>
                  </div>
                </div>
              </div>
              {prochainRdv.typeConsultation === 'video' &&
                ['confirme', 'paye'].includes(String(prochainRdv.statut)) && (
                <Link
                  to="/patient/video-call"
                  className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors w-full mt-4"
                >
                  <Video className="h-5 w-5" />
                  Ouvrir l'espace vidéo
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="mb-4">Aucun rendez-vous à venir</p>
              <Link
                to="/patient/demander-rdv"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Prendre un rendez-vous
              </Link>
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="card-health">
          <h2 className="text-lg font-semibold font-display mb-4">Actions rapides</h2>
          <div className="space-y-3">
            <Link
              to="/patient/demander-rdv"
              className="flex items-center justify-between p-4 rounded-xl bg-primary/10 transition-all border border-primary/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                  <Calendar className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">Prendre rendez-vous</p>
                  <p className="text-sm text-muted-foreground">Réservez une consultation</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-primary" />
            </Link>

            <Link
              to="/patient/paiements"
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Mes paiements</p>
                  <p className="text-sm text-muted-foreground">Historique et factures</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Link
              to="/patient/ia-evaluation"
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Évaluation IA</p>
                  <p className="text-sm text-muted-foreground">Pré-évaluez vos symptômes</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Link
              to="/patient/consultations"
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Mes consultations</p>
                  <p className="text-sm text-muted-foreground">Historique médical</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>

      {/* Derniers paiements */}
      {derniersPaiements.length > 0 && (
        <div className="card-health">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-display">Derniers paiements</h2>
            <Link to="/patient/paiements" className="text-sm text-primary hover:underline flex items-center gap-1">
              Voir tout
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {derniersPaiements.map((paiement) => (
              <div
                key={paiement.id}
                className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors border border-border/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{paiement.rendezVous.medecin.user.name}</h4>
                      {getStatutBadge(paiement.statut)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {paiement.rendezVous.motif}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {new Date(paiement.rendezVous.date).toLocaleDateString('fr-FR')}
                      </span>
                      <span>•</span>
                      <span>{paiement.rendezVous.medecin.specialite}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{formatMontant(paiement.montant)}</p>
                    {paiement.date_paiement && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dernières consultations */}
      {mesConsultations.length > 0 && (
        <div className="card-health">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-display">Dernières consultations</h2>
            <Link to="/patient/consultations" className="text-sm text-primary hover:underline flex items-center gap-1">
              Voir tout
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Médecin</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Diagnostic</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Statut</th>
                </tr>
              </thead>
              <tbody>
                {paginatedConsultations.map((consultation) => {
                  const medecin = medecins.find(m => m.id === consultation.medecinId);
                  return (
                    <tr key={consultation.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {new Date(consultation.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">Dr. {medecin?.nom}</p>
                          <p className="text-xs text-muted-foreground">{medecin?.specialite}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-sm">{consultation.diagnostic}</td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <Badge className="bg-green-100 text-green-700 border-green-200">Terminé</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <TablePaginationControls
            currentPage={consultationsCurrentPage}
            totalPages={consultationsTotalPages}
            totalItems={consultationsTotalItems}
            startItem={consultationsStartItem}
            endItem={consultationsEndItem}
            onPageChange={setConsultationsCurrentPage}
          />
        </div>
      )}

      {/* Aucune donnée */}
      {mesConsultations.length === 0 && rendezVousAVenir.length === 0 && paiements.length === 0 && (
        <div className="card-health text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">Aucun rendez-vous, consultation ou paiement enregistré</p>
          <Link to="/patient/demander-rdv" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
            <Calendar className="h-4 w-4" />
            Prendre un rendez-vous
          </Link>
        </div>
      )}
    </div>
  );
};
