import React from 'react';
import { Users, Stethoscope, Briefcase, BarChart3, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface Stats {
  patients: {
    total: number;
    actifs: number;
    rdv_ce_mois: number;
    consultations_ce_mois: number;
  };
  medecins: {
    total: number;
    disponibles: number;
    rdv_ce_mois: number;
    consultations_effectuees: number;
  };
  secretaires: {
    total: number;
    rdv_geres_ce_mois: number;
    consultations_enregistrees: number;
  };
  general: {
    rdv_total: number;
    consultations_total: number;
    rdv_ce_jour: number;
    rdv_en_attente: number;
  };
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle?: string;
  color: string;
}> = ({ icon, title, value, subtitle, color }) => (
  <div className={`bg-white rounded-lg p-6 border-l-4 ${color} shadow-sm hover:shadow-md transition-shadow`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        {icon}
      </div>
    </div>
  </div>
);

export const AdminDashboardStats: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats-globales'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/stats/globales');
        return response.data as Stats;
      } catch {
        toast.error('Erreur lors du chargement des statistiques');
        return null;
      }
    }
  });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cartes Patients */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Patients
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-6 w-6 text-blue-600" />}
            title="Total Patients"
            value={stats.patients.total}
            subtitle="Enregistrés"
            color="border-blue-500"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6 text-green-600" />}
            title="Patients Actifs"
            value={stats.patients.actifs}
            subtitle="Ce mois"
            color="border-green-500"
          />
          <StatCard
            icon={<BarChart3 className="h-6 w-6 text-purple-600" />}
            title="RDV Ce Mois"
            value={stats.patients.rdv_ce_mois}
            subtitle="Appointments"
            color="border-purple-500"
          />
          <StatCard
            icon={<Stethoscope className="h-6 w-6 text-pink-600" />}
            title="Consultations"
            value={stats.patients.consultations_ce_mois}
            subtitle="Ce mois"
            color="border-pink-500"
          />
        </div>
      </div>

      {/* Cartes Médecins */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Médecins
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Stethoscope className="h-6 w-6 text-teal-600" />}
            title="Total Médecins"
            value={stats.medecins.total}
            subtitle="Enregistrés"
            color="border-teal-500"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6 text-lime-600" />}
            title="Disponibles"
            value={stats.medecins.disponibles}
            subtitle="Actuellement"
            color="border-lime-500"
          />
          <StatCard
            icon={<BarChart3 className="h-6 w-6 text-cyan-600" />}
            title="RDV Ce Mois"
            value={stats.medecins.rdv_ce_mois}
            subtitle="Appointments"
            color="border-cyan-500"
          />
          <StatCard
            icon={<Users className="h-6 w-6 text-indigo-600" />}
            title="Consultations"
            value={stats.medecins.consultations_effectuees}
            subtitle="Effectuées"
            color="border-indigo-500"
          />
        </div>
      </div>

      {/* Cartes Secrétaires */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Secrétaires
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Briefcase className="h-6 w-6 text-orange-600" />}
            title="Total Secrétaires"
            value={stats.secretaires.total}
            subtitle="Enregistrés"
            color="border-orange-500"
          />
          <StatCard
            icon={<BarChart3 className="h-6 w-6 text-red-600" />}
            title="RDV Gérés"
            value={stats.secretaires.rdv_geres_ce_mois}
            subtitle="Ce mois"
            color="border-red-500"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6 text-amber-600" />}
            title="Consultations"
            value={stats.secretaires.consultations_enregistrees}
            subtitle="Enregistrées"
            color="border-amber-500"
          />
        </div>
      </div>

      {/* Cartes Générales */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Vue Globale
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-6 w-6 text-blue-600" />}
            title="RDV Total"
            value={stats.general.rdv_total}
            subtitle="All-time"
            color="border-blue-500"
          />
          <StatCard
            icon={<Stethoscope className="h-6 w-6 text-green-600" />}
            title="Consultations"
            value={stats.general.consultations_total}
            subtitle="All-time"
            color="border-green-500"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
            title="RDV Aujourd'hui"
            value={stats.general.rdv_ce_jour}
            subtitle="Programmés"
            color="border-purple-500"
          />
          <StatCard
            icon={<BarChart3 className="h-6 w-6 text-yellow-600" />}
            title="En Attente"
            value={stats.general.rdv_en_attente}
            subtitle="À confirmer"
            color="border-yellow-500"
          />
        </div>
      </div>
    </div>
  );
};
