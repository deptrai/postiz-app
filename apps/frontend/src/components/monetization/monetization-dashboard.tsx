'use client';

import { FC, useEffect, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { GapAnalysisCard, type MetricGap } from './gap-analysis-card';
import { RecommendationsPanel, type Recommendation } from './recommendations-panel';
import { AlertNotification, type Alert } from './alert-notification';
import { AlertPreferences, type AlertPreferencesData } from './alert-preferences';

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

interface GapAnalysis {
  gaps: MetricGap[];
  totalGaps: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
}

interface RecommendationsData {
  recommendations: Recommendation[];
  totalRecommendations: number;
  actionableCount: number;
}

const StatusBadge: FC<{ status: string }> = ({ status }) => {
  const colors = {
    eligible: 'bg-green-500/20 text-green-400 border-green-500/30',
    close: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    not_eligible: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const t = useT();
  const labels = {
    eligible: t('eligible', 'Eligible'),
    close: t('close_to_eligible', 'Close'),
    not_eligible: t('not_eligible', 'Not Eligible'),
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
  const t = useT();
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
            <span className="text-green-400 font-medium">{t('congratulations_eligible_for_feature', "Congratulations! You're eligible for this feature.")}</span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-textColor/60">{t('progress', 'Progress')}</span>
          <span className="text-sm font-medium text-textColor">{feature.progress.toFixed(1)}%</span>
        </div>
        <ProgressBar progress={feature.progress} status={feature.status} />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-textColor/80">{t('requirements', 'Requirements')}</h4>
        {Object.entries(feature.requiredMetrics).map(([key, required]) => {
          const requiredValue = Number(required);
          const current = feature.currentMetrics[key] || 0;
          const gap = feature.gap[key] || 0;
          const metricProgress = requiredValue > 0 ? Math.min(100, (current / requiredValue) * 100) : 100;

          const metricLabels: Record<string, string> = {
            followers: t('followers', 'Followers'),
            oneMinuteViews: t('one_minute_views', 'One-Minute Views'),
            viewedMinutes: t('viewed_minutes', 'Viewed Minutes'),
            watchedMinutes: t('watched_minutes', 'Watched Minutes'),
            engagements: t('engagements', 'Engagements'),
            videosCount: t('videos', 'Videos'),
          };

          return (
            <div key={key} className="bg-newBgColor rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-textColor/60">{metricLabels[key] || key}</span>
                <span className="text-xs font-medium text-textColor">
                  {formatNumber(current)} / {formatNumber(requiredValue)}
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
                  {formatNumber(gap)} {t('more_needed', 'more needed')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {feature.estimatedDays && feature.status !== 'eligible' && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            <span className="font-medium">{t('estimated_time', 'Estimated time')}:</span>{' '}
            {feature.estimatedDays < 30
              ? `${feature.estimatedDays} ${t('days', 'days')}`
              : `${Math.round(feature.estimatedDays / 30)} ${t('months', 'months')}`}
          </p>
        </div>
      )}
    </div>
  );
};

export const MonetizationDashboard: FC = () => {
  const t = useT();
  const [status, setStatus] = useState<MonetizationStatus | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [preferences, setPreferences] = useState<AlertPreferencesData | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetch = useFetch();

  useEffect(() => {
    loadMonetizationData();
  }, []);

  const loadMonetizationData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load status
      const statusResponse = await fetch('/monetization/status');
      const statusData = await statusResponse.json();
      if (statusData.success) {
        setStatus(statusData.status);
      } else {
        setError(statusData.error || t('failed_to_load_monetization_status', 'Failed to load monetization status'));
        return;
      }

      // Load gap analysis
      const gapsResponse = await fetch('/monetization/gaps');
      const gapsData = await gapsResponse.json();
      if (gapsData.success) {
        setGapAnalysis(gapsData.gapAnalysis);
      }

      // Load recommendations
      const recsResponse = await fetch('/monetization/recommendations');
      const recsData = await recsResponse.json();
      if (recsData.success) {
        setRecommendations(recsData.recommendations);
      }

      // Load alerts
      const alertsResponse = await fetch('/monetization/alerts');
      const alertsData = await alertsResponse.json();
      if (alertsData.success) {
        setAlerts(alertsData.alerts);
      }

      // Load preferences
      const prefsResponse = await fetch('/monetization/alerts/preferences');
      const prefsData = await prefsResponse.json();
      if (prefsData.success) {
        setPreferences(prefsData.preferences);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed_to_load_data', 'Failed to load data'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAlertAsRead = async (alertId: string) => {
    try {
      await fetch(`/monetization/alerts/${alertId}/read`, {
        method: 'POST',
      });
      // Update local state
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const handleSavePreferences = async (newPreferences: AlertPreferencesData) => {
    try {
      const response = await fetch('/monetization/alerts/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
      });
      const data = await response.json();
      if (data.success) {
        setPreferences(data.preferences);
        setShowPreferences(false);
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-textColor/60">{t('loading_monetization_status', 'Loading monetization status...')}</div>
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
        <h2 className="text-2xl font-bold text-textColor mb-2">{t('monetization_dashboard', 'Monetization Dashboard')}</h2>
        <p className="text-textColor/60 mb-4">
          {t('track_your_progress_towards_facebook_monetization_eligibility', 'Track your progress towards Facebook monetization eligibility')}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm text-textColor/80">{eligibleCount} {t('eligible', 'Eligible')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-sm text-textColor/80">
              {[status.inStreamAds, status.reels, status.stars, status.fanSubscription].filter(
                (f) => f.status === 'close'
              ).length}{' '}
              {t('close_to_eligible', 'Close')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
            <span className="text-sm text-textColor/80">
              {[status.inStreamAds, status.reels, status.stars, status.fanSubscription].filter(
                (f) => f.status === 'not_eligible'
              ).length}{' '}
              {t('not_eligible', 'Not Eligible')}
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

      {gapAnalysis && gapAnalysis.totalGaps > 0 && (
        <GapAnalysisCard
          gaps={gapAnalysis.gaps}
          totalGaps={gapAnalysis.totalGaps}
          highPriorityCount={gapAnalysis.highPriorityCount}
          mediumPriorityCount={gapAnalysis.mediumPriorityCount}
          lowPriorityCount={gapAnalysis.lowPriorityCount}
        />
      )}

      {recommendations && recommendations.totalRecommendations > 0 && (
        <RecommendationsPanel
          recommendations={recommendations.recommendations}
          totalRecommendations={recommendations.totalRecommendations}
          actionableCount={recommendations.actionableCount}
        />
      )}

      {/* Alert Preferences Section */}
      {showPreferences && preferences && (
        <AlertPreferences
          preferences={preferences}
          onSave={handleSavePreferences}
          onCancel={() => setShowPreferences(false)}
        />
      )}

      {!showPreferences && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowPreferences(true)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-textColor rounded-lg transition-colors text-sm"
          >
            {t('view_preferences', 'Alert Preferences')}
          </button>
        </div>
      )}

      <div className="bg-newBgColorInner rounded-lg p-4 border border-gray-700/50">
        <p className="text-xs text-textColor/50">
          {t('last_updated', 'Last updated')}: {new Date(status.lastUpdated).toLocaleString()}
        </p>
      </div>

      {/* Alert Notifications Toast */}
      <AlertNotification
        alerts={alerts}
        onMarkAsRead={handleMarkAlertAsRead}
        onDismiss={handleDismissAlert}
      />
    </div>
  );
};
