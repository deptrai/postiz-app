'use client';

import React from 'react';
import clsx from 'clsx';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { HookOpeningType, HookPattern } from './hook-analysis-card';

interface HookPatternsProps {
  patterns: HookPattern[];
  isLoading?: boolean;
  onApplyPattern?: (pattern: HookPattern) => void;
}

const TYPE_COLORS: Record<HookOpeningType, { bg: string; text: string; border: string }> = {
  question: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  statement: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  action: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  curiosity: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  problem: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  unknown: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
};

function getSuccessRateColor(rate: number): string {
  if (rate >= 80) return 'text-green-400';
  if (rate >= 60) return 'text-yellow-400';
  return 'text-orange-400';
}

export function HookPatterns({ patterns, isLoading = false, onApplyPattern }: HookPatternsProps) {
  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-700/50 rounded-lg">
              <div className="h-4 bg-gray-600 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-600 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-600 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!patterns || patterns.length === 0) {
    return (
      <div className="bg-third rounded-xl p-6 text-center">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p className="text-gray-400">No patterns found for this filter</p>
      </div>
    );
  }

  return (
    <div className="bg-third rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="text-lg font-semibold">Proven Hook Patterns</h3>
        <span className="text-sm text-gray-400">({patterns.length} patterns)</span>
      </div>

      {/* Patterns List */}
      <div className="space-y-4">
        {patterns.map((pattern, index) => {
          const colors = TYPE_COLORS[pattern.type];

          return (
            <div
              key={`${pattern.type}-${index}`}
              className={clsx(
                'p-4 rounded-lg border transition-all hover:shadow-lg',
                colors.bg,
                colors.border
              )}
            >
              {/* Pattern Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={clsx('text-sm font-medium capitalize', colors.text)}>
                      {pattern.type}
                    </span>
                    <span className="text-white font-semibold">{pattern.name}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{pattern.description}</p>
                </div>
                <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className={clsx('text-sm font-medium', getSuccessRateColor(pattern.successRate))}>
                    {pattern.successRate}%
                  </span>
                </div>
              </div>

              {/* Example */}
              <div className="bg-black/20 rounded-lg p-3 mb-3">
                <span className="text-xs text-gray-500 block mb-1">Example:</span>
                <p className="text-gray-200 italic">"{pattern.example}"</p>
              </div>

              {/* Best For Tags */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {pattern.bestFor.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                {onApplyPattern && (
                  <button
                    onClick={() => onApplyPattern(pattern)}
                    className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Apply
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HookPatterns;
