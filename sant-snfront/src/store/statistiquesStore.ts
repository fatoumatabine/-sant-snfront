import { create } from 'zustand';
import { apiService } from '@/services/api';

interface StatistiquesState {
  dashboardData: any | null;
  graphiques: any | null;
  isLoading: boolean;
  error: string | null;
  
  fetchDashboard: () => Promise<void>;
  fetchGraphiques: () => Promise<void>;
}

export const useStatistiquesStore = create<StatistiquesState>((set, get) => ({
  dashboardData: null,
  graphiques: null,
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get('/stats/dashboard');

      if (response.data) {
        set({ 
          dashboardData: response.data,
          isLoading: false 
        });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  },

  fetchGraphiques: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get('/stats/graphiques');

      if (response.data) {
        set({ 
          graphiques: response.data,
          isLoading: false 
        });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  }
}));
