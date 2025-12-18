'use client';

import React, { FC } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface QualityContentItem {
  contentId: string;
  externalContentId: string;
  contentType: string;
  caption: string | null;
  publishedAt: string;
  integrationId: string;
  overallScore: number;
  engagementScore: number;
  interpretation: string;
}

export interface QualityContentListProps {
  items: QualityContentItem[];
  total: number;
  isLoading?: boolean;
  onItemClick?: (contentId: string) => void;
  sortBy?: 'score' | 'date' | 'engagement';
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: 'score' | 'date' | 'engagement', sortOrder: 'asc' | 'desc') => void;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500/20';
  if (score >= 60) return 'bg-yellow-500/20';
  if (score >= 40) return 'bg-orange-500/20';
  return 'bg-red-500/20';
};

const getContentTypeIcon = (type: string): React.ReactNode => {
  switch (type) {
    case 'reel':
    case 'video':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    case 'post':
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      );
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const truncateCaption = (caption: string | null, maxLength: number = 60): string => {
  if (!caption) return 'No caption';
  if (caption.length <= maxLength) return caption;
  return caption.substring(0, maxLength) + '...';
};

export const QualityContentList: FC<QualityContentListProps> = ({
  items,
  total,
  isLoading = false,
  onItemClick,
  sortBy = 'score',
  sortOrder = 'desc',
  onSortChange,
}) => {
  const t = useT();

  const handleSort = (newSortBy: 'score' | 'date' | 'engagement') => {
    if (onSortChange) {
      const newOrder = sortBy === newSortBy && sortOrder === 'desc' ? 'asc' : 'desc';
      onSortChange(newSortBy, newOrder);
    }
  };

  const SortButton: FC<{ field: 'score' | 'date' | 'engagement'; label: string }> = ({
    field,
    label,
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={`px-3 py-1 text-xs rounded-full transition-colors ${
        sortBy === field
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
      }`}
    >
      {label}
      {sortBy === field && (
        <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-third rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          {t('quality.contentList.title', 'Content by Quality')}
          <span className="text-sm text-gray-400 font-normal">({total})</span>
        </h3>
        <div className="flex gap-2">
          <SortButton field="score" label={t('quality.sort.score', 'Score')} />
          <SortButton field="date" label={t('quality.sort.date', 'Date')} />
          <SortButton field="engagement" label={t('quality.sort.engagement', 'Engagement')} />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          {t('quality.contentList.empty', 'No content found')}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.contentId}
              onClick={() => onItemClick?.(item.contentId)}
              className={`p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors ${
                onItemClick ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Score Badge */}
                <div
                  className={`w-12 h-12 rounded-lg ${getScoreBgColor(item.overallScore)} flex items-center justify-center flex-shrink-0`}
                >
                  <span className={`text-lg font-bold ${getScoreColor(item.overallScore)}`}>
                    {item.overallScore}
                  </span>
                </div>

                {/* Content Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-400">
                      {getContentTypeIcon(item.contentType)}
                    </span>
                    <span className="text-sm text-gray-400 capitalize">
                      {item.contentType}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(item.publishedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 truncate">
                    {truncateCaption(item.caption)}
                  </p>
                </div>

                {/* Interpretation Badge */}
                <div className="flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getScoreBgColor(item.overallScore)} ${getScoreColor(item.overallScore)}`}
                  >
                    {item.interpretation}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QualityContentList;
