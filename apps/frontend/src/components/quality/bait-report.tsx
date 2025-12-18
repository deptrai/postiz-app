'use client';

import React, { FC, useMemo } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface BaitTrendPoint {
  date: string;
  averageBaitScore: number;
  contentCount: number;
  flaggedCount: number;
}

export interface BaitReportItem {
  contentId: string;
  externalContentId: string;
  caption: string | null;
  publishedAt: string;
  baitScore: number;
  detectedPatterns: number;
  severity: 'high' | 'medium' | 'low' | 'none';
}

export interface BaitReportProps {
  trends: BaitTrendPoint[];
  flaggedContent: BaitReportItem[];
  totalContent: number;
  totalFlagged: number;
  averageBaitScore: number;
  period: 7 | 14 | 30;
  isLoading?: boolean;
  onPeriodChange?: (period: 7 | 14 | 30) => void;
  onContentClick?: (contentId: string) => void;
}

const getSeverityColor = (severity: 'high' | 'medium' | 'low' | 'none'): string => {
  switch (severity) {
    case 'high':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
};

export const BaitReport: FC<BaitReportProps> = ({
  trends,
  flaggedContent,
  totalContent,
  totalFlagged,
  averageBaitScore,
  period,
  isLoading = false,
  onPeriodChange,
  onContentClick,
}) => {
  const t = useT();

  const chartData = useMemo(() => {
    if (trends.length === 0) return { points: [], maxScore: 100 };

    const maxScore = Math.max(...trends.map((t) => t.averageBaitScore), 100);

    const points = trends.map((trend, index) => {
      const x = (index / (trends.length - 1 || 1)) * 100;
      const y = 100 - (trend.averageBaitScore / maxScore) * 100;
      return { x, y, ...trend };
    });

    return { points, maxScore };
  }, [trends]);

  const flaggedPercentage = totalContent > 0 ? Math.round((totalFlagged / totalContent) * 100) : 0;

  const PeriodButton: FC<{ value: 7 | 14 | 30; label: string }> = ({ value, label }) => (
    <button
      onClick={() => onPeriodChange?.(value)}
      className={`px-3 py-1 text-xs rounded-full transition-colors ${
        period === value
          ? 'bg-orange-500/20 text-orange-400'
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-700 rounded" />
          ))}
        </div>
        <div className="h-48 bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-third rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg
            className="w-5 h-5 text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {t('bait.report.title', 'Bait Detection Report')}
        </h3>
        <div className="flex gap-2">
          <PeriodButton value={7} label={t('bait.period.7days', '7 days')} />
          <PeriodButton value={14} label={t('bait.period.14days', '14 days')} />
          <PeriodButton value={30} label={t('bait.period.30days', '30 days')} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-200">{totalContent}</div>
          <div className="text-xs text-gray-400">
            {t('bait.report.totalContent', 'Total Content')}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className={`text-2xl font-bold ${totalFlagged > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {totalFlagged}
          </div>
          <div className="text-xs text-gray-400">
            {t('bait.report.flagged', 'Flagged')} ({flaggedPercentage}%)
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className={`text-2xl font-bold ${
            averageBaitScore === 0 ? 'text-green-400' :
            averageBaitScore <= 20 ? 'text-blue-400' :
            averageBaitScore <= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {averageBaitScore}
          </div>
          <div className="text-xs text-gray-400">
            {t('bait.report.avgScore', 'Avg Bait Score')}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">
          {t('bait.report.trendTitle', 'Bait Score Trend')}
        </h4>
        {trends.length === 0 || totalContent === 0 ? (
          <div className="h-32 flex items-center justify-center text-gray-400">
            {t('bait.report.noData', 'No data available')}
          </div>
        ) : (
          <div className="relative h-32">
            <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-500">
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            <div className="ml-10 h-full relative">
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="border-t border-gray-700" />
                ))}
              </div>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="baitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {chartData.points.length > 1 && (
                  <>
                    <path
                      d={`M ${chartData.points[0].x} 100 L ${chartData.points.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${chartData.points[chartData.points.length - 1].x} 100 Z`}
                      fill="url(#baitGradient)"
                    />
                    <path
                      d={`M ${chartData.points.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                )}
                {chartData.points.map((point, index) => (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r="2"
                    fill={point.flaggedCount > 0 ? '#ef4444' : '#22c55e'}
                    stroke="#1f2937"
                    strokeWidth="0.5"
                  />
                ))}
              </svg>
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
      </div>

      {/* Flagged Content List */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-400 mb-3">
          {t('bait.report.flaggedContent', 'Flagged Content')}
          {flaggedContent.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">({flaggedContent.length})</span>
          )}
        </h4>
        {flaggedContent.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-green-500/50"
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
            {t('bait.report.noFlagged', 'No flagged content in this period!')}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {flaggedContent.map((item) => (
              <div
                key={item.contentId}
                onClick={() => onContentClick?.(item.contentId)}
                className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">
                      {item.caption || t('bait.report.noCaption', 'No caption')}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{formatDate(item.publishedAt)}</span>
                      <span>•</span>
                      <span>{item.detectedPatterns} pattern(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-orange-400">
                      {item.baitScore}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${getSeverityColor(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BaitReport;
