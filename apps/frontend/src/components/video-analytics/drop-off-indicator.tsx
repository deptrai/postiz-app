'use client';

import React from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface DropOffPoint {
  percentage: number;
  dropAmount: number;
  severity: 'low' | 'medium' | 'high';
  viewerLoss: number;
}

export interface DropOffIndicatorProps {
  dropOffPoints: DropOffPoint[];
  totalViewers: number;
  isLoading?: boolean;
  onDropOffClick?: (dropOff: DropOffPoint) => void;
}

function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return 'bg-red-500/20 border-red-500/30 text-red-400';
    case 'medium':
      return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
    case 'low':
      return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
  }
}

function getSeverityIcon(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return '⚠️';
    case 'medium':
      return '⚡';
    case 'low':
      return '📉';
  }
}

export function DropOffIndicator({
  dropOffPoints,
  totalViewers,
  isLoading = false,
  onDropOffClick,
}: DropOffIndicatorProps) {
  const t = useT();
  
  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (dropOffPoints.length === 0) {
    return (
      <div className="bg-third rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          No Significant Drop-offs
        </h3>
        <p className="text-gray-400">
          Great news! Your video maintains smooth retention with no major drop-off points ({'>'} 10% loss).
        </p>
      </div>
    );
  }

  return (
    <div className="bg-third rounded-xl p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {t('drop_off_indicator')}
        </h3>
        <p className="text-sm text-gray-400">
          {dropOffPoints.length} {t('major_drop_off')}
        </p>
      </div>

      {/* Drop-off List */}
      <div className="space-y-3">
        {dropOffPoints.map((dropOff, index) => (
          <div
            key={`dropoff-${index}`}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:scale-[1.02] ${getSeverityColor(dropOff.severity)}`}
            onClick={() => onDropOffClick?.(dropOff)}
          >
            {/* Drop-off Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getSeverityIcon(dropOff.severity)}</span>
                <div>
                  <p className="font-semibold">
                    {dropOff.percentage}% Mark
                  </p>
                  <p className="text-xs opacity-75 capitalize">
                    {dropOff.severity} severity
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  -{dropOff.dropAmount.toFixed(1)}%
                </p>
                <p className="text-xs opacity-75">retention loss</p>
              </div>
            </div>

            {/* Drop-off Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-current/20">
              <div>
                <p className="text-xs opacity-75">Viewers Lost</p>
                <p className="font-medium">{dropOff.viewerLoss.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-75">Of Total Viewers</p>
                <p className="font-medium">
                  {((dropOff.viewerLoss / totalViewers) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Insights */}
            <div className="mt-3 pt-3 border-t border-current/20">
              <p className="text-xs opacity-90">
                {dropOff.percentage <= 10 && '🎯 Early drop suggests weak hook or misleading thumbnail'}
                {dropOff.percentage > 10 && dropOff.percentage <= 30 && '📝 Content may not deliver on promise made in intro'}
                {dropOff.percentage > 30 && dropOff.percentage <= 60 && '⏱️ Pacing issues or content drag detected'}
                {dropOff.percentage > 60 && '📏 Video may be too long for target audience'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 p-4 bg-input/30 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Impact Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400">Total Viewer Loss</p>
            <p className="text-lg font-semibold text-white">
              {dropOffPoints.reduce((sum, d) => sum + d.viewerLoss, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Avg Drop Size</p>
            <p className="text-lg font-semibold text-white">
              {(dropOffPoints.reduce((sum, d) => sum + d.dropAmount, 0) / dropOffPoints.length).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
