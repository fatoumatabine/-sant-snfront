import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { extractData, extractSingleData, extractPaginatedData } from '@/lib/api-response';

/**
 * Utility function to safely extract array data from API responses
 * Handles multiple response formats:
 * - { data: [...] }
 * - { data: { data: [...], meta: {...} } }
 * - [...]
 */
function safeExtractArray<T = any>(response: any): T[] {
  if (!response) return [];
  
  // Direct array
  if (Array.isArray(response)) return response as T[];
  
  // { data: [...] } ou { data: { data: [...] } }
  if (response.data) {
    if (Array.isArray(response.data)) {
      return response.data as T[];
    }
    // Paginated response { data: { data: [...], meta: {} } }
    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data as T[];
    }
  }
  
  return [];
}

/**
 * Hook personnalisé pour les requêtes API avec gestion automatique des réponses
 */
export function useApiQuery<T = any>(
  endpoint: string,
  options?: Omit<UseQueryOptions<T[], unknown, T[]>, 'queryFn' | 'queryKey'>
): UseQueryResult<T[], unknown> {
  return useQuery<T[]>({
    queryKey: [endpoint],
    queryFn: async () => {
      try {
        const response = await apiService.get(endpoint);
        return safeExtractArray<T>(response);
      } catch (error) {
        console.error(`Erreur API (${endpoint}):`, error);
        throw error;
      }
    },
    ...options,
  });
}

/**
 * Hook pour récupérer un objet unique
 */
export function useApiSingleQuery<T = any>(
  endpoint: string,
  options?: Omit<UseQueryOptions<T | null, unknown, T | null>, 'queryFn' | 'queryKey'>
): UseQueryResult<T | null, unknown> {
  return useQuery<T | null>({
    queryKey: [endpoint],
    queryFn: async () => {
      try {
        const response = await apiService.get(endpoint);
        return extractSingleData<T>(response) || null;
      } catch (error) {
        console.error(`Erreur API (${endpoint}):`, error);
        throw error;
      }
    },
    ...options,
  });
}

/**
 * Hook pour les données paginées
 */
export function useApiPaginatedQuery<T = any>(
  endpoint: string,
  options?: Omit<UseQueryOptions<{ data: T[]; meta: any }, unknown, { data: T[]; meta: any }>, 'queryFn' | 'queryKey'>
) {
  return useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      try {
        const response = await apiService.get(endpoint);
        return extractPaginatedData<T>(response);
      } catch (error) {
        console.error(`Erreur API (${endpoint}):`, error);
        throw error;
      }
    },
    ...options,
  });
}
