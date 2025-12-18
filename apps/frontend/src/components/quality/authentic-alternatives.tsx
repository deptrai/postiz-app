'use client';

import React, { FC, useState } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface Alternative {
  original: string;
  alternative: string;
  type: string;
}

export interface AuthenticAlternativesProps {
  alternatives: Alternative[];
  onApply?: (alternative: string) => void;
  isLoading?: boolean;
}

export const AuthenticAlternatives: FC<AuthenticAlternativesProps> = ({
  alternatives,
  onApply,
  isLoading = false,
}) => {
  const t = useT();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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

  if (alternatives.length === 0) {
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
          {t('bait.alternatives.title', 'Authentic Alternatives')}
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
          {t('bait.alternatives.noSuggestions', 'No suggestions needed - your content looks great!')}
        </div>
      </div>
    );
  }

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
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        {t('bait.alternatives.title', 'Authentic Alternatives')}
        <span className="text-sm text-gray-400 font-normal">({alternatives.length})</span>
      </h3>

      <p className="text-sm text-gray-400 mb-4">
        {t('bait.alternatives.description', 'Replace engagement bait with these authentic phrases to avoid algorithm penalties:')}
      </p>

      <div className="space-y-3">
        {alternatives.map((alt, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-gray-800/50 border border-gray-700"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">
                  {t('bait.alternatives.instead', 'Instead of')}:
                </div>
                <div className="text-red-400 line-through mb-3 font-mono text-sm">
                  "{alt.original}"
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 mt-2">
              <div className="flex-shrink-0 mt-1">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">
                  {t('bait.alternatives.tryThis', 'Try this')}:
                </div>
                <div className="text-green-400 font-medium mb-3">
                  "{alt.alternative}"
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(alt.alternative, index)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    {copiedIndex === index ? (
                      <>
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('bait.alternatives.copied', 'Copied!')}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {t('bait.alternatives.copy', 'Copy')}
                      </>
                    )}
                  </button>

                  {onApply && (
                    <button
                      onClick={() => onApply(alt.alternative)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {t('bait.alternatives.apply', 'Apply')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-700">
              <span className="text-xs text-gray-500 capitalize">
                {alt.type} bait
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthenticAlternatives;
