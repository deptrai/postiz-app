'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';

export const DailyBriefPlaceholder = () => {
  const fetch = useFetch();
  
  const load = useCallback(async () => {
    return await (await fetch('/analytics/daily-brief')).json();
  }, [fetch]);

  const { data, isLoading, error } = useSWR('daily-brief', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingComponent />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-newBgColorInner p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-red-500">Error Loading Daily Brief</h2>
        <p className="text-textColor/60">Failed to load Daily Brief data. Please try again later.</p>
      </div>
    );
  }

  const hasData = data?.summary?.totalPosts > 0 || data?.summary?.totalEngagement > 0;

  return (
    <div className="bg-newBgColorInner p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Daily Brief</h2>
      <div className="text-textColor/60 mb-4">
        <p className="text-sm">
          Date: {data?.date || 'N/A'} | Period: Last 7 days
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-boxBg p-4 rounded-md">
          <div className="text-sm text-textColor/60 mb-1">Total Posts</div>
          <div className="text-2xl font-semibold">{data?.summary?.totalPosts || 0}</div>
        </div>
        <div className="bg-boxBg p-4 rounded-md">
          <div className="text-sm text-textColor/60 mb-1">Total Engagement</div>
          <div className="text-2xl font-semibold">{data?.summary?.totalEngagement || 0}</div>
        </div>
        <div className="bg-boxBg p-4 rounded-md">
          <div className="text-sm text-textColor/60 mb-1">Top Performer</div>
          <div className="text-2xl font-semibold">{data?.summary?.topPerformer || 'N/A'}</div>
        </div>
      </div>
      {!hasData && (
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
          <p className="text-sm text-yellow-500/80">
            No analytics data available yet. Data will appear here once content ingestion is running.
          </p>
        </div>
      )}
    </div>
  );
};
