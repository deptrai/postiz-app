import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export interface HeatmapCell {
  hour: number;
  engagement: number;
  count: number;
  confidence: number;
}

export interface Recommendation {
  dayOfWeek: number;
  dayName: string;
  hour: number;
  timeRange: string;
  avgEngagement: number;
  contentCount: number;
  confidenceScore: number;
  recommendation: string;
}

export interface BestTimeResponse {
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  totalContent: number;
  format: string;
  heatmap: HeatmapCell[][];
  recommendations: Recommendation[];
}

export const useBestTime = (
  groupId?: string,
  format: 'all' | 'post' | 'reel' = 'all',
  days: 7 | 14 = 7
) => {
  const fetch = useFetch();

  const params = new URLSearchParams({
    days: days.toString(),
    format,
  });

  if (groupId) {
    params.append('groupId', groupId);
  }

  return useSWR<BestTimeResponse>(
    ['best-time', groupId, format, days],
    async () => {
      return await (await fetch(`/analytics/best-time?${params.toString()}`)).json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 1800000, // 30 minutes
    }
  );
};
