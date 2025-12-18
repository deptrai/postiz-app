'use client';

import React, { useState } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface ThumbnailSuggestion {
  type: 'ab-test' | 'best-practice';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImprovement: string;
  actionItems: string[];
}

export interface ThumbnailSuggestionsProps {
  suggestions: ThumbnailSuggestion[];
  isLoading?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const TYPE_ICONS: Record<string, string> = {
  'ab-test': '🧪',
  'best-practice': '✨',
};

const TYPE_LABELS: Record<string, string> = {
  'ab-test': 'A/B Test',
  'best-practice': 'Best Practice',
};

export function ThumbnailSuggestions({
  suggestions,
  isLoading = false,
}: ThumbnailSuggestionsProps) {
  const t = useT();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'ab-test' | 'best-practice'>('all');

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const filteredSuggestions = filter === 'all'
    ? suggestions
    : suggestions.filter((s) => s.type === filter);

  const abTestCount = suggestions.filter((s) => s.type === 'ab-test').length;
  const bestPracticeCount = suggestions.filter((s) => s.type === 'best-practice').length;
  const highPriorityCount = suggestions.filter((s) => s.priority === 'high').length;

  return (
    <div className="bg-third rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{t('thumbnail_suggestions')}</h3>
          <p className="text-sm text-gray-400">
            {suggestions.length} {t('suggestions')} • {highPriorityCount} {t('high_priority')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              filter === 'all'
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-gray-700/50 text-gray-400 hover:text-white'
            }`}
          >
            {t('all')} ({suggestions.length})
          </button>
          <button
            onClick={() => setFilter('ab-test')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              filter === 'ab-test'
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-gray-700/50 text-gray-400 hover:text-white'
            }`}
          >
            🧪 {t('ab_tests')} ({abTestCount})
          </button>
          <button
            onClick={() => setFilter('best-practice')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              filter === 'best-practice'
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-gray-700/50 text-gray-400 hover:text-white'
            }`}
          >
            ✨ {t('best_practices')} ({bestPracticeCount})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredSuggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              expandedIndex === index
                ? 'bg-gray-700/30 border-purple-500/50'
                : 'bg-gray-700/10 border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{TYPE_ICONS[suggestion.type]}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs border ${PRIORITY_COLORS[suggestion.priority]}`}>
                      {suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {TYPE_LABELS[suggestion.type]}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-white">{suggestion.title}</h4>
                  <p className="text-sm text-gray-400 mt-1">{suggestion.description}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-500">Expected</div>
                <div className="text-sm font-medium text-green-400">{suggestion.expectedImprovement}</div>
              </div>
            </div>

            {expandedIndex === index && suggestion.actionItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h5 className="text-xs font-medium text-gray-400 mb-2">Action Items</h5>
                <ul className="space-y-2">
                  {suggestion.actionItems.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-purple-400 flex-shrink-0">
                        {itemIndex + 1}.
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredSuggestions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎉</div>
          <h4 className="text-lg font-medium text-white">Great job!</h4>
          <p className="text-sm text-gray-400">No suggestions in this category</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Priority Summary</span>
          <div className="flex items-center gap-3">
            <span className="text-red-400">
              {suggestions.filter((s) => s.priority === 'high').length} High
            </span>
            <span className="text-yellow-400">
              {suggestions.filter((s) => s.priority === 'medium').length} Medium
            </span>
            <span className="text-blue-400">
              {suggestions.filter((s) => s.priority === 'low').length} Low
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
