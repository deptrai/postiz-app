'use client';

import React from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export type LengthRange = '0-15' | '15-30' | '30-60' | '60-180' | '180+';

export interface LengthPerformance {
  range: LengthRange;
  rangeLabel: string;
  rangeSeconds: { min: number; max: number };
  videoCount: number;
  avgViews: number;
  avgEngagementRate: number;
  avgCompletionRate: number;
  topPerformer?: {
    videoId: string;
    title: string;
    views: number;
    engagementRate: number;
  };
}

export interface LengthPerformanceChartProps {
  performances: LengthPerformance[];
  bestPerformingRange: LengthRange;
  totalVideos: number;
  isLoading?: boolean;
  metric?: 'engagement' | 'views' | 'completion';
  onRangeClick?: (range: LengthRange) => void;
}

function getPerformanceColor(range: LengthRange, bestRange: LengthRange): string {
  if (range === bestRange) return '#22c55e'; // green-500
  return '#8b5cf6'; // purple-500
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function LengthPerformanceChart({
  performances,
  bestPerformingRange,
  totalVideos,
  isLoading = false,
  metric = 'engagement',
  onRangeClick,
}: LengthPerformanceChartProps) {
  const t = useT();
  
  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-64 bg-gray-700 rounded" />
      </div>
    );
  }

  const chartData = performances.map((p) => ({
    range: p.range,
    label: p.rangeLabel.split(' ')[0],
    engagement: p.avgEngagementRate,
    views: p.avgViews,
    completion: p.avgCompletionRate,
    videoCount: p.videoCount,
    isBest: p.range === bestPerformingRange,
  }));

  const metricLabels = {
    engagement: 'Engagement Rate (%)',
    views: 'Average Views',
    completion: 'Completion Rate (%)',
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const perf = performances.find((p) => p.range === data.range);
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{perf?.rangeLabel}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-300">
              <span className="text-purple-400">Videos:</span> {data.videoCount}
            </p>
            <p className="text-gray-300">
              <span className="text-purple-400">Engagement:</span> {data.engagement.toFixed(2)}%
            </p>
            <p className="text-gray-300">
              <span className="text-purple-400">Avg Views:</span> {formatNumber(data.views)}
            </p>
            <p className="text-gray-300">
              <span className="text-purple-400">Completion:</span> {data.completion.toFixed(1)}%
            </p>
            {data.isBest && (
              <p className="text-green-400 font-semibold mt-2">🏆 Best Performing</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-third rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{t('length_performance')}</h3>
          <p className="text-sm text-gray-400">
            {totalVideos} videos analyzed • Best: {bestPerformingRange}s
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-xs text-gray-400">Best Range</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span className="text-xs text-gray-400">Other Ranges</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="label"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => metric === 'views' ? formatNumber(value) : `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey={metric}
              radius={[4, 4, 0, 0]}
              onClick={(data) => onRangeClick?.(data.range)}
              cursor={onRangeClick ? 'pointer' : 'default'}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getPerformanceColor(entry.range, bestPerformingRange)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {performances.map((perf) => (
          <div
            key={perf.range}
            className={`p-2 rounded-lg text-center ${
              perf.range === bestPerformingRange
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-gray-700/50'
            }`}
          >
            <p className="text-xs text-gray-400">{perf.range}s</p>
            <p className="text-sm font-semibold text-white">{perf.videoCount}</p>
            <p className="text-xs text-gray-500">videos</p>
          </div>
        ))}
      </div>
    </div>
  );
}
