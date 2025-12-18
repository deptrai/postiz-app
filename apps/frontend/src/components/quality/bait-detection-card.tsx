'use client';

import React, { FC } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface DetectedPattern {
  patternId: string;
  type: string;
  matchedText: string;
  startIndex: number;
  endIndex: number;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  authenticAlternative: string;
}

export interface BaitDetectionCardProps {
  caption: string;
  baitScore: number;
  hasBait: boolean;
  detectedPatterns: DetectedPattern[];
  overallSeverity: 'high' | 'medium' | 'low' | 'none';
  isLoading?: boolean;
}

const getSeverityColor = (severity: 'high' | 'medium' | 'low' | 'none'): string => {
  switch (severity) {
    case 'high':
      return 'text-red-400';
    case 'medium':
      return 'text-yellow-400';
    case 'low':
      return 'text-blue-400';
    default:
      return 'text-green-400';
  }
};

const getSeverityBgColor = (severity: 'high' | 'medium' | 'low' | 'none'): string => {
  switch (severity) {
    case 'high':
      return 'bg-red-500/20 border-red-500/30';
    case 'medium':
      return 'bg-yellow-500/20 border-yellow-500/30';
    case 'low':
      return 'bg-blue-500/20 border-blue-500/30';
    default:
      return 'bg-green-500/20 border-green-500/30';
  }
};

const getScoreColor = (score: number): string => {
  if (score === 0) return 'text-green-400';
  if (score <= 20) return 'text-blue-400';
  if (score <= 50) return 'text-yellow-400';
  return 'text-red-400';
};

const getTypeIcon = (type: string): React.ReactNode => {
  switch (type) {
    case 'like':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      );
    case 'share':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      );
    case 'comment':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'tag':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    case 'vote':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case 'reaction':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};

export const BaitDetectionCard: FC<BaitDetectionCardProps> = React.memo(({
  caption,
  baitScore,
  hasBait,
  detectedPatterns,
  overallSeverity,
  isLoading = false,
}) => {
  const t = useT();

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-700 rounded mb-4" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-700 rounded" />
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
          {t('bait.card.title', 'Engagement Bait Detection')}
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityBgColor(overallSeverity)}`}>
          {overallSeverity === 'none'
            ? t('bait.severity.clean', 'Clean')
            : t(`bait.severity.${overallSeverity}`, overallSeverity.charAt(0).toUpperCase() + overallSeverity.slice(1))}
        </div>
      </div>

      {/* Bait Score */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-gray-700 flex items-center justify-center">
            <div className="text-center">
              <span className={`text-3xl font-bold ${getScoreColor(baitScore)}`}>
                {baitScore}
              </span>
              <span className="text-gray-400 text-sm block">
                {t('bait.card.score', 'Bait Score')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className={`text-center mb-6 p-3 rounded-lg ${getSeverityBgColor(overallSeverity)}`}>
        {!hasBait ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-400">
              {t('bait.card.noIssues', 'No engagement bait detected!')}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              {t('bait.card.issuesFound', `${detectedPatterns.length} bait pattern(s) detected`)}
            </span>
          </div>
        )}
      </div>

      {/* Detected Patterns */}
      {detectedPatterns.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">
            {t('bait.card.detectedPatterns', 'Detected Patterns')}
          </h4>
          <div className="space-y-3">
            {detectedPatterns.map((pattern, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getSeverityBgColor(pattern.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 mt-0.5 ${getSeverityColor(pattern.severity)}`}>
                    {getTypeIcon(pattern.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium capitalize">{pattern.type} Bait</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${getSeverityBgColor(pattern.severity)}`}
                      >
                        {pattern.severity}
                      </span>
                    </div>
                    <div className="text-sm mb-2">
                      <span className="text-gray-400">{t('bait.card.found', 'Found')}: </span>
                      <span className="text-white font-mono bg-gray-800 px-1 rounded">
                        "{pattern.matchedText}"
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{pattern.explanation}</p>
                    <div className="text-xs">
                      <span className="text-gray-500">{t('bait.card.tryInstead', 'Try instead')}: </span>
                      <span className="text-green-400 italic">"{pattern.authenticAlternative}"</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default BaitDetectionCard;
