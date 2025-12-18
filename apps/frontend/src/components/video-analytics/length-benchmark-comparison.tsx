'use client';

import React from 'react';

export type VideoFormat = 'reel' | 'video' | 'story';

export interface LengthBenchmark {
  niche: string;
  format: VideoFormat;
  industryOptimal: { min: number; max: number };
  industryOptimalLabel: string;
  userOptimal: { min: number; max: number };
  userOptimalLabel: string;
  deviation: number;
  performance: 'above' | 'at' | 'below';
  insights: string[];
}

export interface LengthBenchmarkComparisonProps {
  benchmark: LengthBenchmark;
  isLoading?: boolean;
}

function getPerformanceInfo(performance: 'above' | 'at' | 'below'): {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
} {
  switch (performance) {
    case 'above':
      return {
        icon: '📈',
        label: 'Above Industry',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20 border-blue-500/30',
      };
    case 'at':
      return {
        icon: '✅',
        label: 'At Industry Standard',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20 border-green-500/30',
      };
    case 'below':
      return {
        icon: '📉',
        label: 'Below Industry',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20 border-orange-500/30',
      };
  }
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

export function LengthBenchmarkComparison({
  benchmark,
  isLoading = false,
}: LengthBenchmarkComparisonProps) {
  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/2 mb-4" />
        <div className="h-32 bg-gray-700 rounded mb-4" />
        <div className="h-20 bg-gray-700 rounded" />
      </div>
    );
  }

  const performanceInfo = getPerformanceInfo(benchmark.performance);

  return (
    <div className="bg-third rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Industry Benchmark</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 uppercase bg-gray-700 px-2 py-1 rounded">
            {benchmark.niche}
          </span>
          <span className="text-xs text-gray-400 uppercase bg-gray-700 px-2 py-1 rounded">
            {benchmark.format}
          </span>
        </div>
      </div>

      <div className={`rounded-lg p-4 mb-4 border ${performanceInfo.bgColor}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{performanceInfo.icon}</span>
          <div>
            <p className={`font-semibold ${performanceInfo.color}`}>
              {performanceInfo.label}
            </p>
            <p className="text-sm text-gray-400">
              {benchmark.deviation > 0 ? '+' : ''}{benchmark.deviation}% from benchmark
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏢</span>
            <span className="text-sm text-gray-400">Industry Optimal</span>
          </div>
          <p className="text-xl font-bold text-white">
            {formatSeconds(benchmark.industryOptimal.min)} - {formatSeconds(benchmark.industryOptimal.max)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{benchmark.industryOptimalLabel}</p>
        </div>

        <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">👤</span>
            <span className="text-sm text-gray-400">Your Optimal</span>
          </div>
          <p className="text-xl font-bold text-white">
            {formatSeconds(benchmark.userOptimal.min)} - {formatSeconds(benchmark.userOptimal.max)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{benchmark.userOptimalLabel}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Length Comparison</span>
        </div>
        <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-gray-600 opacity-50"
            style={{
              left: `${(benchmark.industryOptimal.min / 300) * 100}%`,
              width: `${((benchmark.industryOptimal.max - benchmark.industryOptimal.min) / 300) * 100}%`,
            }}
          />
          <div
            className="absolute h-full bg-purple-500"
            style={{
              left: `${(benchmark.userOptimal.min / 300) * 100}%`,
              width: `${((benchmark.userOptimal.max - benchmark.userOptimal.min) / 300) * 100}%`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-white">
            <span>0s</span>
            <span>5m</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-600 rounded" />
            <span className="text-gray-400">Industry</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            <span className="text-gray-400">Your Optimal</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-300">Insights</p>
        {benchmark.insights.map((insight, index) => (
          <div
            key={index}
            className="flex items-start gap-2 text-sm text-gray-400"
          >
            <span className="text-purple-400 mt-0.5">•</span>
            <span>{insight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
