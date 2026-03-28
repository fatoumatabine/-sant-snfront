// Configuration API - URL de base
// Utiliser le proxy Vite qui redirige /api vers localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Service API pour toutes les requêtes HTTP
 */
class APIService {
  private baseURL: string;
  private token: string | null = null;

  private notifyMutation(endpoint: string, method: 'POST' | 'PUT' | 'DELETE'): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('api:mutation-success', {
        detail: { endpoint, method, at: Date.now() },
      })
    );
  }

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  /**
   * Charge le token du localStorage
   */
  private loadToken(): void {
    try {
      const state = localStorage.getItem('sante-sn-auth');
      if (state) {
        const parsed = JSON.parse(state);
        // Zustand stocke le state dans .state ou directement
        const token = parsed.state?.token || parsed.token;
        if (token) {
          this.token = token;
        }
      }
    } catch (error) {
      console.error('Impossible de charger le token du localStorage', error);
    }
  }

  /**
   * Définit le token d'authentification
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Retourne les headers de base
   */
  private getHeaders(contentType: string = 'application/json'): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': contentType,
      'Accept': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    const result = await this.handleResponse<T>(response);
    this.notifyMutation(endpoint, 'POST');
    return result;
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    const result = await this.handleResponse<T>(response);
    this.notifyMutation(endpoint, 'PUT');
    return result;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      ...options,
    });
    const result = await this.handleResponse<T>(response);
    this.notifyMutation(endpoint, 'DELETE');
    return result;
  }

  async getBlob(endpoint: string, options?: RequestInit): Promise<Blob> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders('application/json'),
      ...options,
    });

    if (!response.ok) {
      let message = 'Erreur de téléchargement';
      try {
        const maybeJson = await response.json();
        message = maybeJson?.message || message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    return response.blob();
  }

  /**
   * Gère la réponse
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Si la réponse n'est pas OK
    if (!response.ok) {
      const errorMessage = data?.message || data?.error || 'Une erreur est survenue';
      
      console.error(`[API Error ${response.status}] ${response.url}:`, {
        status: response.status,
        message: errorMessage,
        data
      });
      
      if (response.status === 401) {
        // Token expiré ou non autorisé - nettoyer et rediriger vers login
        this.token = null;
        localStorage.removeItem('sante-sn-auth');
        
        // Délai pour permettre le cleanup
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 500);
      }

      throw new Error(errorMessage);
    }

    return data;
  }
}

export const apiService = new APIService();
