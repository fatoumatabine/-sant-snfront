export interface MarketingCatalogSlot {
  jour: number;
  heure: string;
}

export interface MarketingDoctor {
  id: number;
  nom: string;
  prenom: string;
  nomComplet: string;
  specialite: string;
  tarifConsultation: number;
  activeSlotCount: number;
  consultationCount: number;
  nextAvailableSlot: MarketingCatalogSlot | null;
}

export interface MarketingService {
  slug: string;
  specialite: string;
  doctorCount: number;
  activeSlotCount: number;
  averageTarifConsultation: number;
  minTarifConsultation: number;
  maxTarifConsultation: number;
  sampleDoctors: string[];
  nextAvailableSlot: MarketingCatalogSlot | null;
}

export interface MarketingCatalog {
  doctors: MarketingDoctor[];
  services: MarketingService[];
  stats: {
    totalDoctors: number;
    totalSpecialities: number;
    totalActiveSlots: number;
    averageTarifConsultation: number;
  };
}

