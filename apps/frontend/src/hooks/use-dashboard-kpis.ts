import { useCallback } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export interface DashboardFilters {
  startDate: string;
  endDate: string;
  groupId?: string;
  integrationIds?: string[];
  format?: 'post' | 'reel' | 'all';
}

export interface KPISummary {
  totalPosts: number;
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  engagementRate: number;
  totalVideoViews: number;
  averageEngagementPerPost: number;
}

export interface DashboardKPIsResponse {
  kpis: KPISummary;
  filters: DashboardFilters;
}

export function useDashboardKPIs(filters: DashboardFilters) {
  const fetch = useFetch();

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      ...(filters.groupId && { groupId: filters.groupId }),
      ...(filters.format && filters.format !== 'all' && { format: filters.format }),
    });

    if (filters.integrationIds && filters.integrationIds.length > 0) {
      filters.integrationIds.forEach(id => params.append('integrationIds[]', id));
    }

    return await (await fetch(`/analytics/dashboard/kpis?${params.toString()}`)).json();
  }, [fetch, filters.startDate, filters.endDate, filters.groupId, filters.integrationIds, filters.format]);

  return useSWR<DashboardKPIsResponse>(
    filters.startDate && filters.endDate 
      ? ['dashboard-kpis', filters.startDate, filters.endDate, filters.groupId, filters.integrationIds, filters.format]
      : null,
    load,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  );
}
