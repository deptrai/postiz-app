import React from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

interface TopVideo {
  contentId: string;
  externalContentId: string;
  contentType: string;
  caption: string | null;
  publishedAt: Date;
  totalViews: number;
  estimatedWatchTimeMinutes: number;
  rank: number;
}

interface TopVideosListProps {
  videos: TopVideo[];
  loading?: boolean;
  limit?: number;
}

export const TopVideosList: React.FC<TopVideosListProps> = ({
  videos,
  loading = false,
  limit = 10,
}) => {
  const t = useT();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'reel':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
          </svg>
        );
      case 'video':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
        );
      case 'story':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.5 11.5c0 2-2.5 3.5-2.5 5h-2c0-1.5-2.5-3-2.5-5C8.5 9.57 10.07 8 12 8s3.5 1.57 3.5 3.5z"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getContentTypeColor = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'reel':
        return 'text-pink-400';
      case 'video':
        return 'text-blue-400';
      case 'story':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (rank === 2) return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
    if (rank === 3) return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
    return 'bg-gray-700/20 text-gray-400 border-gray-700/30';
  };

  if (loading) {
    return (
      <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50">
        <div className="h-6 bg-gray-700 rounded w-48 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-textColor mb-4">
          {t('top_videos_by_watch_time', 'Top Videos by Watch Time')}
        </h3>
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-gray-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-400">
            {t('no_video_data', 'No video data available')}
          </p>
        </div>
      </div>
    );
  }

  const displayVideos = videos.slice(0, limit);

  return (
    <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-textColor">
          {t('top_videos_by_watch_time', 'Top Videos by Watch Time')}
        </h3>
        <div className="text-sm text-gray-400">
          {t('top_n_videos', `Top ${displayVideos.length}`)}
        </div>
      </div>

      {/* Videos List */}
      <div className="space-y-3">
        {displayVideos.map((video) => (
          <div
            key={video.contentId}
            className="bg-newBgColor rounded-lg p-4 border border-gray-700/30 hover:border-gray-600/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Rank Badge */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold ${getRankBadgeColor(
                  video.rank
                )}`}
              >
                {video.rank}
              </div>

              {/* Content Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={getContentTypeColor(video.contentType)}>
                        {getContentTypeIcon(video.contentType)}
                      </div>
                      <span className="text-xs font-medium text-gray-400 uppercase">
                        {video.contentType}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-textColor truncate">
                      {video.caption || t('untitled_video', 'Untitled Video')}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(video.publishedAt)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-bold text-textColor">
                        {formatNumber(video.estimatedWatchTimeMinutes)}
                        <span className="text-xs text-gray-400 ml-1">
                          {t('min', 'min')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('watch_time', 'watch time')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row - Views */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-700/30">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>
                        {formatNumber(video.totalViews)} {t('views', 'views')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      <span className="font-mono text-xs">
                        {video.externalContentId.substring(0, 12)}...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {displayVideos.length < videos.length && (
        <div className="mt-4 pt-4 border-t border-gray-700/50 text-center">
          <p className="text-xs text-gray-500">
            {t('showing_top_n_of_total', `Showing top ${displayVideos.length} of ${videos.length} videos`)}
          </p>
        </div>
      )}
    </div>
  );
};
