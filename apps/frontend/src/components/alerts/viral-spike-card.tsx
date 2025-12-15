'use client';

import { FC } from 'react';
import { clsx } from 'clsx';

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

interface ViralSpikeCardProps {
  alert: ViralAlertData;
  onMarkAsRead?: (id: string) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export const ViralSpikeCard: FC<ViralSpikeCardProps> = ({
  alert,
  onMarkAsRead,
  expanded = false,
  onToggleExpand,
}) => {
  const formattedDate = new Date(alert.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatMetricName = (metric: string) => {
    return metric
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  const getSpikeLevel = (percent: number) => {
    if (percent >= 500) return { label: 'MEGA VIRAL', color: 'text-purple-400', bg: 'bg-purple-500/20' };
    if (percent >= 300) return { label: 'VIRAL', color: 'text-green-400', bg: 'bg-green-500/20' };
    return { label: 'TRENDING', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
  };

  const spikeLevel = getSpikeLevel(alert.changePercent);

  return (
    <div
      className={clsx(
        'rounded-lg border p-4 transition-all',
        'bg-gradient-to-r from-green-500/10 to-emerald-500/10',
        'border-green-500/50',
        !alert.isRead && 'ring-2 ring-green-500 ring-offset-2 ring-offset-black'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="text-3xl animate-pulse">🔥</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={clsx(
                  'text-xs font-bold px-2 py-0.5 rounded',
                  spikeLevel.bg,
                  spikeLevel.color
                )}
              >
                {spikeLevel.label}
              </span>
              <span className="text-xs text-green-400 font-semibold">
                +{alert.changePercent.toFixed(0)}%
              </span>
              {!alert.isRead && (
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded animate-pulse">
                  New
                </span>
              )}
              {alert.integration && (
                <span className="text-xs text-gray-400">
                  {alert.integration.name}
                </span>
              )}
            </div>
            <h3 className="font-semibold mt-1 text-green-300">{alert.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          {formattedDate}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-black/30 rounded p-3 border border-gray-700">
          <div className="text-xs text-gray-400">Previous</div>
          <div className="font-semibold text-gray-300">
            {formatValue(alert.previousValue)}
          </div>
        </div>
        <div className="bg-green-500/20 rounded p-3 border border-green-500/50">
          <div className="text-xs text-green-400">Current</div>
          <div className="font-bold text-green-300 text-lg">
            {formatValue(alert.currentValue)}
          </div>
        </div>
        <div className="bg-black/30 rounded p-3 border border-gray-700">
          <div className="text-xs text-gray-400">Growth</div>
          <div className="font-bold text-green-400">
            ↑ {alert.changePercent.toFixed(0)}%
          </div>
        </div>
      </div>

      {expanded && alert.suggestions.length > 0 && (
        <div className="mt-4 border-t border-green-500/30 pt-4">
          <h4 className="text-sm font-semibold mb-2 text-green-300">
            🎯 Recommended Actions:
          </h4>
          <ul className="space-y-2">
            {alert.suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="text-sm text-gray-300 flex items-start gap-2 bg-black/20 p-2 rounded"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onToggleExpand}
          className="text-sm text-green-400 hover:text-green-300"
        >
          {expanded ? 'Show less' : 'Show recommendations'}
        </button>
        <div className="flex gap-2">
          {!alert.isRead && onMarkAsRead && (
            <button
              onClick={() => onMarkAsRead(alert.id)}
              className="text-sm px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViralSpikeCard;
