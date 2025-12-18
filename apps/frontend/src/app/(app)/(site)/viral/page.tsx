'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { ViralScoreCard, ScoreBreakdown } from '@gitroom/frontend/components/viral/viral-score-card';
import { ImprovementSuggestions, ImprovementSuggestion } from '@gitroom/frontend/components/viral/improvement-suggestions';
import { ContentComparison, RankedContent } from '@gitroom/frontend/components/viral/content-comparison';
import { HookAnalysisCard, HookScoreBreakdown, HookRecommendation, HookPattern, HookOpeningType } from '@gitroom/frontend/components/viral/hook-analysis-card';
import { HookPatterns } from '@gitroom/frontend/components/viral/hook-patterns';
import { HookComparison } from '@gitroom/frontend/components/viral/hook-comparison';
import { ViralTimingCard, TimingWindow, BestOverallTime, ConfidenceLevel } from '@gitroom/frontend/components/viral/viral-timing-card';
import { TimingHeatmap, HeatmapCell, TimeSlot } from '@gitroom/frontend/components/viral/timing-heatmap';
import { FormatTimingTabs, ContentFormat } from '@gitroom/frontend/components/viral/format-timing-tabs';
import { ContentElementsCard, ContentElementsAnalysis } from '@gitroom/frontend/components/viral/content-elements-card';

type TabType = 'viral' | 'hook' | 'timing' | 'elements';

interface ViralScoreResult {
  overallScore: number;
  breakdown: ScoreBreakdown;
  interpretation: string;
  suggestions: ImprovementSuggestion[];
}

interface HookAnalysisResult {
  effectivenessScore: number;
  openingType: HookOpeningType;
  breakdown: HookScoreBreakdown;
  interpretation: string;
  recommendations: HookRecommendation[];
  matchedPatterns: HookPattern[];
}

