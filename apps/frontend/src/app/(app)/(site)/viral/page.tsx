'use client';

import React, { useState, useCallback } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { ViralScoreCard, ScoreBreakdown } from '@gitroom/frontend/components/viral/viral-score-card';
import { ImprovementSuggestions, ImprovementSuggestion } from '@gitroom/frontend/components/viral/improvement-suggestions';
import { ContentComparison, RankedContent } from '@gitroom/frontend/components/viral/content-comparison';

interface ViralScoreResult {
  overallScore: number;
  breakdown: ScoreBreakdown;
  interpretation: string;
  suggestions: ImprovementSuggestion[];
}

export default function ViralScorePage() {
  const t = useT();
  const fetch = useFetch();

  // Form state
  const [caption, setCaption] = useState('');
  const [hookText, setHookText] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [contentType, setContentType] = useState<'reel' | 'video' | 'post' | 'story'>('reel');
  const [scheduledTime, setScheduledTime] = useState('');

  // Result state
  const [result, setResult] = useState<ViralScoreResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comparison state
  const [drafts, setDrafts] = useState<Array<{ id: string; caption: string; contentType: string }>>([]);
  const [comparisonResult, setComparisonResult] = useState<RankedContent[] | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const calculateScore = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const hashtagArray = hashtags
        .split(/[,\s#]+/)
        .filter((h) => h.trim())
        .map((h) => h.trim());

      const response = await fetch('/viral/score', {
        method: 'POST',
        body: JSON.stringify({
          metadata: {
            caption,
            hookText: hookText || undefined,
            hashtags: hashtagArray.length > 0 ? hashtagArray : undefined,
            contentType,
            scheduledTime: scheduledTime || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate viral score');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [caption, hookText, hashtags, contentType, scheduledTime, fetch]);

  const addDraft = useCallback(() => {
    if (!caption.trim()) return;

    const newDraft = {
      id: `draft-${Date.now()}`,
      caption,
      contentType,
    };

    setDrafts((prev) => [...prev, newDraft]);
    setCaption('');
  }, [caption, contentType]);

  const compareDrafts = useCallback(async () => {
    if (drafts.length < 2) return;

    setIsComparing(true);

    try {
      const response = await fetch('/viral/compare', {
        method: 'POST',
        body: JSON.stringify({
          drafts: drafts.map((d) => ({
            id: d.id,
            metadata: {
              caption: d.caption,
              contentType: d.contentType,
            },
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to compare drafts');
      }

      const data = await response.json();
      setComparisonResult(data.rankings);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsComparing(false);
    }
  }, [drafts, fetch]);

  const clearDrafts = useCallback(() => {
    setDrafts([]);
    setComparisonResult(null);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <svg
              className="w-7 h-7 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            {t('viral.page.title', 'Viral Score Predictor')}
          </h1>
          <p className="text-gray-400 mt-1">
            {t('viral.page.subtitle', 'Predict your content\'s viral potential before posting')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-third rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t('viral.form.title', 'Content Details')}
          </h3>

          {/* Content Type */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              {t('viral.form.contentType', 'Content Type')}
            </label>
            <div className="flex gap-2">
              {(['reel', 'video', 'post', 'story'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                    contentType === type
                      ? 'bg-purple-500 text-white'
                      : 'bg-input text-gray-300 hover:bg-input/80'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Hook Text */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              {t('viral.form.hookText', 'Hook (First Line)')}
            </label>
            <input
              type="text"
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              placeholder={t('viral.form.hookPlaceholder', 'Did you know this secret hack?')}
              className="w-full px-4 py-3 bg-input rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Caption */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              {t('viral.form.caption', 'Caption')}
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t('viral.form.captionPlaceholder', 'Write your caption here...')}
              rows={4}
              className="w-full px-4 py-3 bg-input rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Hashtags */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              {t('viral.form.hashtags', 'Hashtags')}
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder={t('viral.form.hashtagsPlaceholder', '#viral #trending #fyp')}
              className="w-full px-4 py-3 bg-input rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Scheduled Time */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">
              {t('viral.form.scheduledTime', 'Scheduled Time (Optional)')}
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-3 bg-input rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={calculateScore}
              disabled={isLoading || !caption.trim()}
              className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('viral.form.calculating', 'Calculating...')}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  {t('viral.form.calculate', 'Calculate Score')}
                </>
              )}
            </button>
            <button
              onClick={addDraft}
              disabled={!caption.trim()}
              className="px-4 py-3 bg-input hover:bg-input/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              title={t('viral.form.addDraft', 'Add to comparison')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </button>
          </div>

          {/* Draft List for Comparison */}
          {drafts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-400">
                  {t('viral.form.drafts', 'Drafts for Comparison')} ({drafts.length})
                </h4>
                <button
                  onClick={clearDrafts}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  {t('viral.form.clearAll', 'Clear All')}
                </button>
              </div>
              <div className="space-y-2 mb-4">
                {drafts.map((draft, index) => (
                  <div
                    key={draft.id}
                    className="flex items-center gap-2 p-2 bg-input/50 rounded-lg text-sm"
                  >
                    <span className="text-purple-400">#{index + 1}</span>
                    <span className="flex-1 truncate text-gray-300">{draft.caption}</span>
                    <span className="text-xs text-gray-500 capitalize">{draft.contentType}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={compareDrafts}
                disabled={isComparing || drafts.length < 2}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
              >
                {isComparing
                  ? t('viral.form.comparing', 'Comparing...')
                  : t('viral.form.compare', 'Compare Drafts')}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              <ViralScoreCard
                overallScore={result.overallScore}
                breakdown={result.breakdown}
                interpretation={result.interpretation}
                isLoading={isLoading}
              />
              <ImprovementSuggestions
                suggestions={result.suggestions}
                isLoading={isLoading}
              />
            </>
          ) : (
            <div className="bg-third rounded-xl p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-400 mb-2">
                {t('viral.empty.title', 'No Score Yet')}
              </h3>
              <p className="text-gray-500">
                {t('viral.empty.description', 'Enter your content details and click Calculate Score to see your viral potential.')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Results */}
      {comparisonResult && comparisonResult.length > 0 && (
        <ContentComparison rankings={comparisonResult} isLoading={isComparing} />
      )}
    </div>
  );
}
