import { create } from 'zustand';
import { apiService } from '@/services/api';

interface MedecinState {
  medecins: any[];
  specialites: string[];
  mesList: any[];
  isLoading: boolean;
  error: string | null;
  
  fetchMedecins: () => Promise<void>;
  fetchSpecialites: () => Promise<void>;
  fetchMedecinBySpecialite: (specialite: string) => Promise<void>;
  fetchMedecinDetails: (id: string) => Promise<any>;
  fetchMedecinList: () => Promise<void>;
}

export const useMedecinStore = create<MedecinState>((set, get) => ({
  medecins: [],
  specialites: [],
  mesList: [],
  isLoading: false,
  error: null,

  fetchMedecins: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get('/medecins');

      if (response.data) {
        const medecins = Array.isArray(response.data) ? response.data : response.data.data || [];
        set({ medecins, isLoading: false });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  },

  fetchSpecialites: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get('/medecins/specialites');

      if (response.data) {
        const specialites = Array.isArray(response.data) ? response.data : response.data.data || [];
        set({ specialites, isLoading: false });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  },

  fetchMedecinBySpecialite: async (specialite: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get(`/medecins/specialite/${specialite}`);

      if (response.data) {
        const medecins = Array.isArray(response.data) ? response.data : response.data.data || [];
        set({ medecins, isLoading: false });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  },

  fetchMedecinDetails: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get(`/medecins/${id}`);

      if (response.data) {
        set({ isLoading: false });
        return response.data;
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
    return null;
  },

  fetchMedecinList: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get('/medecins');

      if (response.data) {
        const mesList = Array.isArray(response.data) ? response.data : response.data.data || [];
        set({ mesList, isLoading: false });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  }
}));
