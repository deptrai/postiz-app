'use client';

import { FC } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface MetricGap {
  feature: string;
  metric: string;
  current: number;
  required: number;
  gap: number;
  percentageGap: number;
  priority: 'high' | 'medium' | 'low';
}

export interface GapAnalysisCardProps {
  gaps: MetricGap[];
  totalGaps: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
}

const PriorityBadge: FC<{ priority: 'high' | 'medium' | 'low' }> = ({ priority }) => {
  const t = useT();
  const colors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  const labels = {
    high: t('high_priority', 'High Priority'),
    medium: t('medium_priority', 'Medium Priority'),
    low: t('low_priority', 'Low Priority'),
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[priority]}`}>
      {labels[priority]}
    </span>
  );
};

export const GapAnalysisCard: FC<GapAnalysisCardProps> = ({
  gaps,
  totalGaps,
  highPriorityCount,
  mediumPriorityCount,
  lowPriorityCount,
}) => {
  const t = useT();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getMetricLabel = (metric: string): string => {
    const labels: Record<string, string> = {
      followers: t('followers', 'Followers'),
      oneMinuteViews: t('one_minute_views', 'One-Minute Views'),
      viewedMinutes: t('viewed_minutes', 'Viewed Minutes'),
      watchedMinutes: t('watched_minutes', 'Watched Minutes'),
      engagements: t('engagements', 'Engagements'),
      videosCount: t('videos', 'Videos'),
    };
    return labels[metric] || metric;
  };

  if (totalGaps === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-green-400">{t('no_gaps_found', 'All Requirements Met!')}</h3>
            <p className="text-sm text-green-400/80">{t('eligible_for_all_features', 'You are eligible for all monetization features.')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-textColor">{t('gap_analysis', 'Gap Analysis')}</h3>
        <div className="flex items-center gap-2">
          {highPriorityCount > 0 && (
            <span className="text-xs text-red-400">
              {highPriorityCount} {t('high', 'High')}
            </span>
          )}
          {mediumPriorityCount > 0 && (
            <span className="text-xs text-yellow-400">
              {mediumPriorityCount} {t('medium', 'Medium')}
            </span>
          )}
          {lowPriorityCount > 0 && (
            <span className="text-xs text-green-400">
              {lowPriorityCount} {t('low', 'Low')}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-textColor/60 mb-6">
        {t('gap_analysis_description', 'Focus on high-priority gaps to reach eligibility faster.')}
      </p>

      <div className="space-y-4">
        {gaps.map((gap, index) => (
          <div key={index} className="bg-newBgColor rounded-lg p-4 border border-gray-700/30">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-textColor">{gap.feature}</h4>
                  <PriorityBadge priority={gap.priority} />
                </div>
                <p className="text-xs text-textColor/60">{getMetricLabel(gap.metric)}</p>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-textColor/60">{t('current', 'Current')}</span>
                <span className="font-medium text-textColor">{formatNumber(gap.current)}</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-textColor/60">{t('required', 'Required')}</span>
                <span className="font-medium text-textColor">{formatNumber(gap.required)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, (gap.current / gap.required) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
              <p className="text-sm text-blue-400">
                <span className="font-medium">{t('you_need', 'You need')}:</span>{' '}
                {formatNumber(gap.gap)} {t('more', 'more')} {getMetricLabel(gap.metric).toLowerCase()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
