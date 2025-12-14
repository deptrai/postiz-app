'use client';

import { FC } from 'react';
import dayjs from 'dayjs';
import { TopContentItem } from '@gitroom/frontend/hooks/use-top-content';

export interface TopContentListProps {
  items: TopContentItem[];
  loading?: boolean;
}

export const TopContentList: FC<TopContentListProps> = ({ items, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-newBgColorInner p-6 rounded-lg">
        <div className="flex items-center justify-center h-[200px]">
          <div className="text-textColor/60">Loading top content...</div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-newBgColorInner p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Top Performing Content</h3>
        <div className="flex items-center justify-center h-[200px]">
          <div className="text-center text-textColor/60">
            <p>No content found for the selected filters.</p>
            <p className="text-sm mt-2">Try adjusting your date range or filters.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-newBgColorInner p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Top Performing Content</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="bg-boxBg p-4 rounded-lg hover:bg-forth transition-all"
          >
            <div className="flex items-start gap-4">
              {/* Rank Badge */}
              <div className="flex-shrink-0 w-10 h-10 bg-customColor10/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-customColor10">#{index + 1}</span>
              </div>

              {/* Content Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2 py-1 bg-customColor10/20 text-customColor10 rounded">
                    {item.contentType.toUpperCase()}
                  </span>
                  <span className="text-xs text-textColor/60">
                    {dayjs(item.publishedAt).format('MMM D, YYYY')}
                  </span>
                </div>
                
                {item.caption && (
                  <p className="text-sm text-textColor line-clamp-2 mb-3">
                    {item.caption}
                  </p>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-textColor/60">Reach</p>
                    <p className="text-sm font-semibold text-textColor">
                      {item.totalReach.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-textColor/60">Engagement</p>
                    <p className="text-sm font-semibold text-textColor">
                      {item.totalEngagement.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-textColor/60">Eng. Rate</p>
                    <p className="text-sm font-semibold text-customColor10">
                      {item.engagementRate.toFixed(2)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-textColor/60">Breakdown</p>
                    <p className="text-xs text-textColor/60">
                      {item.reactions}❤️ {item.comments}💬 {item.shares}🔁
                    </p>
                  </div>
                </div>

                {item.videoViews > 0 && (
                  <div className="mt-2 pt-2 border-t border-fifth">
                    <p className="text-xs text-textColor/60">
                      Video Views: <span className="font-semibold">{item.videoViews.toLocaleString()}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
