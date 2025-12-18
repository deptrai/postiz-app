import { Injectable } from '@nestjs/common';

// [ASSUMPTION: Video duration available from content metadata]
// [ASSUMPTION: Benchmark data pre-configured based on industry research]

export type VideoFormat = 'reel' | 'video' | 'story';
export type LengthRange = '0-15' | '15-30' | '30-60' | '60-180' | '180+';

export interface LengthPerformance {
  range: LengthRange;
  rangeLabel: string;
  rangeSeconds: { min: number; max: number };
  videoCount: number;
  avgViews: number;
  avgEngagementRate: number;
  avgCompletionRate: number;
  topPerformer?: {
    videoId: string;
    title: string;
    views: number;
    engagementRate: number;
  };
}

export interface PerformanceByLengthResult {
  organizationId: string;
  format?: VideoFormat;
  dateRange?: { start: Date; end: Date };
  performances: LengthPerformance[];
  totalVideos: number;
  bestPerformingRange: LengthRange;
}

export interface OptimalLengthRecommendation {
  format: VideoFormat;
  optimalRange: LengthRange;
  optimalRangeLabel: string;
  sweetSpotSeconds: { min: number; max: number };
  confidenceScore: number;
  reasoning: string;
  userAvgLength: number;
  recommendedAdjustment: 'shorter' | 'longer' | 'optimal';
}

export interface LengthBenchmark {
  niche: string;
  format: VideoFormat;
  industryOptimal: { min: number; max: number };
  industryOptimalLabel: string;
  userOptimal: { min: number; max: number };
  userOptimalLabel: string;
  deviation: number;
  performance: 'above' | 'at' | 'below';
  insights: string[];
}

export interface LengthOptimizationTip {
  priority: 'high' | 'medium' | 'low';
  category: 'hook' | 'pacing' | 'content' | 'format' | 'general';
  issue: string;
  tip: string;
  example?: string;
  expectedImprovement: string;
}

interface VideoData {
  videoId: string;
  title: string;
  duration: number;
  views: number;
  engagementRate: number;
  completionRate: number;
  format: VideoFormat;
}

@Injectable()
export class VideoLengthAnalyticsService {
  private readonly LENGTH_RANGES: Record<LengthRange, { min: number; max: number; label: string }> = {
    '0-15': { min: 0, max: 15, label: '0-15 seconds (Short)' },
    '15-30': { min: 15, max: 30, label: '15-30 seconds (Medium-Short)' },
    '30-60': { min: 30, max: 60, label: '30-60 seconds (Medium)' },
    '60-180': { min: 60, max: 180, label: '1-3 minutes (Long)' },
    '180+': { min: 180, max: Infinity, label: '3+ minutes (Extended)' },
  };

  private readonly INDUSTRY_BENCHMARKS: Record<VideoFormat, { min: number; max: number }> = {
    reel: { min: 15, max: 30 },
    story: { min: 7, max: 15 },
    video: { min: 60, max: 180 },
  };

  private readonly NICHE_ADJUSTMENTS: Record<string, number> = {
    educational: 1.2,
    entertainment: 0.9,
    tutorial: 1.5,
    news: 1.0,
    fitness: 1.1,
    food: 1.0,
    travel: 1.2,
    tech: 1.1,
    lifestyle: 0.95,
    gaming: 1.3,
  };

  private getLengthRange(duration: number): LengthRange {
    if (duration <= 15) return '0-15';
    if (duration <= 30) return '15-30';
    if (duration <= 60) return '30-60';
    if (duration <= 180) return '60-180';
    return '180+';
  }

