'use client';

import React, { FC } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { ScoreBreakdown } from './viral-score-card';

export interface RankedContent {
  contentId: string;
  score: number;
  rank: number;
  breakdown: ScoreBreakdown;
  label?: string;
}

export interface ContentComparisonProps {
  rankings: RankedContent[];
  isLoading?: boolean;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

const getRankBadge = (rank: number): React.ReactNode => {
  const badges: Record<number, { bg: string; text: string; icon: string }> = {
    1: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '🥇' },
    2: { bg: 'bg-gray-400/20', text: 'text-gray-300', icon: '🥈' },
    3: { bg: 'bg-orange-600/20', text: 'text-orange-400', icon: '🥉' },
  };

  const badge = badges[rank] || { bg: 'bg-gray-700', text: 'text-gray-400', icon: `#${rank}` };

  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${badge.bg} ${badge.text} text-sm font-bold`}>
      {typeof badge.icon === 'string' && badge.icon.startsWith('#') ? badge.icon : badge.icon}
    </span>
  );
};

const MiniFactorBar: FC<{ label: string; score: number }> = ({ label, score }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="text-gray-500 w-16">{label}</span>
    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
        style={{ width: `${score}%` }}
      />
    </div>
    <span className={`w-6 text-right ${getScoreColor(score)}`}>{score}</span>
  </div>
);

export const ContentComparison: FC<ContentComparisonProps> = ({
  rankings,
  isLoading = false,
}) => {
  const t = useT();

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!rankings || rankings.length === 0) {
    return (
      <div className="bg-third rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          {t('viral.comparison.title', 'Content Comparison')}
        </h3>
        <div className="text-center py-8 text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <p>{t('viral.comparison.noContent', 'Add multiple drafts to compare their viral potential')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-third rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        {t('viral.comparison.title', 'Content Comparison')}
        <span className="text-sm font-normal text-gray-400">
          ({rankings.length} {t('viral.comparison.drafts', 'drafts')})
        </span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rankings.map((item) => (
          <div
            key={item.contentId}
            className={`relative bg-input/30 rounded-lg p-4 border transition-all ${
              item.rank === 1
                ? 'border-yellow-500/50 ring-1 ring-yellow-500/20'
                : 'border-gray-700/50 hover:border-gray-600/50'
            }`}
          >
            {/* Rank Badge */}
            <div className="absolute -top-3 -left-2">
              {getRankBadge(item.rank)}
            </div>

            {/* Content Label */}
            <div className="mb-3 pt-2">
              <span className="text-sm text-gray-400">
                {item.label || `${t('viral.comparison.draft', 'Draft')} ${item.rank}`}
              </span>
            </div>

            {/* Overall Score */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">
                {t('viral.comparison.overallScore', 'Overall Score')}
              </span>
              <span className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                {item.score}
              </span>
            </div>

            {/* Mini Breakdown */}
            <div className="space-y-1.5">
              <MiniFactorBar label={t('viral.factors.hook', 'Hook')} score={item.breakdown.hook} />
              <MiniFactorBar label={t('viral.factors.caption', 'Caption')} score={item.breakdown.caption} />
              <MiniFactorBar label={t('viral.factors.hashtags', 'Hashtags')} score={item.breakdown.hashtags} />
              <MiniFactorBar label={t('viral.factors.timing', 'Timing')} score={item.breakdown.timing} />
              <MiniFactorBar label={t('viral.factors.format', 'Format')} score={item.breakdown.format} />
            </div>

            {/* Winner Badge */}
            {item.rank === 1 && (
              <div className="mt-3 text-center">
                <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                  ⭐ {t('viral.comparison.recommended', 'Recommended')}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentComparison;
