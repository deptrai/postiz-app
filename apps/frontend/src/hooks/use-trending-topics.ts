import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export interface TrendingTopic {
  tag: {
    id: string;
    name: string;
    type: 'AUTO' | 'MANUAL';
  };
  currentMentions: number;
  previousMentions: number;
  mentionVelocity: number;
  currentAvgEngagement: number;
  previousAvgEngagement: number;
  engagementVelocity: number;
  velocityScore: number;
  isNew: boolean;
  whyTrending: string;
}

export interface TrendingTopicsResponse {
  timeWindow: '24h' | '48h' | '72h';
  generatedAt: string;
  trending: TrendingTopic[];
}

export const useTrendingTopics = (
  groupId?: string,
  timeWindow: '24h' | '48h' | '72h' = '24h',
  limit: number = 10
) => {
  const fetch = useFetch();

  const params = new URLSearchParams({
    timeWindow,
    limit: limit.toString(),
  });

  if (groupId) {
    params.append('groupId', groupId);
  }

  return useSWR<TrendingTopicsResponse>(
    ['trending-topics', groupId, timeWindow, limit],
    async () => {
      return await (await fetch(`/analytics/trending/topics?${params.toString()}`)).json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 300000, // 5 minutes
    }
  );
};