  private generateMockVideoData(organizationId: string, format?: VideoFormat): VideoData[] {
    const formats: VideoFormat[] = format ? [format] : ['reel', 'video', 'story'];
    const videos: VideoData[] = [];

    formats.forEach((fmt) => {
      const count = Math.floor(Math.random() * 20) + 10;
      for (let i = 0; i < count; i++) {
        let duration: number;
        if (fmt === 'reel') {
          duration = Math.floor(Math.random() * 60) + 5;
        } else if (fmt === 'story') {
          duration = Math.floor(Math.random() * 30) + 5;
        } else {
          duration = Math.floor(Math.random() * 300) + 30;
        }

        const baseEngagement = fmt === 'reel' ? 0.08 : fmt === 'story' ? 0.06 : 0.04;
        const lengthPenalty = duration > 60 ? (duration - 60) * 0.0005 : 0;

        videos.push({
          videoId: `${organizationId}-${fmt}-${i}`,
          title: `${fmt.charAt(0).toUpperCase() + fmt.slice(1)} Video ${i + 1}`,
          duration,
          views: Math.floor(Math.random() * 50000) + 1000,
          engagementRate: Math.max(0.01, baseEngagement - lengthPenalty + (Math.random() * 0.04 - 0.02)),
          completionRate: Math.max(0.1, 0.8 - (duration / 500) + (Math.random() * 0.2 - 0.1)),
          format: fmt,
        });
      }
    });

    return videos;
  }

  /**
   * Get performance breakdown by video length ranges
   * AC #1: Performance breakdown by length ranges
   */
  async getPerformanceByLength(
    organizationId: string,
    filters?: { format?: VideoFormat; startDate?: Date; endDate?: Date }
  ): Promise<PerformanceByLengthResult> {
    const videos = this.generateMockVideoData(organizationId, filters?.format);

    const rangePerformances: Record<LengthRange, {
      videos: VideoData[];
      totalViews: number;
      totalEngagement: number;
      totalCompletion: number;
    }> = {
      '0-15': { videos: [], totalViews: 0, totalEngagement: 0, totalCompletion: 0 },
      '15-30': { videos: [], totalViews: 0, totalEngagement: 0, totalCompletion: 0 },
      '30-60': { videos: [], totalViews: 0, totalEngagement: 0, totalCompletion: 0 },
      '60-180': { videos: [], totalViews: 0, totalEngagement: 0, totalCompletion: 0 },
      '180+': { videos: [], totalViews: 0, totalEngagement: 0, totalCompletion: 0 },
    };

    videos.forEach((video) => {
      const range = this.getLengthRange(video.duration);
      rangePerformances[range].videos.push(video);
      rangePerformances[range].totalViews += video.views;
      rangePerformances[range].totalEngagement += video.engagementRate;
      rangePerformances[range].totalCompletion += video.completionRate;
    });

    const performances: LengthPerformance[] = [];
    let bestRange: LengthRange = '15-30';
    let bestEngagement = 0;

    (Object.keys(rangePerformances) as LengthRange[]).forEach((range) => {
      const data = rangePerformances[range];
      const count = data.videos.length;

      if (count > 0) {
        const avgEngagement = data.totalEngagement / count;
        if (avgEngagement > bestEngagement) {
          bestEngagement = avgEngagement;
          bestRange = range;
        }

        const topVideo = data.videos.reduce((best, current) =>
          current.engagementRate > best.engagementRate ? current : best
        );

        performances.push({
          range,
          rangeLabel: this.LENGTH_RANGES[range].label,
          rangeSeconds: {
            min: this.LENGTH_RANGES[range].min,
            max: this.LENGTH_RANGES[range].max === Infinity ? 999 : this.LENGTH_RANGES[range].max,
          },
          videoCount: count,
          avgViews: Math.round(data.totalViews / count),
          avgEngagementRate: Math.round(avgEngagement * 10000) / 100,
          avgCompletionRate: Math.round((data.totalCompletion / count) * 100),
          topPerformer: {
            videoId: topVideo.videoId,
            title: topVideo.title,
            views: topVideo.views,
            engagementRate: Math.round(topVideo.engagementRate * 10000) / 100,
          },
        });
      } else {
        performances.push({
          range,
          rangeLabel: this.LENGTH_RANGES[range].label,
          rangeSeconds: {
            min: this.LENGTH_RANGES[range].min,
            max: this.LENGTH_RANGES[range].max === Infinity ? 999 : this.LENGTH_RANGES[range].max,
          },
          videoCount: 0,
          avgViews: 0,
          avgEngagementRate: 0,
          avgCompletionRate: 0,
        });
      }
    });

    return {
      organizationId,
      format: filters?.format,
      dateRange: filters?.startDate && filters?.endDate
        ? { start: filters.startDate, end: filters.endDate }
        : undefined,
      performances,
      totalVideos: videos.length,
      bestPerformingRange: bestRange,
    };
  }

