'use client';

import React, { FC } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface ScoreBreakdown {
  hook: number;
  caption: number;
  hashtags: number;
  timing: number;
  format: number;
}

export interface ViralScoreCardProps {
  overallScore: number;
  breakdown: ScoreBreakdown;
  interpretation: string;
  isLoading?: boolean;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500/20';
  if (score >= 60) return 'bg-yellow-500/20';
  if (score >= 40) return 'bg-orange-500/20';
  return 'bg-red-500/20';
};

const getProgressColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

const FactorBar: FC<{ label: string; score: number; weight: string }> = ({
  label,
  score,
  weight,
}) => (
  <div className="mb-3">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-300">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">({weight})</span>
        <span className={getScoreColor(score)}>{score}</span>
      </span>
    </div>
    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${getProgressColor(score)} transition-all duration-500`}
        style={{ width: `${score}%` }}
      />
    </div>
  </div>
);

export const ViralScoreCard: FC<ViralScoreCardProps> = ({
  overallScore,
  breakdown,
  interpretation,
  isLoading = false,
}) => {
  const t = useT();

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-700 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-6 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-third rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        {t('viral.scoreCard.title', 'Viral Score')}
      </h3>

      {/* Overall Score Circle */}
      <div className="flex items-center justify-center mb-6">
        <div
          className={`relative w-32 h-32 rounded-full ${getScoreBgColor(overallScore)} flex items-center justify-center`}
        >
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </div>
            <div className="text-xs text-gray-400">/100</div>
          </div>
          {/* Circular progress indicator */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={`${overallScore * 2.83} 283`}
              className={getScoreColor(overallScore).replace('text-', 'text-')}
              style={{ stroke: overallScore >= 80 ? '#4ade80' : overallScore >= 60 ? '#facc15' : overallScore >= 40 ? '#fb923c' : '#f87171' }}
            />
          </svg>
        </div>
      </div>

      {/* Interpretation */}
      <div className="text-center mb-6">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm ${getScoreBgColor(overallScore)} ${getScoreColor(overallScore)}`}
        >
          {interpretation}
        </span>
      </div>

      {/* Factor Breakdown */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-400 mb-3">
          {t('viral.scoreCard.breakdown', 'Score Breakdown')}
        </h4>
        <FactorBar
          label={t('viral.factors.hook', 'Hook')}
          score={breakdown.hook}
          weight="25%"
        />
        <FactorBar
          label={t('viral.factors.caption', 'Caption')}
          score={breakdown.caption}
          weight="20%"
        />
        <FactorBar
          label={t('viral.factors.hashtags', 'Hashtags')}
          score={breakdown.hashtags}
          weight="15%"
        />
        <FactorBar
          label={t('viral.factors.timing', 'Timing')}
          score={breakdown.timing}
          weight="20%"
        />
        <FactorBar
          label={t('viral.factors.format', 'Format')}
          score={breakdown.format}
          weight="20%"
        />
      </div>
    </div>
  );
};

export default ViralScoreCard;
