'use client';

import { FC, useState, useCallback, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { AlertCard } from './alert-card';
import { clsx } from 'clsx';

interface AlertData {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  threshold: number;
  title: string;
  message: string;
  suggestions: string[];
  isRead: boolean;
  createdAt: string;
  integration?: {
    id: string;
    name: string;
    picture?: string;
  };
}

interface AlertHistoryProps {
  initialLimit?: number;
}

export const AlertHistory: FC<AlertHistoryProps> = ({ initialLimit = 20 }) => {
  const fetch = useFetch();
  const [filter, setFilter] = useState<{
    severity?: string;
    unreadOnly: boolean;
  }>({
    unreadOnly: false,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [data, setData] = useState<{ alerts: AlertData[]; total: number } | null>(null);
  const [unreadData, setUnreadData] = useState<{ count: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadAlerts = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('limit', String(initialLimit));
    if (filter.unreadOnly) params.set('unreadOnly', 'true');
    if (filter.severity) params.set('severity', filter.severity);
    const queryString = params.toString();

    setIsLoading(true);
    try {
      const response = await fetch(`/alerts?${queryString}`);
      setData(response as any);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetch, filter.severity, filter.unreadOnly, initialLimit]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/alerts/unread-count');
      setUnreadData(response as any);
    } catch (e) {
      console.error('Failed to load unread count', e);
    }
  }, [fetch]);

  useEffect(() => {
    loadAlerts();
    loadUnreadCount();
  }, [loadAlerts, loadUnreadCount]);

  const mutate = loadAlerts;
  const mutateUnread = loadUnreadCount;

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      await fetch(`/alerts/${id}/read`, { method: 'POST' });
      mutate();
      mutateUnread();
    },
    [fetch, mutate, mutateUnread]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    await fetch('/alerts/mark-all-read', { method: 'POST' });
    mutate();
    mutateUnread();
  }, [fetch, mutate, mutateUnread]);

  const handleDelete = useCallback(
    async (id: string) => {
      await fetch(`/alerts/${id}/delete`, { method: 'POST' });
      mutate();
      mutateUnread();
    },
    [fetch, mutate, mutateUnread]
  );

  const handleCheckNow = useCallback(async () => {
    await fetch('/alerts/check', { method: 'POST' });
    mutate();
    mutateUnread();
  }, [fetch, mutate, mutateUnread]);

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading alerts. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Alerts</h2>
          {unreadData && unreadData.count > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadData.count} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCheckNow}
            className="text-sm px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
          >
            Check Now
          </button>
          {unreadData && unreadData.count > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter((f) => ({ ...f, unreadOnly: !f.unreadOnly }))}
          className={clsx(
            'text-sm px-3 py-1.5 rounded transition-colors',
            filter.unreadOnly
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          )}
        >
          Unread only
        </button>
        <select
          value={filter.severity || ''}
          onChange={(e) =>
            setFilter((f) => ({
              ...f,
              severity: e.target.value || undefined,
            }))
          }
          className="text-sm px-3 py-1.5 rounded bg-gray-700 text-gray-300 border-none"
        >
          <option value="">All severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="WARNING">Warning</option>
          <option value="INFO">Info</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : data?.alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✅</div>
          <p>No alerts to show</p>
          <p className="text-sm mt-1">
            {filter.unreadOnly
              ? 'All alerts have been read'
              : 'Your KPIs are looking good!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              expanded={expandedId === alert.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === alert.id ? null : alert.id)
              }
            />
          ))}
        </div>
      )}

      {data && data.total > data.alerts.length && (
        <div className="text-center text-sm text-gray-500">
          Showing {data.alerts.length} of {data.total} alerts
        </div>
      )}
    </div>
  );
};

export default AlertHistory;
