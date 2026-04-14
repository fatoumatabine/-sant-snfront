import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiService } from '@/services/api';

/**
 * Hook pour synchroniser l'authentification avec le service API
 */
export const useAPI = () => {
  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (token) {
      apiService.setToken(token);
    } else {
      apiService.setToken(null);
    }
  }, [token, isAuthenticated]);

  return apiService;
};
