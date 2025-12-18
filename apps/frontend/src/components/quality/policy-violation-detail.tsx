'use client';

import React, { FC } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { PolicyViolation, ViolationSeverity, PolicyCategory } from './compliance-check-card';

export interface PolicyViolationDetailProps {
  violation: PolicyViolation;
  onClose?: () => void;
  onApplyFix?: (suggestion: string) => void;
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

const getSeverityDescription = (severity: ViolationSeverity): string => {
  switch (severity) {
    case 'critical':
      return 'Immediate monetization risk - Content may be demonetized or removed';
    case 'high':
      return 'May affect monetization - Reduced reach and revenue potential';
    case 'medium':
      return 'Best practice violation - May impact content performance';
    case 'low':
      return 'Recommendation only - Consider improving for better results';
  }
};

const getCategoryLabel = (category: PolicyCategory): string => {
  switch (category) {
    case 'partner_monetization':
      return 'Partner Monetization Policy';
    case 'content_monetization':
      return 'Content Monetization Policy';
  }
};

const getCategoryDescription = (category: PolicyCategory): string => {
  switch (category) {
    case 'partner_monetization':
      return 'Rules governing partner eligibility and account requirements for monetization';
    case 'content_monetization':
      return 'Rules governing individual content eligibility for monetization';
  }
};

export const PolicyViolationDetail: FC<PolicyViolationDetailProps> = ({
  violation,
  onClose,
  onApplyFix,
}) => {
  const t = useT();

  return (
    <div className="bg-third rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className={`text-lg font-semibold ${getSeverityColor(violation.severity)}`}>
            {violation.policyName}
          </h3>
          <span
            className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full capitalize ${getSeverityBgColor(
              violation.severity
            )}`}
          >
            {violation.severity} severity
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Policy Category */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-sm font-medium text-purple-400">
            {getCategoryLabel(violation.category)}
          </span>
        </div>
        <p className="text-xs text-gray-400">{getCategoryDescription(violation.category)}</p>
      </div>

      {/* Violation Description */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          {t('violation.detail.whatViolated', 'What was violated')}
        </h4>
        <p className="text-gray-400">{violation.description}</p>
      </div>

      {/* Severity Explanation */}
      <div className={`mb-4 p-3 rounded-lg border ${getSeverityBgColor(violation.severity)}`}>
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <span className={`font-medium capitalize ${getSeverityColor(violation.severity)}`}>
              {violation.severity} Severity Impact
            </span>
            <p className="text-sm text-gray-400 mt-1">
              {getSeverityDescription(violation.severity)}
            </p>
          </div>
        </div>
      </div>

      {/* Matched Content (if available) */}
      {violation.matchedContent && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            {t('violation.detail.matchedContent', 'Problematic content')}
          </h4>
          <div className="p-3 bg-gray-800 rounded-lg">
            <code className="text-red-400 text-sm">"{violation.matchedContent}"</code>
          </div>
        </div>
      )}

      {/* How to Fix */}
      <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          {t('violation.detail.howToFix', 'How to fix')}
        </h4>
        <p className="text-gray-300">{violation.fixSuggestion}</p>
        
        {onApplyFix && (
          <button
            onClick={() => onApplyFix(violation.fixSuggestion)}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('violation.detail.applyFix', 'Apply suggestion')}
          </button>
        )}
      </div>

      {/* Learn More */}
      <div className="text-center text-sm text-gray-400">
        <a
          href="https://www.facebook.com/policies/monetization"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          {t('violation.detail.learnMore', 'Learn more about Facebook monetization policies')} →
        </a>
      </div>
    </div>
  );
};

export default PolicyViolationDetail;
