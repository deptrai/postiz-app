'use client';

import { FC } from 'react';
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

interface AlertCardProps {
  alert: AlertData;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const severityConfig = {
  CRITICAL: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    text: 'text-red-500',
    icon: '🚨',
    label: 'Critical',
  },
  WARNING: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/50',
    text: 'text-yellow-500',
    icon: '⚠️',
    label: 'Warning',
  },
  INFO: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/50',
    text: 'text-blue-500',
    icon: 'ℹ️',
    label: 'Info',
  },
};

export const AlertCard: FC<AlertCardProps> = ({
  alert,
  onMarkAsRead,
  onDelete,
  expanded = false,
  onToggleExpand,
}) => {
  const config = severityConfig[alert.severity];
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

  const formatValue = (value: number, metric: string) => {
    if (metric === 'engagement_rate') {
      return `${value.toFixed(2)}%`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  return (
    <div
      className={clsx(
        'rounded-lg border p-4 transition-all',
        config.bg,
        config.border,
        !alert.isRead && 'ring-2 ring-offset-2 ring-offset-black',
        !alert.isRead && config.border.replace('/50', '')
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  'text-xs font-semibold px-2 py-0.5 rounded',
                  config.bg,
                  config.text
                )}
              >
                {config.label}
              </span>
              {!alert.isRead && (
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                  New
                </span>
              )}
              {alert.integration && (
                <span className="text-xs text-gray-400">
                  {alert.integration.name}
                </span>
              )}
            </div>
            <h3 className="font-semibold mt-1">{alert.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          {formattedDate}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-black/20 rounded p-2">
          <div className="text-xs text-gray-400">Previous</div>
          <div className="font-semibold">
            {formatValue(alert.previousValue, alert.metric)}
          </div>
        </div>
        <div className="bg-black/20 rounded p-2">
          <div className="text-xs text-gray-400">Current</div>
          <div className="font-semibold">
            {formatValue(alert.currentValue, alert.metric)}
          </div>
        </div>
        <div className="bg-black/20 rounded p-2">
          <div className="text-xs text-gray-400">Change</div>
          <div className={clsx('font-semibold', config.text)}>
            {alert.changePercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {expanded && alert.suggestions.length > 0 && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold mb-2">Suggested Actions:</h4>
          <ul className="space-y-1">
            {alert.suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                <span className="text-green-500">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onToggleExpand}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          {expanded ? 'Show less' : 'Show suggestions'}
        </button>
        <div className="flex gap-2">
          {!alert.isRead && onMarkAsRead && (
            <button
              onClick={() => onMarkAsRead(alert.id)}
              className="text-sm px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
            >
              Mark as read
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(alert.id)}
              className="text-sm px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
