'use client';

import React, { FC } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export type ViolationSeverity = 'critical' | 'high' | 'medium' | 'low';
export type PolicyCategory = 'partner_monetization' | 'content_monetization';

export interface PolicyViolation {
  ruleId: string;
  policyName: string;
  category: PolicyCategory;
  severity: ViolationSeverity;
  description: string;
  matchedContent?: string;
  fixSuggestion: string;
}

export interface ComplianceCheckCardProps {
  isCompliant: boolean;
  complianceScore: number;
  violations: PolicyViolation[];
  checkedPolicies: number;
  passedPolicies: number;
  recommendations: string[];
  isLoading?: boolean;
  onViolationClick?: (violation: PolicyViolation) => void;
}

const getSeverityColor = (severity: ViolationSeverity): string => {
  switch (severity) {
    case 'critical':
      return 'text-red-500';
    case 'high':
      return 'text-orange-400';
    case 'medium':
      return 'text-yellow-400';
    case 'low':
      return 'text-blue-400';
  }
};

const getSeverityBgColor = (severity: ViolationSeverity): string => {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/20 border-red-500/30';
    case 'high':
      return 'bg-orange-500/20 border-orange-500/30';
    case 'medium':
      return 'bg-yellow-500/20 border-yellow-500/30';
    case 'low':
      return 'bg-blue-500/20 border-blue-500/30';
  }
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

const getCategoryLabel = (category: PolicyCategory): string => {
  switch (category) {
    case 'partner_monetization':
      return 'Partner Monetization';
    case 'content_monetization':
      return 'Content Monetization';
  }
};

export const ComplianceCheckCard: FC<ComplianceCheckCardProps> = ({
  isCompliant,
  complianceScore,
  violations,
  checkedPolicies,
  passedPolicies,
  recommendations,
  isLoading = false,
  onViolationClick,
}) => {
  const t = useT();

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-700 rounded mb-4" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-third rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg
            className="w-5 h-5 text-purple-400"
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
          {t('compliance.card.title', 'Policy Compliance Check')}
        </h3>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            isCompliant
              ? 'bg-green-500/20 border border-green-500/30 text-green-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
        >
          {isCompliant
            ? t('compliance.status.compliant', 'Compliant')
            : t('compliance.status.violations', `${violations.length} Violation(s)`)}
        </div>
      </div>

      {/* Compliance Score */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-gray-700 flex items-center justify-center">
            <div className="text-center">
              <span className={`text-3xl font-bold ${getScoreColor(complianceScore)}`}>
                {complianceScore}
              </span>
              <span className="text-gray-400 text-sm block">
                {t('compliance.card.score', 'Score')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-gray-200">{checkedPolicies}</div>
          <div className="text-xs text-gray-400">
            {t('compliance.card.checked', 'Policies Checked')}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className={`text-xl font-bold ${passedPolicies === checkedPolicies ? 'text-green-400' : 'text-yellow-400'}`}>
            {passedPolicies}
          </div>
          <div className="text-xs text-gray-400">
            {t('compliance.card.passed', 'Passed')}
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div
        className={`text-center mb-6 p-3 rounded-lg ${
          isCompliant
            ? 'bg-green-500/20 border border-green-500/30'
            : 'bg-red-500/20 border border-red-500/30'
        }`}
      >
        {isCompliant ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-400">
              {t('compliance.card.allClear', 'All policies passed! Safe to publish.')}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-red-400">
              {t('compliance.card.issuesFound', 'Policy violations detected. Review before publishing.')}
            </span>
          </div>
        )}
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <div className="border-t border-gray-700 pt-4 mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">
            {t('compliance.card.violations', 'Violations')}
          </h4>
          <div className="space-y-2">
            {violations.map((violation, index) => (
              <div
                key={index}
                onClick={() => onViolationClick?.(violation)}
                className={`p-3 rounded-lg border cursor-pointer hover:brightness-110 transition-all ${getSeverityBgColor(
                  violation.severity
                )}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${getSeverityColor(violation.severity)}`}>
                        {violation.policyName}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${getSeverityBgColor(
                          violation.severity
                        )}`}
                      >
                        {violation.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{violation.description}</p>
                    <div className="mt-2 text-xs">
                      <span className="text-gray-500">{t('compliance.card.category', 'Category')}: </span>
                      <span className="text-gray-300">{getCategoryLabel(violation.category)}</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">
            {t('compliance.card.recommendations', 'Recommendations')}
          </h4>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <svg className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ComplianceCheckCard;
