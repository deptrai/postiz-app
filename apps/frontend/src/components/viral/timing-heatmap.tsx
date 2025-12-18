'use client';

import React from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

// Types matching backend
export interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  value: number;
  label: string;
}

export interface TimeSlot {
  dayOfWeek: number;
  hour: number;
  score: number;
}

interface TimingHeatmapProps {
  heatmap: HeatmapCell[][];
  peakTimes: TimeSlot[];
  lowTimes: TimeSlot[];
  averageEngagement: number;
  onCellClick?: (cell: HeatmapCell) => void;
  isLoading?: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];

function getHeatColor(value: number): string {
  if (value >= 80) return 'bg-green-500';
  if (value >= 70) return 'bg-green-600';
  if (value >= 60) return 'bg-yellow-500';
  if (value >= 50) return 'bg-yellow-600';
  if (value >= 40) return 'bg-orange-500';
  if (value >= 30) return 'bg-orange-600';
  return 'bg-red-600';
}

function getHeatOpacity(value: number): string {
  const opacity = Math.max(0.3, value / 100);
  return `opacity-${Math.round(opacity * 100)}`;
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function TimingHeatmap({
  heatmap,
  peakTimes,
  lowTimes,
  averageEngagement,
  onCellClick,
  isLoading = false,
}: TimingHeatmapProps) {
  const t = useT();
  
  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-48 bg-gray-700 rounded"></div>
      </div>
    );
  }

  // Show hours in 3-hour increments for better readability
  const displayHours = [0, 3, 6, 9, 12, 15, 18, 21];

  return (
    <div className="bg-third rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Engagement Heatmap
      </h3>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
        <span>Low</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <div className="w-4 h-4 bg-orange-600 rounded"></div>
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <div className="w-4 h-4 bg-yellow-600 rounded"></div>
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <div className="w-4 h-4 bg-green-600 rounded"></div>
          <div className="w-4 h-4 bg-green-500 rounded"></div>
        </div>
        <span>High</span>
        <span className="ml-auto">Avg: {Math.round(averageEngagement)}</span>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex mb-1">
            <div className="w-12"></div>
            {displayHours.map((hour) => (
              <div key={hour} className="flex-1 text-center text-xs text-gray-500">
                {HOUR_LABELS[hour / 3]}
              </div>
            ))}
          </div>

          {/* Heatmap rows */}
          {heatmap.map((row, dayIndex) => (
            <div key={dayIndex} className="flex mb-1">
              <div className="w-12 text-xs text-gray-400 flex items-center">
                {DAY_NAMES[dayIndex]}
              </div>
              <div className="flex-1 flex gap-0.5">
                {displayHours.map((hour) => {
                  const cell = row[hour];
                  if (!cell) return null;
                  
                  // Average the 3-hour block
                  const blockCells = [row[hour], row[hour + 1], row[hour + 2]].filter(Boolean);
                  const avgValue = blockCells.reduce((sum, c) => sum + c.value, 0) / blockCells.length;
                  
                  return (
                    <div
                      key={hour}
                      className={`flex-1 h-8 rounded cursor-pointer transition-transform hover:scale-110 hover:z-10 ${getHeatColor(avgValue)}`}
                      style={{ opacity: Math.max(0.3, avgValue / 100) }}
                      onClick={() => onCellClick?.(cell)}
                      title={`${DAY_NAMES[dayIndex]} ${formatHour(hour)}-${formatHour(hour + 3)}: ${Math.round(avgValue)}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Peak Times */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Peak Times
          </h4>
          <div className="space-y-1">
            {peakTimes.slice(0, 5).map((slot, index) => (
              <div key={index} className="text-xs text-gray-300 flex items-center gap-2">
                <span className="text-green-400 font-medium">{slot.score}</span>
                <span>{DAY_NAMES[slot.dayOfWeek]} {formatHour(slot.hour)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            Avoid Times
          </h4>
          <div className="space-y-1">
            {lowTimes.slice(0, 5).map((slot, index) => (
              <div key={index} className="text-xs text-gray-300 flex items-center gap-2">
                <span className="text-red-400 font-medium">{slot.score}</span>
                <span>{DAY_NAMES[slot.dayOfWeek]} {formatHour(slot.hour)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimingHeatmap;
