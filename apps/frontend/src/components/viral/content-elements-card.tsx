'use client';

import React, { useState } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

// Types matching backend
export type CaptionTone = 'casual' | 'professional' | 'humorous' | 'educational' | 'inspirational';
export type CaptionLength = 'short' | 'medium' | 'long';
export type CTAType = 'engagement' | 'action' | 'save' | 'share' | 'none';
export type ContentFormat = 'reel' | 'video' | 'post' | 'story';

export interface CaptionAnalysis {
  length: number;
  lengthCategory: CaptionLength;
  tone: CaptionTone;
  toneConfidence: number;
  keywords: Array<{ word: string; count: number; importance: number }>;
  emojiUsage: {
    count: number;
    emojis: string[];
    placement: 'start' | 'middle' | 'end' | 'throughout' | 'none';
  };
  readability: number;
  suggestions: string[];
}

export interface HashtagAnalysis {
  count: number;
  optimal: boolean;
  hashtags: Array<{
    tag: string;
    trending: boolean;
    relevanceScore: number;
    reach: 'high' | 'medium' | 'low';
  }>;
  overallScore: number;
  suggestions: string[];
}

export interface FormatAnalysis {
  format: ContentFormat;
  formatScore: number;
  videoLength?: {
    seconds: number;
    optimal: boolean;
    recommendation: string;
  };
  performanceInsights: {
    reachPotential: 'high' | 'medium' | 'low';
    engagementPotential: 'high' | 'medium' | 'low';
    recommendation: string;
  };
  suggestions: string[];
}

export interface CTAAnalysis {
  detected: boolean;
  types: Array<{
    type: CTAType;
    text: string;
    effectiveness: number;
    position: 'start' | 'middle' | 'end';
  }>;
  overallEffectiveness: number;
  suggestions: string[];
}

export interface ContentElementsAnalysis {
  contentId?: string;
  caption: CaptionAnalysis;
  hashtags: HashtagAnalysis;
  format: FormatAnalysis;
  cta: CTAAnalysis;
  overallScore: number;
  topStrengths: string[];
  areasToImprove: string[];
}

