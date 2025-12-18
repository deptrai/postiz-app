'use client';

import React from 'react';

// Types matching backend
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface TimingWindow {
  startHour: number;
  endHour: number;
  dayOfWeek: number;
  label: string;
  score: number;
  confidence: ConfidenceLevel;
  successRate: number;
  dataPoints: number;
}

export interface BestOverallTime {
  dayOfWeek: number;
  hour: number;
  dayName: string;
  timeLabel: string;
  confidence: ConfidenceLevel;
  successRate: number;
}

interface ViralTimingCardProps {
  recommendedWindows: TimingWindow[];
  bestOverallTime: BestOverallTime;
  insights: string[];
  isLoading?: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function getConfidenceBgColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'bg-green-500/20 border-green-500/30';
    case 'medium':
      return 'bg-yellow-500/20 border-yellow-500/30';
    case 'low':
      return 'bg-red-500/20 border-red-500/30';
    default:
      return 'bg-gray-500/20 border-gray-500/30';
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function ViralTimingCard({
  recommendedWindows,
  bestOverallTime,
  insights,
  isLoading = false,
}: ViralTimingCardProps) {
  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-700 rounded mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-third rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Optimal Timing
      </h3>

      {/* Best Overall Time */}
      <div className={`p-4 rounded-lg border mb-6 ${getConfidenceBgColor(bestOverallTime.confidence)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Best Time to Post</span>
          <span className={`text-xs px-2 py-1 rounded-full capitalize ${getConfidenceColor(bestOverallTime.confidence)} bg-black/20`}>
            {bestOverallTime.confidence} confidence
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-white">
            {bestOverallTime.dayName}
          </div>
          <div className="text-xl text-purple-400">
            {bestOverallTime.timeLabel}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-400">
          {Math.round(bestOverallTime.successRate * 100)}% historical success rate
        </div>
      </div>

      {/* Recommended Windows */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Recommended Windows</h4>
        <div className="space-y-3">
          {recommendedWindows.slice(0, 5).map((window, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-input/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`text-lg font-bold ${getScoreColor(window.score)}`}>
                  {window.score}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {window.label}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatHour(window.startHour)} - {formatHour(window.endHour)}
                    {window.dayOfWeek >= 0 && ` • ${DAY_NAMES[window.dayOfWeek]}`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs ${getConfidenceColor(window.confidence)}`}>
                  {window.confidence}
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round(window.successRate * 100)}% success
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Insights</h4>
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <svg className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ViralTimingCard;
