'use client';

import React, { FC } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { SensitiveTopic, SensitiveCategory, AdImpact } from './ad-friendly-score-card';

export interface SensitiveTopicsListProps {
  topics: SensitiveTopic[];
  onTopicClick?: (topic: SensitiveTopic) => void;
  isLoading?: boolean;
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

const getSeverityColor = (severity: 'critical' | 'high' | 'medium' | 'low'): string => {
  switch (severity) {
    case 'critical':
      return 'text-red-500 bg-red-500/20 border-red-500/30';
    case 'high':
      return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    case 'medium':
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'low':
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
  }
};

const getImpactColor = (impact: AdImpact): string => {
  switch (impact) {
    case 'no_ads':
      return 'text-red-400';
    case 'limited':
      return 'text-orange-400';
    case 'some_restrictions':
      return 'text-yellow-400';
    default:
      return 'text-green-400';
  }
};

const getImpactLabel = (impact: AdImpact): string => {
  switch (impact) {
    case 'no_ads':
      return 'No Ads Allowed';
    case 'limited':
      return 'Limited Ad Availability';
    case 'some_restrictions':
      return 'Some Advertiser Restrictions';
    default:
      return 'No Impact';
  }
};

export const SensitiveTopicsList: FC<SensitiveTopicsListProps> = ({
  topics,
  onTopicClick,
  isLoading = false,
}) => {
  const t = useT();

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="bg-third rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-green-400"
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
          {t('sensitiveTopic.list.title', 'Sensitive Topics')}
        </h3>
        <div className="text-center py-8 text-gray-400">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-green-500/50"
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
          <p>{t('sensitiveTopic.list.noTopics', 'No sensitive topics detected!')}</p>
          <p className="text-sm mt-2">{t('sensitiveTopic.list.allClear', 'Your content is advertiser-friendly.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-third rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        {t('sensitiveTopic.list.title', 'Sensitive Topics')}
        <span className="text-sm text-gray-400 font-normal">({topics.length})</span>
      </h3>

      <div className="space-y-3">
        {topics.map((topic, index) => (
          <div
            key={index}
            onClick={() => onTopicClick?.(topic)}
            className={`p-4 rounded-lg border cursor-pointer hover:brightness-110 transition-all ${getSeverityColor(topic.severity)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{CATEGORY_LABELS[topic.category]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize border ${getSeverityColor(topic.severity)}`}>
                    {topic.severity}
                  </span>
                </div>

                {/* Explanation */}
                <p className="text-sm text-gray-300 mb-2">{topic.explanation}</p>

                {/* Impact */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400">{t('sensitiveTopic.list.impact', 'Ad Impact')}:</span>
                  <span className={`text-xs font-medium ${getImpactColor(topic.impact)}`}>
                    {getImpactLabel(topic.impact)}
                  </span>
                </div>

                {/* Keywords */}
                <div className="flex flex-wrap gap-1">
                  {topic.matchedKeywords.slice(0, 8).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300"
                    >
                      {keyword}
                    </span>
                  ))}
                  {topic.matchedKeywords.length > 8 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                      +{topic.matchedKeywords.length - 8} more
                    </span>
                  )}
                </div>

                {/* Suggestion */}
                <div className="mt-3 p-2 bg-green-500/10 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-xs text-green-400">{topic.suggestion}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SensitiveTopicsList;
