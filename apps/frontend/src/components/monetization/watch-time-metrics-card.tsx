import React from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

interface WatchTimeMetrics {
  totalWatchTimeMinutes: number;
  totalWatchTimeHours: number;
  averageViewDurationSeconds: number;
  completionRate: number;
  totalViews: number;
  totalVideos: number;
}

interface WatchTimeMetricsCardProps {
  metrics: WatchTimeMetrics | null;
  loading?: boolean;
}

export const WatchTimeMetricsCard: React.FC<WatchTimeMetricsCardProps> = ({
  metrics,
  loading = false,
}) => {
  const t = useT();

  if (loading) {
    return (
      <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-textColor mb-4">
          {t('watch_time_analytics', 'Watch Time Analytics')}
        </h3>
        <p className="text-gray-400">
          {t('no_watch_time_data', 'No watch time data available')}
        </p>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}${t('seconds_abbr', 's')}`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes}${t('minutes_abbr', 'm')}`;
    }
    return `${minutes}${t('minutes_abbr', 'm')} ${remainingSeconds}${t('seconds_abbr', 's')}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  return (
    <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-textColor">
          {t('watch_time_analytics', 'Watch Time Analytics')}
        </h3>
        <div className="text-sm text-gray-400">
          {metrics.totalVideos} {t('videos', 'videos')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Watch Time */}
        <div className="bg-newBgColor rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-start justify-between mb-2">
            <div className="text-sm text-gray-400">
              {t('total_watch_time', 'Total Watch Time')}
            </div>
            <svg
              className="w-5 h-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-2xl font-bold text-textColor mb-1">
            {formatNumber(metrics.totalWatchTimeHours)}
            <span className="text-lg text-gray-400 ml-1">
              {t('hours', 'hours')}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {formatNumber(metrics.totalWatchTimeMinutes)} {t('minutes', 'minutes')}
          </div>
        </div>

        {/* Average View Duration */}
        <div className="bg-newBgColor rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-start justify-between mb-2">
            <div className="text-sm text-gray-400">
              {t('avg_view_duration', 'Avg View Duration')}
            </div>
            <svg
              className="w-5 h-5 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className="text-2xl font-bold text-textColor mb-1">
            {formatDuration(metrics.averageViewDurationSeconds)}
          </div>
          <div className="text-xs text-gray-500">
            {formatNumber(metrics.totalViews)} {t('total_views', 'total views')}
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-newBgColor rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-start justify-between mb-2">
            <div className="text-sm text-gray-400">
              {t('completion_rate', 'Completion Rate')}
            </div>
            <svg
              className="w-5 h-5 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-2xl font-bold text-textColor mb-1">
            {metrics.completionRate}%
          </div>
          <div className="text-xs text-gray-500">
            {t('estimated_viewer_retention', 'Estimated viewer retention')}
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xs text-gray-400">
            {t(
              'watch_time_note',
              'Watch time is estimated based on view counts and average content duration. Reels ~30s, Videos ~3min.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
