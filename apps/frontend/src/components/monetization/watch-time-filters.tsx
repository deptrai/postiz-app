import React, { useState } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface WatchTimeFilterValues {
  startDate?: string;
  endDate?: string;
  contentType?: string;
  integrationId?: string;
}

interface WatchTimeFiltersProps {
  onApplyFilters: (filters: WatchTimeFilterValues) => void;
  onResetFilters: () => void;
}

export const WatchTimeFilters: React.FC<WatchTimeFiltersProps> = ({
  onApplyFilters,
  onResetFilters,
}) => {
  const t = useT();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contentType, setContentType] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleApply = () => {
    const filters: WatchTimeFilterValues = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (contentType) filters.contentType = contentType;
    
    onApplyFilters(filters);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setContentType('');
    onResetFilters();
  };

  const hasActiveFilters = startDate || endDate || contentType;

  return (
    <div className="bg-newBgColorInner rounded-lg p-4 border border-gray-700/50 mb-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-textColor">
            {t('filters', 'Filters')}
          </h3>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
              {t('active', 'Active')}
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-textColor transition-colors"
        >
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Filter Controls */}
      {expanded && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('start_date', 'Start Date')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-newBgColor border border-gray-700 rounded-lg text-textColor focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('end_date', 'End Date')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-newBgColor border border-gray-700 rounded-lg text-textColor focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('content_type', 'Content Type')}
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2 bg-newBgColor border border-gray-700 rounded-lg text-textColor focus:outline-none focus:border-blue-500"
              >
                <option value="">{t('all_types', 'All Types')}</option>
                <option value="reel">{t('reels', 'Reels')}</option>
                <option value="video">{t('videos', 'Videos')}</option>
                <option value="story">{t('stories', 'Stories')}</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {t('apply_filters', 'Apply Filters')}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-textColor rounded-lg transition-colors text-sm"
            >
              {t('reset_filters', 'Reset')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
