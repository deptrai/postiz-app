'use client';

import React from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export type VideoFormat = 'reel' | 'video' | 'story';

export interface OptimalLengthRecommendation {
  format: VideoFormat;
  optimalRange: string;
  optimalRangeLabel: string;
  sweetSpotSeconds: { min: number; max: number };
  confidenceScore: number;
  reasoning: string;
  userAvgLength: number;
  recommendedAdjustment: 'shorter' | 'longer' | 'optimal';
}

export interface OptimalLengthCardProps {
  recommendation: OptimalLengthRecommendation;
  isLoading?: boolean;
}

function getConfidenceColor(score: number): string {
  if (score >= 80) return 'text-green-400 bg-green-500/20 border-green-500/30';
  if (score >= 50) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
  return 'text-red-400 bg-red-500/20 border-red-500/30';
}

function getAdjustmentInfo(adjustment: 'shorter' | 'longer' | 'optimal'): {
  icon: string;
  text: string;
  color: string;
} {
  switch (adjustment) {
    case 'shorter':
      return {
        icon: '⬇️',
        text: 'Consider making videos shorter',
        color: 'text-orange-400',
      };
    case 'longer':
      return {
        icon: '⬆️',
        text: 'Consider making videos longer',
        color: 'text-blue-400',
      };
    case 'optimal':
      return {
        icon: '✅',
        text: 'Your length is optimal!',
        color: 'text-green-400',
      };
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

export function OptimalLengthCard({
  recommendation,
  isLoading = false,
}: OptimalLengthCardProps) {
  const t = useT();
  
  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/2 mb-4" />
        <div className="h-24 bg-gray-700 rounded mb-4" />
        <div className="h-4 bg-gray-700 rounded w-3/4" />
      </div>
    );
  }

  const adjustmentInfo = getAdjustmentInfo(recommendation.recommendedAdjustment);
  const confidenceClass = getConfidenceColor(recommendation.confidenceScore);

  return (
    <div className="bg-third rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{t('optimal_length')}</h3>
        <span className="text-xs text-gray-400 uppercase">
          {recommendation.format}
        </span>
      </div>

      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-4 mb-4 border border-purple-500/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Sweet Spot</span>
          <span className="text-2xl">🎯</span>
        </div>
        <p className="text-3xl font-bold text-white mb-1">
          {formatDuration(recommendation.sweetSpotSeconds.min)} - {formatDuration(recommendation.sweetSpotSeconds.max)}
        </p>
        <p className="text-sm text-gray-400">{recommendation.optimalRangeLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Your Average</p>
          <p className="text-xl font-semibold text-white">
            {formatDuration(recommendation.userAvgLength)}
          </p>
        </div>
        <div className={`rounded-lg p-3 border ${confidenceClass}`}>
          <p className="text-xs text-gray-400 mb-1">Confidence</p>
          <p className="text-xl font-semibold">
            {recommendation.confidenceScore}%
          </p>
        </div>
      </div>

      <div className={`flex items-center gap-2 mb-4 ${adjustmentInfo.color}`}>
        <span className="text-xl">{adjustmentInfo.icon}</span>
        <span className="font-medium">{adjustmentInfo.text}</span>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-3">
        <p className="text-sm text-gray-300">{recommendation.reasoning}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Optimal Range</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-green-500"
                style={{
                  width: `${Math.min(100, (recommendation.userAvgLength / recommendation.sweetSpotSeconds.max) * 100)}%`,
                }}
              />
            </div>
            <span className="text-gray-400">
              {recommendation.userAvgLength <= recommendation.sweetSpotSeconds.max &&
               recommendation.userAvgLength >= recommendation.sweetSpotSeconds.min
                ? 'In range'
                : 'Out of range'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
