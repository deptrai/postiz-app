'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import {
  QualityScoreCard,
  QualityContentList,
  QualityTrendChart,
  ImprovementHighlights,
} from '@gitroom/frontend/components/quality';

interface QualityScore {
  contentId: string;
  externalContentId: string;
  overallScore: number;
  engagementScore: number;
  watchTimeScore: number;
  complianceScore: number;
  consistencyScore: number;
  improvements: Array<{
    factor: 'engagement' | 'watchTime' | 'compliance' | 'consistency';
    currentScore: number;
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
  interpretation: string;
  calculatedAt: string;
}

interface QualityListItem {
  contentId: string;
  externalContentId: string;
  contentType: string;
  caption: string | null;
  publishedAt: string;
  integrationId: string;
  overallScore: number;
  engagementScore: number;
  interpretation: string;
}

interface QualityTrendPoint {
  date: string;
  averageScore: number;
  contentCount: number;
  engagementAvg: number;
  watchTimeAvg: number;
  complianceAvg: number;
  consistencyAvg: number;
}

export default function QualityDashboardPage() {
  const t = useT();
  const fetch = useFetch();

  const mapQualityInterpretation = useCallback(
    (value: string | null | undefined): string => {
      if (!value) return value || '';
      const normalized = value.toLowerCase().trim();

      if (normalized.includes('excellent')) {
        return t('quality.score.excellent', 'Excellent');
      }
      if (normalized.includes('good')) {
        return t('quality.score.good', 'Good');
      }
      if (normalized.includes('average')) {
        return t('quality.score.average', 'Average');
      }
      if (normalized.includes('poor')) {
        return t('quality.score.poor', 'Poor');
      }

      return value;
    },
    [t]
  );

  // State
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState<QualityScore | null>(null);
  const [contentList, setContentList] = useState<QualityListItem[]>([]);
  const [totalContent, setTotalContent] = useState(0);
  const [trends, setTrends] = useState<QualityTrendPoint[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<7 | 14 | 30>(7);
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'engagement'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Loading states
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  // Fetch content list
  const fetchContentList = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const response = await fetch(
        `/quality/list?sortBy=${sortBy}&sortOrder=${sortOrder}&limit=20`
      );
      const data = await response.json();
      setContentList(
        (data.items || []).map((item: QualityListItem) => ({
          ...item,
          interpretation: mapQualityInterpretation(item.interpretation),
        }))
      );
      setTotalContent(data.total || 0);

      // Auto-select first item if none selected
      if (!selectedContentId && data.items?.length > 0) {
        setSelectedContentId(data.items[0].contentId);
      }
    } catch (error) {
      console.error('Failed to fetch quality list:', error);
    } finally {
      setIsLoadingList(false);
    }
  }, [fetch, sortBy, sortOrder, selectedContentId, mapQualityInterpretation]);

  // Fetch trends
  const fetchTrends = useCallback(async () => {
    setIsLoadingTrends(true);
    try {
      const response = await fetch(`/quality/trends?days=${trendPeriod}`);
      const data = await response.json();
      setTrends(data.trends || []);
    } catch (error) {
      console.error('Failed to fetch quality trends:', error);
    } finally {
      setIsLoadingTrends(false);
    }
  }, [fetch, trendPeriod]);

  // Fetch single content score
  const fetchContentScore = useCallback(
    async (contentId: string) => {
      setIsLoadingScore(true);
      try {
        const response = await fetch(`/quality/score/${contentId}`);
        const data = await response.json();
        setSelectedScore({
          ...data,
          interpretation: mapQualityInterpretation(data?.interpretation),
        });
      } catch (error) {
        console.error('Failed to fetch quality score:', error);
        setSelectedScore(null);
      } finally {
        setIsLoadingScore(false);
      }
    },
    [fetch, mapQualityInterpretation]
  );

  // Initial load
  useEffect(() => {
    fetchContentList();
    fetchTrends();
  }, [fetchContentList, fetchTrends]);

  // Refetch list when sort changes
  useEffect(() => {
    fetchContentList();
  }, [sortBy, sortOrder, fetchContentList]);

  // Refetch trends when period changes
  useEffect(() => {
    fetchTrends();
  }, [trendPeriod, fetchTrends]);

  // Fetch score when content selected
  useEffect(() => {
    if (selectedContentId) {
      fetchContentScore(selectedContentId);
    }
  }, [selectedContentId, fetchContentScore]);

  // Handlers
  const handleContentClick = (contentId: string) => {
    setSelectedContentId(contentId);
  };

  const handleSortChange = (
    newSortBy: 'score' | 'date' | 'engagement',
    newSortOrder: 'asc' | 'desc'
  ) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handlePeriodChange = (period: 7 | 14 | 30) => {
    setTrendPeriod(period);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <svg
            className="w-7 h-7 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t('quality.dashboard.title', 'Quality Dashboard')}
        </h1>
        <p className="text-gray-400 mt-1">
          {t(
            'quality.dashboard.subtitle',
            'Monitor and improve your content quality scores'
          )}
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Score Card & Improvements */}
        <div className="space-y-6">
          <QualityScoreCard
            overallScore={selectedScore?.overallScore || 0}
            breakdown={{
              engagementScore: selectedScore?.engagementScore || 0,
              watchTimeScore: selectedScore?.watchTimeScore || 0,
              complianceScore: selectedScore?.complianceScore || 0,
              consistencyScore: selectedScore?.consistencyScore || 0,
            }}
            interpretation={selectedScore?.interpretation || 'Select content to view score'}
            improvements={selectedScore?.improvements || []}
            isLoading={isLoadingScore}
          />

          <ImprovementHighlights
            improvements={selectedScore?.improvements || []}
            isLoading={isLoadingScore}
          />
        </div>

        {/* Middle Column - Content List */}
        <div>
          <QualityContentList
            items={contentList}
            total={totalContent}
            isLoading={isLoadingList}
            onItemClick={handleContentClick}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>

        {/* Right Column - Trends */}
        <div>
          <QualityTrendChart
            trends={trends}
            period={trendPeriod}
            isLoading={isLoadingTrends}
            onPeriodChange={handlePeriodChange}
          />
        </div>
      </div>
    </div>
  );
}