interface ContentElementsCardProps {
  analysis: ContentElementsAnalysis;
  isLoading?: boolean;
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

export function ContentElementsCard({ analysis, isLoading = false }: ContentElementsCardProps) {
  const t = useT();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-700 rounded mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (!analysis || !analysis.caption || !analysis.hashtags || !analysis.format || !analysis.cta) {
    return (
      <div className="bg-third rounded-xl p-6 text-center">
        <p className="text-gray-400">Invalid analysis data</p>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="bg-third rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Content Elements Analysis
      </h3>

      {/* Overall Score */}
      <div className={`p-4 rounded-lg border mb-6 ${getScoreBgColor(analysis.overallScore)}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Overall Score</span>
          <span className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
            {analysis.overallScore}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs text-gray-500 mb-1">Strengths</h4>
            <ul className="space-y-1">
              {analysis.topStrengths.slice(0, 3).map((strength, i) => (
                <li key={i} className="text-xs text-green-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs text-gray-500 mb-1">To Improve</h4>
            <ul className="space-y-1">
              {analysis.areasToImprove.slice(0, 3).map((area, i) => (
                <li key={i} className="text-xs text-orange-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="space-y-3">
        {/* Caption Section */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('caption')}
            className="w-full flex items-center justify-between p-4 bg-input/30 hover:bg-input/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span className="font-medium">Caption Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${getScoreColor(analysis.caption.readability)}`}>
                {analysis.caption.readability}%
              </span>
              <svg className={`w-4 h-4 transition-transform ${expandedSection === 'caption' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          {expandedSection === 'caption' && (
            <div className="p-4 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-xs text-gray-500">Length</span>
                  <p className="text-sm capitalize">{analysis.caption.lengthCategory} ({analysis.caption.length} chars)</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Tone</span>
                  <p className="text-sm capitalize">{analysis.caption.tone} ({analysis.caption.toneConfidence}%)</p>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-xs text-gray-500">Keywords</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.caption.keywords.slice(0, 5).map((kw, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                      {kw.word}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <span className="text-xs text-gray-500">Emoji Usage</span>
                <p className="text-sm">{analysis.caption.emojiUsage.count} emojis ({analysis.caption.emojiUsage.placement})</p>
              </div>
              {analysis.caption.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <span className="text-xs text-gray-500">Suggestions</span>
                  <ul className="mt-1 space-y-1">
                    {analysis.caption.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-gray-300">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hashtags Section */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('hashtags')}
            className="w-full flex items-center justify-between p-4 bg-input/30 hover:bg-input/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <span className="font-medium">Hashtag Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${analysis.hashtags.optimal ? 'text-green-400' : 'text-yellow-400'}`}>
                {analysis.hashtags.count} tags
              </span>
              <svg className={`w-4 h-4 transition-transform ${expandedSection === 'hashtags' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          {expandedSection === 'hashtags' && (
            <div className="p-4 border-t border-gray-700">
              <div className="flex flex-wrap gap-2 mb-4">
                {analysis.hashtags.hashtags.map((h, i) => (
                  <div key={i} className={`px-2 py-1 rounded text-xs ${h.trending ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
                    #{h.tag}
                    {h.trending && <span className="ml-1">🔥</span>}
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                Overall Score: <span className={getScoreColor(analysis.hashtags.overallScore)}>{analysis.hashtags.overallScore}</span>
              </div>
              {analysis.hashtags.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <span className="text-xs text-gray-500">Suggestions</span>
                  <ul className="mt-1 space-y-1">
                    {analysis.hashtags.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-gray-300">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Format Section */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('format')}
            className="w-full flex items-center justify-between p-4 bg-input/30 hover:bg-input/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Format Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${getScoreColor(analysis.format.formatScore)}`}>
                {analysis.format.formatScore}
              </span>
              <svg className={`w-4 h-4 transition-transform ${expandedSection === 'format' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          {expandedSection === 'format' && (
            <div className="p-4 border-t border-gray-700">
              <div className="mb-4">
                <span className="text-xs text-gray-500">Format</span>
                <p className="text-sm capitalize">{analysis.format.format}</p>
              </div>
              {analysis.format.videoLength && (
                <div className="mb-4">
                  <span className="text-xs text-gray-500">Video Length</span>
                  <p className="text-sm">
                    {analysis.format.videoLength.seconds}s
                    {analysis.format.videoLength.optimal ? (
                      <span className="ml-2 text-green-400">✓ Optimal</span>
                    ) : (
                      <span className="ml-2 text-yellow-400">⚠ {analysis.format.videoLength.recommendation}</span>
                    )}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-xs text-gray-500">Reach Potential</span>
                  <p className={`text-sm capitalize ${getPotentialColor(analysis.format.performanceInsights.reachPotential)}`}>
                    {analysis.format.performanceInsights.reachPotential}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Engagement Potential</span>
                  <p className={`text-sm capitalize ${getPotentialColor(analysis.format.performanceInsights.engagementPotential)}`}>
                    {analysis.format.performanceInsights.engagementPotential}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400">{analysis.format.performanceInsights.recommendation}</p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('cta')}
            className="w-full flex items-center justify-between p-4 bg-input/30 hover:bg-input/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <span className="font-medium">CTA Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${analysis.cta.detected ? getScoreColor(analysis.cta.overallEffectiveness) : 'text-red-400'}`}>
                {analysis.cta.detected ? `${analysis.cta.overallEffectiveness}%` : 'None'}
              </span>
              <svg className={`w-4 h-4 transition-transform ${expandedSection === 'cta' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          {expandedSection === 'cta' && (
            <div className="p-4 border-t border-gray-700">
              {analysis.cta.detected ? (
                <>
                  <div className="space-y-2 mb-4">
                    {analysis.cta.types.map((cta, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-input/30 rounded">
                        <div>
                          <span className="text-sm capitalize">{cta.type}</span>
                          <span className="text-xs text-gray-500 ml-2">({cta.position})</span>
                        </div>
                        <span className={`text-sm ${getScoreColor(cta.effectiveness)}`}>
                          {cta.effectiveness}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400">No CTA detected</p>
              )}
              {analysis.cta.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <span className="text-xs text-gray-500">Suggestions</span>
                  <ul className="mt-1 space-y-1">
                    {analysis.cta.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-gray-300">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContentElementsCard;
