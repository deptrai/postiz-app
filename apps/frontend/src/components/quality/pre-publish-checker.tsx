'use client';

import React, { FC, useState, useCallback, useEffect } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export interface Warning {
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface PrePublishCheckResult {
  isClean: boolean;
  baitScore: number;
  warnings: Warning[];
  recommendations: string[];
}

export interface PrePublishCheckerProps {
  content: string;
  onChange?: (content: string) => void;
  onCheckComplete?: (result: PrePublishCheckResult) => void;
  debounceMs?: number;
}

const getSeverityColor = (severity: 'high' | 'medium' | 'low'): string => {
  switch (severity) {
    case 'high':
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'medium':
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'low':
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
  }
};

export const PrePublishChecker: FC<PrePublishCheckerProps> = ({
  content,
  onChange,
  onCheckComplete,
  debounceMs = 500,
}) => {
  const t = useT();
  const fetch = useFetch();
  const [checkResult, setCheckResult] = useState<PrePublishCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  const checkContent = useCallback(async (text: string) => {
    if (!text.trim()) {
      setCheckResult(null);
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch('/quality/bait/check', {
        method: 'POST',
        body: JSON.stringify({ contentDraft: text }),
      });
      const result = await response.json();
      setCheckResult(result);
      onCheckComplete?.(result);
    } catch (error) {
      console.error('Failed to check content:', error);
    } finally {
      setIsChecking(false);
    }
  }, [fetch, onCheckComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkContent(localContent);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localContent, debounceMs, checkContent]);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onChange?.(newContent);
  };

  return (
    <div className="bg-third rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          {t('bait.checker.title', 'Pre-Publish Checker')}
        </h3>
        {isChecking && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t('bait.checker.checking', 'Checking...')}
          </div>
        )}
      </div>

      {/* Content Input */}
      <div className="mb-4">
        <textarea
          value={localContent}
          onChange={handleContentChange}
          placeholder={t('bait.checker.placeholder', 'Enter your content to check for engagement bait...')}
          className="w-full h-32 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Status Indicator */}
      {checkResult && (
        <div className="mb-4">
          <div
            className={`p-3 rounded-lg flex items-center gap-2 ${
              checkResult.isClean
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-red-500/20 border border-red-500/30'
            }`}
          >
            {checkResult.isClean ? (
              <>
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-400 font-medium">
                  {t('bait.checker.clean', 'Content is clean! Ready to publish.')}
                </span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-red-400 font-medium">
                  {t('bait.checker.issues', `${checkResult.warnings.length} issue(s) found`)}
                </span>
                <span className="text-gray-400 text-sm ml-auto">
                  {t('bait.checker.baitScore', 'Bait Score')}: {checkResult.baitScore}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {checkResult && checkResult.warnings.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">
            {t('bait.checker.warnings', 'Warnings')}
          </h4>
          <div className="space-y-2">
            {checkResult.warnings.map((warning, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getSeverityColor(warning.severity)}`}
              >
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm">{warning.message}</p>
                    <div className="mt-2 text-xs text-gray-400">
                      <span className="text-green-400">{t('bait.checker.suggestion', 'Suggestion')}: </span>
                      {warning.suggestion}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize bg-gray-800">
                    {warning.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {checkResult && checkResult.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">
            {t('bait.checker.recommendations', 'Recommendations')}
          </h4>
          <ul className="space-y-1">
            {checkResult.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <svg className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PrePublishChecker;
