'use client';

import React, { useState } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export type ThumbnailStyle = 'text-heavy' | 'face' | 'action' | 'minimal' | 'before-after' | 'curiosity-gap';

export interface ThumbnailPerformance {
  videoId: string;
  videoTitle: string;
  thumbnailUrl?: string;
  style: ThumbnailStyle;
  impressions: number;
  clicks: number;
  ctr: number;
  publishedAt: Date;
}

export interface ThumbnailPerformanceTableProps {
  thumbnails: ThumbnailPerformance[];
  totalVideos: number;
  avgCtr: number;
  bestPerformer?: ThumbnailPerformance;
  worstPerformer?: ThumbnailPerformance;
  isLoading?: boolean;
  onStyleFilter?: (style: ThumbnailStyle | null) => void;
}

type SortField = 'ctr' | 'impressions' | 'clicks' | 'publishedAt';
type SortDirection = 'asc' | 'desc';

const STYLE_LABELS: Record<ThumbnailStyle, string> = {
  'text-heavy': 'Text-Heavy',
  'face': 'Face + Emotion',
  'action': 'Action Shot',
  'minimal': 'Minimal',
  'before-after': 'Before/After',
  'curiosity-gap': 'Curiosity Gap',
};

const STYLE_COLORS: Record<ThumbnailStyle, string> = {
  'text-heavy': 'bg-blue-500/20 text-blue-400',
  'face': 'bg-green-500/20 text-green-400',
  'action': 'bg-orange-500/20 text-orange-400',
  'minimal': 'bg-gray-500/20 text-gray-400',
  'before-after': 'bg-purple-500/20 text-purple-400',
  'curiosity-gap': 'bg-yellow-500/20 text-yellow-400',
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getCtrColor(ctr: number): string {
  if (ctr >= 10) return 'text-green-400';
  if (ctr >= 5) return 'text-yellow-400';
  return 'text-red-400';
}

export function ThumbnailPerformanceTable({
  thumbnails,
  totalVideos,
  avgCtr,
  bestPerformer,
  worstPerformer,
  isLoading = false,
  onStyleFilter,
}: ThumbnailPerformanceTableProps) {
  const t = useT();
  const [sortField, setSortField] = useState<SortField>('ctr');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedStyle, setSelectedStyle] = useState<ThumbnailStyle | null>(null);

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-64 bg-gray-700 rounded" />
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleStyleFilter = (style: ThumbnailStyle | null) => {
    setSelectedStyle(style);
    onStyleFilter?.(style);
  };

  const sortedThumbnails = [...thumbnails].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'publishedAt') {
      return multiplier * (new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    }
    return multiplier * (a[sortField] - b[sortField]);
  });

  const filteredThumbnails = selectedStyle
    ? sortedThumbnails.filter((t) => t.style === selectedStyle)
    : sortedThumbnails;

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1">
      {sortField === field ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="bg-third rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{t('thumbnail_performance')}</h3>
          <p className="text-sm text-gray-400">
            {totalVideos} {t('videos')} • {t('avg_ctr')}: <span className={getCtrColor(avgCtr)}>{avgCtr}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedStyle || ''}
            onChange={(e) => handleStyleFilter(e.target.value as ThumbnailStyle || null)}
            className="bg-input border border-gray-700 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">{t('all_styles')}</option>
            {Object.entries(STYLE_LABELS).map(([style, label]) => (
              <option key={style} value={style}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {bestPerformer && worstPerformer && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="text-xs text-green-400 mb-1">🏆 {t('best_performer')}</div>
            <div className="text-sm text-white truncate">{bestPerformer.videoTitle}</div>
            <div className="text-lg font-bold text-green-400">{bestPerformer.ctr}% {t('ctr')}</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="text-xs text-red-400 mb-1">📉 {t('needs_improvement')}</div>
            <div className="text-sm text-white truncate">{worstPerformer.videoTitle}</div>
            <div className="text-lg font-bold text-red-400">{worstPerformer.ctr}% CTR</div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">{t('video')}</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">{t('style')}</th>
              <th
                className="text-right py-3 px-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
                onClick={() => handleSort('impressions')}
              >
                {t('impressions')} <SortIcon field="impressions" />
              </th>
              <th
                className="text-right py-3 px-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
                onClick={() => handleSort('clicks')}
              >
                {t('clicks')} <SortIcon field="clicks" />
              </th>
              <th
                className="text-right py-3 px-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
                onClick={() => handleSort('ctr')}
              >
                {t('ctr')} <SortIcon field="ctr" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredThumbnails.slice(0, 10).map((thumbnail) => (
              <tr key={thumbnail.videoId} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    {thumbnail.thumbnailUrl && (
                      <div className="w-16 h-9 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-blue-500/30" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate max-w-[200px]">{thumbnail.videoTitle}</div>
                      <div className="text-xs text-gray-500">{thumbnail.videoId}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded text-xs ${STYLE_COLORS[thumbnail.style]}`}>
                    {STYLE_LABELS[thumbnail.style]}
                  </span>
                </td>
                <td className="py-3 px-2 text-right text-sm text-gray-300">
                  {formatNumber(thumbnail.impressions)}
                </td>
                <td className="py-3 px-2 text-right text-sm text-gray-300">
                  {formatNumber(thumbnail.clicks)}
                </td>
                <td className={`py-3 px-2 text-right text-sm font-medium ${getCtrColor(thumbnail.ctr)}`}>
                  {thumbnail.ctr}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredThumbnails.length > 10 && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing 10 of {filteredThumbnails.length} videos
        </div>
      )}
    </div>
  );
}
