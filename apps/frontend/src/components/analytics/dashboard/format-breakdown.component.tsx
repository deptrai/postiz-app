'use client';

import { FC } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { DashboardFilters } from '@gitroom/frontend/hooks/use-dashboard-kpis';

interface FormatMetrics {
  totalContent: number;
  totalReach: number;
  totalEngagement: number;
  engagementRate: number;
  metrics: {
    reactions: number;
    comments: number;
    shares: number;
    videoViews?: number;
  };
}

interface FormatBreakdownData {
  posts: FormatMetrics;
  reels: FormatMetrics;
  winner: 'posts' | 'reels' | 'tie';
  winnerBy: number;
}

interface FormatBreakdownProps {
  filters: DashboardFilters;
}

export const FormatBreakdownChart: FC<FormatBreakdownProps> = ({ filters }) => {
  const fetch = useFetch();

  const { data, isLoading, error } = useSWR<FormatBreakdownData>(
    filters.startDate && filters.endDate
      ? [
          'format-breakdown',
          filters.startDate,
          filters.endDate,
          filters.groupId,
          filters.integrationIds,
        ]
      : null,
    async () => {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.groupId && { groupId: filters.groupId }),
      });

      if (filters.integrationIds && filters.integrationIds.length > 0) {
        filters.integrationIds.forEach((id) => params.append('integrationIds[]', id));
      }

      return await (await fetch(`/analytics/dashboard/format-breakdown?${params.toString()}`)).json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 300000, // 5 minutes
    }
  );

  if (isLoading) {
    return (
      <div className="bg-newBgColorInner p-6 rounded-lg">
        <div className="flex items-center justify-center h-[200px]">
          <div className="text-textColor/60">Loading format breakdown...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-newBgColorInner p-6 rounded-lg">
        <div className="flex items-center justify-center h-[200px]">
          <div className="text-red-500">Error loading format breakdown</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-newBgColorInner p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Format Performance</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormatCard format="Posts" icon="📝" data={data.posts} isWinner={data.winner === 'posts'} />
        <FormatCard format="Reels" icon="🎬" data={data.reels} isWinner={data.winner === 'reels'} />
      </div>

      {data.winner !== 'tie' && (
        <div className="mt-4 p-3 bg-customColor10/10 border border-customColor10/20 rounded-md">
          <p className="text-sm text-textColor">
            <strong className="text-customColor10">
              {data.winner === 'posts' ? 'Posts' : 'Reels'}
            </strong>{' '}
            performing <strong>{data.winnerBy.toFixed(1)}%</strong> better in engagement rate
          </p>
        </div>
      )}

      {data.winner === 'tie' && (
        <div className="mt-4 p-3 bg-boxBg rounded-md">
          <p className="text-sm text-textColor/60">Both formats performing equally</p>
        </div>
      )}
    </div>
  );
};

interface FormatCardProps {
  format: string;
  icon: string;
  data: FormatMetrics;
  isWinner: boolean;
}

const FormatCard: FC<FormatCardProps> = ({ format, icon, data, isWinner }) => {
  const hasData = data.totalContent > 0;

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        isWinner
          ? 'border-green-500 bg-green-500/5'
          : 'border-fifth hover:border-fifth/60'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h4 className="text-base font-semibold text-textColor">{format}</h4>
        </div>
        {isWinner && hasData && (
          <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full font-medium">
            Winner
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="py-4 text-center text-textColor/40 text-sm">
          No {format.toLowerCase()} found
        </div>
      ) : (
        <div className="space-y-2">
          <MetricRow label="Content" value={data.totalContent.toString()} />
          <MetricRow label="Reach" value={data.totalReach.toLocaleString()} />
          <MetricRow label="Engagement" value={data.totalEngagement.toLocaleString()} />
          <div className="pt-2 mt-2 border-t border-fifth">
            <MetricRow
              label="Engagement Rate"
              value={`${data.engagementRate.toFixed(1)}%`}
              highlight={true}
            />
          </div>
          {data.metrics.videoViews !== undefined && data.metrics.videoViews > 0 && (
            <div className="pt-2 border-t border-fifth">
              <MetricRow label="Video Views" value={data.metrics.videoViews.toLocaleString()} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface MetricRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const MetricRow: FC<MetricRowProps> = ({ label, value, highlight = false }) => (
  <div className="flex justify-between items-center">
    <span className={`text-sm ${highlight ? 'font-medium text-textColor' : 'text-textColor/60'}`}>
      {label}
    </span>
    <span
      className={`text-sm ${
        highlight ? 'font-bold text-customColor10' : 'font-medium text-textColor'
      }`}
    >
      {value}
    </span>
  </div>
);
