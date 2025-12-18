import { Injectable } from '@nestjs/common';

// [ASSUMPTION: Retention data calculated from view duration vs video length]
// [ASSUMPTION: Benchmark data pre-configured based on industry research]

export type VideoFormat = 'reel' | 'video' | 'story';
export type DropOffSeverity = 'low' | 'medium' | 'high';

export interface RetentionPoint {
  percentage: number; // 0-100 (video progress)
  retention: number; // 0-100 (% viewers remaining)
  viewersCount: number;
}

export interface DropOffPoint {
  percentage: number;
  dropAmount: number;
  severity: DropOffSeverity;
  viewerLoss: number;
}

export interface RetentionCurve {
  videoId: string;
  videoTitle?: string;
  videoDuration: number; // seconds
  totalViewers: number;
  points: RetentionPoint[];
  dropOffPoints: DropOffPoint[];
  averageRetention: number; // 0-100
  completionRate: number; // 0-100
}

export interface BenchmarkComparison {
  videoRetention: RetentionCurve;
  benchmark: {
    niche: string;
    format: VideoFormat;
    points: RetentionPoint[];
    averageRetention: number;
  };
  deviation: number; // % difference from benchmark
  performance: 'above' | 'at' | 'below';
}

export interface RetentionSuggestion {
  type: 'hook' | 'pacing' | 'length' | 'content' | 'payoff';
  priority: 'high' | 'medium' | 'low';
  dropOffPoint: number; // percentage where issue occurs
  issue: string;
  suggestion: string;
  expectedImprovement: string;
}

export interface VideoComparison {
  videos: Array<{
    videoId: string;
    videoTitle: string;
    curve: RetentionCurve;
  }>;
  insights: string[];
}

@Injectable()
export class RetentionAnalyticsService {
  // Benchmark data based on industry research
  private readonly BENCHMARKS: Record<
    VideoFormat,
    { points: Array<{ percentage: number; retention: number }> }
  > = {
    reel: {
      // Reels: 60% retention at 50% mark is good
      points: [
        { percentage: 0, retention: 100 },
        { percentage: 10, retention: 85 },
        { percentage: 20, retention: 75 },
        { percentage: 30, retention: 70 },
        { percentage: 40, retention: 65 },
        { percentage: 50, retention: 60 },
        { percentage: 60, retention: 55 },
        { percentage: 70, retention: 50 },
        { percentage: 80, retention: 45 },
        { percentage: 90, retention: 40 },
        { percentage: 100, retention: 35 },
      ],
    },
    video: {
      // Long-form: 50% retention at 50% mark is good
      points: [
        { percentage: 0, retention: 100 },
        { percentage: 10, retention: 75 },
        { percentage: 20, retention: 65 },
        { percentage: 30, retention: 58 },
        { percentage: 40, retention: 54 },
        { percentage: 50, retention: 50 },
        { percentage: 60, retention: 46 },
        { percentage: 70, retention: 42 },
        { percentage: 80, retention: 38 },
        { percentage: 90, retention: 33 },
        { percentage: 100, retention: 28 },
      ],
    },
    story: {
      // Stories: Similar to reels but slightly lower retention
      points: [
        { percentage: 0, retention: 100 },
        { percentage: 10, retention: 80 },
        { percentage: 20, retention: 70 },
        { percentage: 30, retention: 63 },
        { percentage: 40, retention: 58 },
        { percentage: 50, retention: 53 },
        { percentage: 60, retention: 48 },
        { percentage: 70, retention: 43 },
        { percentage: 80, retention: 38 },
        { percentage: 90, retention: 33 },
        { percentage: 100, retention: 28 },
      ],
    },
  };

  /**
   * Get retention curve for a video
   * AC #1, #2: Visual retention graph with drop-off points
   */
  async getRetentionCurve(
    organizationId: string,
    videoId: string,
    viewData?: {
      totalViewers: number;
      viewsAtIntervals: Record<number, number>; // percentage -> viewer count
      videoDuration: number;
      videoTitle?: string;
    }
  ): Promise<RetentionCurve> {
    // [ASSUMPTION: View data provided or calculated from analytics]
    // In real implementation, this would query from database
    // For now, use provided data or generate sample data

    const totalViewers = viewData?.totalViewers || 1000;
    const videoDuration = viewData?.videoDuration || 60;
    const videoTitle = viewData?.videoTitle || `Video ${videoId}`;

    // Calculate retention points at intervals
    const points: RetentionPoint[] = [];
    const intervals = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    for (const percentage of intervals) {
      const viewersCount =
        viewData?.viewsAtIntervals?.[percentage] ||
        this.estimateViewersAtPoint(totalViewers, percentage);

      const retention = (viewersCount / totalViewers) * 100;

      points.push({
        percentage,
        retention,
        viewersCount,
      });
    }

    // Identify drop-off points (>10% drop between intervals)
    const dropOffPoints = this.identifyDropOffPoints(points, totalViewers);

    // Calculate average retention and completion rate
    const averageRetention = this.calculateAverageRetention(points);
    const completionRate = points[points.length - 1].retention;

    return {
      videoId,
      videoTitle,
      videoDuration,
      totalViewers,
      points,
      dropOffPoints,
      averageRetention,
      completionRate,
    };
  }

