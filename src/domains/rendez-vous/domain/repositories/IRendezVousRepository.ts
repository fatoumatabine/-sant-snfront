// Repository Interface for Rendez-Vous
import { 
  RendezVous, 
  RendezVousRequest, 
  RendezVousListResponse,
  RendezVousResponse,
  AvailableSlot 
} from '../models/RendezVous';

export interface IRendezVousRepository {
  // Patient operations
  create(data: RendezVousRequest): Promise<RendezVous>;
  getAll(): Promise<RendezVousListResponse>;
  getById(id: number): Promise<RendezVousResponse>;
  cancel(id: number): Promise<RendezVousResponse>;
  
  // Medecin operations
  getByMedecin(medecinId: number): Promise<RendezVousListResponse>;
  confirm(id: number): Promise<RendezVousResponse>;
  
  // Secretary operations
  getPending(): Promise<RendezVousListResponse>;
  processDemande(id: number, accept: boolean): Promise<RendezVousResponse>;
  
  // Availability
  getAvailableSlots(medecinId: number, date: string): Promise<AvailableSlot[]>;
}
