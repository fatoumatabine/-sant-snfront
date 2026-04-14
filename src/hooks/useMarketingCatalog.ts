import { useQuery } from '@tanstack/react-query';
import { loadMarketingCatalog } from '@/lib/marketingCatalogApi';
import type { MarketingCatalog } from '@/types/marketing';

export function useMarketingCatalog() {
  return useQuery<MarketingCatalog | null>({
    queryKey: ['marketing-catalog'],
    queryFn: loadMarketingCatalog,
    staleTime: 60_000,
  });
}
