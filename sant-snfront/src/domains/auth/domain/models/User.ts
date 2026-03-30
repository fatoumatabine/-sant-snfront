// Domain Models - Auth

export type UserRole = 'patient' | 'medecin' | 'secretaire' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  patientId?: number;
  medecinId?: number;
  secretaireId?: number;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
