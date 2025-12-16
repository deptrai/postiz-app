'use client';

import { FC, useState, useCallback } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useDashboardKPIs, DashboardFilters as FilterType } from '@gitroom/frontend/hooks/use-dashboard-kpis';
import { useTopContent } from '@gitroom/frontend/hooks/use-top-content';
import { DashboardFilters } from './dashboard-filters.component';
import { KPICard } from './kpi-card.component';
import { TopContentList } from './top-content-list.component';
import { FormatBreakdownChart } from './format-breakdown.component';
import { TrendingTopicsWidget } from '@gitroom/frontend/components/analytics/trending/trending-topics.component';
import { BestTimeHeatmap } from '@gitroom/frontend/components/analytics/best-time/best-time-heatmap.component';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { ExportModal } from '@gitroom/frontend/components/analytics/export/export-modal.component';
import dayjs from 'dayjs';

export const AnalyticsDashboardPage: FC = () => {
  const t = useT();
  const [filters, setFilters] = useState<FilterType>({
    startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    format: 'all',
  });
  const [showExportModal, setShowExportModal] = useState(false);

  const { data: kpisData, isLoading: isLoadingKPIs, error: kpisError } = useDashboardKPIs(filters);
  const { data: topContentData, isLoading: isLoadingContent, error: contentError } = useTopContent(filters, 10);

  const handleFiltersChange = useCallback((newFilters: FilterType) => {
    setFilters(newFilters);
  }, []);

  const isLoading = isLoadingKPIs || isLoadingContent;

  if (isLoading && !kpisData && !topContentData) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <LoadingComponent />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Filters Sidebar */}
      <div className="lg:w-[320px] flex-shrink-0">
        <DashboardFilters onFiltersChange={handleFiltersChange} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Error Display */}
        {(kpisError || contentError) && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-500 font-medium">{t('error_loading_dashboard', 'Error loading dashboard data')}</p>
            <p className="text-red-500/80 text-sm mt-1">
              {kpisError?.message || contentError?.message || t('please_try_refreshing', 'Please try refreshing the page')}
            </p>
          </div>
        )}

        {/* KPI Cards Grid */}
        {kpisData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title={t('total_posts', 'Total Posts')}
              value={kpisData.kpis.totalPosts}
              subtitle={t('in_selected_period', 'In selected period')}
            />
            <KPICard
              title={t('total_reach', 'Total Reach')}
              value={kpisData.kpis.totalReach.toLocaleString()}
              subtitle={t('unique_impressions', 'Unique impressions')}
            />
            <KPICard
              title={t('total_engagement', 'Total Engagement')}
              value={kpisData.kpis.totalEngagement.toLocaleString()}
              subtitle={t('reactions_comments_shares', 'Reactions + Comments + Shares')}
            />
            <KPICard
              title={t('engagement_rate', 'Engagement Rate')}
              value={`${kpisData.kpis.engagementRate.toFixed(2)}%`}
              subtitle={t('engagement_reach', 'Engagement / Reach')}
            />
          </div>
        )}

        {/* Additional KPIs Row */}
        {kpisData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title={t('avg_engagement', 'Avg Engagement')}
              value={kpisData.kpis.averageEngagementPerPost.toFixed(1)}
              subtitle={t('per_post', 'Per post')}
            />
            <KPICard
              title={t('total_impressions', 'Total Impressions')}
              value={kpisData.kpis.totalImpressions.toLocaleString()}
              subtitle={t('including_duplicates', 'Including duplicates')}
            />
            <KPICard
              title={t('video_views', 'Video Views')}
              value={kpisData.kpis.totalVideoViews.toLocaleString()}
              subtitle={t('for_video_content', 'For video content')}
            />
          </div>
        )}

        {/* Format Breakdown - Story 3.3 */}
        <FormatBreakdownChart filters={filters} />

        {/* Trending Topics - Story 4.2 */}
        <TrendingTopicsWidget groupId={filters.groupId} />

        {/* Loading State for Content */}
        {isLoadingContent && !topContentData && (
          <div className="bg-newBgColorInner p-6 rounded-lg">
            <div className="flex items-center justify-center h-[200px]">
              <LoadingComponent />
            </div>
          </div>
        )}

        {/* Top Content List */}
        {topContentData && (
          <TopContentList
            items={topContentData.topContent}
            loading={isLoadingContent}
          />
        )}

        {/* Empty State */}
        {!isLoading && kpisData && kpisData.kpis.totalPosts === 0 && (
          <div className="bg-newBgColorInner p-8 rounded-lg text-center">
            <div className="text-textColor/60">
              <p className="text-lg font-medium mb-2">{t('no_data_available', 'No data available')}</p>
              <p className="text-sm">
                {t('no_content_found', 'No content found for the selected date range and filters.')}
              </p>
              <p className="text-sm mt-2">
                {t('make_sure_tracked', 'Make sure you have tracked Facebook pages and ingested data.')}
              </p>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="bg-newBgColorInner p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-textColor/60">
            <p>
              {t('showing_data_from', 'Showing data from')} {filters.startDate} {t('to', 'to')} {filters.endDate}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 py-1.5 bg-customColor10 text-white rounded-md text-sm font-medium hover:bg-customColor10/80 transition-all"
              >
                {t('export_csv', 'Export CSV')}
              </button>
              <p>
                {t('last_updated', 'Last updated')}: {dayjs().format('MMM D, YYYY h:mm A')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          groupId={filters.groupId}
          startDate={filters.startDate}
          endDate={filters.endDate}
          format={filters.format}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};
