'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';

export const DailyBriefPlaceholder = () => {
  const fetch = useFetch();
  
  const load = useCallback(async () => {
    return await (await fetch('/analytics/daily-brief')).json();
  }, []);

  const { data, isLoading } = useSWR('daily-brief', load, {
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

  return (
    <div className="bg-newBgColorInner p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Daily Brief</h2>
      <div className="text-textColor/60 mb-4">
        <p className="mb-2">
          Your analytics intelligence dashboard is being set up.
        </p>
        <p className="text-sm">
          Date: {data?.date || 'N/A'} | Organization: {data?.organizationId || 'N/A'}
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
      <div className="mt-6 text-sm text-textColor/40">
        This is a placeholder view. Real analytics data will appear here once ingestion is configured.
      </div>
    </div>
  );
};