export default function ViralScorePage() {
  const t = useT();
  const fetch = useFetch();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('viral');

  // Form state
  const [caption, setCaption] = useState('');
  const [hookText, setHookText] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [contentType, setContentType] = useState<'reel' | 'video' | 'post' | 'story'>('reel');
  const [scheduledTime, setScheduledTime] = useState('');

  // Hook form state
  const [hasQuickCuts, setHasQuickCuts] = useState(false);
  const [hasMusic, setHasMusic] = useState(true);
  const [hasSoundEffects, setHasSoundEffects] = useState(false);
  const [hasVoiceover, setHasVoiceover] = useState(false);

  // Result state
  const [result, setResult] = useState<ViralScoreResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook analysis state
  const [hookResult, setHookResult] = useState<HookAnalysisResult | null>(null);
  const [hookPatterns, setHookPatterns] = useState<HookPattern[]>([]);
  const [isLoadingHook, setIsLoadingHook] = useState(false);
  const [hookHooks, setHookHooks] = useState<Array<{ id: string; hookText: string; contentType: string }>>([]);
  const [hookComparisonResult, setHookComparisonResult] = useState<any[] | null>(null);
  const [isComparingHooks, setIsComparingHooks] = useState(false);

  // Comparison state
  const [drafts, setDrafts] = useState<Array<{ id: string; caption: string; contentType: string }>>([]);
  const [comparisonResult, setComparisonResult] = useState<RankedContent[] | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Timing state
  const [timingResult, setTimingResult] = useState<{
    recommendedWindows: TimingWindow[];
    bestOverallTime: BestOverallTime;
    formatSpecific: { format: ContentFormat; windows: TimingWindow[] };
    nicheSpecific?: { niche: string; windows: TimingWindow[] };
    insights: string[];
  } | null>(null);
  const [heatmapResult, setHeatmapResult] = useState<{
    heatmap: HeatmapCell[][];
    peakTimes: TimeSlot[];
    lowTimes: TimeSlot[];
    averageEngagement: number;
  } | null>(null);
  const [isLoadingTiming, setIsLoadingTiming] = useState(false);
  const [timingFormat, setTimingFormat] = useState<ContentFormat>('reel');
  const [timingNiche, setTimingNiche] = useState<string>('');

  // Elements analysis state
  const [elementsResult, setElementsResult] = useState<ContentElementsAnalysis | null>(null);
  const [isLoadingElements, setIsLoadingElements] = useState(false);
  const [elementsCaption, setElementsCaption] = useState('');
  const [elementsHashtags, setElementsHashtags] = useState('');
  const [elementsContentType, setElementsContentType] = useState<'reel' | 'video' | 'post' | 'story'>('reel');
  const [elementsVideoLength, setElementsVideoLength] = useState<number | undefined>(undefined);

  // Load hook patterns on mount
  useEffect(() => {
    const loadPatterns = async () => {
      try {
        const response = await fetch('/viral/hook/patterns');
        if (response.ok) {
          const data = await response.json();
          setHookPatterns(data.patterns || []);
        }
      } catch (err) {
        console.error('Failed to load hook patterns:', err);
      }
    };
    loadPatterns();
  }, [fetch]);

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

  // Hook analysis functions
  const analyzeHook = useCallback(async () => {
    if (!hookText.trim()) return;

    setIsLoadingHook(true);
    setError(null);

    try {
      console.log('[Hook Analyzer] Starting analysis...');
      const response = await fetch('/viral/hook/analyze', {
        method: 'POST',
        body: JSON.stringify({
          metadata: {
            hookText,
            caption: caption || undefined,
            contentType,
            hasQuickCuts,
            hasMusic,
            hasSoundEffects,
            hasVoiceover,
          },
        }),
      });

      console.log('[Hook Analyzer] Response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to analyze hook');
      }

      const data = await response.json();
      console.log('[Hook Analyzer] Received data:', data);
      setHookResult(data);
      console.log('[Hook Analyzer] State updated');
    } catch (err: any) {
      console.error('[Hook Analyzer] Error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoadingHook(false);
    }
  }, [hookText, caption, contentType, hasQuickCuts, hasMusic, hasSoundEffects, hasVoiceover, fetch]);

  const addHookForComparison = useCallback(() => {
    if (!hookText.trim()) return;

    const newHook = {
      id: `hook-${Date.now()}`,
      hookText,
      contentType,
    };

    setHookHooks((prev) => [...prev, newHook]);
    setHookText('');
  }, [hookText, contentType]);

  const compareHooks = useCallback(async () => {
    if (hookHooks.length < 2) return;

    setIsComparingHooks(true);

    try {
      const response = await fetch('/viral/hook/compare', {
        method: 'POST',
        body: JSON.stringify({
          hooks: hookHooks.map((h) => ({
            id: h.id,
            metadata: {
              hookText: h.hookText,
              contentType: h.contentType,
              hasMusic,
              hasVoiceover,
            },
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to compare hooks');
      }

      const data = await response.json();
      setHookComparisonResult(data.rankings);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsComparingHooks(false);
    }
  }, [hookHooks, hasMusic, hasVoiceover, fetch]);

  const clearHooks = useCallback(() => {
    setHookHooks([]);
    setHookComparisonResult(null);
  }, []);

  // Timing functions
  const loadTimingData = useCallback(async (format: ContentFormat, niche?: string) => {
    setIsLoadingTiming(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('contentType', format);
      if (niche) params.set('niche', niche);

      const [timingResponse, heatmapResponse] = await Promise.all([
        fetch(`/viral/timing?${params.toString()}`),
        fetch(`/viral/timing/heatmap?${params.toString()}`),
      ]);

      if (timingResponse.ok) {
        const data = await timingResponse.json();
        setTimingResult(data);
      }

      if (heatmapResponse.ok) {
        const data = await heatmapResponse.json();
        setHeatmapResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load timing data');
    } finally {
      setIsLoadingTiming(false);
    }
  }, [fetch]);

  // Load timing data when format or niche changes
  useEffect(() => {
    if (activeTab === 'timing') {
      loadTimingData(timingFormat, timingNiche || undefined);
    }
  }, [activeTab, timingFormat, timingNiche, loadTimingData]);

  const handleTimingFormatChange = useCallback((format: ContentFormat) => {
    setTimingFormat(format);
  }, []);

  const applyPattern = useCallback((pattern: HookPattern) => {
    setHookText(pattern.example);
  }, []);

  // Elements analysis function
  const analyzeElements = useCallback(async () => {
    if (!elementsCaption.trim()) {
      setError('Please enter a caption to analyze');
      return;
    }

    setIsLoadingElements(true);
    setError(null);

    try {
      const hashtagsArray = elementsHashtags
        .split(/[,\s#]+/)
        .filter(tag => tag.trim())
        .map(tag => tag.trim());

      const response = await fetch('/viral/elements/analyze', {
        method: 'POST',
        body: JSON.stringify({
          caption: elementsCaption,
          hashtags: hashtagsArray.length > 0 ? hashtagsArray : undefined,
          contentType: elementsContentType,
          videoLength: elementsVideoLength,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setElementsResult(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to analyze content elements');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze content elements');
    } finally {
      setIsLoadingElements(false);
    }
  }, [elementsCaption, elementsHashtags, elementsContentType, elementsVideoLength, fetch]);

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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('viral')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'viral'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t('viral_score')}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('hook')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'hook'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t('hook_analyzer')}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('timing')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'timing'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('optimal_timing')}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('elements')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'elements'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {t('content_elements')}
          </span>
        </button>
      </div>

      {/* VIRAL SCORE TAB */}
      {activeTab === 'viral' && (
        <>
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
        </>
      )}

      {/* HOOK ANALYZER TAB */}
      {activeTab === 'hook' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hook Input Form */}
            <div className="bg-third rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Hook Details</h3>

              {/* Content Type */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Content Type</label>
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
                <label className="block text-sm text-gray-400 mb-2">Hook (First 3 Seconds)</label>
                <textarea
                  value={hookText}
                  onChange={(e) => setHookText(e.target.value)}
                  placeholder="Did you know this secret hack changes everything?"
                  rows={3}
                  className="w-full px-4 py-3 bg-input rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Audio/Visual Options */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Audio & Visual Elements</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-input rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasQuickCuts}
                      onChange={(e) => setHasQuickCuts(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Quick Cuts</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-input rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasMusic}
                      onChange={(e) => setHasMusic(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Music</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-input rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSoundEffects}
                      onChange={(e) => setHasSoundEffects(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Sound Effects</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-input rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasVoiceover}
                      onChange={(e) => setHasVoiceover(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Voiceover</span>
                  </label>
                </div>
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
                  onClick={analyzeHook}
                  disabled={isLoadingHook || !hookText.trim()}
                  className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isLoadingHook ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Analyze Hook
                    </>
                  )}
                </button>
                <button
                  onClick={addHookForComparison}
                  disabled={!hookText.trim()}
                  className="px-4 py-3 bg-input hover:bg-input/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  title="Add to comparison"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>

              {/* Hook List for Comparison */}
              {hookHooks.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-400">Hooks for Comparison ({hookHooks.length})</h4>
                    <button onClick={clearHooks} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
                  </div>
                  <div className="space-y-2 mb-4">
                    {hookHooks.map((hook, index) => (
                      <div key={hook.id} className="flex items-center gap-2 p-2 bg-input/50 rounded-lg text-sm">
                        <span className="text-purple-400">#{index + 1}</span>
                        <span className="flex-1 truncate text-gray-300">{hook.hookText}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={compareHooks}
                    disabled={isComparingHooks || hookHooks.length < 2}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                  >
                    {isComparingHooks ? 'Comparing...' : 'Compare Hooks'}
                  </button>
                </div>
              )}
            </div>

            {/* Hook Results */}
            <div className="space-y-6">
              {hookResult ? (
                <HookAnalysisCard
                  effectivenessScore={hookResult.effectivenessScore}
                  openingType={hookResult.openingType}
                  breakdown={hookResult.breakdown}
                  interpretation={hookResult.interpretation}
                  isLoading={isLoadingHook}
                />
              ) : (
                <div className="bg-third rounded-xl p-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No Analysis Yet</h3>
                  <p className="text-gray-500">Enter your hook text and click Analyze Hook to see effectiveness.</p>
                </div>
              )}
            </div>
          </div>

          {/* Hook Patterns */}
          <HookPatterns patterns={hookPatterns} onApplyPattern={applyPattern} />

          {/* Hook Comparison Results */}
          {hookComparisonResult && hookComparisonResult.length > 0 && (
            <HookComparison rankings={hookComparisonResult} isLoading={isComparingHooks} />
          )}
        </>
      )}

      {/* TIMING TAB */}
      {activeTab === 'timing' && (
        <>
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timing Options */}
            <div className="space-y-6">
              {/* Niche Selector */}
              <div className="bg-third rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Timing Options</h3>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Niche (Optional)</label>
                  <select
                    value={timingNiche}
                    onChange={(e) => setTimingNiche(e.target.value)}
                    className="w-full px-4 py-3 bg-input rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Niches</option>
                    <option value="fitness">Fitness</option>
                    <option value="food">Food</option>
                    <option value="beauty">Beauty</option>
                    <option value="tech">Tech</option>
                    <option value="gaming">Gaming</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="business">Business</option>
                    <option value="education">Education</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500">
                  Select a niche to get customized timing recommendations based on your audience's behavior patterns.
                </p>
              </div>

              {/* Format Timing Tabs */}
              <FormatTimingTabs
                activeFormat={timingFormat}
                onFormatChange={handleTimingFormatChange}
                formatWindows={timingResult?.formatSpecific}
                isLoading={isLoadingTiming}
              />
            </div>

            {/* Timing Results */}
            <div className="space-y-6">
              {timingResult ? (
                <ViralTimingCard
                  recommendedWindows={timingResult.recommendedWindows}
                  bestOverallTime={timingResult.bestOverallTime}
                  insights={timingResult.insights}
                  isLoading={isLoadingTiming}
                />
              ) : (
                <div className="bg-third rounded-xl p-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-400 mb-2">Loading Timing Data...</h3>
                  <p className="text-gray-500">Analyzing optimal posting times for your content.</p>
                </div>
              )}
            </div>
          </div>

          {/* Heatmap */}
          {heatmapResult && (
            <TimingHeatmap
              heatmap={heatmapResult.heatmap}
              peakTimes={heatmapResult.peakTimes}
              lowTimes={heatmapResult.lowTimes}
              averageEngagement={heatmapResult.averageEngagement}
              isLoading={isLoadingTiming}
            />
          )}
        </>
      )}

      {/* ELEMENTS TAB */}
      {activeTab === 'elements' && (
        <>
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="bg-third rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Analyze Content Elements</h3>

              {/* Content Type */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Content Type</label>
                <div className="flex gap-2">
                  {(['reel', 'video', 'post', 'story'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setElementsContentType(type)}
                      className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                        elementsContentType === type
                          ? 'bg-purple-500 text-white'
                          : 'bg-input text-gray-300 hover:bg-input/80'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Caption</label>
                <textarea
                  value={elementsCaption}
                  onChange={(e) => setElementsCaption(e.target.value)}
                  placeholder="Paste your caption here to analyze its elements..."
                  rows={6}
                  className="w-full px-4 py-3 bg-input rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Hashtags */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Hashtags (optional)</label>
                <input
                  type="text"
                  value={elementsHashtags}
                  onChange={(e) => setElementsHashtags(e.target.value)}
                  placeholder="#viral #trending #content"
                  className="w-full px-4 py-3 bg-input rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Separate with spaces or commas</p>
              </div>

              {/* Video Length (for reel/video) */}
              {(elementsContentType === 'reel' || elementsContentType === 'video') && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Video Length (seconds)</label>
                  <input
                    type="number"
                    value={elementsVideoLength || ''}
                    onChange={(e) => setElementsVideoLength(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="30"
                    min={1}
                    className="w-full px-4 py-3 bg-input rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={analyzeElements}
                disabled={isLoadingElements || !elementsCaption.trim()}
                className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoadingElements ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Analyze Elements
                  </>
                )}
              </button>
            </div>

            {/* Results */}
            <div>
              {elementsResult ? (
                <ContentElementsCard
                  analysis={elementsResult}
                  isLoading={isLoadingElements}
                />
              ) : (
                <div className="bg-third rounded-xl p-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No Analysis Yet</h3>
                  <p className="text-gray-500">Enter your content details and click Analyze Elements to see breakdown.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
