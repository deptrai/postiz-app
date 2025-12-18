'use client';

import React from 'react';
import clsx from 'clsx';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { HookOpeningType, HookScoreBreakdown } from './hook-analysis-card';

interface RankedHook {
  hookId: string;
  score: number;
  rank: number;
  openingType: HookOpeningType;
  breakdown: HookScoreBreakdown;
  hookText?: string;
}

interface HookComparisonProps {
  rankings: RankedHook[];
  isLoading?: boolean;
}

const OPENING_TYPE_EMOJI: Record<HookOpeningType, string> = {
  question: '❓',
  statement: '💬',
  action: '🎬',
  curiosity: '🔮',
  problem: '🎯',
  unknown: '❔',
};

function getRankBadgeStyle(rank: number): string {
  switch (rank) {
    case 1:
      return 'bg-yellow-500 text-black';
    case 2:
      return 'bg-gray-300 text-black';
    case 3:
      return 'bg-orange-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

export function HookComparison({ rankings, isLoading = false }: HookComparisonProps) {
  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!rankings || rankings.length === 0) {
    return (
      <div className="bg-third rounded-xl p-6 text-center">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-400">Add at least 2 hooks to compare</p>
      </div>
    );
  }

  return (
    <div className="bg-third rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-semibold">Hook Comparison</h3>
        <span className="text-sm text-gray-400">({rankings.length} hooks)</span>
      </div>

      {/* Rankings */}
      <div className="space-y-3">
        {rankings.map((hook) => (
          <div
            key={hook.hookId}
            className={clsx(
              'flex items-center gap-4 p-4 rounded-lg border transition-all',
              hook.rank === 1
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-input border-gray-700'
            )}
          >
            {/* Rank Badge */}
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                getRankBadgeStyle(hook.rank)
              )}
            >
              {hook.rank}
            </div>

            {/* Hook Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{OPENING_TYPE_EMOJI[hook.openingType]}</span>
                <span className="text-sm text-gray-400 capitalize">{hook.openingType} hook</span>
              </div>
              {hook.hookText && (
                <p className="text-sm text-gray-300 truncate">{hook.hookText}</p>
              )}
            </div>

            {/* Score Breakdown Mini */}
            <div className="hidden md:flex items-center gap-4 text-xs">
              <div className="text-center">
                <div className="text-gray-500">Opening</div>
                <div className={getScoreColor(hook.breakdown.openingType)}>
                  {hook.breakdown.openingType}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Pacing</div>
                <div className={getScoreColor(hook.breakdown.pacing)}>
                  {hook.breakdown.pacing}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Visual</div>
                <div className={getScoreColor(hook.breakdown.visualImpact)}>
                  {hook.breakdown.visualImpact}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Audio</div>
                <div className={getScoreColor(hook.breakdown.audioHook)}>
                  {hook.breakdown.audioHook}
                </div>
              </div>
            </div>

            {/* Overall Score */}
            <div className="text-right">
              <div className={clsx('text-2xl font-bold', getScoreColor(hook.score))}>
                {hook.score}
              </div>
              <div className="text-xs text-gray-500">/100</div>
            </div>
          </div>
        ))}
      </div>

      {/* Winner Highlight */}
      {rankings.length >= 2 && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-green-400 text-sm">
            <strong>Best hook:</strong> #{rankings[0].hookId} with {rankings[0].score}% effectiveness
          </span>
        </div>
      )}
    </div>
  );
}

export default HookComparison;
