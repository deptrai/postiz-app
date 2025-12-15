'use client';

import { FC, useState, useCallback, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { clsx } from 'clsx';

interface AlertConfigItem {
  id: string;
  metric: string;
  threshold: number;
  enabled: boolean;
}

interface AlertConfigData {
  [metric: string]: {
    id: string;
    threshold: number;
    enabled: boolean;
  };
}

const metricLabels: Record<string, string> = {
  engagement_rate: 'Engagement Rate',
  reach: 'Reach',
  views: 'Views',
  likes: 'Likes',
  comments: 'Comments',
  shares: 'Shares',
};

export const AlertConfig: FC = () => {
  const fetch = useFetch();
  const [saving, setSaving] = useState<string | null>(null);
  const [data, setData] = useState<AlertConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/alerts/config');
      // Transform array response to object format
      const configArray = response as unknown as AlertConfigItem[];
      const configObj: AlertConfigData = {};
      for (const item of configArray) {
        configObj[item.metric] = {
          id: item.id,
          threshold: item.threshold,
          enabled: item.enabled,
        };
      }
      setData(configObj);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const mutate = loadConfig;

  const handleUpdateThreshold = useCallback(
    async (metric: string, threshold: number, enabled: boolean) => {
      setSaving(metric);
      try {
        await fetch('/alerts/config', {
          method: 'PUT',
          body: JSON.stringify({ metric, threshold, enabled }),
        });
        mutate();
      } finally {
        setSaving(null);
      }
    },
    [fetch, mutate]
  );

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading configuration. Please try again.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Alert Configuration</h2>
        <p className="text-sm text-gray-400 mt-1">
          Configure when you want to receive alerts for KPI drops
        </p>
      </div>

      <div className="space-y-3">
        {data &&
          Object.entries(data).map(([metric, config]) => (
            <div
              key={metric}
              className={clsx(
                'p-4 rounded-lg border transition-colors',
                config.enabled
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-900 border-gray-800 opacity-60'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) =>
                        handleUpdateThreshold(
                          metric,
                          config.threshold,
                          e.target.checked
                        )
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                  <span className="font-medium">
                    {metricLabels[metric] || metric}
                  </span>
                </div>
                {saving === metric && (
                  <span className="text-xs text-blue-400">Saving...</span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400 w-32">
                  Alert when drop exceeds:
                </span>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  value={config.threshold}
                  onChange={(e) =>
                    handleUpdateThreshold(
                      metric,
                      parseInt(e.target.value, 10),
                      config.enabled
                    )
                  }
                  disabled={!config.enabled}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <span
                  className={clsx(
                    'text-lg font-bold w-16 text-right',
                    config.threshold >= 50
                      ? 'text-red-500'
                      : config.threshold >= 30
                      ? 'text-yellow-500'
                      : 'text-blue-500'
                  )}
                >
                  {config.threshold}%
                </span>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                {config.threshold >= 50
                  ? 'Only critical drops will trigger alerts'
                  : config.threshold >= 30
                  ? 'Warning and critical drops will trigger alerts'
                  : 'All significant drops will trigger alerts'}
              </div>
            </div>
          ))}
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="font-semibold text-blue-400">How alerts work</h3>
        <ul className="mt-2 text-sm text-gray-400 space-y-1">
          <li>• Alerts are checked daily against the previous 7-day average</li>
          <li>• Critical alerts: &gt;50% drop</li>
          <li>• Warning alerts: 30-50% drop</li>
          <li>• Info alerts: 20-30% drop</li>
        </ul>
      </div>
    </div>
  );
};

export default AlertConfig;
