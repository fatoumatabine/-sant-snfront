import { create } from 'zustand';
import { apiService } from '@/services/api';

interface Consultation {
  id: string;
  rendezVousId: string;
  patientId: string;
  medecinId: string;
  date: string;
  diagnostic: string;
  constantes: {
    tension: string;
    temperature: number;
    poids: number;
    taille: number;
  };
  notes: string;
}

interface ConsultationState {
  consultations: Consultation[];
  isLoading: boolean;
  error: string | null;
  
  fetchConsultations: () => Promise<void>;
  fetchConsultationById: (id: string) => Promise<Consultation | null>;
  createConsultation: (data: any) => Promise<boolean>;
  updateConstantes: (id: string, constantes: any) => Promise<boolean>;
  updateDiagnostic: (id: string, diagnostic: string) => Promise<boolean>;
}

export const useConsultationStore = create<ConsultationState>((set, get) => ({
  consultations: [],
  isLoading: false,
  error: null,

  fetchConsultations: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get('/patient/mes-consultations');

      if (response.data) {
        const consultations = Array.isArray(response.data) ? response.data : response.data.data || [];
        const mapped = consultations.map((c: any) => ({
          id: c.id.toString(),
          rendezVousId: c.rendez_vous_id?.toString() || '',
          patientId: c.patient_id?.toString() || '',
          medecinId: c.medecin_id?.toString() || '',
          date: c.date || new Date().toISOString().split('T')[0],
          diagnostic: c.diagnostic || '',
          constantes: c.constantes || {
            tension: '',
            temperature: 0,
            poids: 0,
            taille: 0
          },
          notes: c.notes || ''
        }));

        set({ consultations: mapped, isLoading: false });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  },

  fetchConsultationById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get(`/consultations/${id}`);

      if (response.data) {
        const c = response.data;
        const consultation: Consultation = {
          id: c.id.toString(),
          rendezVousId: c.rendez_vous_id?.toString() || '',
          patientId: c.patient_id?.toString() || '',
          medecinId: c.medecin_id?.toString() || '',
          date: c.date || new Date().toISOString().split('T')[0],
          diagnostic: c.diagnostic || '',
          constantes: c.constantes || {
            tension: '',
            temperature: 0,
            poids: 0,
            taille: 0
          },
          notes: c.notes || ''
        };

        return consultation;
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
    return null;
  },

  createConsultation: async (data: any) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.post(`/consultations/${data.rendezVousId}`, {
        diagnostic: data.diagnostic,
        notes: data.notes
      });

      if (response.data) {
        const newConsultation: Consultation = {
          id: response.data.id.toString(),
          rendezVousId: response.data.rendez_vous_id?.toString() || '',
          patientId: response.data.patient_id?.toString() || '',
          medecinId: response.data.medecin_id?.toString() || '',
          date: response.data.date || new Date().toISOString().split('T')[0],
          diagnostic: response.data.diagnostic || '',
          constantes: response.data.constantes || {},
          notes: response.data.notes || ''
        };

        set(state => ({
          consultations: [...state.consultations, newConsultation],
          isLoading: false
        }));
        return true;
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la création' 
      });
      return false;
    }
  },

  updateConstantes: async (id: string, constantes: any) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.put(`/consultations/${id}/constantes`, constantes);

      set(state => ({
        consultations: state.consultations.map(c =>
          c.id === id ? { ...c, constantes } : c
        ),
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour' 
      });
      return false;
    }
  },

  updateDiagnostic: async (id: string, diagnostic: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.put(`/consultations/${id}/diagnostic`, { diagnostic });

      set(state => ({
        consultations: state.consultations.map(c =>
          c.id === id ? { ...c, diagnostic } : c
        ),
        isLoading: false
      }));
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
