'use client';

import { FC, useState, useEffect } from 'react';
import dayjs from 'dayjs';

export interface DashboardFiltersProps {
  onFiltersChange: (filters: {
    startDate: string;
    endDate: string;
    groupId?: string;
    integrationIds?: string[];
    format: 'post' | 'reel' | 'all';
  }) => void;
  groups?: Array<{ id: string; name: string }>;
  integrations?: Array<{ id: string; name: string }>;
}

export const DashboardFilters: FC<DashboardFiltersProps> = ({
  onFiltersChange,
  groups = [],
  integrations = [],
}) => {
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [groupId, setGroupId] = useState<string>('');
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [format, setFormat] = useState<'post' | 'reel' | 'all'>('all');

  useEffect(() => {
    onFiltersChange({
      startDate,
      endDate,
      groupId: groupId || undefined,
      integrationIds: selectedIntegrations.length > 0 ? selectedIntegrations : undefined,
      format,
    });
  }, [startDate, endDate, groupId, selectedIntegrations, format, onFiltersChange]);

  return (
    <div className="bg-newBgColorInner p-6 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>

      {/* Date Range */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date Range</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-textColor/60">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-[40px] bg-boxBg text-textColor rounded-md px-3 outline-none border border-fifth focus:border-customColor10"
            />
          </div>
          <div>
            <label className="text-xs text-textColor/60">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-[40px] bg-boxBg text-textColor rounded-md px-3 outline-none border border-fifth focus:border-customColor10"
            />
          </div>
        </div>
      </div>

      {/* Group Filter */}
      {groups.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Page Group</label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full h-[40px] bg-boxBg text-textColor rounded-md px-3 outline-none border border-fifth focus:border-customColor10"
          >
            <option value="">All Groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Integration Filter */}
      {integrations.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Pages</label>
          <select
            multiple
            value={selectedIntegrations}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value);
              setSelectedIntegrations(selected);
            }}
            className="w-full min-h-[100px] bg-boxBg text-textColor rounded-md px-3 py-2 outline-none border border-fifth focus:border-customColor10"
          >
            {integrations.map((integration) => (
              <option key={integration.id} value={integration.id}>
                {integration.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-textColor/60">Hold Ctrl/Cmd to select multiple</p>
        </div>
      )}

      {/* Format Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Content Format</label>
        <div className="flex gap-2">
          {(['all', 'post', 'reel'] as const).map((formatOption) => (
            <button
              key={formatOption}
              onClick={() => setFormat(formatOption)}
              className={`flex-1 h-[36px] rounded-md font-medium transition-all ${
                format === formatOption
                  ? 'bg-customColor10 text-white'
                  : 'bg-boxBg text-textColor hover:bg-forth'
              }`}
            >
              {formatOption.charAt(0).toUpperCase() + formatOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Date Ranges */}
      <div className="space-y-2 pt-2 border-t border-fifth">
        <label className="text-sm font-medium">Quick Select</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setStartDate(dayjs().subtract(7, 'days').format('YYYY-MM-DD'));
              setEndDate(dayjs().format('YYYY-MM-DD'));
            }}
            className="h-[32px] bg-boxBg text-textColor rounded-md text-sm hover:bg-forth"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              setStartDate(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
              setEndDate(dayjs().format('YYYY-MM-DD'));
            }}
            className="h-[32px] bg-boxBg text-textColor rounded-md text-sm hover:bg-forth"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => {
              setStartDate(dayjs().subtract(90, 'days').format('YYYY-MM-DD'));
              setEndDate(dayjs().format('YYYY-MM-DD'));
            }}
            className="h-[32px] bg-boxBg text-textColor rounded-md text-sm hover:bg-forth"
          >
            Last 90 Days
          </button>
          <button
            onClick={() => {
              setStartDate(dayjs().startOf('month').format('YYYY-MM-DD'));
              setEndDate(dayjs().format('YYYY-MM-DD'));
            }}
            className="h-[32px] bg-boxBg text-textColor rounded-md text-sm hover:bg-forth"
          >
            This Month
          </button>
        </div>
      </div>
    </div>
  );
};
