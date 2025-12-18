'use client';

import React, { useState } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface BenchmarkPoint {
  percentage: number;
  retention: number;
  viewersCount: number;
}

export interface BenchmarkComparison {
  videoRetention: {
    averageRetention: number;
    completionRate: number;
  };
  benchmark: {
    niche: string;
    format: 'reel' | 'video' | 'story';
    points: BenchmarkPoint[];
    averageRetention: number;
  };
  deviation: number;
  performance: 'above' | 'at' | 'below';
}

export interface BenchmarkOverlayProps {
  comparison: BenchmarkComparison;
  isLoading?: boolean;
}

function getPerformanceColor(performance: 'above' | 'at' | 'below'): string {
  switch (performance) {
    case 'above':
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'at':
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'below':
      return 'text-red-400 bg-red-500/20 border-red-500/30';
  }
}

function getPerformanceIcon(performance: 'above' | 'at' | 'below'): string {
  switch (performance) {
    case 'above':
      return '🎯';
    case 'at':
      return '✅';
    case 'below':
      return '📊';
  }
}

function getPerformanceMessage(performance: 'above' | 'at' | 'below', deviation: number): string {
  switch (performance) {
    case 'above':
      return `Excellent! Your video performs ${Math.abs(deviation).toFixed(1)}% above the industry benchmark.`;
    case 'at':
      return `Your video matches the industry benchmark (within ±5%).`;
    case 'below':
      return `Your video is ${Math.abs(deviation).toFixed(1)}% below the industry benchmark. Check suggestions for improvements.`;
  }
}

export function BenchmarkOverlay({
  comparison,
  isLoading = false,
}: BenchmarkOverlayProps) {
  const t = useT();
  const [showDetails, setShowDetails] = useState(true);

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-third rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t('benchmark')}
          </h3>
          <p className="text-sm text-gray-400 capitalize">
            {comparison.benchmark.niche} · {comparison.benchmark.format}
          </p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className={`w-5 h-5 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Performance Badge */}
      <div className={`border rounded-lg p-4 mb-4 ${getPerformanceColor(comparison.performance)}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getPerformanceIcon(comparison.performance)}</span>
          <div className="flex-1">
            <p className="font-semibold capitalize mb-1">
              Performance: {comparison.performance === 'above' ? 'Above' : comparison.performance === 'at' ? 'At' : 'Below'} Benchmark
            </p>
            <p className="text-sm opacity-90">
              {getPerformanceMessage(comparison.performance, comparison.deviation)}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Comparison */}
      {showDetails && (
        <div className="space-y-4">
          {/* Average Retention Comparison */}
          <div className="bg-input/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Average Retention</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Your Video</p>
                <p className="text-2xl font-bold text-purple-400">
                  {comparison.videoRetention.averageRetention.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Industry Avg</p>
                <p className="text-2xl font-bold text-green-400">
                  {comparison.benchmark.averageRetention.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Visual Bar Comparison */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all"
                    style={{ width: `${comparison.videoRetention.averageRetention}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">You</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-500 h-full rounded-full transition-all"
                    style={{ width: `${comparison.benchmark.averageRetention}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">Avg</span>
              </div>
            </div>
          </div>

          {/* Deviation Breakdown */}
          <div className="bg-input/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Deviation Breakdown</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Difference</p>
                <p className={`text-xl font-bold ${comparison.deviation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {comparison.deviation >= 0 ? '+' : ''}{comparison.deviation.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4b5563"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={comparison.deviation >= 0 ? '#10b981' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray={`${Math.abs(comparison.deviation)}, 100`}
                  />
                </svg>
                <p className="text-xs text-gray-400 mt-1">Deviation</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">Your Rank</p>
                <p className="text-xl font-bold text-white">
                  {comparison.performance === 'above' ? 'Top 25%' : comparison.performance === 'at' ? 'Top 50%' : 'Bottom 50%'}
                </p>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-input/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Insights</h4>
            <ul className="space-y-2">
              {comparison.performance === 'above' && (
                <>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Your content resonates well with your audience</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Analyze what works and replicate it in future videos</span>
                  </li>
                </>
              )}
              {comparison.performance === 'at' && (
                <>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>You're performing at industry standard</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Small improvements can push you above average</span>
                  </li>
                </>
              )}
              {comparison.performance === 'below' && (
                <>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Review retention suggestions for specific improvements</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Focus on hook strength and content pacing</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
