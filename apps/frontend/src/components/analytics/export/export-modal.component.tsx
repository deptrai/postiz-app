'use client';

import { FC, useState, useEffect, useCallback } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import dayjs from 'dayjs';

export interface ExportModalProps {
  groupId?: string;
  startDate?: string;
  endDate?: string;
  format?: 'post' | 'reel' | 'all';
  onClose: () => void;
}

export const ExportModal: FC<ExportModalProps> = ({
  groupId,
  startDate: initialStartDate,
  endDate: initialEndDate,
  format: initialFormat = 'all',
  onClose,
}) => {
  const fetch = useFetch();
  const [startDate, setStartDate] = useState(
    initialStartDate || dayjs().subtract(7, 'days').format('YYYY-MM-DD')
  );
  const [endDate, setEndDate] = useState(
    initialEndDate || dayjs().format('YYYY-MM-DD')
  );
  const [format, setFormat] = useState<'all' | 'post' | 'reel'>(initialFormat);
  const [exportType, setExportType] = useState<'detailed' | 'summary'>('detailed');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle ESC key to close modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    },
    [isExporting, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isExporting) {
      onClose();
    }
  };

  const validateDates = (): string | null => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (!start.isValid() || !end.isValid()) {
      return 'Invalid date format';
    }

    if (end.isBefore(start)) {
      return 'End date must be after start date';
    }

    if (end.diff(start, 'days') > 90) {
      return 'Date range cannot exceed 90 days';
    }

    return null;
  };

  const handleExport = async () => {
    const validationError = validateDates();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        format,
        exportType,
      });

      if (groupId) {
        queryParams.append('groupId', groupId);
      }

      const response = await fetch(`/analytics/export/csv?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Export failed');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-newBgColorInner p-6 rounded-lg w-[500px] max-w-[90vw]">
        <h2 className="text-xl font-bold mb-4">Export Analytics Data</h2>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Date Range */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Date Range</label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 h-[40px] bg-boxBg text-textColor rounded-md px-3 outline-none border border-fifth focus:border-customColor10"
            />
            <span className="text-textColor/60">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 h-[40px] bg-boxBg text-textColor rounded-md px-3 outline-none border border-fifth focus:border-customColor10"
            />
          </div>
          <p className="text-xs text-textColor/60 mt-1">Maximum 90 days</p>
        </div>

        {/* Content Format */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Content Format</label>
          <div className="flex gap-2">
            {(['all', 'post', 'reel'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 h-[36px] rounded-md font-medium transition-all ${
                  format === f
                    ? 'bg-customColor10 text-white'
                    : 'bg-boxBg text-textColor hover:bg-forth'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Export Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Export Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setExportType('detailed')}
              className={`flex-1 h-[36px] rounded-md font-medium transition-all ${
                exportType === 'detailed'
                  ? 'bg-customColor10 text-white'
                  : 'bg-boxBg text-textColor hover:bg-forth'
              }`}
            >
              Detailed (per content)
            </button>
            <button
              onClick={() => setExportType('summary')}
              className={`flex-1 h-[36px] rounded-md font-medium transition-all ${
                exportType === 'summary'
                  ? 'bg-customColor10 text-white'
                  : 'bg-boxBg text-textColor hover:bg-forth'
              }`}
            >
              Summary (per day)
            </button>
          </div>
          <p className="text-xs text-textColor/60 mt-1">
            {exportType === 'detailed'
              ? 'One row per content item with all metrics'
              : 'Aggregated daily totals'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 h-[40px] bg-boxBg text-textColor rounded-md font-medium hover:bg-forth disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 h-[40px] bg-customColor10 text-white rounded-md font-medium hover:bg-customColor10/80 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};
