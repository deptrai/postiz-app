'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import {
  BaitDetectionCard,
  AuthenticAlternatives,
  PrePublishChecker,
  BaitReport,
  DetectedPattern,
  Alternative,
  BaitTrendPoint,
  BaitReportItem,
} from '@gitroom/frontend/components/quality';

interface BaitDetectionResult {
  caption: string;
  baitScore: number;
  hasBait: boolean;
  detectedPatterns: DetectedPattern[];
  overallSeverity: 'high' | 'medium' | 'low' | 'none';
  suggestions: string[];
}

interface BaitReportData {
  trends: BaitTrendPoint[];
  flaggedContent: BaitReportItem[];
  totalContent: number;
  totalFlagged: number;
  averageBaitScore: number;
}

export default function BaitDetectionPage() {
  const t = useT();
  const fetch = useFetch();

  // Detection state
  const [caption, setCaption] = useState('');
  const [detectionResult, setDetectionResult] = useState<BaitDetectionResult | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  // Report state
  const [reportPeriod, setReportPeriod] = useState<7 | 14 | 30>(7);
  const [reportData, setReportData] = useState<BaitReportData | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Fetch bait report
  const fetchReport = useCallback(async () => {
    setIsLoadingReport(true);
    try {
      const response = await fetch(`/quality/bait/report?days=${reportPeriod}`);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch bait report:', error);
    } finally {
      setIsLoadingReport(false);
    }
  }, [fetch, reportPeriod]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Detect bait in caption
  const handleDetect = async () => {
    if (!caption.trim()) return;

    setIsDetecting(true);
    try {
      const response = await fetch('/quality/bait/detect', {
        method: 'POST',
        body: JSON.stringify({ caption }),
      });
      const result: BaitDetectionResult = await response.json();
      setDetectionResult(result);

      // Build alternatives from detected patterns
      const alts: Alternative[] = result.detectedPatterns.map((p) => ({
        original: p.matchedText,
        alternative: p.authenticAlternative,
        type: p.type,
      }));
      setAlternatives(alts);
    } catch (error) {
      console.error('Failed to detect bait:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleApplyAlternative = (alternative: string) => {
    // Replace the first bait pattern with the alternative
    if (detectionResult && detectionResult.detectedPatterns.length > 0) {
      const pattern = detectionResult.detectedPatterns[0];
      const newCaption = caption.replace(pattern.matchedText, alternative);
      setCaption(newCaption);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t('bait.page.title', 'Engagement Bait Detection')}
        </h1>
      </div>

      <p className="text-gray-400">
        {t(
          'bait.page.description',
          'Detect and avoid engagement bait patterns that can reduce your reach on social media.'
        )}
      </p>

      {/* Detection Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input and Detection */}
        <div className="space-y-4">
          <div className="bg-third rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t('bait.page.checkCaption', 'Check Your Caption')}
            </h3>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t(
                'bait.page.placeholder',
                'Enter your caption to check for engagement bait patterns...\n\nExample: "Like this post if you agree! Share with friends!"'
              )}
              className="w-full h-40 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            <button
              onClick={handleDetect}
              disabled={!caption.trim() || isDetecting}
              className="mt-4 w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isDetecting
                ? t('bait.page.detecting', 'Detecting...')
                : t('bait.page.detectButton', 'Detect Bait Patterns')}
            </button>
          </div>

          {/* Alternatives */}
          <AuthenticAlternatives
            alternatives={alternatives}
            onApply={handleApplyAlternative}
            isLoading={isDetecting}
          />
        </div>

        {/* Detection Results */}
        <div className="space-y-4">
          {detectionResult ? (
            <BaitDetectionCard
              caption={detectionResult.caption}
              baitScore={detectionResult.baitScore}
              hasBait={detectionResult.hasBait}
              detectedPatterns={detectionResult.detectedPatterns}
              overallSeverity={detectionResult.overallSeverity}
              isLoading={isDetecting}
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <p>{t('bait.page.noResults', 'Enter a caption and click "Detect" to check for bait patterns')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pre-Publish Checker Section */}
      <div className="border-t border-gray-700 pt-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('bait.page.prePublish', 'Pre-Publish Checker')}
        </h2>
        <PrePublishChecker
          content=""
          onChange={(content) => console.log('Content changed:', content)}
        />
      </div>

      {/* Report Section */}
      <div className="border-t border-gray-700 pt-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('bait.page.report', 'Historical Bait Report')}
        </h2>
        <BaitReport
          trends={reportData?.trends || []}
          flaggedContent={reportData?.flaggedContent || []}
          totalContent={reportData?.totalContent || 0}
          totalFlagged={reportData?.totalFlagged || 0}
          averageBaitScore={reportData?.averageBaitScore || 0}
          period={reportPeriod}
          isLoading={isLoadingReport}
          onPeriodChange={setReportPeriod}
        />
      </div>
    </div>
  );
}
