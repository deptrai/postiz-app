'use client';

import { FC } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface Recommendation {
  id: string;
  type: 'content' | 'frequency' | 'engagement' | 'timing';
  title: string;
  description: string;
  targetMetric: string;
  expectedImpact: {
    metric: string;
    estimatedIncrease: string;
    timeframe: string;
  };
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  totalRecommendations: number;
  actionableCount: number;
}

const RecommendationTypeIcon: FC<{ type: string }> = ({ type }) => {
  const icons = {
    content: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    frequency: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    engagement: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
    timing: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return icons[type as keyof typeof icons] || icons.content;
};

const PriorityDot: FC<{ priority: 'high' | 'medium' | 'low' }> = ({ priority }) => {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  return <div className={`w-2 h-2 rounded-full ${colors[priority]}`} />;
};

export const RecommendationsPanel: FC<RecommendationsPanelProps> = ({
  recommendations,
  totalRecommendations,
  actionableCount,
}) => {
  const t = useT();

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      content: t('content_type', 'Content Type'),
      frequency: t('posting_frequency', 'Posting Frequency'),
      engagement: t('engagement_tactics', 'Engagement'),
      timing: t('optimal_timing', 'Timing'),
    };
    return labels[type] || type;
  };

  if (totalRecommendations === 0) {
    return (
      <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-textColor mb-4">{t('recommendations', 'Recommendations')}</h3>
        <p className="text-textColor/60">{t('no_recommendations_available', 'No recommendations available at this time.')}</p>
      </div>
    );
  }

  return (
    <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-textColor">{t('recommendations', 'Recommendations')}</h3>
        <span className="text-sm text-textColor/60">
          {actionableCount} {t('actionable', 'actionable')}
        </span>
      </div>

      <p className="text-sm text-textColor/60 mb-6">
        {t('recommendations_description', 'Follow these recommendations to improve your metrics and reach eligibility faster.')}
      </p>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="bg-newBgColor rounded-lg p-5 border border-gray-700/30 hover:border-gray-600/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                <RecommendationTypeIcon type={rec.type} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-semibold text-textColor">{rec.title}</h4>
                    <PriorityDot priority={rec.priority} />
                  </div>
                  <span className="text-xs text-textColor/50 bg-gray-700/30 px-2 py-1 rounded">
                    {getTypeLabel(rec.type)}
                  </span>
                </div>

                <p className="text-sm text-textColor/70 mb-4">{rec.description}</p>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-blue-400/80 font-medium mb-1">
                        {t('expected_impact', 'Expected Impact')}
                      </p>
                      <p className="text-sm text-blue-400 font-semibold">
                        {rec.expectedImpact.estimatedIncrease}
                      </p>
                      <p className="text-xs text-blue-400/60 mt-1">
                        {t('timeframe', 'Timeframe')}: {rec.expectedImpact.timeframe}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700/50">
        <p className="text-xs text-textColor/50 text-center">
          {t('recommendations_note', 'Impact estimates are based on industry averages and your current growth rate.')}
        </p>
      </div>
    </div>
  );
};
