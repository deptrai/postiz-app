'use client';

import React from 'react';
import { HashtagAnalysis as HashtagAnalysisType } from './content-elements-card';

interface HashtagAnalysisProps {
  analysis: HashtagAnalysisType;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function getReachBadge(reach: 'high' | 'medium' | 'low'): { bg: string; text: string } {
  switch (reach) {
    case 'high': return { bg: 'bg-green-500/20', text: 'text-green-400' };
    case 'medium': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400' };
    case 'low': return { bg: 'bg-gray-700', text: 'text-gray-400' };
  }
}

export function HashtagAnalysis({ analysis }: HashtagAnalysisProps) {
  const trendingCount = analysis.hashtags.filter(h => h.trending).length;
  const highReachCount = analysis.hashtags.filter(h => h.reach === 'high').length;
  const lowReachCount = analysis.hashtags.filter(h => h.reach === 'low').length;

  return (
    <div className="bg-third rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
        Hashtag Analysis
      </h3>

      {/* Overall Score */}
      <div className="mb-6 p-4 bg-input/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-400">Overall Score</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}
              </span>
              <span className="text-xs text-gray-500">/100</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-lg font-semibold ${analysis.optimal ? 'text-green-400' : 'text-yellow-400'}`}>
              {analysis.count} hashtags
            </span>
            <p className="text-xs text-gray-500">
              {analysis.optimal ? 'Optimal range ✓' : 'Recommended: 5-15'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 bg-input/30 rounded-lg text-center">
          <span className="text-2xl font-bold text-green-400">{trendingCount}</span>
          <p className="text-xs text-gray-500">Trending</p>
        </div>
        <div className="p-3 bg-input/30 rounded-lg text-center">
          <span className="text-2xl font-bold text-blue-400">{highReachCount}</span>
          <p className="text-xs text-gray-500">High Reach</p>
        </div>
        <div className="p-3 bg-input/30 rounded-lg text-center">
          <span className="text-2xl font-bold text-gray-400">{lowReachCount}</span>
          <p className="text-xs text-gray-500">Niche</p>
        </div>
      </div>

      {/* Hashtag List */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Hashtags</h4>
        <div className="space-y-2">
          {analysis.hashtags.map((h, i) => {
            const reachStyle = getReachBadge(h.reach);
            return (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-input/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">#{h.tag}</span>
                  {h.trending && (
                    <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                      🔥 Trending
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 ${reachStyle.bg} ${reachStyle.text} text-xs rounded capitalize`}>
                    {h.reach} reach
                  </span>
                  <span className={`text-sm font-medium ${getScoreColor(h.relevanceScore)}`}>
                    {h.relevanceScore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mix Recommendation */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h4 className="text-sm font-medium text-blue-400 mb-2">💡 Optimal Mix</h4>
        <p className="text-xs text-gray-300">
          For best results, use a mix of high-reach (2-3), medium-reach (3-5), and niche hashtags (5-7).
          Include 1-2 trending hashtags when relevant.
        </p>
      </div>

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Suggestions</h4>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <svg className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default HashtagAnalysis;
