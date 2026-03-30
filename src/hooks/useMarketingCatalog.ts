import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { extractSingleData } from '@/lib/api-response';
import type { MarketingCatalog } from '@/types/marketing';

export function useMarketingCatalog() {
  return useQuery<MarketingCatalog | null>({
    queryKey: ['marketing-catalog'],
    queryFn: async () => {
      const response = await apiService.get(API_ENDPOINTS.medecins.publicCatalog);
      return extractSingleData<MarketingCatalog>(response);
    },
    staleTime: 60_000,
  });
}

