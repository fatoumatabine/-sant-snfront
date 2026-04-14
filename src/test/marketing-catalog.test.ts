import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMarketingCatalog } from '@/lib/marketingCatalogApi';
import { apiService } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiService: {
    get: vi.fn(),
  },
}));

const mockedApiService = apiService as unknown as {
  get: ReturnType<typeof vi.fn>;
};

describe('marketing catalog api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reconstruit le catalogue depuis la liste legacy si la route agregée est absente', async () => {
    mockedApiService.get
      .mockRejectedValueOnce(new Error('Route non trouvée'))
      .mockResolvedValueOnce({
        data: [
          {
            id: 7,
            prenom: 'Aminata',
            nom: 'Ndiaye',
            specialite: 'Médecine générale',
            tarif_consultation: 15000,
          },
          {
            id: 8,
            prenom: 'Moussa',
            nom: 'Ba',
            specialite: 'Cardiologie',
            tarif_consultation: 25000,
          },
        ],
      });

    const catalog = await loadMarketingCatalog();

    expect(mockedApiService.get).toHaveBeenNthCalledWith(1, '/medecins/public/catalog');
    expect(mockedApiService.get).toHaveBeenNthCalledWith(2, '/medecins?page=1&limit=100');
    expect(catalog).toEqual({
      doctors: [
        {
          id: 8,
          nom: 'Ba',
          prenom: 'Moussa',
          nomComplet: 'Moussa Ba',
          specialite: 'Cardiologie',
          tarifConsultation: 25000,
          activeSlotCount: 0,
          consultationCount: 0,
          nextAvailableSlot: null,
        },
        {
          id: 7,
          nom: 'Ndiaye',
          prenom: 'Aminata',
          nomComplet: 'Aminata Ndiaye',
          specialite: 'Médecine générale',
          tarifConsultation: 15000,
          activeSlotCount: 0,
          consultationCount: 0,
          nextAvailableSlot: null,
        },
      ],
      services: [
        {
          slug: 'cardiologie',
          specialite: 'Cardiologie',
          doctorCount: 1,
          activeSlotCount: 0,
          averageTarifConsultation: 25000,
          minTarifConsultation: 25000,
          maxTarifConsultation: 25000,
          sampleDoctors: ['Moussa Ba'],
          nextAvailableSlot: null,
        },
        {
          slug: 'medecine-generale',
          specialite: 'Médecine générale',
          doctorCount: 1,
          activeSlotCount: 0,
          averageTarifConsultation: 15000,
          minTarifConsultation: 15000,
          maxTarifConsultation: 15000,
          sampleDoctors: ['Aminata Ndiaye'],
          nextAvailableSlot: null,
        },
      ],
      stats: {
        totalDoctors: 2,
        totalSpecialities: 2,
        totalActiveSlots: 0,
        averageTarifConsultation: 20000,
      },
    });
  });

  it('propage les erreurs non liees a une route manquante', async () => {
    mockedApiService.get.mockRejectedValueOnce(new Error('Erreur reseau inattendue'));

    await expect(loadMarketingCatalog()).rejects.toThrow('Erreur reseau inattendue');
    expect(mockedApiService.get).toHaveBeenCalledTimes(1);
  });
});