  /**
   * Get benchmark comparison
   * AC #3: Compare with niche benchmark
   */
  async getBenchmarkComparison(
    organizationId: string,
    videoId: string,
    niche: string,
    format: VideoFormat,
    retentionCurve?: RetentionCurve
  ): Promise<BenchmarkComparison> {
    // Get video retention curve if not provided
    const videoRetention =
      retentionCurve ||
      (await this.getRetentionCurve(organizationId, videoId));

    // Get benchmark for format
    const benchmarkPoints = this.BENCHMARKS[format].points;
    const benchmarkAverage = this.calculateAverageBenchmark(benchmarkPoints);

    // Calculate deviation
    const deviation = videoRetention.averageRetention - benchmarkAverage;

    // Determine performance
    let performance: 'above' | 'at' | 'below' = 'at';
    if (deviation > 5) performance = 'above';
    else if (deviation < -5) performance = 'below';

    return {
      videoRetention,
      benchmark: {
        niche,
        format,
        points: benchmarkPoints.map((p) => ({
          ...p,
          viewersCount: Math.round((p.retention / 100) * videoRetention.totalViewers),
        })),
        averageRetention: benchmarkAverage,
      },
      deviation,
      performance,
    };
  }

  /**
   * Get retention improvement suggestions
   * AC #4: Suggest improvements based on drop-off patterns
   */
  async getRetentionSuggestions(
    organizationId: string,
    videoId: string,
    retentionCurve?: RetentionCurve
  ): Promise<RetentionSuggestion[]> {
    // Get retention curve if not provided
    const curve =
      retentionCurve || (await this.getRetentionCurve(organizationId, videoId));

    const suggestions: RetentionSuggestion[] = [];

    // Analyze drop-off points and generate suggestions
    for (const dropOff of curve.dropOffPoints) {
      if (dropOff.percentage <= 10) {
        // Early drop (0-10%): Weak hook, misleading thumbnail
        suggestions.push({
          type: 'hook',
          priority: dropOff.severity === 'high' ? 'high' : 'medium',
          dropOffPoint: dropOff.percentage,
          issue: `${dropOff.dropAmount.toFixed(1)}% of viewers left within the first 10% of the video`,
          suggestion:
            'Improve your opening hook. Start with the most engaging content immediately. Avoid long intros or slow builds.',
          expectedImprovement: '+15-25% retention in first 10 seconds',
        });
      } else if (dropOff.percentage > 10 && dropOff.percentage <= 30) {
        // Second wave drop (10-30%): Hook didn't deliver on promise
        suggestions.push({
          type: 'content',
          priority: dropOff.severity === 'high' ? 'high' : 'medium',
          dropOffPoint: dropOff.percentage,
          issue: `Significant drop at ${dropOff.percentage}% - viewers may feel misled`,
          suggestion:
            'Ensure your content delivers on the promise made in the hook and thumbnail. Provide value quickly.',
          expectedImprovement: '+10-15% retention',
        });
      } else if (dropOff.percentage > 30 && dropOff.percentage <= 60) {
        // Mid drop (40-60%): Pacing issues, content drag
        suggestions.push({
          type: 'pacing',
          priority: dropOff.severity === 'high' ? 'high' : 'medium',
          dropOffPoint: dropOff.percentage,
          issue: `Drop-off at ${dropOff.percentage}% suggests pacing issues`,
          suggestion:
            'Tighten your pacing. Remove filler content, add pattern interrupts (cuts, zooms, text), maintain momentum.',
          expectedImprovement: '+8-12% retention',
        });
      } else if (dropOff.percentage > 60) {
        // Late drop (80-90%): Too long, no payoff
        suggestions.push({
          type: 'length',
          priority: dropOff.severity === 'high' ? 'medium' : 'low',
          dropOffPoint: dropOff.percentage,
          issue: `Drop-off at ${dropOff.percentage}% - video may be too long`,
          suggestion:
            'Consider shortening your video or delivering the payoff earlier. Viewers lose interest near the end.',
          expectedImprovement: '+5-10% completion rate',
        });
      }
    }

    // Check overall completion rate
    if (curve.completionRate < 30) {
      suggestions.push({
        type: 'payoff',
        priority: 'high',
        dropOffPoint: 100,
        issue: `Low completion rate (${curve.completionRate.toFixed(1)}%)`,
        suggestion:
          'Add a strong payoff or conclusion. Viewers need a reason to watch till the end. Consider adding a "stay tuned" moment.',
        expectedImprovement: '+10-20% completion rate',
      });
    }

    // Sort by priority
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Compare retention curves of multiple videos
   * AC #5: Compare 2-3 videos
   */
  async compareRetentionCurves(
    organizationId: string,
    videoIds: string[],
    videoData?: Array<{
      videoId: string;
      videoTitle: string;
      totalViewers: number;
      viewsAtIntervals: Record<number, number>;
      videoDuration: number;
    }>
  ): Promise<VideoComparison> {
    if (videoIds.length < 2 || videoIds.length > 3) {
      throw new Error('Can only compare 2-3 videos');
    }

    // Get retention curves for all videos
    const videos = await Promise.all(
      videoIds.map(async (videoId, index) => {
        const data = videoData?.[index];
        const curve = await this.getRetentionCurve(
          organizationId,
          videoId,
          data
        );
        return {
          videoId,
          videoTitle: data?.videoTitle || curve.videoTitle || `Video ${videoId}`,
          curve,
        };
      })
    );

    // Generate comparison insights
    const insights = this.generateComparisonInsights(videos);

    return {
      videos,
      insights,
    };
  }

  // Private helper methods

  private estimateViewersAtPoint(
    totalViewers: number,
    percentage: number
  ): number {
    // Simple exponential decay model for retention
    // Real implementation would use actual analytics data
    const retentionRate = Math.exp((-percentage / 100) * 1.2);
    return Math.round(totalViewers * retentionRate);
  }

  private identifyDropOffPoints(
    points: RetentionPoint[],
    totalViewers: number
  ): DropOffPoint[] {
    const dropOffs: DropOffPoint[] = [];

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      const dropAmount = prev.retention - curr.retention;

      // Identify drops >10%
      if (dropAmount > 10) {
        const viewerLoss = prev.viewersCount - curr.viewersCount;

        let severity: DropOffSeverity = 'low';
        if (dropAmount > 20) severity = 'high';
        else if (dropAmount > 15) severity = 'medium';

        dropOffs.push({
          percentage: curr.percentage,
          dropAmount,
          severity,
          viewerLoss,
        });
      }
    }

    return dropOffs;
  }

