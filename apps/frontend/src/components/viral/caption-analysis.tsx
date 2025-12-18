'use client';

import React from 'react';
import { CaptionAnalysis as CaptionAnalysisType } from './content-elements-card';

interface CaptionAnalysisProps {
  analysis: CaptionAnalysisType;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function getToneEmoji(tone: string): string {
  switch (tone) {
    case 'casual': return '😊';
    case 'professional': return '💼';
    case 'humorous': return '😂';
    case 'educational': return '📚';
    case 'inspirational': return '✨';
    default: return '📝';
  }
}

export function CaptionAnalysis({ analysis }: CaptionAnalysisProps) {
  return (
    <div className="bg-third rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        Caption Analysis
      </h3>

      {/* Readability Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Readability</span>
          <span className={`text-2xl font-bold ${getScoreColor(analysis.readability)}`}>
            {analysis.readability}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              analysis.readability >= 80 ? 'bg-green-500' :
              analysis.readability >= 60 ? 'bg-yellow-500' :
              analysis.readability >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${analysis.readability}%` }}
          />
        </div>
      </div>

      {/* Length & Tone */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-input/30 rounded-lg">
          <span className="text-xs text-gray-500 block mb-1">Length</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold capitalize">{analysis.lengthCategory}</span>
            <span className="text-xs text-gray-400">({analysis.length} chars)</span>
          </div>
          <div className="mt-2 flex gap-1">
            <div className={`h-1 flex-1 rounded ${analysis.lengthCategory === 'short' ? 'bg-blue-500' : 'bg-gray-600'}`} />
            <div className={`h-1 flex-1 rounded ${analysis.lengthCategory === 'medium' ? 'bg-blue-500' : 'bg-gray-600'}`} />
            <div className={`h-1 flex-1 rounded ${analysis.lengthCategory === 'long' ? 'bg-blue-500' : 'bg-gray-600'}`} />
          </div>
        </div>
        <div className="p-4 bg-input/30 rounded-lg">
          <span className="text-xs text-gray-500 block mb-1">Tone</span>
          <div className="flex items-center gap-2">
            <span className="text-xl">{getToneEmoji(analysis.tone)}</span>
            <span className="text-lg font-semibold capitalize">{analysis.tone}</span>
          </div>
          <span className="text-xs text-gray-400">{analysis.toneConfidence}% confidence</span>
        </div>
      </div>

      {/* Keywords */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Keywords</h4>
        <div className="flex flex-wrap gap-2">
          {analysis.keywords.map((kw, i) => (
            <div
              key={i}
              className={`px-3 py-1.5 rounded-full text-sm ${
                kw.importance >= 80 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                kw.importance >= 50 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                'bg-gray-700 text-gray-300'
              }`}
            >
              {kw.word}
              {kw.count > 1 && <span className="ml-1 text-xs opacity-60">×{kw.count}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Emoji Usage */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Emoji Usage</h4>
        <div className="p-4 bg-input/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Count</span>
            <span className={`font-semibold ${
              analysis.emojiUsage.count >= 1 && analysis.emojiUsage.count <= 5 ? 'text-green-400' :
              analysis.emojiUsage.count === 0 ? 'text-yellow-400' : 'text-orange-400'
            }`}>
              {analysis.emojiUsage.count}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Placement</span>
            <span className="text-sm capitalize text-gray-300">{analysis.emojiUsage.placement}</span>
          </div>
          {analysis.emojiUsage.emojis.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-xl">
                {analysis.emojiUsage.emojis.slice(0, 10).join(' ')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">💡 Suggestions</h4>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <svg className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default CaptionAnalysis;
