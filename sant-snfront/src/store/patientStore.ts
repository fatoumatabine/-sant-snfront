import { create } from 'zustand';
import { apiService } from '@/services/api';

interface PatientDashboardData {
  totalRendezVous: number;
  upcomingRendezVous: number;
  consultationsCount: number;
  ordonnancesCount: number;
}

interface PatientState {
  dashboardData: PatientDashboardData | null;
  mesList: any[];
  dossierMedical: any | null;
  isLoading: boolean;
  error: string | null;
  
  fetchDashboardSummary: () => Promise<void>;
  fetchDashboardAppointments: () => Promise<void>;
  fetchDashboardConsultations: () => Promise<void>;
  fetchDashboardOrdonnances: () => Promise<void>;
  fetchMesRendezVous: () => Promise<void>;
  fetchDossierMedical: () => Promise<void>;
  updateProfile: (data: any) => Promise<boolean>;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  dashboardData: null,
  mesList: [],
  dossierMedical: null,
  isLoading: false,
  error: null,

  fetchDashboardSummary: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const rendezVousResponse = await apiService.get('/patient/mes-rendez-vous');
      const consultationsResponse = await apiService.get('/patient/mes-consultations');
      
      const rendezVous = Array.isArray(rendezVousResponse) ? rendezVousResponse : rendezVousResponse.data || [];
      const consultations = Array.isArray(consultationsResponse) ? consultationsResponse : consultationsResponse.data || [];
      
      const upcomingRdv = rendezVous.filter((rdv: any) => 
        rdv.statut !== 'termine' && rdv.statut !== 'annule'
      );

      set({ 
        dashboardData: {
          totalRendezVous: rendezVous.length,
          upcomingRendezVous: upcomingRdv.length,
          consultationsCount: consultations.length,
          ordonnancesCount: 0
        },
        isLoading: false 
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  },

  fetchDashboardAppointments: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get('/patient/mes-rendez-vous');

      const data = Array.isArray(response) ? response : response.data || [];
      set({ 
        mesList: data,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  },

  fetchDashboardConsultations: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get('/patient/mes-consultations');
      set({ isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  },

  fetchDashboardOrdonnances: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Les ordonnances peuvent être récupérées via les consultations
      const response = await apiService.get('/patient/mes-consultations');
      set({ isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  },

  fetchMesRendezVous: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get('/patient/mes-rendez-vous');

      if (response.data) {
        set({ 
          mesList: Array.isArray(response.data) ? response.data : response.data.data || [],
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

  fetchDossierMedical: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get('/patient/dossier-medical');

      if (response.data) {
        set({ 
          dossierMedical: response.data,
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

  updateProfile: async (data: any) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.put('/patient/profile', data);

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour' 
      });
      return false;
    }
  }
}));
