import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PatientMedicalRecord } from '@/pages/Patient/PatientMedicalRecord';
import { MedecinProfile } from '@/pages/Medecin/MedecinProfile';
import { WebChatPage } from '@/pages/Common/WebChatPage';
import { apiService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

vi.mock('@/services/api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedApiService = apiService as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

const mockedUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

const medecinAuthState = {
  user: {
    id: '42',
    email: 'medecin@example.com',
    prenom: 'Aminata',
    nom: 'Ndiaye',
    role: 'medecin',
    telephone: '770000000',
    dateInscription: '2026-01-01',
    actif: true,
  },
  setUser: vi.fn(),
};

const patientAuthState = {
  user: {
    id: '12',
    email: 'patient@example.com',
    prenom: 'Awa',
    nom: 'Diallo',
    role: 'patient',
    telephone: '771111111',
    dateInscription: '2026-01-01',
    actif: true,
  },
  setUser: vi.fn(),
};

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseAuthStore.mockReturnValue(patientAuthState);
});

describe('critical flows', () => {
  it('affiche le dossier medical avec les donnees API', async () => {
    mockedApiService.get.mockResolvedValueOnce({
      data: {
        patient: {
          id: 12,
          prenom: 'Awa',
          nom: 'Diallo',
          email: 'patient@example.com',
          telephone: '771111111',
          adresse: 'Dakar',
          dateNaissance: '1998-06-04T00:00:00.000Z',
          groupeSanguin: 'O+',
          diabete: false,
          hypertension: true,
          hepatite: false,
          autresPathologies: 'Asthme',
        },
        summary: {
          consultationsCount: 4,
          ordonnancesCount: 2,
          upcomingAppointmentsCount: 1,
          triageCount: 3,
          lastConsultationAt: '2026-03-20T00:00:00.000Z',
        },
        recentConsultations: [
          {
            id: '1',
            date: '2026-03-20T00:00:00.000Z',
            diagnostic: 'Suivi général',
            notes: 'RAS',
            ordonnanceId: 19,
            medecin: {
              prenom: 'Moussa',
              nom: 'Ba',
              specialite: 'Cardiologie',
            },
          },
        ],
      },
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PatientMedicalRecord />
      </MemoryRouter>
    );

    expect(await screen.findByText('Profil de santé')).toBeInTheDocument();
    expect(screen.getByText('Awa Diallo')).toBeInTheDocument();
    expect(screen.getByText('Asthme')).toBeInTheDocument();
    expect(screen.getByText('Suivi général')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Voir tout l’historique/i })).toHaveAttribute(
      'href',
      '/patient/consultations'
    );
  });

  it('charge et met a jour le profil medecin', async () => {
    mockedUseAuthStore.mockReturnValue(medecinAuthState);

    mockedApiService.get.mockResolvedValueOnce({
      data: {
        id: 7,
        prenom: 'Aminata',
        nom: 'Ndiaye',
        specialite: 'Médecine générale',
        telephone: '770000000',
        adresse: 'Dakar Plateau',
        tarif_consultation: 15000,
        user: {
          email: 'medecin@example.com',
        },
      },
    });

    mockedApiService.put.mockResolvedValueOnce({
      data: {
        id: 7,
        prenom: 'Aminata',
        nom: 'Ndiaye',
        specialite: 'Cardiologie',
        telephone: '776666666',
        adresse: 'Point E',
        tarif_consultation: 20000,
      },
    });

    render(<MedecinProfile />);

    expect(await screen.findByDisplayValue('Aminata')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Spécialité'), {
      target: { value: 'Cardiologie' },
    });
    fireEvent.change(screen.getByLabelText('Téléphone'), {
      target: { value: '776666666' },
    });
    fireEvent.change(screen.getByLabelText('Tarif consultation'), {
      target: { value: '20000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer les modifications/i }));

    await waitFor(() => {
      expect(mockedApiService.put).toHaveBeenCalledWith(
        '/medecins/7',
        expect.objectContaining({
          specialite: 'Cardiologie',
          telephone: '776666666',
          tarif_consultation: 20000,
        })
      );
    });

    expect(medecinAuthState.setUser).toHaveBeenCalledWith(
      expect.objectContaining({
        prenom: 'Aminata',
        nom: 'Ndiaye',
        telephone: '776666666',
      })
    );
  });

  it('affiche un message utile si le backend chat nest pas pret', async () => {
    mockedUseAuthStore.mockReturnValue(patientAuthState);

    mockedApiService.get.mockImplementation((endpoint: string) => {
      if (endpoint === '/chat/contacts') {
        return Promise.resolve({
          data: [
            {
              userId: 77,
              name: 'Dr. Fall',
              email: 'fall@example.com',
              role: 'medecin',
            },
          ],
        });
      }

      if (endpoint === '/chat/threads') {
        return Promise.reject(
          new Error("Le client Prisma du chat n'est pas généré. Exécutez `npx prisma generate` puis redémarrez l'API.")
        );
      }

      return Promise.resolve({ data: [] });
    });

    render(<WebChatPage />);

    expect(await screen.findByText('Messagerie temporairement indisponible')).toBeInTheDocument();
    expect(screen.getByText(/npx prisma generate/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dr\. Fall/i })).toBeDisabled();
  });
});
