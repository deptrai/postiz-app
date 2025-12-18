'use client';

import React from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export type ThumbnailStyle = 'text-heavy' | 'face' | 'action' | 'minimal' | 'before-after' | 'curiosity-gap';

export interface StylePerformance {
  style: ThumbnailStyle;
  styleLabel: string;
  avgCtr: number;
  videoCount: number;
  totalImpressions: number;
  totalClicks: number;
  confidenceScore: number;
  rank: number;
  benchmark: number;
  vsIndustry: 'above' | 'at' | 'below';
}

export interface StylePerformanceChartProps {
  styles: StylePerformance[];
  bestStyle: ThumbnailStyle;
  worstStyle: ThumbnailStyle;
  recommendations: string[];
  isLoading?: boolean;
}

const STYLE_COLORS: Record<ThumbnailStyle, string> = {
  'text-heavy': '#3B82F6',
  'face': '#22C55E',
  'action': '#F97316',
  'minimal': '#6B7280',
  'before-after': '#A855F7',
  'curiosity-gap': '#EAB308',
};

const VS_INDUSTRY_ICONS: Record<string, string> = {
  above: '📈',
  at: '➡️',
  below: '📉',
};

export function StylePerformanceChart({
  styles,
  bestStyle,
  worstStyle,
  recommendations,
  isLoading = false,
}: StylePerformanceChartProps) {
  const t = useT();
  
  if (isLoading) {
    return (
      <div className="bg-third rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-64 bg-gray-700 rounded" />
      </div>
    );
  }

  if (!styles || styles.length === 0) {
    return (
      <div className="bg-third rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('style_performance')}</h3>
        <div className="text-center text-gray-400 py-8">{t('no_style_data')}</div>
      </div>
    );
  }

  const chartData = styles.map((s) => ({
    name: s.styleLabel,
    ctr: s.avgCtr,
    benchmark: s.benchmark,
    videoCount: s.videoCount,
    confidence: s.confidenceScore,
    style: s.style,
    vsIndustry: s.vsIndustry,
  }));

  const avgCtr = styles.reduce((sum, s) => sum + s.avgCtr, 0) / styles.length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-sm text-gray-300">
            CTR: <span className="text-purple-400 font-medium">{data.ctr}%</span>
          </p>
          <p className="text-sm text-gray-300">
            Industry Benchmark: <span className="text-gray-400">{data.benchmark}%</span>
          </p>
          <p className="text-sm text-gray-300">
            Videos: <span className="text-gray-400">{data.videoCount}</span>
          </p>
          <p className="text-sm text-gray-300">
            Confidence: <span className="text-gray-400">{data.confidence}%</span>
          </p>
          <p className="text-sm mt-1">
            {VS_INDUSTRY_ICONS[data.vsIndustry]} {data.vsIndustry === 'above' ? 'Above' : data.vsIndustry === 'below' ? 'Below' : 'At'} industry
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-third rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{t('style_performance')}</h3>
          <p className="text-sm text-gray-400">{t('ctr_by_style')}</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            <span className="text-gray-400">{t('your_ctr')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-dashed border-gray-500 rounded" />
            <span className="text-gray-400">{t('industry_avg')}</span>
          </div>
        </div>
      </div>

      {/* Simple Bar Visualization */}
      <div className="space-y-3">
        {chartData.map((item, index) => {
          const maxCtr = Math.max(...chartData.map(d => d.ctr));
          const widthPercent = maxCtr > 0 ? (item.ctr / maxCtr) * 100 : 0;
          return (
            <div key={index} className="flex items-center gap-3">
              <div className="w-28 text-sm text-gray-300 truncate">{item.name}</div>
              <div className="flex-1 h-6 bg-gray-700 rounded overflow-hidden relative">
                <div
                  className="h-full bg-purple-500 rounded transition-all duration-300"
                  style={{ width: `${widthPercent}%` }}
                />
                {item.benchmark && (
                  <div
                    className="absolute top-0 h-full w-0.5 bg-gray-400"
                    style={{ left: `${(item.benchmark / maxCtr) * 100}%` }}
                  />
                )}
              </div>
              <div className="w-16 text-right text-sm font-medium text-purple-400">{item.ctr}%</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="text-xs text-green-400 mb-1">🏆 {t('best_style')}</div>
          <div className="text-sm text-white">
            {styles.find((s) => s.style === bestStyle)?.styleLabel}
          </div>
          <div className="text-lg font-bold text-green-400">
            {styles.find((s) => s.style === bestStyle)?.avgCtr}% {t('ctr')}
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="text-xs text-red-400 mb-1">📉 {t('lowest_style')}</div>
          <div className="text-sm text-white">
            {styles.find((s) => s.style === worstStyle)?.styleLabel}
          </div>
          <div className="text-lg font-bold text-red-400">
            {styles.find((s) => s.style === worstStyle)?.avgCtr}% {t('ctr')}
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-400 mb-2">{t('recommendations')}</h4>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-purple-400">💡</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-400 mb-2">{t('style_breakdown')}</h4>
        <div className="grid grid-cols-3 gap-2">
          {styles.map((style) => (
            <div
              key={style.style}
              className="bg-gray-700/30 rounded-lg p-2 text-center"
            >
              <div className="text-xs text-gray-400">{style.styleLabel}</div>
              <div className="text-sm font-medium text-white">{style.avgCtr}%</div>
              <div className="text-xs text-gray-500">{style.videoCount} videos</div>
              <div className="text-xs mt-1">
                {VS_INDUSTRY_ICONS[style.vsIndustry]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
