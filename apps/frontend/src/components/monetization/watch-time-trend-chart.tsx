import React, { useState } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

interface WatchTimeTrend {
  date: string;
  watchTimeMinutes: number;
  views: number;
  growthRate: number;
}

interface WatchTimeTrendChartProps {
  trends: WatchTimeTrend[];
  loading?: boolean;
  onPeriodChange?: (days: number) => void;
}

export const WatchTimeTrendChart: React.FC<WatchTimeTrendChartProps> = ({
  trends,
  loading = false,
  onPeriodChange,
}) => {
  const t = useT();
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const periods = [
    { days: 7, label: t('7_days', '7 days') },
    { days: 14, label: t('14_days', '14 days') },
    { days: 30, label: t('30_days', '30 days') },
  ];

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
    if (onPeriodChange) {
      onPeriodChange(days);
    }
  };

  if (loading) {
    return (
      <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
        <div className="h-64 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!trends || trends.length === 0) {
    return (
      <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-textColor mb-4">
          {t('watch_time_trends', 'Watch Time Trends')}
        </h3>
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-gray-600 mx-auto mb-4"
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
          <p className="text-gray-400">
            {t('no_trend_data', 'No trend data available for the selected period')}
          </p>
        </div>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxWatchTime = Math.max(...trends.map((t) => t.watchTimeMinutes));
  const chartHeight = 200; // pixels

  // Calculate overall growth
  const firstValue = trends[0]?.watchTimeMinutes || 0;
  const lastValue = trends[trends.length - 1]?.watchTimeMinutes || 0;
  const overallGrowth = firstValue > 0 
    ? ((lastValue - firstValue) / firstValue) * 100 
    : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-textColor">
            {t('watch_time_trends', 'Watch Time Trends')}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-sm font-medium ${
                overallGrowth >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {overallGrowth >= 0 ? '↑' : '↓'} {Math.abs(overallGrowth).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">
              {t('period_growth', 'period growth')}
            </span>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {periods.map((period) => (
            <button
              key={period.days}
              onClick={() => handlePeriodChange(period.days)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedPeriod === period.days
                  ? 'bg-blue-500 text-white'
                  : 'bg-newBgColor text-gray-400 hover:bg-gray-700'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((percent) => (
            <line
              key={percent}
              x1="0"
              y1={chartHeight * (1 - percent)}
              x2="100%"
              y2={chartHeight * (1 - percent)}
              stroke="#374151"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Line chart */}
          <polyline
            points={trends
              .map((trend, index) => {
                const x = (index / (trends.length - 1)) * 100;
                const y =
                  chartHeight - (trend.watchTimeMinutes / maxWatchTime) * chartHeight;
                return `${x}%,${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
          />

          {/* Area fill */}
          <polygon
            points={`0,${chartHeight} ${trends
              .map((trend, index) => {
                const x = (index / (trends.length - 1)) * 100;
                const y =
                  chartHeight - (trend.watchTimeMinutes / maxWatchTime) * chartHeight;
                return `${x}%,${y}`;
              })
              .join(' ')} 100%,${chartHeight}`}
            fill="url(#gradient)"
            opacity="0.2"
          />

          {/* Data points */}
          {trends.map((trend, index) => {
            const x = (index / (trends.length - 1)) * 100;
            const y =
              chartHeight - (trend.watchTimeMinutes / maxWatchTime) * chartHeight;
            return (
              <g key={index}>
                <circle
                  cx={`${x}%`}
                  cy={y}
                  r="4"
                  fill="#3B82F6"
                  className="hover:r-6 transition-all cursor-pointer"
                >
                  <title>
                    {formatDate(trend.date)}: {formatNumber(trend.watchTimeMinutes)} min
                  </title>
                </circle>
              </g>
            );
          })}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
          <span>{formatNumber(maxWatchTime)}</span>
          <span>{formatNumber(maxWatchTime * 0.75)}</span>
          <span>{formatNumber(maxWatchTime * 0.5)}</span>
          <span>{formatNumber(maxWatchTime * 0.25)}</span>
          <span>0</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-4 text-xs text-gray-500">
        <span>{formatDate(trends[0].date)}</span>
        {trends.length > 2 && (
          <span>{formatDate(trends[Math.floor(trends.length / 2)].date)}</span>
        )}
        <span>{formatDate(trends[trends.length - 1].date)}</span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-700/50">
        <div>
          <div className="text-xs text-gray-400 mb-1">
            {t('peak_watch_time', 'Peak Watch Time')}
          </div>
          <div className="text-lg font-semibold text-textColor">
            {formatNumber(maxWatchTime)} {t('min', 'min')}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">
            {t('avg_daily_views', 'Avg Daily Views')}
          </div>
          <div className="text-lg font-semibold text-textColor">
            {formatNumber(
              Math.round(
                trends.reduce((sum, t) => sum + t.views, 0) / trends.length
              )
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">
            {t('total_period_watch_time', 'Total Period')}
          </div>
          <div className="text-lg font-semibold text-textColor">
            {formatNumber(trends.reduce((sum, t) => sum + t.watchTimeMinutes, 0))}{' '}
            {t('min', 'min')}
          </div>
        </div>
      </div>
    </div>
  );
};
