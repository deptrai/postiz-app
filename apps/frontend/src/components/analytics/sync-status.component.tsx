'use client';

import { FC, useState, useCallback, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface SyncIntegration {
  integrationId: string;
  integrationName: string;
  provider: string;
  lastSyncedAt: string | null;
  contentCount: number;
  isTracked: boolean;
}

interface SyncStatusProps {
  className?: string;
  compact?: boolean;
}

export const SyncStatusComponent: FC<SyncStatusProps> = ({ className = '', compact = false }) => {
  const fetch = useFetch();
  const t = useT();
  const [syncStatus, setSyncStatus] = useState<{
    trackedCount: number;
    integrations: SyncIntegration[];
    lastUpdated: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/integrations/sync/status');
      const data = await response.json();
      if (data.success) {
        setSyncStatus({
          trackedCount: data.trackedCount,
          integrations: data.integrations,
          lastUpdated: data.lastUpdated,
        });
      }
    } catch (err) {
      console.error('Failed to load sync status', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    loadSyncStatus();
    // Refresh every 30 seconds
    const interval = setInterval(loadSyncStatus, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className={`bg-newBgColorInner rounded-lg p-4 ${className}`}>
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
          <div className="h-4 bg-gray-600 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (!syncStatus || syncStatus.trackedCount === 0) {
    return null;
  }

  if (compact) {
    const latestSync = syncStatus.integrations
      .filter(i => i.lastSyncedAt)
      .sort((a, b) => new Date(b.lastSyncedAt!).getTime() - new Date(a.lastSyncedAt!).getTime())[0];

    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-textColor/60">
          {syncStatus.trackedCount} {t('tracked_integrations', 'tracked')} • 
          {latestSync ? ` ${t('last_synced', 'Last synced')} ${dayjs(latestSync.lastSyncedAt).fromNow()}` : ` ${t('never_synced', 'Never synced')}`}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-newBgColorInner rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-textColor">{t('sync_status', 'Sync Status')}</h3>
        <span className="text-xs text-textColor/40">
          {dayjs(syncStatus.lastUpdated).format('HH:mm:ss')}
        </span>
      </div>
      
      <div className="space-y-2">
        {syncStatus.integrations.map((integration) => (
          <div
            key={integration.integrationId}
            className="flex items-center justify-between py-2 border-b border-newBgColor last:border-0"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${integration.lastSyncedAt ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm text-textColor">{integration.integrationName}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-textColor/60">
                {integration.contentCount} {t('items', 'items')}
              </div>
              <div className="text-xs text-textColor/40">
                {integration.lastSyncedAt 
                  ? dayjs(integration.lastSyncedAt).fromNow()
                  : t('never_synced', 'Never synced')
                }
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
