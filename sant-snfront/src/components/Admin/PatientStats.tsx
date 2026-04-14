import React from 'react';
import { Users, TrendingUp, BarChart3, Stethoscope } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle?: string;
  color: string;
}> = ({ icon, title, value, subtitle, color }) => (
  <div className={`bg-white rounded-lg p-4 border-l-4 ${color} shadow-sm`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>{icon}</div>
    </div>
  </div>
);

export const PatientStats: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['patient-stats'],
    queryFn: async () => {
      const response = await apiService.get('/stats/globales');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Chargement des statistiques...
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={<Users className="h-5 w-5 text-blue-600" />}
        title="Total Patients"
        value={stats.patients?.total || 0}
        subtitle="Enregistrés"
        color="border-blue-500"
      />
      <StatCard
        icon={<TrendingUp className="h-5 w-5 text-green-600" />}
        title="Patients Actifs"
        value={stats.patients?.actifs || 0}
        subtitle="Ce mois"
        color="border-green-500"
      />
      <StatCard
        icon={<BarChart3 className="h-5 w-5 text-purple-600" />}
        title="RDV Ce Mois"
        value={stats.patients?.rdv_ce_mois || 0}
        subtitle="Appointments"
        color="border-purple-500"
      />
      <StatCard
        icon={<Stethoscope className="h-5 w-5 text-pink-600" />}
        title="Consultations"
        value={stats.patients?.consultations_ce_mois || 0}
        subtitle="Ce mois"
        color="border-pink-500"
      />
    </div>
  );
};
