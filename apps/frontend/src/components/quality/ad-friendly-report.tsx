'use client';

import React, { FC, useMemo } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { SensitiveCategory } from './ad-friendly-score-card';

export interface AdFriendlyReportItem {
  contentId: string;
  externalContentId: string;
  caption: string | null;
  publishedAt: string;
  adFriendlyScore: number;
  isAdFriendly: boolean;
  flaggedCategories: SensitiveCategory[];
}

export interface AdFriendlyTrendPoint {
  date: string;
  averageScore: number;
  contentCount: number;
  adFriendlyCount: number;
  adFriendlyPercentage: number;
}

export interface AdFriendlyReportProps {
  totalContent: number;
  adFriendlyCount: number;
  adFriendlyPercentage: number;
  averageScore: number;
  categoryStats: Record<SensitiveCategory, number>;
  flaggedContent: AdFriendlyReportItem[];
  trends: AdFriendlyTrendPoint[];
  period: 7 | 14 | 30;
  isLoading?: boolean;
  onPeriodChange?: (period: 7 | 14 | 30) => void;
  onContentClick?: (contentId: string) => void;
}

const CATEGORY_LABELS: Record<SensitiveCategory, string> = {
  violence: 'Violence',
  adult: 'Adult',
  controversial: 'Controversial',
  drugs_alcohol: 'Drugs/Alcohol',
  profanity: 'Profanity',
  tragedy: 'Tragedy',
  misinformation: 'Misinfo',
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return '#22c55e';
  if (score >= 70) return '#3b82f6';
  if (score >= 50) return '#eab308';
  return '#ef4444';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
};

export const AdFriendlyReport: FC<AdFriendlyReportProps> = ({
  totalContent,
  adFriendlyCount,
  adFriendlyPercentage,
  averageScore,
  categoryStats,
  flaggedContent,
  trends,
  period,
  isLoading = false,
  onPeriodChange,
  onContentClick,
}) => {
  const t = useT();

  const chartData = useMemo(() => {
    if (trends.length === 0) return { points: [] };

    const points = trends.map((trend, index) => {
      const x = (index / (trends.length - 1 || 1)) * 100;
      const y = 100 - trend.averageScore;
      return { x, y, ...trend };
    });

    return { points };
  }, [trends]);

  const topCategories = useMemo(() => {
    return Object.entries(categoryStats)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [categoryStats]);

  const PeriodButton: FC<{ value: 7 | 14 | 30; label: string }> = ({ value, label }) => (
    <button
      onClick={() => onPeriodChange?.(value)}
      className={`px-3 py-1 text-xs rounded-full transition-colors ${
        period === value
          ? 'bg-emerald-500/20 text-emerald-400'
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
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
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
            className="w-5 h-5 text-emerald-400"
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
          {t('adFriendly.report.title', 'Ad-Friendly Report')}
        </h3>
        <div className="flex gap-2">
          <PeriodButton value={7} label={t('adFriendly.period.7days', '7 days')} />
          <PeriodButton value={14} label={t('adFriendly.period.14days', '14 days')} />
          <PeriodButton value={30} label={t('adFriendly.period.30days', '30 days')} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-200">{totalContent}</div>
          <div className="text-xs text-gray-400">
            {t('adFriendly.report.total', 'Total Content')}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{adFriendlyCount}</div>
          <div className="text-xs text-gray-400">
            {t('adFriendly.report.friendly', 'Ad-Friendly')}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div
            className="text-2xl font-bold"
            style={{ color: getScoreColor(adFriendlyPercentage) }}
          >
            {adFriendlyPercentage}%
          </div>
          <div className="text-xs text-gray-400">
            {t('adFriendly.report.percentage', 'Friendly Rate')}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div
            className="text-2xl font-bold"
            style={{ color: getScoreColor(averageScore) }}
          >
            {averageScore}
          </div>
          <div className="text-xs text-gray-400">
            {t('adFriendly.report.avgScore', 'Avg Score')}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">
          {t('adFriendly.report.trend', 'Ad-Friendly Score Trend')}
        </h4>
        {trends.length === 0 || totalContent === 0 ? (
          <div className="h-32 flex items-center justify-center text-gray-400">
            {t('adFriendly.report.noData', 'No data available')}
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
                  <linearGradient id="adFriendlyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {chartData.points.length > 1 && (
                  <>
                    <path
                      d={`M ${chartData.points[0].x} 100 L ${chartData.points.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${chartData.points[chartData.points.length - 1].x} 100 Z`}
                      fill="url(#adFriendlyGradient)"
                    />
                    <path
                      d={`M ${chartData.points.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
                      fill="none"
                      stroke="#10b981"
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
                    fill={point.adFriendlyPercentage >= 70 ? '#22c55e' : '#ef4444'}
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

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">
            {t('adFriendly.report.topIssues', 'Top Issue Categories')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {topCategories.map(([category, count]) => (
              <div
                key={category}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <span className="text-sm text-red-400">
                  {CATEGORY_LABELS[category as SensitiveCategory]}
                </span>
                <span className="text-xs text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flagged Content */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-400 mb-3">
          {t('adFriendly.report.flagged', 'Flagged Content')}
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
            {t('adFriendly.report.allGood', 'All content is ad-friendly!')}
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
                      {item.caption || t('adFriendly.report.noCaption', 'No caption')}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{formatDate(item.publishedAt)}</span>
                      <span>•</span>
                      <span>{item.flaggedCategories.length} issue(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: getScoreColor(item.adFriendlyScore) }}
                    >
                      {item.adFriendlyScore}
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

export default AdFriendlyReport;
