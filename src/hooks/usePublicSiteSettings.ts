import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { extractSingleData } from '@/lib/api-response';
import {
  defaultAdminSettings,
  type PublicSiteSettingsPayload,
} from '@/lib/adminSettings';

const fallbackPublicSiteSettings: PublicSiteSettingsPayload = {
  generalSettings: {
    appName: defaultAdminSettings.generalSettings.appName,
    appDescription: defaultAdminSettings.generalSettings.appDescription,
    language: defaultAdminSettings.generalSettings.language,
  },
  marketingSettings: defaultAdminSettings.marketingSettings,
};

export function usePublicSiteSettings() {
  return useQuery<PublicSiteSettingsPayload>({
    queryKey: ['public-site-settings'],
    initialData: fallbackPublicSiteSettings,
    queryFn: async () => {
      try {
        const response = await apiService.get(API_ENDPOINTS.settings.publicSite);
        return extractSingleData<PublicSiteSettingsPayload>(response) || fallbackPublicSiteSettings;
      } catch {
        return fallbackPublicSiteSettings;
      }
    },
    staleTime: 60_000,
  });
}