  private calculateAverageRetention(points: RetentionPoint[]): number {
    const sum = points.reduce((acc, point) => acc + point.retention, 0);
    return sum / points.length;
  }

  private calculateAverageBenchmark(
    points: Array<{ percentage: number; retention: number }>
  ): number {
    const sum = points.reduce((acc, point) => acc + point.retention, 0);
    return sum / points.length;
  }

  private generateComparisonInsights(
    videos: Array<{ videoId: string; videoTitle: string; curve: RetentionCurve }>
  ): string[] {
    const insights: string[] = [];

    // Compare average retention
    const sorted = [...videos].sort(
      (a, b) => b.curve.averageRetention - a.curve.averageRetention
    );
    insights.push(
      `"${sorted[0].videoTitle}" has the highest average retention at ${sorted[0].curve.averageRetention.toFixed(1)}%`
    );

    // Compare completion rates
    const completionSorted = [...videos].sort(
      (a, b) => b.curve.completionRate - a.curve.completionRate
    );
    insights.push(
      `"${completionSorted[0].videoTitle}" has the best completion rate at ${completionSorted[0].curve.completionRate.toFixed(1)}%`
    );

    // Identify best hook
    const hookRetention = videos.map((v) => ({
      title: v.videoTitle,
      retention: v.curve.points[1].retention, // 10% mark
    }));
    const bestHook = hookRetention.sort((a, b) => b.retention - a.retention)[0];
    insights.push(
      `"${bestHook.title}" has the strongest hook with ${bestHook.retention.toFixed(1)}% retention at 10%`
    );

    // Compare drop-off patterns
    const dropOffCounts = videos.map((v) => ({
      title: v.videoTitle,
      count: v.curve.dropOffPoints.length,
    }));
    const leastDrops = dropOffCounts.sort((a, b) => a.count - b.count)[0];
    if (leastDrops.count < dropOffCounts[dropOffCounts.length - 1].count) {
      insights.push(
        `"${leastDrops.title}" has the smoothest retention with only ${leastDrops.count} major drop-off point(s)`
      );
    }

    return insights;
  }
}
