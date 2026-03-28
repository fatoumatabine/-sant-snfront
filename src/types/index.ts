// Types pour Santé SN

export type UserRole = 'patient' | 'medecin' | 'secretaire' | 'admin';

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  telephone: string;
  patientId?: number;
  medecinId?: number;
  secretaireId?: number;
  avatar?: string;
  dateInscription: string;
  actif: boolean;
}

export interface Patient extends User {
  role: 'patient';
  dateNaissance: string;
  adresse: string;
  groupeSanguin?: string;
  allergies: string[];
  antecedents: Antecedent[];
  contactUrgence?: {
    nom: string;
    telephone: string;
    relation: string;
  };
}

export interface Antecedent {
  id: string;
  type: 'medical' | 'chirurgical' | 'familial' | 'allergie';
  description: string;
  date?: string;
  traitement?: string;
}

export interface Medecin extends User {
  role: 'medecin';
  specialite: string;
  numeroOrdre: string;
  experience: number;
  tarif: number;
  disponibilites: Disponibilite[];
  biographie?: string;
  formations: string[];
}

export interface Disponibilite {
  jour: 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi';
  heureDebut: string;
  heureFin: string;
}

export interface Secretaire extends User {
  role: 'secretaire';
  medecinAssigne?: string;
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

export interface RendezVous {
  id: string;
  patientId: string;
  medecinId: string;
  date: string;
  heure: string;
  motif: string;
  statut: 'en_attente' | 'confirme' | 'annule' | 'termine';
  notes?: string;
  typeConsultation: 'presentiel' | 'video';
  createdAt: string;
}

export interface Consultation {
  id: string;
  rendezVousId: string;
  patientId: string;
  medecinId: string;
  date: string;
  diagnostic: string;
  symptomes: string[];
  traitement: string;
  ordonnance?: Ordonnance;
  notes: string;
  prochainRdv?: string;
}

export interface Ordonnance {
  id: string;
  consultationId: string;
  medicaments: Medicament[];
  instructions: string;
  dateEmission: string;
  validiteJours: number;
}

export interface Medicament {
  nom: string;
  dosage: string;
  frequence: string;
  duree: string;
  instructions?: string;
}

export interface Paiement {
  id: string;
  patientId: string;
  consultationId?: string;
  montant: number;
  statut: 'en_attente' | 'paye' | 'rembourse' | 'echec';
  methodePaiement: 'especes' | 'carte' | 'mobile_money' | 'virement';
  date: string;
  reference: string;
}

export interface Statistiques {
  totalPatients: number;
  totalMedecins: number;
  totalConsultations: number;
  totalRendezVous: number;
  revenus: number;
  consultationsParMois: { mois: string; count: number }[];
  rendezVousParStatut: { statut: string; count: number }[];
  specialitesPopulaires: { specialite: string; count: number }[];
}

export interface QuestionIA {
  id: string;
  question: string;
  options?: string[];
  type: 'text' | 'choice' | 'multiple' | 'scale';
}

export interface EvaluationIA {
  id: string;
  patientId: string;
  date: string;
  reponses: { questionId: string; reponse: string | string[] }[];
  resultat: {
    niveau: 'faible' | 'modere' | 'eleve';
    recommandations: string[];
    specialiteConseillee?: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  titre: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  lu: boolean;
  date: string;
}

export interface DemandeRdv {
  id: string;
  patientId: string;
  medecinId: string;
  datePreferee: string;
  heurePreferee: string;
  motif: string;
  statut: 'nouvelle' | 'traitee' | 'refusee';
  createdAt: string;
}
