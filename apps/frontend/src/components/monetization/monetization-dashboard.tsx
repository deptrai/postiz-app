'use client';

import { FC, useEffect, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

interface FeatureProgress {
  name: string;
  status: 'eligible' | 'not_eligible' | 'close';
  progress: number;
  currentMetrics: any;
  requiredMetrics: any;
  gap: any;
  estimatedDays?: number;
}

interface MonetizationStatus {
  inStreamAds: FeatureProgress;
  reels: FeatureProgress;
  stars: FeatureProgress;
  fanSubscription: FeatureProgress;
  lastUpdated: Date;
}

const StatusBadge: FC<{ status: string }> = ({ status }) => {
  const colors = {
    eligible: 'bg-green-500/20 text-green-400 border-green-500/30',
    close: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    not_eligible: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const labels = {
    eligible: 'Eligible',
    close: 'Close',
    not_eligible: 'Not Eligible',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
};

const ProgressBar: FC<{ progress: number; status: string }> = ({ progress, status }) => {
  const barColor = status === 'eligible' ? 'bg-green-500' : status === 'close' ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
      <div
        className={`h-full ${barColor} transition-all duration-500`}
        style={{ width: `${Math.min(100, progress)}%` }}
      />
    </div>
  );
};

const FeatureCard: FC<{ feature: FeatureProgress }> = ({ feature }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-textColor">{feature.name}</h3>
        <StatusBadge status={feature.status} />
      </div>

      {feature.status === 'eligible' && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-400 font-medium">Congratulations! You're eligible for this feature.</span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-textColor/60">Progress</span>
          <span className="text-sm font-medium text-textColor">{feature.progress.toFixed(1)}%</span>
        </div>
        <ProgressBar progress={feature.progress} status={feature.status} />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-textColor/80">Requirements</h4>
        {Object.entries(feature.requiredMetrics).map(([key, required]) => {
          const current = feature.currentMetrics[key] || 0;
          const gap = feature.gap[key] || 0;
          const metricProgress = required > 0 ? Math.min(100, (current / required) * 100) : 100;

          const metricLabels: Record<string, string> = {
            followers: 'Followers',
            oneMinuteViews: 'One-Minute Views',
            viewedMinutes: 'Viewed Minutes',
            watchedMinutes: 'Watched Minutes',
            engagements: 'Engagements',
            videosCount: 'Videos',
          };

          return (
            <div key={key} className="bg-newBgColor rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-textColor/60">{metricLabels[key] || key}</span>
                <span className="text-xs font-medium text-textColor">
                  {formatNumber(current)} / {formatNumber(required)}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${metricProgress}%` }}
                />
              </div>
              {gap > 0 && (
                <p className="text-xs text-textColor/50 mt-1">
                  {formatNumber(gap)} more needed
                </p>
              )}
            </div>
          );
        })}
      </div>

      {feature.estimatedDays && feature.status !== 'eligible' && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            <span className="font-medium">Estimated time:</span>{' '}
            {feature.estimatedDays < 30
              ? `${feature.estimatedDays} days`
              : `${Math.round(feature.estimatedDays / 30)} months`}
          </p>
        </div>
      )}
    </div>
  );
};

export const MonetizationDashboard: FC = () => {
  const [status, setStatus] = useState<MonetizationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetch = useFetch();

  useEffect(() => {
    loadMonetizationStatus();
  }, []);

  const loadMonetizationStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/monetization/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.error || 'Failed to load monetization status');
      }
    } catch (err) {
      setError('Failed to load monetization status');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-textColor/60">Loading monetization status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const eligibleCount = [status.inStreamAds, status.reels, status.stars, status.fanSubscription].filter(
    (f) => f.status === 'eligible'
  ).length;

  return (
    <div className="space-y-6">
      <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50">
        <h2 className="text-2xl font-bold text-textColor mb-2">Monetization Dashboard</h2>
        <p className="text-textColor/60 mb-4">
          Track your progress towards Facebook monetization eligibility
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm text-textColor/80">{eligibleCount} Eligible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-sm text-textColor/80">
              {[status.inStreamAds, status.reels, status.stars, status.fanSubscription].filter(
                (f) => f.status === 'close'
              ).length}{' '}
              Close
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
            <span className="text-sm text-textColor/80">
              {[status.inStreamAds, status.reels, status.stars, status.fanSubscription].filter(
                (f) => f.status === 'not_eligible'
              ).length}{' '}
              Not Eligible
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeatureCard feature={status.inStreamAds} />
        <FeatureCard feature={status.reels} />
        <FeatureCard feature={status.stars} />
        <FeatureCard feature={status.fanSubscription} />
      </div>

      <div className="bg-newBgColorInner rounded-lg p-4 border border-gray-700/50">
        <p className="text-xs text-textColor/50">
          Last updated: {new Date(status.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  );
};
