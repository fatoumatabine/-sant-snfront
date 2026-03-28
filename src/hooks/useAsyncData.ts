import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';

interface UseAsyncDataOptions {
  skip?: boolean;
}

/**
 * Hook pour charger les données de manière asynchrone
 */
export const useAsyncData = <T = any>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseAsyncDataOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options.skip) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchFn();
        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Une erreur est survenue';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refetch };
};
