'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface RetentionCurve {
  videoId: string;
  videoTitle?: string;
  videoDuration: number;
  totalViewers: number;
  points: Array<{
    percentage: number;
    retention: number;
    viewersCount: number;
  }>;
  dropOffPoints: Array<{
    percentage: number;
    dropAmount: number;
    severity: 'low' | 'medium' | 'high';
    viewerLoss: number;
  }>;
  averageRetention: number;
  completionRate: number;
}

export interface VideoComparison {
  videos: Array<{
    videoId: string;
    videoTitle: string;
    curve: RetentionCurve;
  }>;
  insights: string[];
}

export interface VideoComparisonViewProps {
  comparison: VideoComparison;
  isLoading?: boolean;
}

const VIDEO_COLORS = ['#a855f7', '#10b981', '#3b82f6', '#f59e0b'];

export function VideoComparisonView({
  comparison,
  isLoading = false,
}: VideoComparisonViewProps) {
  const [selectedVideos, setSelectedVideos] = useState<string[]>(
    comparison.videos.map(v => v.videoId)
  );

  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-96 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData: any[] = [];
  const maxPoints = Math.max(...comparison.videos.map(v => v.curve.points.length));
  
  for (let i = 0; i < maxPoints; i++) {
    const dataPoint: any = {};
    
    comparison.videos.forEach((video, index) => {
      if (video.curve.points[i]) {
        dataPoint.percentage = video.curve.points[i].percentage;
        dataPoint[video.videoId] = video.curve.points[i].retention;
      }
    });
    
    chartData.push(dataPoint);
  }

  // Toggle video visibility
  const toggleVideo = (videoId: string) => {
    if (selectedVideos.includes(videoId)) {
      if (selectedVideos.length > 1) {
        setSelectedVideos(selectedVideos.filter(id => id !== videoId));
      }
    } else {
      setSelectedVideos([...selectedVideos, videoId]);
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-white mb-2">
            {payload[0].payload.percentage}% Progress
          </p>
          {payload.map((entry: any, index: number) => {
            const video = comparison.videos.find(v => v.videoId === entry.dataKey);
            return (
              <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4 text-sm">
                <span style={{ color: entry.color }}>{video?.videoTitle}</span>
                <span className="font-medium text-white">{entry.value.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-third rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Video Comparison
        </h3>
        <p className="text-sm text-gray-400">
          Comparing {comparison.videos.length} video{comparison.videos.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Video Selector Toggles */}
      <div className="mb-6 flex flex-wrap gap-3">
        {comparison.videos.map((video, index) => (
          <button
            key={video.videoId}
            onClick={() => toggleVideo(video.videoId)}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              selectedVideos.includes(video.videoId)
                ? 'border-current bg-current/20'
                : 'border-gray-600 bg-gray-700/50 opacity-50'
            }`}
            style={{
              color: selectedVideos.includes(video.videoId) ? VIDEO_COLORS[index] : '#9ca3af',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: VIDEO_COLORS[index] }}
              ></div>
              <span className="font-medium">{video.videoTitle}</span>
            </div>
            <div className="text-xs mt-1 opacity-75">
              Avg: {video.curve.averageRetention.toFixed(1)}% · Completion: {video.curve.completionRate.toFixed(1)}%
            </div>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-96 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="percentage"
              stroke="#9ca3af"
              label={{ value: 'Video Progress (%)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
            />
            <YAxis
              stroke="#9ca3af"
              label={{ value: 'Viewer Retention (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {comparison.videos.map((video, index) => (
              selectedVideos.includes(video.videoId) && (
                <Line
                  key={video.videoId}
                  type="monotone"
                  dataKey={video.videoId}
                  stroke={VIDEO_COLORS[index]}
                  strokeWidth={3}
                  dot={{ fill: VIDEO_COLORS[index], r: 3 }}
                  name={video.videoTitle}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Comparison Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-sm font-medium text-gray-400 pb-3">Metric</th>
              {comparison.videos.map((video, index) => (
                <th
                  key={video.videoId}
                  className="text-right text-sm font-medium pb-3"
                  style={{ color: VIDEO_COLORS[index] }}
                >
                  {video.videoTitle}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-gray-800">
              <td className="py-3 text-gray-400">Avg Retention</td>
              {comparison.videos.map(video => (
                <td key={video.videoId} className="py-3 text-right font-semibold text-white">
                  {video.curve.averageRetention.toFixed(1)}%
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-800">
              <td className="py-3 text-gray-400">Completion Rate</td>
              {comparison.videos.map(video => (
                <td key={video.videoId} className="py-3 text-right font-semibold text-white">
                  {video.curve.completionRate.toFixed(1)}%
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-800">
              <td className="py-3 text-gray-400">Hook Retention (10%)</td>
              {comparison.videos.map(video => {
                const hookPoint = video.curve.points.find(p => p.percentage === 10);
                return (
                  <td key={video.videoId} className="py-3 text-right font-semibold text-white">
                    {hookPoint?.retention.toFixed(1)}%
                  </td>
                );
              })}
            </tr>
            <tr className="border-b border-gray-800">
              <td className="py-3 text-gray-400">Mid Retention (50%)</td>
              {comparison.videos.map(video => {
                const midPoint = video.curve.points.find(p => p.percentage === 50);
                return (
                  <td key={video.videoId} className="py-3 text-right font-semibold text-white">
                    {midPoint?.retention.toFixed(1)}%
                  </td>
                );
              })}
            </tr>
            <tr className="border-b border-gray-800">
              <td className="py-3 text-gray-400">Total Viewers</td>
              {comparison.videos.map(video => (
                <td key={video.videoId} className="py-3 text-right font-semibold text-white">
                  {video.curve.totalViewers.toLocaleString()}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-800">
              <td className="py-3 text-gray-400">Drop-offs</td>
              {comparison.videos.map(video => (
                <td key={video.videoId} className="py-3 text-right font-semibold text-white">
                  {video.curve.dropOffPoints.length}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 text-gray-400">Duration</td>
              {comparison.videos.map(video => (
                <td key={video.videoId} className="py-3 text-right font-semibold text-white">
                  {video.curve.videoDuration}s
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Insights */}
      {comparison.insights.length > 0 && (
        <div className="bg-input/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Key Insights
          </h4>
          <ul className="space-y-2">
            {comparison.insights.map((insight, index) => (
              <li key={`insight-${index}`} className="flex items-start gap-2 text-sm text-gray-300">
                <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Winner Badge */}
      <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏆</span>
          <div>
            <p className="text-sm font-medium text-purple-400">Best Performer</p>
            <p className="text-white font-semibold">
              {comparison.videos.sort((a, b) => b.curve.averageRetention - a.curve.averageRetention)[0].videoTitle}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Study this video's strengths and apply them to future content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
