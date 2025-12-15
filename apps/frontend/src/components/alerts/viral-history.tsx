'use client';

import { FC, useState, useCallback, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { ViralSpikeCard } from './viral-spike-card';

interface ViralAlertData {
  id: string;
  type: string;
  severity: string;
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
    providerIdentifier?: string;
  };
}

interface ViralPatterns {
  topMetrics: { metric: string; count: number }[];
  avgSpikePercent: number;
  totalViralEvents: number;
}

interface ViralHistoryResponse {
  viralAlerts: ViralAlertData[];
  total: number;
  patterns: ViralPatterns;
  limit: number;
  offset: number;
}

export const ViralHistory: FC = () => {
  const fetch = useFetch();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [data, setData] = useState<ViralHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const loadViralHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/alerts/viral-history?limit=20');
      setData(response as unknown as ViralHistoryResponse);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    loadViralHistory();
  }, [loadViralHistory]);

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      await fetch(`/alerts/${id}/read`, { method: 'POST' });
      loadViralHistory();
    },
    [fetch, loadViralHistory]
  );

  const handleCheckViral = useCallback(async () => {
    setIsChecking(true);
    try {
      await fetch('/alerts/check-viral', { method: 'POST' });
      loadViralHistory();
    } finally {
      setIsChecking(false);
    }
  }, [fetch, loadViralHistory]);

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading viral history. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            Viral Content
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Content with engagement spikes &gt;200% in 24h
          </p>
        </div>
        <button
          onClick={handleCheckViral}
          disabled={isChecking}
          className="px-4 py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {isChecking ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
              Checking...
            </>
          ) : (
            <>
              <span>🔍</span>
              Check for Viral Content
            </>
          )}
        </button>
      </div>

      {data?.patterns && data.patterns.totalViralEvents > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-lg p-4 border border-green-500/30">
            <div className="text-3xl font-bold text-green-400">
              {data.patterns.totalViralEvents}
            </div>
            <div className="text-sm text-gray-400">Total Viral Events</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-lg p-4 border border-purple-500/30">
            <div className="text-3xl font-bold text-purple-400">
              +{data.patterns.avgSpikePercent}%
            </div>
            <div className="text-sm text-gray-400">Avg Spike</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-lg p-4 border border-blue-500/30">
            <div className="text-lg font-bold text-blue-400">
              {data.patterns.topMetrics[0]?.metric.replace(/_/g, ' ') || 'N/A'}
            </div>
            <div className="text-sm text-gray-400">Top Viral Metric</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : data?.viralAlerts.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="text-5xl mb-4">📈</div>
          <p className="text-gray-400 text-lg">No viral content detected yet</p>
          <p className="text-sm text-gray-500 mt-2">
            When your content spikes &gt;200%, it will appear here
          </p>
          <button
            onClick={handleCheckViral}
            className="mt-4 px-4 py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
          >
            Check Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.viralAlerts.map((alert) => (
            <ViralSpikeCard
              key={alert.id}
              alert={alert}
              onMarkAsRead={handleMarkAsRead}
              expanded={expandedId === alert.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === alert.id ? null : alert.id)
              }
            />
          ))}
        </div>
      )}

      {data && data.total > data.viralAlerts.length && (
        <div className="text-center text-sm text-gray-500">
          Showing {data.viralAlerts.length} of {data.total} viral events
        </div>
      )}
    </div>
  );
};

export default ViralHistory;
