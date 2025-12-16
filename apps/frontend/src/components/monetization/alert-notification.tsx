'use client';

import { FC, useEffect, useState } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface Alert {
  id: string;
  type: 'MONETIZATION_MILESTONE';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  currentValue: number;
  threshold: number;
  isRead: boolean;
  createdAt: string;
  suggestions?: string[];
}

export interface AlertNotificationProps {
  alerts: Alert[];
  onMarkAsRead: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
}

const AlertIcon: FC<{ severity: 'CRITICAL' | 'WARNING' | 'INFO' }> = ({ severity }) => {
  if (severity === 'INFO') {
    return (
      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  } else if (severity === 'WARNING') {
    return (
      <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  } else {
    return (
      <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
};

const CelebrationIcon: FC = () => {
  return (
    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

export const AlertNotification: FC<AlertNotificationProps> = ({
  alerts,
  onMarkAsRead,
  onDismiss,
}) => {
  const t = useT();
  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Show only unread alerts
    const unread = alerts.filter(a => !a.isRead).slice(0, 3);
    setVisibleAlerts(unread);
  }, [alerts]);

  const handleDismiss = (alertId: string) => {
    onMarkAsRead(alertId);
    onDismiss(alertId);
    setVisibleAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {visibleAlerts.map((alert) => {
        const is100Percent = alert.threshold === 100;
        const is90Percent = alert.threshold === 90;
        const is80Percent = alert.threshold === 80;

        return (
          <div
            key={alert.id}
            className={`
              bg-newBgColorInner rounded-lg p-4 border shadow-lg
              transform transition-all duration-300 hover:scale-105
              ${is100Percent ? 'border-green-500/50 animate-pulse' : ''}
              ${is90Percent ? 'border-yellow-500/50' : ''}
              ${is80Percent ? 'border-blue-500/50' : ''}
              ${alert.severity === 'WARNING' && !is90Percent ? 'border-yellow-500/50' : ''}
              ${!is100Percent && !is90Percent && !is80Percent && alert.severity !== 'WARNING' ? 'border-gray-700/50' : ''}
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {is100Percent ? (
                  <CelebrationIcon />
                ) : (
                  <AlertIcon severity={alert.severity} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-textColor pr-2">{alert.title}</h4>
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="flex-shrink-0 text-textColor/50 hover:text-textColor transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-xs text-textColor/70 mb-3">{alert.message}</p>

                {alert.suggestions && alert.suggestions.length > 0 && (
                  <div className="bg-gray-800/50 rounded p-2 mb-2">
                    <p className="text-xs font-medium text-textColor/80 mb-1">
                      {t('suggestions', 'Suggestions')}:
                    </p>
                    <ul className="text-xs text-textColor/60 space-y-1">
                      {alert.suggestions.slice(0, 2).map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-blue-400 flex-shrink-0">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-textColor/50">
                    {new Date(alert.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>

            {is100Percent && (
              <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 6.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                <span>{t('alert_eligible_now', 'You can start monetizing now!')}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
