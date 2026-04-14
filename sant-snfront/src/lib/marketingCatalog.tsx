import {
  Activity,
  Baby,
  Brain,
  Heart,
  Microscope,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MarketingCatalog, MarketingCatalogSlot } from '@/types/marketing';
import { marketingImages } from '@/lib/marketingImages';

type SpecialtyPresentation = {
  Icon: LucideIcon;
  image: string;
  description: string;
};

const dayLabels = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
];

export const marketingCatalogFallback: MarketingCatalog = {
  doctors: [
    {
      id: 1,
      nom: 'Ndiaye',
      prenom: 'Awa',
      nomComplet: 'Dr Awa Ndiaye',
      specialite: 'Médecine générale',
      tarifConsultation: 15000,
      activeSlotCount: 6,
      consultationCount: 128,
      nextAvailableSlot: { jour: 1, heure: '09:00' },
    },
    {
      id: 2,
      nom: 'Ba',
      prenom: 'Moussa',
      nomComplet: 'Dr Moussa Ba',
      specialite: 'Cardiologie',
      tarifConsultation: 25000,
      activeSlotCount: 4,
      consultationCount: 84,
      nextAvailableSlot: { jour: 2, heure: '11:30' },
    },
    {
      id: 3,
      nom: 'Fall',
      prenom: 'Mariama',
      nomComplet: 'Dr Mariama Fall',
      specialite: 'Pédiatrie',
      tarifConsultation: 20000,
      activeSlotCount: 5,
      consultationCount: 96,
      nextAvailableSlot: { jour: 3, heure: '10:00' },
    },
    {
      id: 4,
      nom: 'Sarr',
      prenom: 'Fatou',
      nomComplet: 'Dr Fatou Sarr',
      specialite: 'Gynécologie',
      tarifConsultation: 22000,
      activeSlotCount: 3,
      consultationCount: 73,
      nextAvailableSlot: { jour: 4, heure: '14:00' },
    },
  ],
  services: [
    {
      slug: 'medecine-generale',
      specialite: 'Médecine générale',
      doctorCount: 1,
      activeSlotCount: 6,
      averageTarifConsultation: 15000,
      minTarifConsultation: 15000,
      maxTarifConsultation: 15000,
      sampleDoctors: ['Dr Awa Ndiaye'],
      nextAvailableSlot: { jour: 1, heure: '09:00' },
    },
    {
      slug: 'cardiologie',
      specialite: 'Cardiologie',
      doctorCount: 1,
      activeSlotCount: 4,
      averageTarifConsultation: 25000,
      minTarifConsultation: 25000,
      maxTarifConsultation: 25000,
      sampleDoctors: ['Dr Moussa Ba'],
      nextAvailableSlot: { jour: 2, heure: '11:30' },
    },
    {
      slug: 'pediatrie',
      specialite: 'Pédiatrie',
      doctorCount: 1,
      activeSlotCount: 5,
      averageTarifConsultation: 20000,
      minTarifConsultation: 20000,
      maxTarifConsultation: 20000,
      sampleDoctors: ['Dr Mariama Fall'],
      nextAvailableSlot: { jour: 3, heure: '10:00' },
    },
    {
      slug: 'gynecologie',
      specialite: 'Gynécologie',
      doctorCount: 1,
      activeSlotCount: 3,
      averageTarifConsultation: 22000,
      minTarifConsultation: 22000,
      maxTarifConsultation: 22000,
      sampleDoctors: ['Dr Fatou Sarr'],
      nextAvailableSlot: { jour: 4, heure: '14:00' },
    },
  ],
  stats: {
    totalDoctors: 4,
    totalSpecialities: 4,
    totalActiveSlots: 18,
    averageTarifConsultation: 20500,
  },
};

function normalized(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function formatMarketingSlot(slot: MarketingCatalogSlot | null): string {
  if (!slot) {
    return 'Créneau à confirmer';
  }

  return `${dayLabels[slot.jour] || 'Jour'} à ${slot.heure}`;
}

export function getSpecialtyPresentation(specialite: string): SpecialtyPresentation {
  const value = normalized(specialite);

  if (value.includes('cardio') || value.includes('coeur')) {
    return {
      Icon: Heart,
      image: marketingImages.specialtyCardiology,
      description:
        'Suivi cardiovasculaire, prévention, avis spécialisé et accompagnement sur les risques chroniques.',
    };
  }

  if (value.includes('pedi') || value.includes('enfant')) {
    return {
      Icon: Baby,
      image: marketingImages.specialtyPediatrics,
      description:
        "Consultations pédiatriques, suivi de croissance, prévention familiale et réponses rapides pour l'enfant.",
    };
  }

  if (
    value.includes('psy') ||
    value.includes('mental') ||
    value.includes('neuro')
  ) {
    return {
      Icon: Brain,
      image: marketingImages.specialtyMental,
      description:
        'Écoute, orientation spécialisée et accompagnement pour les besoins émotionnels, cognitifs et psychiques.',
    };
  }

  if (
    value.includes('derma') ||
    value.includes('bio') ||
    value.includes('labo') ||
    value.includes('analyse')
  ) {
    return {
      Icon: Microscope,
      image: marketingImages.specialtyLabs,
      description:
        'Bilans, analyses, exploration clinique et aide au diagnostic pour mieux orienter la prise en charge.',
    };
  }

  if (value.includes('gyne') || value.includes('femme') || value.includes('fam')) {
    return {
      Icon: Users,
      image: marketingImages.specialtyFamily,
      description:
        'Suivi de santé familiale, parcours féminins et accompagnement des besoins de consultation du quotidien.',
    };
  }

  if (value.includes('urgence') || value.includes('trauma')) {
    return {
      Icon: ShieldCheck,
      image: marketingImages.specialtyUrgency,
      description:
        "Évaluation plus rapide des situations sensibles et meilleur aiguillage vers l'action adaptée.",
    };
  }

  if (value.includes('chir')) {
    return {
      Icon: Activity,
      image: marketingImages.specialtySurgery,
      description:
        'Avis spécialisé, préparation pré-opératoire et suivi coordonné après intervention ou examen.',
    };
  }

  return {
    Icon: Stethoscope,
    image: marketingImages.specialtyDefault,
    description:
      'Consultation médicale structurée, prise en charge du quotidien et orientation vers le bon niveau de soin.',
  };
}

export function buildDoctorInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}
