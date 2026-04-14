import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Antecedent, User, UserRole } from '@/types';
import { apiService } from '@/services/api';
import {
  AUTH_MIN_LENGTHS,
  AUTH_VALIDATION_MESSAGES,
  isValidGmailEmail,
} from '@/constants/authValidation';
import { splitFullName } from '@/lib/user-name';

interface RegisterPatientPayload {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  password: string;
  dateNaissance?: string;
  adresse?: string;
  groupeSanguin?: string;
  allergies?: string[];
  antecedents?: Antecedent[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterPatientPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setHasHydrated: (value: boolean) => void;
}

const mapAuthUserToStoreUser = (userData: any): User => {
  const parsedName = splitFullName(userData.name);

  return {
    id: String(userData.id),
    email: userData.email,
    nom: userData.nom || parsedName.lastName || '',
    prenom: userData.prenom || parsedName.firstName || '',
    role: userData.role as UserRole,
    telephone: userData.phone || userData.telephone || '',
    patientId: userData.patientId,
    medecinId: userData.medecinId,
    secretaireId: userData.secretaireId,
    avatar: userData.avatarUrl || userData.avatar || undefined,
    dateInscription: new Date().toISOString().split('T')[0],
    actif: true,
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.post('/auth/login', {
            email,
            password
          });

          // Supporte les formats de réponse {success, data: {...}} et {accessToken, user}
          const responseData = response.data || response;
          const token = responseData.accessToken || responseData.access_token;
          const userData = responseData.user;

          if (token && userData) {
            const user = mapAuthUserToStoreUser(userData);

            // Mettre à jour le token dans le service API
            apiService.setToken(token);
            
            const newState = { 
              user, 
              token, 
              isAuthenticated: true, 
              isLoading: false,
              error: null 
            };
            
            set(newState);
            return true;
          }
          
          throw new Error('Réponse invalide du serveur');
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Email ou mot de passe incorrect';
          console.error('✗ Erreur de connexion:', errorMsg);
          set({ 
            isLoading: false, 
            error: errorMsg 
          });
          return false;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const prenom = String(userData.prenom || '').trim();
          const nom = String(userData.nom || '').trim();
          const email = String(userData.email || '').trim().toLowerCase();
          const telephone = String(userData.telephone || '').trim();
          const password = String(userData.password || '');
          const dateNaissance = String(userData.dateNaissance || '').trim();
          const adresse = String(userData.adresse || '').trim();
          const groupeSanguin = String(userData.groupeSanguin || '').trim();
          const allergies = Array.isArray(userData.allergies)
            ? userData.allergies.map((item) => String(item).trim()).filter(Boolean)
            : [];
          const antecedents = Array.isArray(userData.antecedents)
            ? userData.antecedents
                .map((item) => ({
                  type: item.type,
                  description: String(item.description || '').trim(),
                  traitement: item.traitement ? String(item.traitement).trim() : undefined,
                  date: item.date ? String(item.date).trim() : undefined,
                }))
                .filter((item) => item.description.length > 0)
            : [];

          // Alignement strict avec RegisterPatientSchema backend
          if (prenom.length < AUTH_MIN_LENGTHS.name) {
            throw new Error(AUTH_VALIDATION_MESSAGES.prenom);
          }
          if (nom.length < AUTH_MIN_LENGTHS.name) {
            throw new Error(AUTH_VALIDATION_MESSAGES.nom);
          }
          if (!isValidGmailEmail(email)) {
            throw new Error(AUTH_VALIDATION_MESSAGES.gmail);
          }
          if (telephone.length < AUTH_MIN_LENGTHS.telephone) {
            throw new Error(AUTH_VALIDATION_MESSAGES.telephone);
          }
          if (password.length < AUTH_MIN_LENGTHS.password) {
            throw new Error(AUTH_VALIDATION_MESSAGES.password);
          }

          const payload = {
            nom,
            prenom,
            name: `${prenom} ${nom}`.trim(),
            email,
            telephone,
            password,
            role: 'patient',
            ...(dateNaissance ? { date_naissance: dateNaissance } : {}),
            ...(adresse ? { adresse } : {}),
            ...(groupeSanguin ? { groupe_sanguin: groupeSanguin } : {}),
            ...(allergies.length > 0 ? { allergies } : {}),
            ...(antecedents.length > 0 ? { antecedents } : {}),
          };

          const response = await apiService.post('/auth/register', payload);

          // Support backend Node.js (format {success, data: {user, accessToken}})
          const responseData = response?.data || response;
          const token = responseData.accessToken || responseData.access_token;
          const user = responseData.user;

          if (token && user) {
            const newUser = mapAuthUserToStoreUser(user);

            // Mettre à jour le token dans le service API
            apiService.setToken(token);
            
            set({ 
              user: newUser, 
              token, 
              isAuthenticated: true, 
              isLoading: false,
              error: null 
            });
            return true;
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Erreur lors de l\'inscription' 
          });
          return false;
        }
      },

      logout: async () => {
        try {
          await apiService.post('/auth/logout', {});
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
        }
        
        apiService.setToken(null);
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          error: null 
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: user !== null });
      },

      setToken: (token: string | null) => {
        set({ token });
        if (token) {
          apiService.setToken(token);
        }
      },

      setHasHydrated: (value: boolean) => {
        set({ hasHydrated: value });
      },
    }),
    {
      name: 'sante-sn-auth',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          apiService.setToken(state.token);
        }
        state?.setHasHydrated(true);
      }
    }
  )
);

// Helper pour obtenir le chemin de redirection selon le rôle
export const getRedirectPath = (role: UserRole): string => {
  const paths: Record<UserRole, string> = {
    patient: '/patient/dashboard',
    medecin: '/medecin/dashboard',
    secretaire: '/secretaire/dashboard',
    admin: '/admin/dashboard'
  };
  return paths[role];
};
