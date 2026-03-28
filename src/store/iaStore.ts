import { create } from 'zustand';
import { apiService } from '@/services/api';

interface EvaluationIAResult {
  id: string;
  patientId: string;
  symptomes: string;
  diagnostic: string;
  recommendations: string;
  dateEvaluation: string;
}

interface IAState {
  evaluations: EvaluationIAResult[];
  isLoading: boolean;
  error: string | null;
  
  evaluer: (symptomes: string) => Promise<EvaluationIAResult | null>;
  fetchHistorique: () => Promise<void>;
}

export const useIAStore = create<IAState>((set, get) => ({
  evaluations: [],
  isLoading: false,
  error: null,

  evaluer: async (symptomes: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.post('/ia/evaluer', {
        symptomes
      });

      if (response.data) {
        const evaluation: EvaluationIAResult = {
          id: response.data.id?.toString() || '',
          patientId: response.data.patient_id?.toString() || '',
          symptomes: response.data.symptomes || symptomes,
          diagnostic: response.data.diagnostic || '',
          recommendations: response.data.recommendations || '',
          dateEvaluation: response.data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
        };

        set(state => ({
          evaluations: [...state.evaluations, evaluation],
          isLoading: false
        }));

        return evaluation;
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'évaluation' 
      });
      return null;
    }
  },

  fetchHistorique: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get('/ia/historique');

      if (response.data) {
        const evaluations = Array.isArray(response.data) ? response.data : response.data.data || [];
        const mapped = evaluations.map((e: any) => ({
          id: e.id?.toString() || '',
          patientId: e.patient_id?.toString() || '',
          symptomes: e.symptomes || '',
          diagnostic: e.diagnostic || '',
          recommendations: e.recommendations || '',
          dateEvaluation: e.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
        }));

        set({ evaluations: mapped, isLoading: false });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  }
}));
