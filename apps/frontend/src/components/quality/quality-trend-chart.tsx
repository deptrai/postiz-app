'use client';

import React, { FC, useMemo } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface QualityTrendPoint {
  date: string;
  averageScore: number;
  contentCount: number;
  engagementAvg: number;
  watchTimeAvg: number;
  complianceAvg: number;
  consistencyAvg: number;
}

export interface QualityTrendChartProps {
  trends: QualityTrendPoint[];
  period: 7 | 14 | 30;
  isLoading?: boolean;
  onPeriodChange?: (period: 7 | 14 | 30) => void;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#facc15';
  if (score >= 40) return '#fb923c';
  return '#f87171';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
};

export const QualityTrendChart: FC<QualityTrendChartProps> = ({
  trends,
  period,
  isLoading = false,
  onPeriodChange,
}) => {
  const t = useT();

  const chartData = useMemo(() => {
    if (trends.length === 0) return { points: [], maxScore: 100, minScore: 0 };

    const scores = trends.map((t) => t.averageScore).filter((s) => s > 0);
    const maxScore = Math.max(...scores, 100);
    const minScore = Math.min(...scores, 0);

    const points = trends.map((trend, index) => {
      const x = (index / (trends.length - 1 || 1)) * 100;
      const y = 100 - ((trend.averageScore - minScore) / (maxScore - minScore || 1)) * 100;
      return { x, y, ...trend };
    });

    return { points, maxScore, minScore };
  }, [trends]);

  const averageScore = useMemo(() => {
    const validScores = trends.filter((t) => t.averageScore > 0);
    if (validScores.length === 0) return 0;
    return Math.round(
      validScores.reduce((sum, t) => sum + t.averageScore, 0) / validScores.length
    );
  }, [trends]);

  const totalContent = useMemo(() => {
    return trends.reduce((sum, t) => sum + t.contentCount, 0);
  }, [trends]);

  const PeriodButton: FC<{ value: 7 | 14 | 30; label: string }> = ({ value, label }) => (
    <button
      onClick={() => onPeriodChange?.(value)}
      className={`px-3 py-1 text-xs rounded-full transition-colors ${
        period === value
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-48 bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-third rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
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
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          {t('quality.trendChart.title', 'Quality Trends')}
        </h3>
        <div className="flex gap-2">
          <PeriodButton value={7} label={t('quality.period.7days', '7 days')} />
          <PeriodButton value={14} label={t('quality.period.14days', '14 days')} />
          <PeriodButton value={30} label={t('quality.period.30days', '30 days')} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">
            {t('quality.trendChart.avgScore', 'Average Score')}
          </div>
          <div className={`text-2xl font-bold`} style={{ color: getScoreColor(averageScore) }}>
            {averageScore}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">
            {t('quality.trendChart.totalContent', 'Total Content')}
          </div>
          <div className="text-2xl font-bold text-gray-200">{totalContent}</div>
        </div>
      </div>

      {/* Chart */}
      {trends.length === 0 || totalContent === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-600"
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
            {t('quality.trendChart.noData', 'No trend data available')}
          </div>
        </div>
      ) : (
        <div className="relative h-48">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-500">
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>

          {/* Chart area */}
          <div className="ml-10 h-full relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border-t border-gray-700" />
              ))}
            </div>

            {/* Line chart */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Area fill */}
              <defs>
                <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {chartData.points.length > 1 && (
                <>
                  {/* Area */}
                  <path
                    d={`M ${chartData.points[0].x} 100 L ${chartData.points.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${chartData.points[chartData.points.length - 1].x} 100 Z`}
                    fill="url(#qualityGradient)"
                  />
                  {/* Line */}
                  <path
                    d={`M ${chartData.points.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              )}

              {/* Data points */}
              {chartData.points.map((point, index) => (
                <g key={index}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="2"
                    fill={getScoreColor(point.averageScore)}
                    stroke="#1f2937"
                    strokeWidth="0.5"
                  />
                </g>
              ))}
            </svg>

            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 transform translate-y-5">
              {chartData.points
                .filter((_, i) => i % Math.ceil(chartData.points.length / 5) === 0 || i === chartData.points.length - 1)
                .map((point, index) => (
                  <span key={index}>{formatDate(point.date)}</span>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Factor breakdown legend */}
      <div className="mt-8 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-400 mb-3">
          {t('quality.trendChart.factorAvg', 'Average Factor Scores')}
        </h4>
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: 'engagementAvg', label: 'Engagement', color: 'bg-blue-500' },
            { key: 'watchTimeAvg', label: 'Watch Time', color: 'bg-purple-500' },
            { key: 'complianceAvg', label: 'Compliance', color: 'bg-green-500' },
            { key: 'consistencyAvg', label: 'Consistency', color: 'bg-yellow-500' },
          ].map((factor) => {
            const avg = Math.round(
              trends.reduce((sum, t) => sum + (t[factor.key as keyof QualityTrendPoint] as number || 0), 0) /
                (trends.filter((t) => t.contentCount > 0).length || 1)
            );
            return (
              <div key={factor.key} className="text-center">
                <div className={`w-3 h-3 ${factor.color} rounded-full mx-auto mb-1`} />
                <div className="text-xs text-gray-400">{factor.label}</div>
                <div className="text-sm font-medium text-gray-200">{avg}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QualityTrendChart;
