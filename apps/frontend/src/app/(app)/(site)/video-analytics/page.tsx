'use client';

import React, { useState, useCallback } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import {
  RetentionCurveChart,
  DropOffIndicator,
  BenchmarkOverlay,
  RetentionSuggestions,
  VideoComparisonView,
  RetentionPoint,
  DropOffPoint,
  RetentionSuggestion,
  BenchmarkComparison,
  VideoComparison,
  RetentionCurve,
} from '@gitroom/frontend/components/video-analytics';

type TabType = 'retention' | 'benchmark' | 'compare';

interface RetentionCurveResult {
  videoId: string;
  videoTitle?: string;
  videoDuration: number;
  totalViewers: number;
  points: RetentionPoint[];
  dropOffPoints: DropOffPoint[];
  averageRetention: number;
  completionRate: number;
}

export default function VideoAnalyticsPage() {
  const t = useT();
  const fetch = useFetch();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('retention');

  // Form state
  const [videoId, setVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [totalViewers, setTotalViewers] = useState<number>(1000);
  const [videoDuration, setVideoDuration] = useState<number>(60);
  const [niche, setNiche] = useState('fitness');
  const [format, setFormat] = useState<'reel' | 'video' | 'story'>('reel');

  // Comparison form state
  const [compareVideoIds, setCompareVideoIds] = useState<string[]>(['', '']);

  // Result state
  const [retentionResult, setRetentionResult] = useState<RetentionCurveResult | null>(null);
  const [suggestionsResult, setSuggestionsResult] = useState<RetentionSuggestion[] | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkComparison | null>(null);
  const [comparisonResult, setComparisonResult] = useState<VideoComparison | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState(false);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analyze retention curve
  const analyzeRetention = useCallback(async () => {
    if (!videoId.trim()) {
      setError('Please enter a video ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get retention curve
      const curveResponse = await fetch(`/video-analytics/retention/${videoId}?totalViewers=${totalViewers}&videoDuration=${videoDuration}`, {
        method: 'GET',
      });

      if (!curveResponse.ok) {
        throw new Error('Failed to analyze retention');
      }

      const curveData = await curveResponse.json();
      setRetentionResult(curveData);

      // Get suggestions
      const suggestionsResponse = await fetch(`/video-analytics/retention/${videoId}/suggestions`, {
        method: 'GET',
      });

      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        setSuggestionsResult(suggestionsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [videoId, totalViewers, videoDuration, fetch]);

  // Get benchmark comparison
  const getBenchmark = useCallback(async () => {
    if (!videoId.trim()) {
      setError('Please enter a video ID first');
      return;
    }

    setIsLoadingBenchmark(true);
    setError(null);

    try {
      const response = await fetch(`/video-analytics/retention/${videoId}/benchmark?niche=${niche}&format=${format}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get benchmark');
      }

      const data = await response.json();
      setBenchmarkResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingBenchmark(false);
    }
  }, [videoId, niche, format, fetch]);

  // Compare videos
  const compareVideos = useCallback(async () => {
    const validIds = compareVideoIds.filter(id => id.trim());
    if (validIds.length < 2) {
      setError('Please enter at least 2 video IDs to compare');
      return;
    }

    setIsLoadingComparison(true);
    setError(null);

    try {
      const response = await fetch('/video-analytics/retention/compare', {
        method: 'POST',
        body: JSON.stringify({ videoIds: validIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to compare videos');
      }

      const data = await response.json();
      setComparisonResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingComparison(false);
    }
  }, [compareVideoIds, fetch]);

  // Add comparison video input
  const addCompareVideo = () => {
    if (compareVideoIds.length < 3) {
      setCompareVideoIds([...compareVideoIds, '']);
    }
  };

  // Remove comparison video input
  const removeCompareVideo = (index: number) => {
    if (compareVideoIds.length > 2) {
      setCompareVideoIds(compareVideoIds.filter((_, i) => i !== index));
    }
  };

  // Update comparison video ID
  const updateCompareVideoId = (index: number, value: string) => {
    const newIds = [...compareVideoIds];
    newIds[index] = value;
    setCompareVideoIds(newIds);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Video Analytics</h1>
          <p className="text-gray-400 mt-1">Analyze video retention and optimize performance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('retention')}
          className={`px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'retention'
              ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📈 Retention Curve
        </button>
        <button
          onClick={() => setActiveTab('benchmark')}
          className={`px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'benchmark'
              ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📊 Benchmark
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'compare'
              ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🔄 Compare Videos
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Retention Tab */}
      {activeTab === 'retention' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="bg-third rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Video Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Video ID</label>
                <input
                  type="text"
                  value={videoId}
                  onChange={(e) => setVideoId(e.target.value)}
                  placeholder="Enter video ID"
                  className="w-full bg-input border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Video Title (optional)</label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="My awesome video"
                  className="w-full bg-input border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Total Viewers</label>
                  <input
                    type="number"
                    value={totalViewers}
                    onChange={(e) => setTotalViewers(parseInt(e.target.value) || 0)}
                    min={1}
                    className="w-full bg-input border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duration (sec)</label>
                  <input
                    type="number"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(parseInt(e.target.value) || 0)}
                    min={1}
                    className="w-full bg-input border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={analyzeRetention}
                disabled={isLoading || !videoId.trim()}
                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isLoading ? 'Analyzing...' : 'Analyze Retention'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {retentionResult ? (
              <>
                <RetentionCurveChart
                  points={retentionResult.points}
                  dropOffPoints={retentionResult.dropOffPoints}
                  videoTitle={retentionResult.videoTitle || videoTitle}
                  isLoading={isLoading}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DropOffIndicator
                    dropOffPoints={retentionResult.dropOffPoints}
                    totalViewers={retentionResult.totalViewers}
                    isLoading={isLoading}
                  />
                  
                  {suggestionsResult && (
                    <RetentionSuggestions
                      suggestions={suggestionsResult}
                      isLoading={isLoading}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="bg-third rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Data Yet</h3>
                <p className="text-gray-400">
                  Enter a video ID and click "Analyze Retention" to see your retention curve
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Benchmark Tab */}
      {activeTab === 'benchmark' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="bg-third rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Benchmark Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Video ID</label>
                <input
                  type="text"
                  value={videoId}
                  onChange={(e) => setVideoId(e.target.value)}
                  placeholder="Enter video ID"
                  className="w-full bg-input border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Niche</label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-input border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="fitness">Fitness</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="tech">Tech</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="food">Food</option>
                  <option value="travel">Travel</option>
                  <option value="gaming">Gaming</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'reel' | 'video' | 'story')}
                  className="w-full bg-input border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="reel">Reel (Short-form)</option>
                  <option value="video">Video (Long-form)</option>
                  <option value="story">Story</option>
                </select>
              </div>

              <button
                onClick={getBenchmark}
                disabled={isLoadingBenchmark || !videoId.trim()}
                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isLoadingBenchmark ? 'Loading...' : 'Compare with Benchmark'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {benchmarkResult ? (
              <div className="space-y-6">
                <BenchmarkOverlay
                  comparison={benchmarkResult}
                  isLoading={isLoadingBenchmark}
                />
                
                {retentionResult && (
                  <RetentionCurveChart
                    points={retentionResult.points}
                    benchmarkPoints={benchmarkResult.benchmark.points as RetentionPoint[]}
                    showBenchmark={true}
                    videoTitle={retentionResult.videoTitle || videoTitle}
                    isLoading={isLoadingBenchmark}
                  />
                )}
              </div>
            ) : (
              <div className="bg-third rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">📈</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Benchmark Data</h3>
                <p className="text-gray-400">
                  Select your niche and format, then click "Compare with Benchmark"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="bg-third rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Compare Videos</h3>
            
            <div className="space-y-4">
              {compareVideoIds.map((id, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => updateCompareVideoId(index, e.target.value)}
                    placeholder={`Video ${index + 1} ID`}
                    className="flex-1 bg-input border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  {compareVideoIds.length > 2 && (
                    <button
                      onClick={() => removeCompareVideo(index)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {compareVideoIds.length < 3 && (
                <button
                  onClick={addCompareVideo}
                  className="w-full py-2 border border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-purple-500 hover:text-purple-400 transition-colors"
                >
                  + Add Video (max 3)
                </button>
              )}

              <button
                onClick={compareVideos}
                disabled={isLoadingComparison || compareVideoIds.filter(id => id.trim()).length < 2}
                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isLoadingComparison ? 'Comparing...' : 'Compare Videos'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {comparisonResult ? (
              <VideoComparisonView
                comparison={comparisonResult}
                isLoading={isLoadingComparison}
              />
            ) : (
              <div className="bg-third rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">🔄</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Comparison Data</h3>
                <p className="text-gray-400">
                  Enter 2-3 video IDs and click "Compare Videos" to see side-by-side analysis
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
