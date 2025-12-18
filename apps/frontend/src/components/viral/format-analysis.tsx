'use client';

import React from 'react';
import { FormatAnalysis as FormatAnalysisType, ContentFormat } from './content-elements-card';

interface FormatAnalysisProps {
  analysis: FormatAnalysisType;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500/20 border-green-500/30';
  if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
  if (score >= 40) return 'bg-orange-500/20 border-orange-500/30';
  return 'bg-red-500/20 border-red-500/30';
}

function getPotentialColor(potential: 'high' | 'medium' | 'low'): string {
  switch (potential) {
    case 'high': return 'text-green-400';
    case 'medium': return 'text-yellow-400';
    case 'low': return 'text-red-400';
  }
}

function getFormatIcon(format: ContentFormat): React.ReactNode {
  switch (format) {
    case 'reel':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'video':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    case 'post':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'story':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function getFormatDescription(format: ContentFormat): string {
  switch (format) {
    case 'reel': return 'Short-form vertical video with high organic reach';
    case 'video': return 'Long-form content for in-depth engagement';
    case 'post': return 'Image or carousel content for feed';
    case 'story': return 'Ephemeral content for quick engagement';
  }
}

const FORMAT_BENCHMARKS: Record<ContentFormat, { reach: string; engagement: string; optimal: string }> = {
  reel: { reach: 'Highest', engagement: 'High', optimal: '15-30s' },
  video: { reach: 'Medium', engagement: 'High', optimal: '3-10 min' },
  post: { reach: 'Medium', engagement: 'Medium', optimal: '5-10 slides' },
  story: { reach: 'Low', engagement: 'Medium', optimal: '5-7 slides' },
};

export function FormatAnalysis({ analysis }: FormatAnalysisProps) {
  const benchmark = FORMAT_BENCHMARKS[analysis.format];

  return (
    <div className="bg-third rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Format Analysis
      </h3>

      {/* Format Score */}
      <div className={`mb-6 p-4 rounded-lg border ${getScoreBgColor(analysis.formatScore)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-purple-400">
              {getFormatIcon(analysis.format)}
            </div>
            <div>
              <span className="font-semibold capitalize text-lg">{analysis.format}</span>
              <p className="text-xs text-gray-400">{getFormatDescription(analysis.format)}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-bold ${getScoreColor(analysis.formatScore)}`}>
              {analysis.formatScore}
            </span>
            <p className="text-xs text-gray-500">format score</p>
          </div>
        </div>
      </div>

      {/* Video Length (if applicable) */}
      {analysis.videoLength && (
        <div className="mb-6 p-4 bg-input/30 rounded-lg">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Video Length</h4>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">{analysis.videoLength.seconds}s</span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              analysis.videoLength.optimal 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {analysis.videoLength.optimal ? '✓ Optimal' : '⚠ Adjust'}
            </span>
          </div>
          <p className="text-sm text-gray-400">{analysis.videoLength.recommendation}</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>0s</span>
              <span>Optimal: {benchmark.optimal}</span>
              <span>60s+</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 relative">
              <div
                className={`absolute h-2 rounded-full ${
                  analysis.videoLength.optimal ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ 
                  width: `${Math.min(100, (analysis.videoLength.seconds / 60) * 100)}%` 
                }}
              />
              {/* Optimal zone indicator */}
              <div className="absolute h-2 bg-green-500/30 rounded-full" style={{ left: '25%', width: '25%' }} />
            </div>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Performance Insights</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-input/30 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">Reach Potential</span>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold capitalize ${getPotentialColor(analysis.performanceInsights.reachPotential)}`}>
                {analysis.performanceInsights.reachPotential}
              </span>
              <div className="flex gap-0.5">
                {['high', 'medium', 'low'].map((level, i) => (
                  <div
                    key={i}
                    className={`w-2 h-4 rounded-sm ${
                      i <= ['high', 'medium', 'low'].indexOf(analysis.performanceInsights.reachPotential)
                        ? getPotentialColor(analysis.performanceInsights.reachPotential).replace('text-', 'bg-')
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 bg-input/30 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">Engagement Potential</span>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold capitalize ${getPotentialColor(analysis.performanceInsights.engagementPotential)}`}>
                {analysis.performanceInsights.engagementPotential}
              </span>
              <div className="flex gap-0.5">
                {['high', 'medium', 'low'].map((level, i) => (
                  <div
                    key={i}
                    className={`w-2 h-4 rounded-sm ${
                      i <= ['high', 'medium', 'low'].indexOf(analysis.performanceInsights.engagementPotential)
                        ? getPotentialColor(analysis.performanceInsights.engagementPotential).replace('text-', 'bg-')
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-300 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          💡 {analysis.performanceInsights.recommendation}
        </p>
      </div>

      {/* Format Comparison */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Format Comparison</h4>
        <div className="space-y-2">
          {(['reel', 'video', 'post', 'story'] as ContentFormat[]).map((format) => {
            const isActive = format === analysis.format;
            const bm = FORMAT_BENCHMARKS[format];
            return (
              <div
                key={format}
                className={`p-3 rounded-lg flex items-center justify-between ${
                  isActive ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-input/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={isActive ? 'text-purple-400' : 'text-gray-500'}>
                    {getFormatIcon(format)}
                  </div>
                  <span className={`capitalize ${isActive ? 'font-medium text-white' : 'text-gray-400'}`}>
                    {format}
                  </span>
                  {isActive && <span className="text-xs text-purple-400">(current)</span>}
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-gray-500">Reach: <span className="text-gray-300">{bm.reach}</span></span>
                  <span className="text-gray-500">Optimal: <span className="text-gray-300">{bm.optimal}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Suggestions</h4>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <svg className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FormatAnalysis;
