// Register Use Case - Auth Domain

import { IAuthRepository, RegisterData } from '../../domain/repositories/IAuthRepository';
import { Session } from '../../domain/models/User';
import {
  AUTH_MIN_LENGTHS,
  AUTH_VALIDATION_MESSAGES,
  isValidGmailEmail,
} from '@/constants/authValidation';

export class RegisterUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(data: RegisterData): Promise<Session> {
    // Validation
    this.validateData(data);

    const session = await this.authRepository.register(data);

    // Store tokens
    localStorage.setItem('accessToken', session.accessToken);
    localStorage.setItem('refreshToken', session.refreshToken);

    return session;
  }

  private validateData(data: RegisterData): void {
    if (!isValidGmailEmail(data.email || '')) {
      throw new Error(AUTH_VALIDATION_MESSAGES.gmail);
    }
    if ((data.password || '').length < AUTH_MIN_LENGTHS.password) {
      throw new Error(AUTH_VALIDATION_MESSAGES.password);
    }
    if ((data.prenom || '').trim().length < AUTH_MIN_LENGTHS.name) {
      throw new Error(AUTH_VALIDATION_MESSAGES.prenom);
    }
    if ((data.nom || '').trim().length < AUTH_MIN_LENGTHS.name) {
      throw new Error(AUTH_VALIDATION_MESSAGES.nom);
    }
    if ((data.telephone || '').trim().length < AUTH_MIN_LENGTHS.telephone) {
      throw new Error(AUTH_VALIDATION_MESSAGES.telephone);
    }
    if ((data.name || '').trim().length < AUTH_MIN_LENGTHS.name) {
      throw new Error('Nom complet requis');
    }
    if (data.role !== 'patient') {
      throw new Error("Seul le role 'patient' est autorise");
    }
  }
}
