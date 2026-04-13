import { API_ENDPOINTS } from '@/config/api-endpoints';
import { extractData, extractSingleData } from '@/lib/api-response';
import { apiService } from '@/services/api';
import type { MarketingCatalog, MarketingCatalogSlot, MarketingDoctor, MarketingService } from '@/types/marketing';

type LegacyCatalogSlotCandidate = {
  jour?: number | string | null;
  heure?: string | null;
  actif?: boolean | null;
} | null;

export type LegacyMarketingMedecin = {
  id?: number | string | null;
  nom?: string | null;
  prenom?: string | null;
  nomComplet?: string | null;
  specialite?: string | null;
  tarif_consultation?: number | string | null;
  tarifConsultation?: number | string | null;
  activeSlotCount?: number | string | null;
  consultationCount?: number | string | null;
  nextAvailableSlot?: MarketingCatalogSlot | LegacyCatalogSlotCandidate;
  creneaux?: LegacyCatalogSlotCandidate[];
  consultations?: Array<{ id?: number | string | null; isArchived?: boolean | null }> | null;
} | null;

const LEGACY_MARKETING_LIMIT = 100;

function toNumber(value: unknown, fallback: number = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSlot(slot: LegacyCatalogSlotCandidate): MarketingCatalogSlot | null {
  if (!slot) {
    return null;
  }

  const jour = toNumber(slot.jour, -1);
  const heure = typeof slot.heure === 'string' ? slot.heure.trim() : '';

  if (jour < 0 || !heure) {
    return null;
  }

  return { jour, heure };
}

function resolveActiveSlotCount(medecin: Exclude<LegacyMarketingMedecin, null>): number {
  if (Array.isArray(medecin.creneaux)) {
    return medecin.creneaux.filter((creneau) => creneau && creneau.actif !== false).length;
  }

  return Math.max(0, toNumber(medecin.activeSlotCount));
}

function resolveConsultationCount(medecin: Exclude<LegacyMarketingMedecin, null>): number {
  if (Array.isArray(medecin.consultations)) {
    return medecin.consultations.filter((consultation) => consultation?.isArchived !== true).length;
  }

  return Math.max(0, toNumber(medecin.consultationCount));
}

function resolveNextAvailableSlot(
  medecin: Exclude<LegacyMarketingMedecin, null>
): MarketingCatalogSlot | null {
  const directSlot = normalizeSlot(medecin.nextAvailableSlot as LegacyCatalogSlotCandidate);
  if (directSlot) {
    return directSlot;
  }

  if (!Array.isArray(medecin.creneaux)) {
    return null;
  }

  const activeSlots = medecin.creneaux
    .filter((creneau) => creneau && creneau.actif !== false)
    .map((creneau) => normalizeSlot(creneau))
    .filter(Boolean) as MarketingCatalogSlot[];

  if (activeSlots.length === 0) {
    return null;
  }

  return activeSlots.sort((left, right) => {
    if (left.jour !== right.jour) {
      return left.jour - right.jour;
    }

    return left.heure.localeCompare(right.heure);
  })[0];
}

function buildDoctorFullName(medecin: Exclude<LegacyMarketingMedecin, null>): string {
  const nomComplet = typeof medecin.nomComplet === 'string' ? medecin.nomComplet.trim() : '';
  if (nomComplet) {
    return nomComplet;
  }

  const prenom = toNonEmptyString(medecin.prenom, '');
  const nom = toNonEmptyString(medecin.nom, '');
  const fullName = `${prenom} ${nom}`.trim();
  return fullName || 'Médecin disponible';
}

function compareSlots(
  left: MarketingCatalogSlot | null,
  right: MarketingCatalogSlot | null
): number {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  if (left.jour !== right.jour) return left.jour - right.jour;
  return left.heure.localeCompare(right.heure);
}

export function buildMarketingCatalogFromLegacyMedecins(
  medecins: LegacyMarketingMedecin[]
): MarketingCatalog {
  const doctors: MarketingDoctor[] = medecins
    .filter(Boolean)
    .map((medecin, index) => {
      const specialite = toNonEmptyString(medecin!.specialite, 'Médecine générale');
      const tarifConsultation = Math.max(
        0,
        toNumber(medecin!.tarifConsultation ?? medecin!.tarif_consultation)
      );

      return {
        id: toNumber(medecin!.id, index + 1),
        nom: toNonEmptyString(medecin!.nom, 'Médecin'),
        prenom: toNonEmptyString(medecin!.prenom, ''),
        nomComplet: buildDoctorFullName(medecin!),
        specialite,
        tarifConsultation,
        activeSlotCount: resolveActiveSlotCount(medecin!),
        consultationCount: resolveConsultationCount(medecin!),
        nextAvailableSlot: resolveNextAvailableSlot(medecin!),
      };
    })
    .sort((left, right) => {
      const specialityComparison = left.specialite.localeCompare(right.specialite, 'fr');
      if (specialityComparison !== 0) {
        return specialityComparison;
      }

      const prenomComparison = left.prenom.localeCompare(right.prenom, 'fr');
      if (prenomComparison !== 0) {
        return prenomComparison;
      }

      return left.nom.localeCompare(right.nom, 'fr');
    });

  const servicesBySpecialite = new Map<
    string,
    {
      specialite: string;
      doctorCount: number;
      activeSlotCount: number;
      totalTarifConsultation: number;
      minTarifConsultation: number;
      maxTarifConsultation: number;
      sampleDoctors: string[];
      nextAvailableSlot: MarketingCatalogSlot | null;
    }
  >();

  for (const doctor of doctors) {
    const current = servicesBySpecialite.get(doctor.specialite);

    if (!current) {
      servicesBySpecialite.set(doctor.specialite, {
        specialite: doctor.specialite,
        doctorCount: 1,
        activeSlotCount: doctor.activeSlotCount,
        totalTarifConsultation: doctor.tarifConsultation,
        minTarifConsultation: doctor.tarifConsultation,
        maxTarifConsultation: doctor.tarifConsultation,
        sampleDoctors: [doctor.nomComplet],
        nextAvailableSlot: doctor.nextAvailableSlot,
      });
      continue;
    }

    current.doctorCount += 1;
    current.activeSlotCount += doctor.activeSlotCount;
    current.totalTarifConsultation += doctor.tarifConsultation;
    current.minTarifConsultation = Math.min(current.minTarifConsultation, doctor.tarifConsultation);
    current.maxTarifConsultation = Math.max(current.maxTarifConsultation, doctor.tarifConsultation);

    if (current.sampleDoctors.length < 3) {
      current.sampleDoctors.push(doctor.nomComplet);
    }

    if (compareSlots(doctor.nextAvailableSlot, current.nextAvailableSlot) < 0) {
      current.nextAvailableSlot = doctor.nextAvailableSlot;
    }
  }

  const services: MarketingService[] = Array.from(servicesBySpecialite.values())
    .map((service) => ({
      slug: toSlug(service.specialite),
      specialite: service.specialite,
      doctorCount: service.doctorCount,
      activeSlotCount: service.activeSlotCount,
      averageTarifConsultation:
        service.doctorCount > 0
          ? Number((service.totalTarifConsultation / service.doctorCount).toFixed(2))
          : 0,
      minTarifConsultation: service.minTarifConsultation,
      maxTarifConsultation: service.maxTarifConsultation,
      sampleDoctors: service.sampleDoctors,
      nextAvailableSlot: service.nextAvailableSlot,
    }))
    .sort((left, right) => {
      if (right.doctorCount !== left.doctorCount) {
        return right.doctorCount - left.doctorCount;
      }

      return left.specialite.localeCompare(right.specialite, 'fr');
    });

  const totalTarifConsultation = doctors.reduce(
    (sum, doctor) => sum + doctor.tarifConsultation,
    0
  );

  return {
    doctors,
    services,
    stats: {
      totalDoctors: doctors.length,
      totalSpecialities: services.length,
      totalActiveSlots: doctors.reduce((sum, doctor) => sum + doctor.activeSlotCount, 0),
      averageTarifConsultation:
        doctors.length > 0 ? Number((totalTarifConsultation / doctors.length).toFixed(2)) : 0,
    },
  };
}

export function shouldUseLegacyMarketingCatalogFallback(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes('route non trouvée') ||
    message.includes('not found') ||
    message.includes('404')
  );
}

export async function loadMarketingCatalog(): Promise<MarketingCatalog | null> {
  try {
    const response = await apiService.get(API_ENDPOINTS.medecins.publicCatalog);
    const catalog = extractSingleData<MarketingCatalog>(response);

    if (catalog) {
      return catalog;
    }
  } catch (error) {
    if (!shouldUseLegacyMarketingCatalogFallback(error)) {
      throw error;
    }
  }

  const legacyResponse = await apiService.get(
    `${API_ENDPOINTS.medecins.list}?page=1&limit=${LEGACY_MARKETING_LIMIT}`
  );
  const legacyMedecins = extractData<LegacyMarketingMedecin[]>(legacyResponse);
  return buildMarketingCatalogFromLegacyMedecins(legacyMedecins);
}
