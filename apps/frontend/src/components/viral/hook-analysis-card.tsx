'use client';

import React from 'react';
import clsx from 'clsx';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

// Types matching backend
export type HookOpeningType = 'question' | 'statement' | 'action' | 'curiosity' | 'problem' | 'unknown';

export interface HookScoreBreakdown {
  openingType: number;
  pacing: number;
  visualImpact: number;
  audioHook: number;
}

export interface HookRecommendation {
  factor: keyof HookScoreBreakdown;
  currentScore: number;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  potentialGain: number;
}

export interface HookPattern {
  type: HookOpeningType;
  name: string;
  description: string;
  example: string;
  successRate: number;
  bestFor: string[];
}

interface HookAnalysisCardProps {
  effectivenessScore: number;
  openingType: HookOpeningType;
  breakdown: HookScoreBreakdown;
  interpretation: string;
  isLoading?: boolean;
}

const FACTOR_LABELS: Record<keyof HookScoreBreakdown, { label: string; weight: string }> = {
  openingType: { label: 'Opening Type', weight: '30%' },
  pacing: { label: 'Pacing', weight: '25%' },
  visualImpact: { label: 'Visual Impact', weight: '25%' },
  audioHook: { label: 'Audio Hook', weight: '20%' },
};

const OPENING_TYPE_INFO: Record<HookOpeningType, { label: string; emoji: string; color: string }> = {
  question: { label: 'Question Hook', emoji: '❓', color: 'text-blue-400' },
  statement: { label: 'Bold Statement', emoji: '💬', color: 'text-purple-400' },
  action: { label: 'Action Hook', emoji: '🎬', color: 'text-green-400' },
  curiosity: { label: 'Curiosity Hook', emoji: '🔮', color: 'text-yellow-400' },
  problem: { label: 'Problem Hook', emoji: '🎯', color: 'text-red-400' },
  unknown: { label: 'Unknown Type', emoji: '❔', color: 'text-gray-400' },
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return 'stroke-green-400';
  if (score >= 60) return 'stroke-yellow-400';
  if (score >= 40) return 'stroke-orange-400';
  return 'stroke-red-400';
}

function getProgressBarColor(score: number): string {
  if (score >= 80) return 'bg-green-400';
  if (score >= 60) return 'bg-yellow-400';
  if (score >= 40) return 'bg-orange-400';
  return 'bg-red-400';
}

export function HookAnalysisCard({
  effectivenessScore,
  openingType,
  breakdown,
  interpretation,
  isLoading = false,
}: HookAnalysisCardProps) {
  const t = useT();
  const openingInfo = OPENING_TYPE_INFO[openingType];

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="flex items-start gap-6">
          <div className="w-32 h-32 bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-700 rounded w-1/3" />
            <div className="h-4 bg-gray-700 rounded w-1/2" />
            <div className="space-y-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-3 bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (effectivenessScore / 100) * circumference;

  return (
    <div className="bg-third rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-semibold">Hook Analysis</h3>
      </div>

      <div className="flex items-start gap-6">
        {/* Score Ring */}
        <div className="relative flex-shrink-0">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-700"
            />
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={getScoreRingColor(effectivenessScore)}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transition: 'stroke-dashoffset 0.5s ease-in-out',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={clsx('text-3xl font-bold', getScoreColor(effectivenessScore))}>
              {effectivenessScore}
            </span>
            <span className="text-xs text-gray-400">/100</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1">
          {/* Opening Type Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{openingInfo.emoji}</span>
            <span className={clsx('font-medium', openingInfo.color)}>{openingInfo.label}</span>
          </div>

          {/* Interpretation */}
          <div className="mb-4">
            <span className={clsx(
              'inline-block px-3 py-1 rounded-full text-sm',
              effectivenessScore >= 80 ? 'bg-green-500/20 text-green-400' :
              effectivenessScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
              effectivenessScore >= 40 ? 'bg-orange-500/20 text-orange-400' :
              'bg-red-500/20 text-red-400'
            )}>
              {interpretation}
            </span>
          </div>

          {/* Breakdown */}
          <h4 className="text-sm font-medium text-gray-400 mb-2">Score Breakdown</h4>
          <div className="space-y-2">
            {(Object.keys(breakdown) as Array<keyof HookScoreBreakdown>).map((factor) => {
              const score = breakdown[factor];
              const { label, weight } = FACTOR_LABELS[factor];

              return (
                <div key={factor} className="flex items-center gap-3">
                  <span className="text-sm text-gray-300 w-28">{label}</span>
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full transition-all duration-500', getProgressBarColor(score))}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-10">({weight})</span>
                  <span className={clsx('text-sm font-medium w-8 text-right', getScoreColor(score))}>
                    {score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HookAnalysisCard;
