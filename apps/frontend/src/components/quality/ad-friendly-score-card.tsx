'use client';

import React, { FC } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export type SensitiveCategory =
  | 'violence'
  | 'adult'
  | 'controversial'
  | 'drugs_alcohol'
  | 'profanity'
  | 'tragedy'
  | 'misinformation';

export type AdImpact = 'no_ads' | 'limited' | 'some_restrictions' | 'none';

export interface SensitiveTopic {
  category: SensitiveCategory;
  matchedKeywords: string[];
  impact: AdImpact;
  severity: 'critical' | 'high' | 'medium' | 'low';
  explanation: string;
  suggestion: string;
}

export interface CategoryScore {
  category: SensitiveCategory;
  score: number;
  flagged: boolean;
  keywords: string[];
}

export interface AdFriendlyScoreCardProps {
  overallScore: number;
  isAdFriendly: boolean;
  interpretation: string;
  categoryBreakdown: CategoryScore[];
  sensitiveTopics: SensitiveTopic[];
  suggestions: string[];
  isLoading?: boolean;
  onTopicClick?: (topic: SensitiveTopic) => void;
}

const CATEGORY_LABELS: Record<SensitiveCategory, string> = {
  violence: 'Violence',
  adult: 'Adult Content',
  controversial: 'Controversial',
  drugs_alcohol: 'Drugs & Alcohol',
  profanity: 'Profanity',
  tragedy: 'Tragedy',
  misinformation: 'Misinformation',
};

const CATEGORY_ICONS: Record<SensitiveCategory, React.ReactNode> = {
  violence: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  adult: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  controversial: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  drugs_alcohol: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  profanity: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  ),
  tragedy: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  misinformation: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 90) return 'bg-green-500/20 border-green-500/30';
  if (score >= 70) return 'bg-blue-500/20 border-blue-500/30';
  if (score >= 50) return 'bg-yellow-500/20 border-yellow-500/30';
  return 'bg-red-500/20 border-red-500/30';
};

const getImpactColor = (impact: AdImpact): string => {
  switch (impact) {
    case 'no_ads':
      return 'text-red-400 bg-red-500/20';
    case 'limited':
      return 'text-orange-400 bg-orange-500/20';
    case 'some_restrictions':
      return 'text-yellow-400 bg-yellow-500/20';
    default:
      return 'text-green-400 bg-green-500/20';
  }
};

const getImpactLabel = (impact: AdImpact): string => {
  switch (impact) {
    case 'no_ads':
      return 'No Ads';
    case 'limited':
      return 'Limited';
    case 'some_restrictions':
      return 'Some Restrictions';
    default:
      return 'None';
  }
};

export const AdFriendlyScoreCard: FC<AdFriendlyScoreCardProps> = ({
  overallScore,
  isAdFriendly,
  interpretation,
  categoryBreakdown,
  sensitiveTopics,
  suggestions,
  isLoading = false,
  onTopicClick,
}) => {
  const t = useT();

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-700 rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-700 rounded" />
          ))}
        </div>
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
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          {t('adFriendly.card.title', 'Advertiser-Friendly Score')}
        </h3>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreBgColor(overallScore)}`}
        >
          {isAdFriendly
            ? t('adFriendly.status.friendly', 'Ad-Friendly')
            : t('adFriendly.status.limited', 'Limited')}
        </div>
      </div>

      {/* Score Display */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <div className="w-28 h-28 rounded-full border-4 border-gray-700 flex items-center justify-center">
            <div className="text-center">
              <span className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </span>
              <span className="text-gray-400 text-sm block">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className={`text-center mb-6 p-3 rounded-lg border ${getScoreBgColor(overallScore)}`}>
        <span className={getScoreColor(overallScore)}>{interpretation}</span>
      </div>

      {/* Category Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">
          {t('adFriendly.card.categories', 'Category Breakdown')}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {categoryBreakdown.map((cat) => (
            <div
              key={cat.category}
              className={`p-2 rounded-lg flex items-center justify-between ${
                cat.flagged ? 'bg-red-500/10 border border-red-500/30' : 'bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={cat.flagged ? 'text-red-400' : 'text-gray-400'}>
                  {CATEGORY_ICONS[cat.category]}
                </span>
                <span className={`text-xs ${cat.flagged ? 'text-red-400' : 'text-gray-300'}`}>
                  {CATEGORY_LABELS[cat.category]}
                </span>
              </div>
              <span
                className={`text-sm font-medium ${
                  cat.score >= 90 ? 'text-green-400' : cat.score >= 70 ? 'text-blue-400' : cat.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}
              >
                {cat.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sensitive Topics */}
      {sensitiveTopics.length > 0 && (
        <div className="border-t border-gray-700 pt-4 mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">
            {t('adFriendly.card.topics', 'Detected Sensitive Topics')}
          </h4>
          <div className="space-y-2">
            {sensitiveTopics.map((topic, index) => (
              <div
                key={index}
                onClick={() => onTopicClick?.(topic)}
                className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-red-400">{CATEGORY_ICONS[topic.category]}</span>
                      <span className="font-medium">{CATEGORY_LABELS[topic.category]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getImpactColor(topic.impact)}`}>
                        {getImpactLabel(topic.impact)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-1">
                      {t('adFriendly.card.keywords', 'Keywords')}: {topic.matchedKeywords.slice(0, 5).join(', ')}
                      {topic.matchedKeywords.length > 5 && ` +${topic.matchedKeywords.length - 5} more`}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">
            {t('adFriendly.card.suggestions', 'Suggestions')}
          </h4>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <svg className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdFriendlyScoreCard;