  /**
   * Get optimal length recommendation for a format
   * AC #2, #4: Optimal length and sweet spot
   */
  async getOptimalLength(
    organizationId: string,
    format: VideoFormat
  ): Promise<OptimalLengthRecommendation> {
    const performanceData = await this.getPerformanceByLength(organizationId, { format });

    const validPerformances = performanceData.performances.filter((p) => p.videoCount > 0);
    const bestPerformance = validPerformances.reduce((best, current) =>
      current.avgEngagementRate > best.avgEngagementRate ? current : best
    );

    const industryBenchmark = this.INDUSTRY_BENCHMARKS[format];
    const totalVideos = validPerformances.reduce((sum, p) => sum + p.videoCount, 0);
    const confidenceScore = Math.min(100, Math.round((totalVideos / 50) * 100));

    const userAvgLength = validPerformances.reduce((sum, p) => {
      const midpoint = (p.rangeSeconds.min + Math.min(p.rangeSeconds.max, 300)) / 2;
      return sum + midpoint * p.videoCount;
    }, 0) / totalVideos;

    let recommendedAdjustment: 'shorter' | 'longer' | 'optimal' = 'optimal';
    const optimalMidpoint = (bestPerformance.rangeSeconds.min + Math.min(bestPerformance.rangeSeconds.max, 300)) / 2;

    if (userAvgLength > optimalMidpoint * 1.2) {
      recommendedAdjustment = 'shorter';
    } else if (userAvgLength < optimalMidpoint * 0.8) {
      recommendedAdjustment = 'longer';
    }

    let reasoning = '';
    if (bestPerformance.range === '15-30') {
      reasoning = `Your ${format}s perform best in the 15-30 second range, matching industry standards for short-form content.`;
    } else if (bestPerformance.range === '0-15') {
      reasoning = `Ultra-short content (0-15s) shows highest engagement. Consider quick, punchy content for maximum impact.`;
    } else if (bestPerformance.range === '30-60') {
      reasoning = `Medium-length content (30-60s) works well for your audience. This allows for more detailed storytelling.`;
    } else if (bestPerformance.range === '60-180') {
      reasoning = `Your audience prefers longer content (1-3 min). They're engaged and willing to invest time in quality content.`;
    } else {
      reasoning = `Extended content (3+ min) performs best. Your audience values in-depth, comprehensive content.`;
    }

    return {
      format,
      optimalRange: bestPerformance.range,
      optimalRangeLabel: bestPerformance.rangeLabel,
      sweetSpotSeconds: {
        min: bestPerformance.rangeSeconds.min,
        max: Math.min(bestPerformance.rangeSeconds.max, 300),
      },
      confidenceScore,
      reasoning,
      userAvgLength: Math.round(userAvgLength),
      recommendedAdjustment,
    };
  }

  /**
   * Get niche benchmark comparison
   * AC #3: Comparison with niche benchmarks
   */
  async getNicheLengthBenchmarks(
    organizationId: string,
    niche: string,
    format: VideoFormat
  ): Promise<LengthBenchmark> {
    const optimalLength = await this.getOptimalLength(organizationId, format);

    const baseIndustry = this.INDUSTRY_BENCHMARKS[format];
    const nicheAdjustment = this.NICHE_ADJUSTMENTS[niche.toLowerCase()] || 1.0;

    const industryOptimal = {
      min: Math.round(baseIndustry.min * nicheAdjustment),
      max: Math.round(baseIndustry.max * nicheAdjustment),
    };

    const userMidpoint = (optimalLength.sweetSpotSeconds.min + optimalLength.sweetSpotSeconds.max) / 2;
    const industryMidpoint = (industryOptimal.min + industryOptimal.max) / 2;
    const deviation = Math.round(((userMidpoint - industryMidpoint) / industryMidpoint) * 100);

    let performance: 'above' | 'at' | 'below' = 'at';
    if (deviation > 10) performance = 'above';
    else if (deviation < -10) performance = 'below';

    const insights: string[] = [];

    if (performance === 'above') {
      insights.push(`Your optimal length is ${Math.abs(deviation)}% longer than industry average for ${niche} ${format}s.`);
      insights.push('Your audience may prefer more detailed content.');
    } else if (performance === 'below') {
      insights.push(`Your optimal length is ${Math.abs(deviation)}% shorter than industry average for ${niche} ${format}s.`);
      insights.push('Your audience prefers quick, concise content.');
    } else {
      insights.push(`Your optimal length aligns with industry standards for ${niche} ${format}s.`);
      insights.push('You\'re hitting the sweet spot for your niche.');
    }

    insights.push(`Industry recommends ${industryOptimal.min}-${industryOptimal.max}s for ${niche} ${format}s.`);

    return {
      niche,
      format,
      industryOptimal,
      industryOptimalLabel: `${industryOptimal.min}-${industryOptimal.max} seconds`,
      userOptimal: optimalLength.sweetSpotSeconds,
      userOptimalLabel: `${optimalLength.sweetSpotSeconds.min}-${optimalLength.sweetSpotSeconds.max} seconds`,
      deviation,
      performance,
      insights,
    };
  }

