/**
 * Utilitaires pour gérer les réponses API
 * Standardise l'extraction des données quel que soit le format de réponse
 */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Extrait les données d'une réponse API
 * Gère les formats:
 * - { data: [...] }
 * - { data: { data: [...], meta: {...} } }  // Paginé
 * - { success: true, data: [...] }
 * - [...]
 */
export function extractData<T = any>(response: any): T {
  if (!response) {
    return [] as any;
  }

  // Si c'est déjà un tableau, retourner directement
  if (Array.isArray(response)) {
    return response as T;
  }

  // Si response.data existe
  if (response.data !== undefined && response.data !== null) {
    // Si response.data est un tableau
    if (Array.isArray(response.data)) {
      return response.data as T;
    }

    // Si response.data.data existe et est un tableau (réponse paginée)
    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data as T;
    }

    // Si response.data est un objet simple
    if (typeof response.data === 'object' && !Array.isArray(response.data) && !response.data.data && !response.data.meta) {
      return response.data as T;
    }
  }

  // Si c'est un objet avec des propriétés, retourner l'objet
  if (typeof response === 'object' && !Array.isArray(response)) {
    return response as T;
  }

  // Par défaut, retourner un tableau vide
  return [] as any;
}

/**
 * Extrait un objet unique d'une réponse API
 */
export function extractSingleData<T = any>(response: any): T | null {
  if (!response) {
    return null;
  }

  // Si c'est déjà un objet non-tableau
  if (typeof response === 'object' && !Array.isArray(response)) {
    // Si response.data existe
    if (response.data) {
      if (Array.isArray(response.data)) {
        return response.data[0] || null;
      }
      return response.data as T;
    }
    return response as T;
  }

  return null;
}

/**
 * Gère une liste avec pagination
 */
export function extractPaginatedData<T = any>(response: any) {
  if (!response) {
    return {
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 0,
      },
    };
  }

  // Format avec data et meta
  if (response.data && response.meta) {
    return {
      data: Array.isArray(response.data) ? response.data : [],
      meta: response.meta,
    };
  }

  // Format avec data.data et data.meta
  if (response.data?.data && response.data?.meta) {
    return {
      data: Array.isArray(response.data.data) ? response.data.data : [],
      meta: response.data.meta,
    };
  }

  // Si c'est déjà un tableau
  if (Array.isArray(response)) {
    return {
      data: response,
      meta: {
        current_page: 1,
        last_page: 1,
        total: response.length,
        per_page: response.length,
      },
    };
  }

  return {
    data: [],
    meta: {
      current_page: 1,
      last_page: 1,
      total: 0,
      per_page: 0,
    },
  };
}

/**
 * Hook pour utiliser dans les composants
 */
export const apiResponseUtils = {
  extractData,
  extractSingleData,
  extractPaginatedData,
};
