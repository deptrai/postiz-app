'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export interface RetentionPoint {
  percentage: number;
  retention: number;
  viewersCount: number;
}

export interface DropOffPoint {
  percentage: number;
  dropAmount: number;
  severity: 'low' | 'medium' | 'high';
  viewerLoss: number;
}

export interface RetentionCurveChartProps {
  points: RetentionPoint[];
  dropOffPoints?: DropOffPoint[];
  benchmarkPoints?: RetentionPoint[];
  videoTitle?: string;
  showBenchmark?: boolean;
  isLoading?: boolean;
  onPointClick?: (point: RetentionPoint) => void;
}

function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return '#ef4444'; // red-500
    case 'medium':
      return '#f59e0b'; // amber-500
    case 'low':
      return '#eab308'; // yellow-500
  }
}

export function RetentionCurveChart({
  points,
  dropOffPoints = [],
  benchmarkPoints,
  videoTitle,
  showBenchmark = false,
  isLoading = false,
  onPointClick,
}: RetentionCurveChartProps) {
  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-80 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Combine video and benchmark data for chart
  const chartData = points.map((point, index) => {
    const data: any = {
      percentage: point.percentage,
      retention: point.retention,
      viewersCount: point.viewersCount,
    };

    if (showBenchmark && benchmarkPoints && benchmarkPoints[index]) {
      data.benchmark = benchmarkPoints[index].retention;
    }

    return data;
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const dropOff = dropOffPoints.find((d) => d.percentage === data.percentage);

      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-white mb-2">
            {data.percentage}% Progress
          </p>
          <p className="text-sm text-gray-300">
            Retention: <span className="font-medium text-purple-400">{data.retention.toFixed(1)}%</span>
          </p>
          <p className="text-sm text-gray-300">
            Viewers: <span className="font-medium text-blue-400">{data.viewersCount.toLocaleString()}</span>
          </p>
          {showBenchmark && data.benchmark && (
            <p className="text-sm text-gray-300 mt-1">
              Benchmark: <span className="font-medium text-green-400">{data.benchmark.toFixed(1)}%</span>
            </p>
          )}
          {dropOff && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <p className="text-sm font-semibold text-red-400">Drop-off Alert!</p>
              <p className="text-xs text-gray-300">
                -{dropOff.dropAmount.toFixed(1)}% ({dropOff.viewerLoss.toLocaleString()} viewers)
              </p>
              <p className="text-xs text-gray-400 capitalize">
                Severity: {dropOff.severity}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-third rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">Retention Curve</h3>
        {videoTitle && (
          <p className="text-sm text-gray-400">{videoTitle}</p>
        )}
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="percentage"
              stroke="#9ca3af"
              label={{ value: 'Video Progress (%)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
            />
            <YAxis
              stroke="#9ca3af"
              label={{ value: 'Viewer Retention (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Drop-off reference lines */}
            {dropOffPoints.map((dropOff) => (
              <ReferenceLine
                key={`dropoff-${dropOff.percentage}`}
                x={dropOff.percentage}
                stroke={getSeverityColor(dropOff.severity)}
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: `↓ ${dropOff.dropAmount.toFixed(0)}%`,
                  position: 'top',
                  fill: getSeverityColor(dropOff.severity),
                  fontSize: 12,
                }}
              />
            ))}

            {/* Benchmark line */}
            {showBenchmark && benchmarkPoints && (
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Industry Benchmark"
              />
            )}

            {/* Video retention line */}
            <Line
              type="monotone"
              dataKey="retention"
              stroke="#a855f7"
              strokeWidth={3}
              dot={{ fill: '#a855f7', r: 4 }}
              activeDot={{ r: 6, onClick: (e: any, payload: any) => onPointClick?.(payload.payload) }}
              name="Your Video"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend for drop-offs */}
      {dropOffPoints.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Drop-off Points</h4>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-400">High Severity (>20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs text-gray-400">Medium Severity (15-20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-400">Low Severity (10-15%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-input/30 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Start Retention</p>
          <p className="text-lg font-semibold text-white">{points[0]?.retention.toFixed(1)}%</p>
        </div>
        <div className="bg-input/30 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Mid Retention (50%)</p>
          <p className="text-lg font-semibold text-white">
            {points.find(p => p.percentage === 50)?.retention.toFixed(1)}%
          </p>
        </div>
        <div className="bg-input/30 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Completion Rate</p>
          <p className="text-lg font-semibold text-white">
            {points[points.length - 1]?.retention.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
