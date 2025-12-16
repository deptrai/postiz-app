'use client';

import { FC, useState, useCallback, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

interface ThemeTrend {
  id: string;
  name: string;
  keywords: string[];
  velocity: number;
  direction: 'rising' | 'stable' | 'falling';
  currentPeriodMetrics: {
    contentCount: number;
    totalReach: number;
    totalEngagement: number;
  };
}

interface TopContent {
  id: string;
  externalContentId: string;
  contentType: string;
  caption: string | null;
  url: string | null;
  totalReach: number;
  totalEngagement: number;
  engagementRate: number;
}

interface ThemeTrendingWidgetProps {
  limit?: number;
  showTopContent?: boolean;
}

export const ThemeTrendingWidget: FC<ThemeTrendingWidgetProps> = ({
  limit = 5,
  showTopContent = true,
}) => {
  const fetch = useFetch();
  const [trends, setTrends] = useState<ThemeTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const loadTrends = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/themes/trending?limit=${limit}`);
      const data = await response.json();
      if (data.success) {
        setTrends(data.trends);
      }
    } catch (err) {
      setError('Failed to load trending themes');
    } finally {
      setIsLoading(false);
    }
  }, [fetch, limit]);

  const loadTopContent = useCallback(async (themeId: string) => {
    setIsLoadingContent(true);
    try {
      const response = await fetch(`/themes/${themeId}/top-content?limit=3`);
      const data = await response.json();
      if (data.success) {
        setTopContent(data.content);
      }
    } catch (err) {
      console.error('Failed to load top content', err);
    } finally {
      setIsLoadingContent(false);
    }
  }, [fetch]);

  const handleExpandTheme = (themeId: string) => {
    if (expandedTheme === themeId) {
      setExpandedTheme(null);
      setTopContent([]);
    } else {
      setExpandedTheme(themeId);
      if (showTopContent) {
        loadTopContent(themeId);
      }
    }
  };

  useEffect(() => {
    loadTrends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'rising':
        return '↑';
      case 'falling':
        return '↓';
      default:
        return '→';
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'rising':
        return 'text-green-500';
      case 'falling':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-newBgColorInner rounded-lg p-4">
        <h3 className="font-semibold text-textColor mb-3">Trending Themes</h3>
        <p className="text-sm text-textColor/60">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-newBgColorInner rounded-lg p-4">
        <h3 className="font-semibold text-textColor mb-3">Trending Themes</h3>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="bg-newBgColorInner rounded-lg p-4">
        <h3 className="font-semibold text-textColor mb-3">Trending Themes</h3>
        <p className="text-sm text-textColor/60">No trending themes yet. Run clustering first.</p>
      </div>
    );
  }

  return (
    <div className="bg-newBgColorInner rounded-lg p-4">
      <h3 className="font-semibold text-textColor mb-3">Trending Themes</h3>
      
      <div className="space-y-2">
        {trends.map((trend) => (
          <div key={trend.id}>
            <div
              className="flex items-center justify-between p-3 bg-newBgColor rounded-lg cursor-pointer hover:bg-newBgColor/80 transition-all"
              onClick={() => handleExpandTheme(trend.id)}
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${getDirectionColor(trend.direction)}`}>
                  {getDirectionIcon(trend.direction)}
                </span>
                <div>
                  <p className="font-medium text-textColor">{trend.name}</p>
                  <div className="flex gap-1 mt-1">
                    {trend.keywords.slice(0, 3).map((keyword, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 bg-customColor10/10 text-customColor10 text-xs rounded"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-semibold ${getDirectionColor(trend.direction)}`}>
                  {trend.velocity > 0 ? '+' : ''}{trend.velocity.toFixed(1)}%
                </p>
                <p className="text-xs text-textColor/60">
                  {formatNumber(trend.currentPeriodMetrics.totalEngagement)} eng
                </p>
              </div>
            </div>

            {/* Expanded content */}
            {expandedTheme === trend.id && showTopContent && (
              <div className="mt-2 ml-8 p-3 bg-newBgColor/50 rounded-lg">
                <p className="text-xs font-medium text-textColor/60 mb-2">Top Content</p>
                
                {isLoadingContent && (
                  <p className="text-xs text-textColor/60">Loading...</p>
                )}
                
                {!isLoadingContent && topContent.length === 0 && (
                  <p className="text-xs text-textColor/60">No content found</p>
                )}
                
                {topContent.length > 0 && (
                  <div className="space-y-2">
                    {topContent.map((content) => (
                      <div
                        key={content.id}
                        className="p-2 bg-newBgColor rounded text-sm"
                      >
                        <p className="text-textColor line-clamp-1">
                          {content.caption || 'No caption'}
                        </p>
                        <div className="flex gap-3 mt-1 text-xs text-textColor/60">
                          <span>{formatNumber(content.totalReach)} reach</span>
                          <span>{formatNumber(content.totalEngagement)} eng</span>
                          <span>{content.engagementRate.toFixed(1)}% rate</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
