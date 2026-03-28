import { create } from 'zustand';
import { RendezVous, DemandeRdv } from '@/types';
import { apiService } from '@/services/api';

interface RendezVousState {
  rendezVous: RendezVous[];
  demandes: DemandeRdv[];
  isLoading: boolean;
  error: string | null;
  
  getRendezVousByPatient: (patientId: string) => RendezVous[];
  getRendezVousByMedecin: (medecinId: string) => RendezVous[];
  getDemandesByMedecin: (medecinId: string) => DemandeRdv[];
  createRendezVous: (rdv: Omit<RendezVous, 'id' | 'createdAt'>) => Promise<boolean>;
  updateRendezVousStatut: (id: string, statut: RendezVous['statut']) => Promise<boolean>;
  createDemandeRdv: (demande: Omit<DemandeRdv, 'id' | 'createdAt' | 'statut'>) => Promise<boolean>;
  traiterDemande: (id: string, accepter: boolean) => Promise<boolean>;
  fetchMesRendezVous: () => Promise<void>;
  fetchMedecinRendezVous: () => Promise<void>;
  annulerRendezVous: (id: string) => Promise<boolean>;
  validerRendezVous: (id: string) => Promise<boolean>;
}

export const useRendezVousStore = create<RendezVousState>((set, get) => ({
  rendezVous: [],
  demandes: [],
  isLoading: false,
  error: null,

  getRendezVousByPatient: (patientId: string) => {
    return get().rendezVous.filter(rdv => rdv.patientId === patientId);
  },

  getRendezVousByMedecin: (medecinId: string) => {
    return get().rendezVous.filter(rdv => rdv.medecinId === medecinId);
  },

  getDemandesByMedecin: (medecinId: string) => {
    return get().demandes.filter(d => d.medecinId === medecinId);
  },

  createRendezVous: async (rdv) => {
    set({ isLoading: true, error: null });
    
    try {
      const payload = {
        medecin_id: rdv.medecinId,
        date: rdv.date,
        heure: rdv.heure,
        motif: rdv.motif,
        type: rdv.typeConsultation === 'video' ? 'en_ligne' : 'presentiel'
      };

      const response = await apiService.post('/rendez-vous', payload);

      if (response.data) {
        const newRdv: RendezVous = {
          id: response.data.id.toString(),
          ...rdv,
          createdAt: new Date().toISOString().split('T')[0]
        };
        
        set(state => ({ 
          rendezVous: [...state.rendezVous, newRdv],
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

  updateRendezVousStatut: async (id: string, statut: RendezVous['statut']) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.put(`/rendez-vous/${id}`, { statut });

      set(state => ({
        rendezVous: state.rendezVous.map(rdv =>
          rdv.id === id ? { ...rdv, statut } : rdv
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

  createDemandeRdv: async (demande) => {
    set({ isLoading: true, error: null });
    
    try {
      const payload = {
        medecin_id: Number(demande.medecinId),
        date: demande.datePreferee,
        heure: demande.heurePreferee,
        motif: demande.motif,
        type: 'presentiel',
      };

      const response = await apiService.post('/rendez-vous', payload);

      if (response.data) {
        const newDemande: DemandeRdv = {
          ...demande,
          id: response.data.id.toString(),
          statut: 'nouvelle',
          createdAt: new Date().toISOString().split('T')[0]
        };
        
        set(state => ({ 
          demandes: [...state.demandes, newDemande],
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

  traiterDemande: async (id: string, accepter: boolean) => {
    set({ isLoading: true, error: null });
    
    try {
      const statut = accepter ? 'traitee' : 'refusee';
      const action = accepter ? 'valider' : 'rejeter';
      await apiService.put(`/secretaire/demandes/${id}/${action}`, {});

      set(state => ({
        demandes: state.demandes.map(d =>
          d.id === id ? { ...d, statut: statut as DemandeRdv['statut'] } : d
        ),
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du traitement' 
      });
      return false;
    }
  },

  fetchMesRendezVous: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get('/patient/mes-rendez-vous');

      if (response.data) {
        const rendezVous = Array.isArray(response.data) ? response.data : response.data.data || [];
        const mapped = rendezVous.map((rdv: any) => ({
          id: rdv.id.toString(),
          patientId: String(rdv.patientId ?? rdv.patient_id ?? ''),
          medecinId: String(rdv.medecinId ?? rdv.medecin_id ?? ''),
          date: rdv.date,
          heure: rdv.heure,
          motif: rdv.motif || '',
          typeConsultation: rdv.type === 'en_ligne' ? 'video' : 'presentiel' as const,
          statut: rdv.statut as RendezVous['statut'],
          createdAt: (rdv.createdAt || rdv.created_at)?.split('T')[0] || new Date().toISOString().split('T')[0]
        }));

        set({ rendezVous: mapped, isLoading: false });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  },

  fetchMedecinRendezVous: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.get('/rendez-vous/medecin/list');

      if (response.data) {
        const rendezVous = Array.isArray(response.data) ? response.data : response.data.data || [];
        const mapped = rendezVous.map((rdv: any) => ({
          id: rdv.id.toString(),
          patientId: String(rdv.patientId ?? rdv.patient_id ?? ''),
          medecinId: String(rdv.medecinId ?? rdv.medecin_id ?? ''),
          date: rdv.date,
          heure: rdv.heure,
          motif: rdv.motif || '',
          typeConsultation: rdv.type === 'en_ligne' ? 'video' : 'presentiel' as const,
          statut: rdv.statut as RendezVous['statut'],
          createdAt: (rdv.createdAt || rdv.created_at)?.split('T')[0] || new Date().toISOString().split('T')[0]
        }));

        set({ rendezVous: mapped, isLoading: false });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement' 
      });
    }
  },

  annulerRendezVous: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.delete(`/rendez-vous/${id}`);

      set(state => ({
        rendezVous: state.rendezVous.map(rdv =>
          rdv.id === id ? { ...rdv, statut: 'annule' as const } : rdv
        ),
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'annulation' 
      });
      return false;
    }
  },

  validerRendezVous: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.post(`/rendez-vous/${id}/confirmer`, {});

      set(state => ({
        rendezVous: state.rendezVous.map(rdv =>
          rdv.id === id ? { ...rdv, statut: 'confirme' as const } : rdv
        ),
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la validation' 
      });
      return false;
    }
  }
}));
