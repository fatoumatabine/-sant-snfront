// Auth Repository Implementation

import { IAuthRepository, LoginData, RegisterData } from '../../domain/repositories/IAuthRepository';
import { Session, User } from '../../domain/models/User';
import { API_BASE_URL, fetchWithTimeout, toApiNetworkError } from '@/lib/api-network';

// Helper for making API calls
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  let response: Response;

  try {
    response = await fetchWithTimeout(url, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error('[Auth API Network Error]', { url, error });
    throw toApiNetworkError(error, url);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export class AuthRepository implements IAuthRepository {
  async login(data: LoginData): Promise<Session> {
    const responseData = await apiRequest<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    
    return {
      user: responseData.user,
      accessToken: responseData.accessToken,
      refreshToken: responseData.refreshToken,
    };
  }

  async register(data: RegisterData): Promise<Session> {
    const prenom = (data.prenom || '').trim();
    const nom = (data.nom || '').trim();

    const responseData = await apiRequest<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({
          name: data.name || `${prenom} ${nom}`.trim(),
          email: data.email,
          password: data.password,
          role: data.role,
          prenom,
          nom,
          telephone: (data.telephone || '').trim(),
        }),
      }
    );
    
    return {
      user: responseData.user,
      accessToken: responseData.accessToken,
      refreshToken: responseData.refreshToken,
    };
  }

  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const responseData = await apiRequest<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh-token',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }
    );
    return responseData;
  }

  async getCurrentUser(): Promise<User> {
    const responseData = await apiRequest<User>('/auth/me');
    return responseData;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const responseData = await apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return responseData;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const responseData = await apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: newPassword }),
    });
    return responseData;
  }
}

// Export singleton instance
export const authRepository = new AuthRepository();
