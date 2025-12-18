'use client';

import React, { useState } from 'react';

export type TipPriority = 'high' | 'medium' | 'low';
export type TipCategory = 'hook' | 'pacing' | 'content' | 'format' | 'general';

export interface LengthOptimizationTip {
  priority: TipPriority;
  category: TipCategory;
  issue: string;
  tip: string;
  example?: string;
  expectedImprovement: string;
}

export interface LengthOptimizationTipsProps {
  tips: LengthOptimizationTip[];
  isLoading?: boolean;
}

function getPriorityInfo(priority: TipPriority): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (priority) {
    case 'high':
      return {
        label: 'High Priority',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20 border-red-500/30',
      };
    case 'medium':
      return {
        label: 'Medium Priority',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20 border-yellow-500/30',
      };
    case 'low':
      return {
        label: 'Low Priority',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20 border-blue-500/30',
      };
  }
}

function getCategoryIcon(category: TipCategory): string {
  switch (category) {
    case 'hook':
      return '🎣';
    case 'pacing':
      return '⏱️';
    case 'content':
      return '📝';
    case 'format':
      return '🎬';
    case 'general':
      return '💡';
  }
}

function getCategoryLabel(category: TipCategory): string {
  switch (category) {
    case 'hook':
      return 'Hook';
    case 'pacing':
      return 'Pacing';
    case 'content':
      return 'Content';
    case 'format':
      return 'Format';
    case 'general':
      return 'General';
  }
}

export function LengthOptimizationTips({
  tips,
  isLoading = false,
}: LengthOptimizationTipsProps) {
  const [expandedTip, setExpandedTip] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const highPriorityCount = tips.filter((t) => t.priority === 'high').length;
  const mediumPriorityCount = tips.filter((t) => t.priority === 'medium').length;

  return (
    <div className="bg-third rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Optimization Tips</h3>
          <p className="text-sm text-gray-400">
            {tips.length} recommendations • {highPriorityCount} high priority
          </p>
        </div>
        <div className="flex items-center gap-2">
          {highPriorityCount > 0 && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
              {highPriorityCount} High
            </span>
          )}
          {mediumPriorityCount > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">
              {mediumPriorityCount} Medium
            </span>
          )}
        </div>
      </div>

      {tips.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">🎉</span>
          <p className="text-white font-medium">Great job!</p>
          <p className="text-gray-400 text-sm">
            Your video lengths are well optimized. Keep up the good work!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tips.map((tip, index) => {
            const priorityInfo = getPriorityInfo(tip.priority);
            const isExpanded = expandedTip === index;

            return (
              <div
                key={index}
                className={`rounded-lg border transition-all cursor-pointer ${priorityInfo.bgColor}`}
                onClick={() => setExpandedTip(isExpanded ? null : index)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getCategoryIcon(tip.category)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-400">
                            {getCategoryLabel(tip.category)}
                          </span>
                        </div>
                        <p className="text-white font-medium">{tip.issue}</p>
                        <p className="text-sm text-gray-400 mt-1">{tip.tip}</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-xl">
                      {isExpanded ? '−' : '+'}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-600/50">
                      {tip.example && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-400 mb-1">Example</p>
                          <p className="text-sm text-gray-300 bg-gray-800/50 p-2 rounded">
                            {tip.example}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">📈</span>
                        <span className="text-sm text-green-400">
                          Expected: {tip.expectedImprovement}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Potential Impact</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-4 h-2 rounded ${
                  i <= Math.min(5, highPriorityCount + Math.ceil(mediumPriorityCount / 2))
                    ? 'bg-purple-500'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
