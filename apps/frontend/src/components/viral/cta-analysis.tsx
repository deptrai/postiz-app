'use client';

import React from 'react';
import { CTAAnalysis as CTAAnalysisType, CTAType } from './content-elements-card';

interface CTAAnalysisProps {
  analysis: CTAAnalysisType;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getCTAIcon(type: CTAType): string {
  switch (type) {
    case 'engagement': return '💬';
    case 'action': return '👆';
    case 'save': return '📌';
    case 'share': return '📤';
    default: return '📝';
  }
}

function getCTADescription(type: CTAType): string {
  switch (type) {
    case 'engagement': return 'Encourages comments and interaction';
    case 'action': return 'Drives clicks and follows';
    case 'save': return 'Prompts users to save content';
    case 'share': return 'Encourages sharing with others';
    default: return '';
  }
}

export function CTAAnalysis({ analysis }: CTAAnalysisProps) {
  return (
    <div className="bg-third rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        Call-to-Action Analysis
      </h3>

      {/* Overall Status */}
      <div className={`mb-6 p-4 rounded-lg border ${
        analysis.detected 
          ? 'bg-green-500/10 border-green-500/20' 
          : 'bg-red-500/10 border-red-500/20'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${analysis.detected ? '' : 'opacity-50'}`}>
              {analysis.detected ? '✅' : '❌'}
            </span>
            <div>
              <span className={`font-semibold ${analysis.detected ? 'text-green-400' : 'text-red-400'}`}>
                {analysis.detected ? 'CTA Detected' : 'No CTA Detected'}
              </span>
              <p className="text-xs text-gray-400">
                {analysis.detected 
                  ? `${analysis.types.length} call-to-action${analysis.types.length > 1 ? 's' : ''} found`
                  : 'Adding a CTA can significantly boost engagement'
                }
              </p>
            </div>
          </div>
          {analysis.detected && (
            <div className="text-right">
              <span className={`text-2xl font-bold ${getScoreColor(analysis.overallEffectiveness)}`}>
                {analysis.overallEffectiveness}%
              </span>
              <p className="text-xs text-gray-500">effectiveness</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Types */}
      {analysis.detected && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Detected CTAs</h4>
          <div className="space-y-3">
            {analysis.types.map((cta, i) => (
              <div key={i} className="p-4 bg-input/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCTAIcon(cta.type)}</span>
                    <span className="font-medium capitalize">{cta.type}</span>
                    <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded capitalize">
                      {cta.position}
                    </span>
                  </div>
                  <span className={`font-bold ${getScoreColor(cta.effectiveness)}`}>
                    {cta.effectiveness}%
                  </span>
                </div>
                <p className="text-sm text-gray-400 italic mb-2">"{cta.text}"</p>
                <p className="text-xs text-gray-500">{getCTADescription(cta.type)}</p>
                <div className="mt-2">
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getScoreBgColor(cta.effectiveness)}`}
                      style={{ width: `${cta.effectiveness}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Types Reference */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">CTA Types & Effectiveness</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { type: 'engagement', effectiveness: 85, example: '"Comment below!"' },
            { type: 'save', effectiveness: 78, example: '"Save for later!"' },
            { type: 'share', effectiveness: 72, example: '"Tag a friend!"' },
            { type: 'action', effectiveness: 65, example: '"Click link in bio!"' },
          ].map((item, i) => (
            <div key={i} className="p-3 bg-input/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span>{getCTAIcon(item.type as CTAType)}</span>
                <span className="text-sm font-medium capitalize">{item.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{item.example}</span>
                <span className={`text-xs font-medium ${getScoreColor(item.effectiveness)}`}>
                  {item.effectiveness}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">💡 Suggestions</h4>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <svg className="w-4 h-4 mt-0.5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default CTAAnalysis;
