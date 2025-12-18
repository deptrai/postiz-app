'use client';

import React, { FC } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface ImprovementItem {
  factor: 'engagement' | 'watchTime' | 'compliance' | 'consistency';
  currentScore: number;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface ImprovementHighlightsProps {
  improvements: ImprovementItem[];
  isLoading?: boolean;
}

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

const getPriorityIcon = (priority: 'high' | 'medium' | 'low'): React.ReactNode => {
  switch (priority) {
    case 'high':
      return (
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'medium':
      return (
        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'low':
      return (
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
  }
};

const getFactorLabel = (factor: string): string => {
  switch (factor) {
    case 'engagement':
      return 'Engagement';
    case 'watchTime':
      return 'Watch Time';
    case 'compliance':
      return 'Compliance';
    case 'consistency':
      return 'Consistency';
    default:
      return factor;
  }
};

const getFactorIcon = (factor: string): React.ReactNode => {
  switch (factor) {
    case 'engagement':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case 'watchTime':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'compliance':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'consistency':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return null;
  }
};

export const ImprovementHighlights: FC<ImprovementHighlightsProps> = ({
  improvements,
  isLoading = false,
}) => {
  const t = useT();

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (improvements.length === 0) {
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
          {t('quality.improvements.title', 'Improvement Areas')}
        </h3>
        <div className="text-center py-6 text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-green-500/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t('quality.improvements.allGood', 'Great job! No major improvements needed.')}
        </div>
      </div>
    );
  }

  const highPriority = improvements.filter((i) => i.priority === 'high');
  const mediumPriority = improvements.filter((i) => i.priority === 'medium');
  const lowPriority = improvements.filter((i) => i.priority === 'low');

  return (
    <div className="bg-third rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-yellow-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        {t('quality.improvements.title', 'Improvement Areas')}
        <span className="text-sm text-gray-400 font-normal">({improvements.length})</span>
      </h3>

      <div className="space-y-3">
        {[...highPriority, ...mediumPriority, ...lowPriority].map((improvement, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getPriorityColor(improvement.priority)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getPriorityIcon(improvement.priority)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">
                      {getFactorIcon(improvement.factor)}
                    </span>
                    <span className="font-medium">
                      {getFactorLabel(improvement.factor)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {t('quality.improvements.currentScore', 'Current')}: {improvement.currentScore}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        improvement.priority === 'high'
                          ? 'bg-red-500/30'
                          : improvement.priority === 'medium'
                            ? 'bg-yellow-500/30'
                            : 'bg-blue-500/30'
                      }`}
                    >
                      {improvement.priority}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{improvement.suggestion}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImprovementHighlights;
