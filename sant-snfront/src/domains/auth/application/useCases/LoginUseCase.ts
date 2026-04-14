// Login Use Case - Auth Domain

import { IAuthRepository, LoginData } from '../../domain/repositories/IAuthRepository';
import { Session } from '../../domain/models/User';

export class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(data: LoginData): Promise<Session> {
    // Validation
    if (!data.email || !data.password) {
      throw new Error('Email et mot de passe requis');
    }

    const session = await this.authRepository.login(data);

    // Store tokens
    localStorage.setItem('accessToken', session.accessToken);
    localStorage.setItem('refreshToken', session.refreshToken);

    return session;
  }
}
