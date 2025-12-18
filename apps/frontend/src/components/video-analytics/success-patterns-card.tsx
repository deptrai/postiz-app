'use client';

import React from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface SuccessPattern {
  element: string;
  elementLabel: string;
  frequency: number;
  avgCtrImpact: number;
  description: string;
  examples: Array<{
    videoId: string;
    videoTitle: string;
    ctr: number;
  }>;
}

export interface ThumbnailPerformance {
  videoId: string;
  videoTitle: string;
  thumbnailUrl?: string;
  style: string;
  impressions: number;
  clicks: number;
  ctr: number;
  publishedAt: Date;
}

export interface SuccessPatternsCardProps {
  patterns: SuccessPattern[];
  topPerformers: ThumbnailPerformance[];
  insights: string[];
  isLoading?: boolean;
}

const PATTERN_ICONS: Record<string, string> = {
  'bright-colors': '🎨',
  'human-face': '👤',
  'large-text': '📝',
  'high-contrast': '⚡',
  'rule-of-thirds': '📐',
  'emotional-expression': '😮',
  'brand-consistency': '🏷️',
  'curiosity-element': '❓',
};

function getImpactColor(impact: number): string {
  if (impact >= 3) return 'text-green-400';
  if (impact >= 2) return 'text-yellow-400';
  return 'text-gray-400';
}

function getFrequencyWidth(frequency: number): string {
  return `${Math.min(100, frequency)}%`;
}

export function SuccessPatternsCard({
  patterns,
  topPerformers,
  insights,
  isLoading = false,
}: SuccessPatternsCardProps) {
  const t = useT();
  
  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-48 bg-gray-700 rounded mb-4" />
        <div className="h-32 bg-gray-700 rounded" />
      </div>
    );
  }

  const topPatterns = patterns.slice(0, 6);

  return (
    <div className="bg-third rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{t('success_patterns')}</h3>
          <p className="text-sm text-gray-400">{t('pattern_analysis')}</p>
        </div>
        <div className="text-2xl">🔍</div>
      </div>

      <div className="space-y-3 mb-6">
        {topPatterns.map((pattern) => (
          <div key={pattern.element} className="bg-gray-700/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{PATTERN_ICONS[pattern.element] || '📌'}</span>
                <div>
                  <div className="text-sm font-medium text-white">{pattern.elementLabel}</div>
                  <div className="text-xs text-gray-500">{pattern.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${getImpactColor(pattern.avgCtrImpact)}`}>
                  +{pattern.avgCtrImpact}% CTR
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all"
                  style={{ width: getFrequencyWidth(pattern.frequency) }}
                />
              </div>
              <span className="text-xs text-gray-400 w-12 text-right">{pattern.frequency}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-700 pt-4 mb-4">
        <h4 className="text-sm font-medium text-gray-400 mb-3">{t('top_performers')}</h4>
        <div className="grid grid-cols-1 gap-2">
          {topPerformers.slice(0, 3).map((performer, index) => (
            <div
              key={performer.videoId}
              className="flex items-center gap-3 bg-gray-700/20 rounded-lg p-2"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{performer.videoTitle}</div>
                <div className="text-xs text-gray-500">{performer.videoId}</div>
              </div>
              <div className="text-sm font-medium text-green-400">{performer.ctr}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-400 mb-3">{t('key_insights')}</h4>
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-purple-400 flex-shrink-0">💡</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{t('pattern_analysis')}</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-400">{t('high_impact')}: +3%+</span>
            <span className="text-yellow-400">Medium: +2%</span>
            <span className="text-gray-400">Low: &lt;2%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
