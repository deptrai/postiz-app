'use client';

import React, { FC } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface QualityBreakdown {
  engagementScore: number;
  watchTimeScore: number;
  complianceScore: number;
  consistencyScore: number;
}

export interface ImprovementSuggestion {
  factor: 'engagement' | 'watchTime' | 'compliance' | 'consistency';
  currentScore: number;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface QualityScoreCardProps {
  overallScore: number;
  breakdown: QualityBreakdown;
  interpretation: string;
  improvements?: ImprovementSuggestion[];
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

const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
  switch (priority) {
    case 'high':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
};

const FactorBar: FC<{ label: string; score: number; weight: string }> = React.memo(({
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
));

export const QualityScoreCard: FC<QualityScoreCardProps> = React.memo(({
  overallScore,
  breakdown,
  interpretation,
  improvements = [],
  isLoading = false,
}) => {
  const t = useT();

  const getFactorLabel = (factor: ImprovementSuggestion['factor']): string => {
    switch (factor) {
      case 'engagement':
        return t('quality.factors.engagement', 'Engagement');
      case 'watchTime':
        return t('quality.factors.watchTime', 'Watch Time');
      case 'compliance':
        return t('quality.factors.compliance', 'Compliance');
      case 'consistency':
        return t('quality.factors.consistency', 'Consistency');
    }
  };

  const getPriorityLabel = (priority: ImprovementSuggestion['priority']): string => {
    switch (priority) {
      case 'high':
        return t('quality.priority.high', 'High');
      case 'medium':
        return t('quality.priority.medium', 'Medium');
      case 'low':
        return t('quality.priority.low', 'Low');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-700 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
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
          className="w-5 h-5 text-blue-400"
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
        {t('quality.scoreCard.title', 'Quality Score')}
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
              style={{
                stroke:
                  overallScore >= 80
                    ? '#4ade80'
                    : overallScore >= 60
                      ? '#facc15'
                      : overallScore >= 40
                        ? '#fb923c'
                        : '#f87171',
              }}
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
          {t('quality.scoreCard.breakdown', 'Score Breakdown')}
        </h4>
        <FactorBar
          label={t('quality.factors.engagement', 'Engagement')}
          score={breakdown.engagementScore}
          weight="35%"
        />
        <FactorBar
          label={t('quality.factors.watchTime', 'Watch Time')}
          score={breakdown.watchTimeScore}
          weight="25%"
        />
        <FactorBar
          label={t('quality.factors.compliance', 'Compliance')}
          score={breakdown.complianceScore}
          weight="25%"
        />
        <FactorBar
          label={t('quality.factors.consistency', 'Consistency')}
          score={breakdown.consistencyScore}
          weight="15%"
        />
      </div>

      {/* Improvement Suggestions */}
      {improvements.length > 0 && (
        <div className="border-t border-gray-700 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {t('quality.scoreCard.improvements', 'Areas to Improve')}
          </h4>
          <div className="space-y-2">
            {improvements.map((improvement, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getPriorityColor(improvement.priority)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium capitalize">
                    {getFactorLabel(improvement.factor)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700">
                    {getPriorityLabel(improvement.priority)}
                  </span>
                </div>
                <p className="text-xs text-gray-300">{improvement.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default QualityScoreCard;
