'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';

export const DailyBriefPlaceholder = () => {
  const fetch = useFetch();
  
  const load = useCallback(async () => {
    return await (await fetch('/analytics/daily-brief')).json();
  }, [fetch]);

  const { data, isLoading, error } = useSWR('daily-brief', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingComponent />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-newBgColorInner p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-red-500">Error Loading Daily Brief</h2>
        <p className="text-textColor/60">Failed to load Daily Brief data. Please try again later.</p>
      </div>
    );
  }

  const hasData = data?.summary?.totalPosts > 0 || data?.summary?.totalEngagement > 0;
  const kpis = data?.kpis || {};
  const topContent = data?.topContent || [];

  return (
    <div className="bg-newBgColorInner p-6 rounded-lg space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Daily Brief</h2>
        <p className="text-sm text-textColor/60">
          Period: Last 7 days | Date: {data?.date || 'N/A'}
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-boxBg p-4 rounded-md">
          <div className="text-sm text-textColor/60 mb-1">Total Posts</div>
          <div className="text-2xl font-semibold">{kpis.totalPosts || 0}</div>
        </div>
        <div className="bg-boxBg p-4 rounded-md">
          <div className="text-sm text-textColor/60 mb-1">Total Engagement</div>
          <div className="text-2xl font-semibold">{kpis.totalEngagement || 0}</div>
        </div>
        <div className="bg-boxBg p-4 rounded-md">
          <div className="text-sm text-textColor/60 mb-1">Avg Engagement</div>
          <div className="text-2xl font-semibold">{kpis.avgEngagement?.toFixed(1) || 0}</div>
        </div>
        <div className="bg-boxBg p-4 rounded-md">
          <div className="text-sm text-textColor/60 mb-1">Engagement Rate</div>
          <div className="text-2xl font-semibold">{kpis.engagementRate?.toFixed(2) || 0}%</div>
        </div>
      </div>

      {/* Top Content */}
      {topContent.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Top Performing Content</h3>
          <div className="space-y-2">
            {topContent.slice(0, 5).map((content: any, idx: number) => (
              <div key={content.id || idx} className="bg-boxBg p-3 rounded-md flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium truncate">{content.caption || 'No caption'}</div>
                  <div className="text-xs text-textColor/60">ID: {content.externalContentId}</div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-semibold">{content.totalEngagement || 0}</div>
                  <div className="text-xs text-textColor/60">engagement</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasData && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
          <p className="text-sm text-yellow-500/80">
            No analytics data available yet. Data will appear here once content ingestion is running.
          </p>
        </div>
      )}
    </div>
  );
};
