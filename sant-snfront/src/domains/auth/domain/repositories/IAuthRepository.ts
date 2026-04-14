// Repository Interface - Auth Domain

import { User, Session } from '../models/User';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'patient';
  prenom: string;
  nom: string;
  telephone: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface IAuthRepository {
  login(data: LoginData): Promise<Session>;
  register(data: RegisterData): Promise<Session>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  getCurrentUser(): Promise<User>;
  forgotPassword(email: string): Promise<{ message: string }>;
  resetPassword(token: string, newPassword: string): Promise<{ message: string }>;
}
