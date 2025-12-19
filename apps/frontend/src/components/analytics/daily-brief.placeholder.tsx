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
  const summary = data?.summary || {};
  const kpis = data?.kpis || {};
  const topContent = data?.topContent || [];
  const trends = data?.trends || [];
  const recommendations = data?.recommendations || [];
  const formatBreakdown = data?.formatBreakdown || {};

  return (
    <div className="bg-newBgColorInner p-6 rounded-lg space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Daily Brief</h2>
        <p className="text-sm text-textColor/60">
          Period: {data?.period?.start || 'N/A'} to {data?.period?.end || 'N/A'} ({data?.period?.days || 7} days)
        </p>
      </div>

      {/* Key Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-boxBg p-4 rounded-md">
            <div className="text-xs text-textColor/60 mb-1">Total Posts</div>
            <div className="text-2xl font-semibold">{summary.totalPosts || 0}</div>
          </div>
          <div className="bg-boxBg p-4 rounded-md">
            <div className="text-xs text-textColor/60 mb-1">Total Reach</div>
            <div className="text-2xl font-semibold">{summary.totalReach?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-boxBg p-4 rounded-md">
            <div className="text-xs text-textColor/60 mb-1">Total Engagement</div>
            <div className="text-2xl font-semibold">{summary.totalEngagement?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-boxBg p-4 rounded-md">
            <div className="text-xs text-textColor/60 mb-1">Engagement Rate</div>
            <div className="text-2xl font-semibold">{summary.engagementRate?.toFixed(2) || 0}%</div>
          </div>
          <div className="bg-boxBg p-4 rounded-md">
            <div className="text-xs text-textColor/60 mb-1">Total Impressions</div>
            <div className="text-2xl font-semibold">{summary.totalImpressions?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-boxBg p-4 rounded-md">
            <div className="text-xs text-textColor/60 mb-1">Avg Engagement</div>
            <div className="text-2xl font-semibold">{summary.avgEngagement?.toFixed(1) || 0}</div>
          </div>
          <div className="bg-boxBg p-4 rounded-md">
            <div className="text-xs text-textColor/60 mb-1">Video Views</div>
            <div className="text-2xl font-semibold">{kpis.totalVideoViews?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-boxBg p-4 rounded-md">
            <div className="text-xs text-textColor/60 mb-1">Top Performer</div>
            <div className="text-sm font-semibold truncate">{summary.topPerformer || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Trends */}
      {trends.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Trends (vs Previous Period)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trends.map((trend: any, idx: number) => (
              <div key={idx} className="bg-boxBg p-4 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-textColor/60">{trend.metric}</div>
                  <div className={`text-sm font-semibold ${
                    trend.direction === 'up' ? 'text-green-500' : 
                    trend.direction === 'down' ? 'text-red-500' : 
                    'text-textColor/60'
                  }`}>
                    {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} 
                    {Math.abs(trend.change).toFixed(1)}%
                  </div>
                </div>
                <div className="text-lg font-semibold">{trend.current?.toLocaleString() || 0}</div>
                <div className="text-xs text-textColor/60">Previous: {trend.previous?.toLocaleString() || 0}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
          <div className="space-y-2">
            {recommendations.map((rec: any, idx: number) => (
              <div key={idx} className={`p-4 rounded-md border ${
                rec.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                rec.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                'bg-blue-500/10 border-blue-500/20'
              }`}>
                <div className="font-semibold text-sm mb-1">{rec.title}</div>
                <div className="text-sm text-textColor/80">{rec.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Format Breakdown */}
      {(formatBreakdown.posts?.count > 0 || formatBreakdown.reels?.count > 0) && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Content Format Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-boxBg p-4 rounded-md">
              <div className="text-sm font-semibold mb-3">Posts</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-textColor/60">Count</span>
                  <span className="text-sm font-semibold">{formatBreakdown.posts?.count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-textColor/60">Engagement</span>
                  <span className="text-sm font-semibold">{formatBreakdown.posts?.engagement?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-textColor/60">Engagement Rate</span>
                  <span className="text-sm font-semibold">{formatBreakdown.posts?.engagementRate?.toFixed(2) || 0}%</span>
                </div>
              </div>
            </div>
            <div className="bg-boxBg p-4 rounded-md">
              <div className="text-sm font-semibold mb-3">Reels</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-textColor/60">Count</span>
                  <span className="text-sm font-semibold">{formatBreakdown.reels?.count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-textColor/60">Engagement</span>
                  <span className="text-sm font-semibold">{formatBreakdown.reels?.engagement?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-textColor/60">Engagement Rate</span>
                  <span className="text-sm font-semibold">{formatBreakdown.reels?.engagementRate?.toFixed(2) || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Content */}
      {topContent.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Top Performing Content</h3>
          <div className="space-y-2">
            {topContent.slice(0, 5).map((content: any, idx: number) => (
              <div key={content.id || idx} className="bg-boxBg p-3 rounded-md">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium truncate">{content.caption || 'No caption'}</div>
                    <div className="text-xs text-textColor/60">ID: {content.externalContentId}</div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold">{content.totalEngagement?.toLocaleString() || 0}</div>
                    <div className="text-xs text-textColor/60">engagement</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-textColor/60">Reach</div>
                    <div className="font-semibold">{content.totalReach?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-textColor/60">Reactions</div>
                    <div className="font-semibold">{content.reactions?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-textColor/60">Comments</div>
                    <div className="font-semibold">{content.comments?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-textColor/60">Shares</div>
                    <div className="font-semibold">{content.shares?.toLocaleString() || 0}</div>
                  </div>
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
