'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import {
  AdFriendlyScoreCard,
  SensitiveTopicsList,
  AdFriendlyReport,
  SensitiveTopic,
  CategoryScore,
  AdFriendlyReportItem,
  AdFriendlyTrendPoint,
  SensitiveCategory,
} from '@gitroom/frontend/components/quality';

interface AdFriendlyResult {
  overallScore: number;
  isAdFriendly: boolean;
  interpretation: string;
  categoryBreakdown: CategoryScore[];
  sensitiveTopics: SensitiveTopic[];
  suggestions: string[];
}

interface AdFriendlyReportData {
  totalContent: number;
  adFriendlyCount: number;
  adFriendlyPercentage: number;
  averageScore: number;
  categoryStats: Record<SensitiveCategory, number>;
  flaggedContent: AdFriendlyReportItem[];
  trends: AdFriendlyTrendPoint[];
}

export default function AdFriendlyPage() {
  const t = useT();
  const fetch = useFetch();

  // Score state
  const [content, setContent] = useState('');
  const [scoreResult, setScoreResult] = useState<AdFriendlyResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  // Report state
  const [reportPeriod, setReportPeriod] = useState<7 | 14 | 30>(7);
  const [reportData, setReportData] = useState<AdFriendlyReportData | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Fetch report
  const fetchReport = useCallback(async () => {
    setIsLoadingReport(true);
    try {
      const response = await fetch(`/quality/ad-friendly/report?days=${reportPeriod}`);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch ad-friendly report:', error);
    } finally {
      setIsLoadingReport(false);
    }
  }, [fetch, reportPeriod]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Score content
  const handleScore = async () => {
    if (!content.trim()) return;

    setIsScoring(true);
    try {
      const response = await fetch('/quality/ad-friendly/score', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      const result: AdFriendlyResult = await response.json();
      setScoreResult(result);
    } catch (error) {
      console.error('Failed to score content:', error);
    } finally {
      setIsScoring(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t('adFriendly.page.title', 'Advertiser-Friendly Scoring')}
        </h1>
      </div>

      <p className="text-gray-400">
        {t(
          'adFriendly.page.description',
          'Check if your content is suitable for advertisers and maximize your ad revenue potential.'
        )}
      </p>

      {/* Scoring Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="bg-third rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t('adFriendly.page.checkContent', 'Check Your Content')}
            </h3>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t(
                'adFriendly.page.placeholder',
                'Enter your content to check for advertiser-friendliness...\n\nExample: "Check out this amazing product launch!"'
              )}
              className="w-full h-40 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
            <button
              onClick={handleScore}
              disabled={!content.trim() || isScoring}
              className="mt-4 w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isScoring
                ? t('adFriendly.page.scoring', 'Scoring...')
                : t('adFriendly.page.scoreButton', 'Score Content')}
            </button>
          </div>

          {/* Sensitive Topics List */}
          {scoreResult && (
            <SensitiveTopicsList
              topics={scoreResult.sensitiveTopics}
              isLoading={isScoring}
            />
          )}
        </div>

        {/* Results */}
        <div>
          {scoreResult ? (
            <AdFriendlyScoreCard
              overallScore={scoreResult.overallScore}
              isAdFriendly={scoreResult.isAdFriendly}
              interpretation={scoreResult.interpretation}
              categoryBreakdown={scoreResult.categoryBreakdown}
              sensitiveTopics={scoreResult.sensitiveTopics}
              suggestions={scoreResult.suggestions}
              isLoading={isScoring}
            />
          ) : (
            <div className="bg-third rounded-xl p-6 text-center text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
              <p>{t('adFriendly.page.noResults', 'Enter content and click "Score" to check ad-friendliness')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Section */}
      <div className="border-t border-gray-700 pt-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('adFriendly.page.report', 'Ad-Friendly Report')}
        </h2>
        <AdFriendlyReport
          totalContent={reportData?.totalContent || 0}
          adFriendlyCount={reportData?.adFriendlyCount || 0}
          adFriendlyPercentage={reportData?.adFriendlyPercentage || 100}
          averageScore={reportData?.averageScore || 100}
          categoryStats={reportData?.categoryStats || {
            violence: 0,
            adult: 0,
            controversial: 0,
            drugs_alcohol: 0,
            profanity: 0,
            tragedy: 0,
            misinformation: 0,
          }}
          flaggedContent={reportData?.flaggedContent || []}
          trends={reportData?.trends || []}
          period={reportPeriod}
          isLoading={isLoadingReport}
          onPeriodChange={setReportPeriod}
        />
      </div>
    </div>
  );
}
