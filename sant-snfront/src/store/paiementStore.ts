import { create } from 'zustand';
import { apiService } from '@/services/api';

interface PaiementState {
  isLoading: boolean;
  error: string | null;
  
  initierPaiement: (rendezVousId: string, montant: number) => Promise<any>;
  verifierPaiement: (id: string) => Promise<any>;
  callbackPaiement: (data: any) => Promise<boolean>;
}

export const usePaiementStore = create<PaiementState>((set, get) => ({
  isLoading: false,
  error: null,

  initierPaiement: async (rendezVousId: string, montant: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.post('/paiement/initier', {
        rendez_vous_id: rendezVousId,
        montant
      });

      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'initiation du paiement' 
      });
      return null;
    }
  },

  verifierPaiement: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get(`/paiement/verifier/${id}`);

      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la vérification' 
      });
      return null;
    }
  },

  callbackPaiement: async (data: any) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.post('/paiement/callback', data);

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du traitement du paiement' 
      });
      return false;
    }
  }
}));
