'use client';

import React from 'react';
import { TimingWindow, ConfidenceLevel } from './viral-timing-card';

export type ContentFormat = 'reel' | 'video' | 'post' | 'story';

interface FormatTimingTabsProps {
  activeFormat: ContentFormat;
  onFormatChange: (format: ContentFormat) => void;
  formatWindows?: {
    format: ContentFormat;
    windows: TimingWindow[];
  };
  isLoading?: boolean;
}

const FORMAT_INFO: Record<ContentFormat, { icon: React.ReactNode; label: string; description: string }> = {
  reel: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Reels',
    description: 'Short-form vertical videos',
  },
  video: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Videos',
    description: 'Long-form video content',
  },
  post: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Posts',
    description: 'Image and carousel posts',
  },
  story: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Stories',
    description: '24-hour temporary content',
  },
};

function getConfidenceColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'text-green-400';
    case 'medium':
      return 'text-yellow-400';
    case 'low':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function FormatTimingTabs({
  activeFormat,
  onFormatChange,
  formatWindows,
  isLoading = false,
}: FormatTimingTabsProps) {
  const formats: ContentFormat[] = ['reel', 'video', 'post', 'story'];

  return (
    <div className="bg-third rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        Format-Specific Timing
      </h3>

      {/* Format Tabs */}
      <div className="flex gap-2 mb-6">
        {formats.map((format) => {
          const info = FORMAT_INFO[format];
          const isActive = activeFormat === format;
          
          return (
            <button
              key={format}
              onClick={() => onFormatChange(format)}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-500 text-white'
                  : 'bg-input text-gray-300 hover:bg-input/80'
              }`}
            >
              {info.icon}
              <span className="text-xs font-medium">{info.label}</span>
            </button>
          );
        })}
      </div>

      {/* Format Description */}
      <div className="mb-4 p-3 bg-input/50 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          {FORMAT_INFO[activeFormat].icon}
          <span className="font-medium">{FORMAT_INFO[activeFormat].label}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {FORMAT_INFO[activeFormat].description}
        </p>
      </div>

      {/* Windows for selected format */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      ) : formatWindows && formatWindows.windows.length > 0 ? (
        <div className="space-y-3">
          {formatWindows.windows.map((window, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-input/30 rounded-lg border border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-purple-400">{window.score}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{window.label}</div>
                  <div className="text-xs text-gray-400">
                    {formatHour(window.startHour)} - {formatHour(window.endHour)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-medium ${getConfidenceColor(window.confidence)}`}>
                  {window.confidence} confidence
                </div>
                <div className="text-xs text-gray-500">
                  {window.dataPoints} data points
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No timing data available for {FORMAT_INFO[activeFormat].label}</p>
        </div>
      )}
    </div>
  );
}

export default FormatTimingTabs;
