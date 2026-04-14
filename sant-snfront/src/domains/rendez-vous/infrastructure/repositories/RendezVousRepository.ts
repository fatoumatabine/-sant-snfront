// Infrastructure - Rendez-Vous Repository Implementation
import { apiService } from '@/services/api';
import { IRendezVousRepository } from '../../domain/repositories/IRendezVousRepository';
import { 
  RendezVous, 
  RendezVousRequest, 
  RendezVousListResponse,
  RendezVousResponse,
  AvailableSlot 
} from '../../domain/models/RendezVous';

const API_BASE = '/rendez-vous';

function unwrapData<T>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
}

export class RendezVousRepository implements IRendezVousRepository {
  async create(data: RendezVousRequest): Promise<RendezVous> {
    const response = await apiService.post(`${API_BASE}`, data);
    return unwrapData<RendezVous>(response);
  }

  async getAll(): Promise<RendezVousListResponse> {
    const response = await apiService.get(`${API_BASE}`);
    const data = unwrapData<RendezVous[]>(response);
    return { data, total: data.length };
  }

  async getById(id: number): Promise<RendezVousResponse> {
    const response = await apiService.get(`${API_BASE}/${id}`);
    const data = unwrapData<RendezVous>(response);
    return { data };
  }

  async cancel(id: number): Promise<RendezVousResponse> {
    const response = await apiService.delete(`${API_BASE}/${id}`);
    const data = unwrapData<RendezVous>(response);
    return { data };
  }

  async getByMedecin(medecinId: number): Promise<RendezVousListResponse> {
    const response = await apiService.get(`${API_BASE}/medecin/list?medecin_id=${medecinId}`);
    const data = unwrapData<RendezVous[]>(response);
    return { data, total: data.length };
  }

  async confirm(id: number): Promise<RendezVousResponse> {
    const response = await apiService.post(`${API_BASE}/${id}/confirmer`, {});
    const data = unwrapData<RendezVous>(response);
    return { data };
  }

  async getPending(): Promise<RendezVousListResponse> {
    const response = await apiService.get(`/secretaire/dashboard/demandes`);
    const data = unwrapData<RendezVous[]>(response);
    return { data, total: data.length };
  }

  async processDemande(id: number, accept: boolean): Promise<RendezVousResponse> {
    const action = accept ? 'valider' : 'rejeter';
    const response = await apiService.put(`/secretaire/demandes/${id}/${action}`, {});
    const data = unwrapData<RendezVous>(response);
    return { data };
  }

  async getAvailableSlots(medecinId: number, date: string): Promise<AvailableSlot[]> {
    const response = await apiService.get(
      `${API_BASE}/creneaux-disponibles?medecinId=${medecinId}&date=${date}`
    );
    const data = unwrapData<AvailableSlot[]>(response);
    return data;
  }
}

// Export singleton instance
export const rendezVousRepository = new RendezVousRepository();
