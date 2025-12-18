'use client';

import React, { useState } from 'react';

export type SuggestionType = 'hook' | 'pacing' | 'length' | 'content' | 'payoff';
export type Priority = 'high' | 'medium' | 'low';

export interface RetentionSuggestion {
  type: SuggestionType;
  priority: Priority;
  dropOffPoint: number;
  issue: string;
  suggestion: string;
  expectedImprovement: string;
}

export interface RetentionSuggestionsProps {
  suggestions: RetentionSuggestion[];
  isLoading?: boolean;
  onSuggestionClick?: (suggestion: RetentionSuggestion) => void;
}

function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500/20 border-red-500/30 text-red-400';
    case 'medium':
      return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
    case 'low':
      return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
  }
}

function getTypeIcon(type: SuggestionType): string {
  switch (type) {
    case 'hook':
      return '🎣';
    case 'pacing':
      return '⚡';
    case 'length':
      return '📏';
    case 'content':
      return '📝';
    case 'payoff':
      return '🎯';
  }
}

function getTypeLabel(type: SuggestionType): string {
  switch (type) {
    case 'hook':
      return 'Opening Hook';
    case 'pacing':
      return 'Content Pacing';
    case 'length':
      return 'Video Length';
    case 'content':
      return 'Content Delivery';
    case 'payoff':
      return 'Conclusion & Payoff';
  }
}

export function RetentionSuggestions({
  suggestions,
  isLoading = false,
  onSuggestionClick,
}: RetentionSuggestionsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-third rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Excellent Retention!
        </h3>
        <p className="text-gray-400">
          Your video has strong retention with no major issues detected. Keep up the great work!
        </p>
      </div>
    );
  }

  // Group suggestions by priority
  const highPriority = suggestions.filter(s => s.priority === 'high');
  const mediumPriority = suggestions.filter(s => s.priority === 'medium');
  const lowPriority = suggestions.filter(s => s.priority === 'low');

  return (
    <div className="bg-third rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Improvement Suggestions
        </h3>
        <p className="text-sm text-gray-400">
          {suggestions.length} recommendation{suggestions.length > 1 ? 's' : ''} to boost retention
        </p>
      </div>

      {/* Priority Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {highPriority.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{highPriority.length}</p>
            <p className="text-xs text-red-400/70">High Priority</p>
          </div>
        )}
        {mediumPriority.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{mediumPriority.length}</p>
            <p className="text-xs text-amber-400/70">Medium Priority</p>
          </div>
        )}
        {lowPriority.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{lowPriority.length}</p>
            <p className="text-xs text-blue-400/70">Low Priority</p>
          </div>
        )}
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <div
              key={`suggestion-${index}`}
              className={`border rounded-lg transition-all ${getPriorityColor(suggestion.priority)}`}
            >
              {/* Suggestion Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => {
                  setExpandedIndex(isExpanded ? null : index);
                  onSuggestionClick?.(suggestion);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{getTypeIcon(suggestion.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{getTypeLabel(suggestion.type)}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-current/20 uppercase">
                          {suggestion.priority}
                        </span>
                      </div>
                      <p className="text-sm opacity-90">{suggestion.issue}</p>
                      {suggestion.dropOffPoint < 100 && (
                        <p className="text-xs opacity-75 mt-1">
                          📍 Drop-off at {suggestion.dropOffPoint}%
                        </p>
                      )}
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Suggestion */}
                  <div className="bg-current/10 rounded-lg p-3">
                    <p className="text-xs font-medium opacity-75 mb-1">💡 Suggestion</p>
                    <p className="text-sm">{suggestion.suggestion}</p>
                  </div>

                  {/* Expected Improvement */}
                  <div className="bg-current/10 rounded-lg p-3">
                    <p className="text-xs font-medium opacity-75 mb-1">📈 Expected Impact</p>
                    <p className="text-sm font-medium">{suggestion.expectedImprovement}</p>
                  </div>

                  {/* Action Button */}
                  <button
                    className="w-full py-2 px-4 bg-current/20 hover:bg-current/30 rounded-lg transition-colors text-sm font-medium"
                    onClick={() => {
                      // Jump to drop-off point in chart
                      console.log('Jump to', suggestion.dropOffPoint);
                    }}
                  >
                    View on Chart →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Impact */}
      {suggestions.length > 0 && (
        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Potential Impact
          </h4>
          <p className="text-sm text-gray-300">
            Implementing these suggestions could potentially increase your average retention by
            <span className="font-bold text-purple-400"> +15-35%</span> and significantly improve completion rates.
          </p>
        </div>
      )}
    </div>
  );
}
