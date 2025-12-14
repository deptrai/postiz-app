import { useCallback } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { DashboardFilters } from './use-dashboard-kpis';

export interface TopContentItem {
  id: string;
  externalContentId: string;
  contentType: string;
  caption: string | null;
  publishedAt: string;
  integrationId: string;
  totalReach: number;
  totalEngagement: number;
  engagementRate: number;
  reactions: number;
  comments: number;
  shares: number;
  videoViews: number;
}

export interface DashboardTopContentResponse {
  topContent: TopContentItem[];
  count: number;
  filters: DashboardFilters & { limit: number };
}

export function useTopContent(filters: DashboardFilters, limit: number = 10) {
  const fetch = useFetch();

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      limit: limit.toString(),
      ...(filters.groupId && { groupId: filters.groupId }),
      ...(filters.format && filters.format !== 'all' && { format: filters.format }),
    });

    if (filters.integrationIds && filters.integrationIds.length > 0) {
      filters.integrationIds.forEach(id => params.append('integrationIds[]', id));
    }

    return await (await fetch(`/analytics/dashboard/top-content?${params.toString()}`)).json();
  }, [fetch, filters.startDate, filters.endDate, filters.groupId, filters.integrationIds, filters.format, limit]);

  return useSWR<DashboardTopContentResponse>(
    filters.startDate && filters.endDate 
      ? ['dashboard-top-content', filters.startDate, filters.endDate, filters.groupId, filters.integrationIds, filters.format, limit]
      : null,
    load,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  );
}
