// Domain Models for Rendez-Vous

export interface RendezVous {
  id: number;
  patient_id: number;
  medecin_id: number;
  date: string;
  heure: string;
  type: string;
  motif: string;
  statut: RendezVousStatut;
  specialite?: string;
  prestation_type?: string;
  created_at: string;
  updated_at: string;
}

export type RendezVousStatut = 
  | 'en_attente'
  | 'confirme'
  | 'annule'
  | 'termine'
  | 'no_show';

export interface RendezVousRequest {
  medecin_id: number;
  date: string;
  type: string;
  motif: string;
  specialite?: string;
  prestation_type?: string;
  heure?: string;
}

export interface AvailableSlot {
  date: string;
  heure: string;
  disponible: boolean;
}

export interface Creneau {
  id: number;
  medecin_id: number;
  jour: string;
  heure_debut: string;
  heure_fin: string;
  disponible: boolean;
}

// Response types
export interface RendezVousListResponse {
  data: RendezVous[];
  total: number;
}

export interface RendezVousResponse {
  data: RendezVous;
}

export interface AvailableSlotsResponse {
  data: AvailableSlot[];
}
