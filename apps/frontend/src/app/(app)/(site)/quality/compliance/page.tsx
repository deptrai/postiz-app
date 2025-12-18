'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import {
  ComplianceCheckCard,
  PolicyViolationDetail,
  ComplianceHistory,
  PolicyViolation,
  ComplianceTrendPoint,
  ComplianceHistoryItem,
} from '@gitroom/frontend/components/quality';

interface ComplianceCheckResult {
  isCompliant: boolean;
  complianceScore: number;
  violations: PolicyViolation[];
  checkedPolicies: number;
  passedPolicies: number;
  recommendations: string[];
}

interface ComplianceHistoryData {
  trends: ComplianceTrendPoint[];
  recentViolations: ComplianceHistoryItem[];
  totalContent: number;
  totalViolations: number;
  averageScore: number;
}

export default function CompliancePage() {
  const t = useT();
  const fetch = useFetch();

  // Check state
  const [contentDraft, setContentDraft] = useState('');
  const [checkResult, setCheckResult] = useState<ComplianceCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<PolicyViolation | null>(null);

  // History state
  const [historyPeriod, setHistoryPeriod] = useState<7 | 14 | 30>(7);
  const [historyData, setHistoryData] = useState<ComplianceHistoryData | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch compliance history
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/quality/compliance/history?days=${historyPeriod}`);
      const data = await response.json();
      setHistoryData(data);
    } catch (error) {
      console.error('Failed to fetch compliance history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [fetch, historyPeriod]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Check compliance
  const handleCheck = async () => {
    if (!contentDraft.trim()) return;

    setIsChecking(true);
    setSelectedViolation(null);
    try {
      const response = await fetch('/quality/compliance/check', {
        method: 'POST',
        body: JSON.stringify({ contentDraft }),
      });
      const result: ComplianceCheckResult = await response.json();
      setCheckResult(result);
    } catch (error) {
      console.error('Failed to check compliance:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleViolationClick = (violation: PolicyViolation) => {
    setSelectedViolation(violation);
  };

  const handleCloseDetail = () => {
    setSelectedViolation(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t('compliance.page.title', 'Policy Compliance Check')}
        </h1>
      </div>

      <p className="text-gray-400">
        {t(
          'compliance.page.description',
          'Check your content against Facebook monetization policies before publishing to avoid demonetization.'
        )}
      </p>

      {/* Check Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="bg-third rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t('compliance.page.checkContent', 'Check Your Content')}
            </h3>
            <textarea
              value={contentDraft}
              onChange={(e) => setContentDraft(e.target.value)}
              placeholder={t(
                'compliance.page.placeholder',
                'Enter your content to check for policy compliance...\n\nExample: "You won\'t believe what happened! Like this post!"'
              )}
              className="w-full h-40 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
            <button
              onClick={handleCheck}
              disabled={!contentDraft.trim() || isChecking}
              className="mt-4 w-full py-2 px-4 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isChecking
                ? t('compliance.page.checking', 'Checking...')
                : t('compliance.page.checkButton', 'Check Compliance')}
            </button>
          </div>

          {/* Violation Detail */}
          {selectedViolation && (
            <PolicyViolationDetail
              violation={selectedViolation}
              onClose={handleCloseDetail}
            />
          )}
        </div>

        {/* Results */}
        <div>
          {checkResult ? (
            <ComplianceCheckCard
              isCompliant={checkResult.isCompliant}
              complianceScore={checkResult.complianceScore}
              violations={checkResult.violations}
              checkedPolicies={checkResult.checkedPolicies}
              passedPolicies={checkResult.passedPolicies}
              recommendations={checkResult.recommendations}
              isLoading={isChecking}
              onViolationClick={handleViolationClick}
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
              <p>{t('compliance.page.noResults', 'Enter content and click "Check" to verify policy compliance')}</p>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="border-t border-gray-700 pt-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('compliance.page.history', 'Compliance History')}
        </h2>
        <ComplianceHistory
          trends={historyData?.trends || []}
          recentViolations={historyData?.recentViolations || []}
          totalContent={historyData?.totalContent || 0}
          totalViolations={historyData?.totalViolations || 0}
          averageScore={historyData?.averageScore || 100}
          period={historyPeriod}
          isLoading={isLoadingHistory}
          onPeriodChange={setHistoryPeriod}
        />
      </div>
    </div>
  );
}