  /**
   * Get length optimization tips
   * AC #5: Actionable tips to optimize video length
   */
  async getLengthOptimizationTips(
    organizationId: string,
    format: VideoFormat
  ): Promise<LengthOptimizationTip[]> {
    const performanceData = await this.getPerformanceByLength(organizationId, { format });
    const optimalLength = await this.getOptimalLength(organizationId, format);

    const tips: LengthOptimizationTip[] = [];

    if (optimalLength.recommendedAdjustment === 'shorter') {
      tips.push({
        priority: 'high',
        category: 'content',
        issue: 'Your videos are longer than optimal',
        tip: 'Trim unnecessary content. Focus on the core message and remove filler.',
        example: 'Cut long intros, remove repetitive explanations, and get to the point faster.',
        expectedImprovement: '+15-25% completion rate',
      });

      tips.push({
        priority: 'medium',
        category: 'pacing',
        issue: 'Content may feel slow',
        tip: 'Increase pacing with faster cuts and transitions.',
        example: 'Use jump cuts every 3-5 seconds to maintain viewer attention.',
        expectedImprovement: '+10-15% retention',
      });
    }

    if (optimalLength.recommendedAdjustment === 'longer') {
      tips.push({
        priority: 'high',
        category: 'content',
        issue: 'Your videos may be too short',
        tip: 'Add more value and depth to your content.',
        example: 'Include additional tips, behind-the-scenes, or extended explanations.',
        expectedImprovement: '+20-30% watch time',
      });
    }

    const lowCompletionRanges = performanceData.performances.filter(
      (p) => p.videoCount > 0 && p.avgCompletionRate < 40
    );

    if (lowCompletionRanges.length > 0) {
      tips.push({
        priority: 'high',
        category: 'hook',
        issue: `Low completion rates in ${lowCompletionRanges.map((r) => r.rangeLabel).join(', ')}`,
        tip: 'Improve your hook to keep viewers watching.',
        example: 'Start with a compelling question, surprising fact, or promise of value.',
        expectedImprovement: '+25-40% completion rate',
      });
    }

    if (format === 'reel' && optimalLength.optimalRange !== '15-30') {
      tips.push({
        priority: 'medium',
        category: 'format',
        issue: 'Reels perform best at 15-30 seconds',
        tip: 'Consider adjusting your reel length to the 15-30 second sweet spot.',
        example: 'Edit longer content into multiple shorter reels for better engagement.',
        expectedImprovement: '+10-20% engagement',
      });
    }

    if (format === 'story' && optimalLength.optimalRange !== '0-15') {
      tips.push({
        priority: 'medium',
        category: 'format',
        issue: 'Stories work best under 15 seconds',
        tip: 'Keep stories ultra-short for maximum impact.',
        example: 'One key message per story, use text overlays for quick communication.',
        expectedImprovement: '+15-25% completion',
      });
    }

    tips.push({
      priority: 'low',
      category: 'general',
      issue: 'Continuous optimization',
      tip: 'Test different lengths and analyze performance regularly.',
      example: 'Create A/B tests with same content at different lengths.',
      expectedImprovement: 'Ongoing improvement',
    });

    return tips.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}
