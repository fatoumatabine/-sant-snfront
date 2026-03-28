// useAuth Hook - Auth Domain Presentation Layer

import { useState, useCallback, useEffect } from 'react';
import { User } from '../../domain/models/User';
import { LoginUseCase } from '../../application/useCases/LoginUseCase';
import { RegisterUseCase } from '../../application/useCases/RegisterUseCase';
import { authRepository } from '../../infrastructure/repositories/AuthRepository';
import { LoginData, RegisterData } from '../../domain/repositories/IAuthRepository';

// Initialize use cases
const loginUseCase = new LoginUseCase(authRepository);
const registerUseCase = new RegisterUseCase(authRepository);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsAuthenticated(true);
      // Optionally fetch user data here
    }
  }, []);

  const login = useCallback(async (data: LoginData) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await loginUseCase.execute(data);
      setUser(session.user);
      setIsAuthenticated(true);
      return session;
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await registerUseCase.execute(data);
      setUser(session.user);
      setIsAuthenticated(true);
      return session;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authRepository.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      // Still clear local state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
}
