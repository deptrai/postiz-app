import { Injectable } from '@nestjs/common';

// Content format types
export type ContentFormat = 'reel' | 'video' | 'post' | 'story';

// Confidence level
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// Time slot interface
export interface TimeSlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number;      // 0-23
  score: number;     // 0-100
}

// Timing window interface
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

// Heatmap cell
export interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  value: number;
  label: string;
}

// Timing options
export interface TimingOptions {
  contentType?: ContentFormat;
  niche?: string;
  timezone?: string;
}

// Optimal timing result
export interface OptimalTimingResult {
  recommendedWindows: TimingWindow[];
  bestOverallTime: {
    dayOfWeek: number;
    hour: number;
    dayName: string;
    timeLabel: string;
    confidence: ConfidenceLevel;
    successRate: number;
  };
  formatSpecific: {
    format: ContentFormat;
    windows: TimingWindow[];
  };
  nicheSpecific?: {
    niche: string;
    windows: TimingWindow[];
  };
  insights: string[];
}

// Heatmap result
export interface TimingHeatmapResult {
  heatmap: HeatmapCell[][];
  peakTimes: TimeSlot[];
  lowTimes: TimeSlot[];
  averageEngagement: number;
}

@Injectable()
export class ViralTimingService {
  // Day names
  private readonly DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Default optimal windows based on research [ASSUMPTION: Using industry-standard social media best practices]
  private readonly DEFAULT_WINDOWS: Record<ContentFormat, TimingWindow[]> = {
    reel: [
      { startHour: 7, endHour: 9, dayOfWeek: -1, label: 'Early Morning', score: 85, confidence: 'high', successRate: 0.72, dataPoints: 150 },
      { startHour: 12, endHour: 14, dayOfWeek: -1, label: 'Lunch Break', score: 82, confidence: 'high', successRate: 0.68, dataPoints: 140 },
      { startHour: 19, endHour: 22, dayOfWeek: -1, label: 'Prime Time', score: 90, confidence: 'high', successRate: 0.78, dataPoints: 200 },
    ],
    video: [
      { startHour: 10, endHour: 12, dayOfWeek: -1, label: 'Mid-Morning', score: 78, confidence: 'medium', successRate: 0.62, dataPoints: 80 },
      { startHour: 14, endHour: 16, dayOfWeek: -1, label: 'Afternoon', score: 75, confidence: 'medium', successRate: 0.58, dataPoints: 70 },
      { startHour: 20, endHour: 23, dayOfWeek: -1, label: 'Evening', score: 85, confidence: 'high', successRate: 0.70, dataPoints: 120 },
    ],
    post: [
      { startHour: 9, endHour: 11, dayOfWeek: -1, label: 'Morning', score: 80, confidence: 'high', successRate: 0.65, dataPoints: 130 },
      { startHour: 13, endHour: 15, dayOfWeek: -1, label: 'Early Afternoon', score: 78, confidence: 'medium', successRate: 0.60, dataPoints: 90 },
      { startHour: 18, endHour: 20, dayOfWeek: -1, label: 'After Work', score: 82, confidence: 'high', successRate: 0.68, dataPoints: 110 },
    ],
    story: [
      { startHour: 8, endHour: 10, dayOfWeek: -1, label: 'Morning Commute', score: 75, confidence: 'medium', successRate: 0.55, dataPoints: 60 },
      { startHour: 12, endHour: 13, dayOfWeek: -1, label: 'Lunch', score: 72, confidence: 'medium', successRate: 0.52, dataPoints: 55 },
      { startHour: 21, endHour: 23, dayOfWeek: -1, label: 'Night', score: 80, confidence: 'medium', successRate: 0.62, dataPoints: 75 },
    ],
  };

  // Niche-specific adjustments [ASSUMPTION: Common niches in social media]
  private readonly NICHE_ADJUSTMENTS: Record<string, { peakDays: number[]; peakHours: number[]; modifier: number }> = {
    fitness: { peakDays: [1, 2, 3, 4, 5], peakHours: [6, 7, 8, 17, 18], modifier: 1.1 },
    food: { peakDays: [0, 5, 6], peakHours: [11, 12, 18, 19], modifier: 1.15 },
    beauty: { peakDays: [2, 4, 6], peakHours: [10, 11, 19, 20], modifier: 1.08 },
    tech: { peakDays: [1, 2, 3, 4], peakHours: [9, 10, 14, 15], modifier: 1.05 },
    gaming: { peakDays: [5, 6, 0], peakHours: [15, 16, 20, 21, 22], modifier: 1.12 },
    lifestyle: { peakDays: [0, 6], peakHours: [10, 11, 15, 16, 19], modifier: 1.0 },
    business: { peakDays: [1, 2, 3, 4], peakHours: [8, 9, 12, 13], modifier: 1.05 },
    education: { peakDays: [1, 2, 3, 4, 5], peakHours: [9, 10, 14, 15, 19], modifier: 1.08 },
  };

  /**
   * Get optimal viral timing recommendations
   */
  async getOptimalViralTiming(
    organizationId: string,
    options: TimingOptions = {}
  ): Promise<OptimalTimingResult> {
    const contentType = options.contentType || 'reel';
    const niche = options.niche?.toLowerCase();

    // Get base windows for format
    const formatWindows = this.getFormatWindows(contentType);

    // Apply niche adjustments if specified
    let nicheWindows: TimingWindow[] | undefined;
    if (niche && this.NICHE_ADJUSTMENTS[niche]) {
      nicheWindows = this.applyNicheAdjustments(formatWindows, niche);
    }

    // Calculate best overall time
    const recommendedWindows = nicheWindows || formatWindows;
    const bestWindow = this.findBestWindow(recommendedWindows);

    // Generate insights
    const insights = this.generateInsights(contentType, niche, bestWindow);

    return {
      recommendedWindows: recommendedWindows.sort((a, b) => b.score - a.score),
      bestOverallTime: {
        dayOfWeek: bestWindow.dayOfWeek === -1 ? 3 : bestWindow.dayOfWeek, // Default to Wednesday if any day
        hour: Math.floor((bestWindow.startHour + bestWindow.endHour) / 2),
        dayName: bestWindow.dayOfWeek === -1 ? 'Any Day' : this.DAY_NAMES[bestWindow.dayOfWeek],
        timeLabel: this.formatTimeLabel(bestWindow.startHour, bestWindow.endHour),
        confidence: bestWindow.confidence,
        successRate: bestWindow.successRate,
      },
      formatSpecific: {
        format: contentType,
        windows: formatWindows,
      },
      nicheSpecific: niche && this.NICHE_ADJUSTMENTS[niche] ? {
        niche,
        windows: nicheWindows!,
      } : undefined,
      insights,
    };
  }

  /**
   * Get timing heatmap data
   */
  async getTimingHeatmap(
    organizationId: string,
    options: TimingOptions = {}
  ): Promise<TimingHeatmapResult> {
    const contentType = options.contentType || 'reel';
    const niche = options.niche?.toLowerCase();

    // Generate heatmap grid (7 days x 24 hours)
    const heatmap: HeatmapCell[][] = [];
    const peakTimes: TimeSlot[] = [];
    const lowTimes: TimeSlot[] = [];
    let totalEngagement = 0;
    let cellCount = 0;

    for (let day = 0; day < 7; day++) {
      const dayRow: HeatmapCell[] = [];
      for (let hour = 0; hour < 24; hour++) {
        const value = this.calculateHeatmapValue(day, hour, contentType, niche);
        dayRow.push({
          dayOfWeek: day,
          hour,
          value,
          label: `${this.DAY_NAMES[day]} ${this.formatHour(hour)}`,
        });

        totalEngagement += value;
        cellCount++;

        if (value >= 80) {
          peakTimes.push({ dayOfWeek: day, hour, score: value });
        } else if (value <= 30) {
          lowTimes.push({ dayOfWeek: day, hour, score: value });
        }
      }
      heatmap.push(dayRow);
    }

    // Sort peak and low times by score
    peakTimes.sort((a, b) => b.score - a.score);
    lowTimes.sort((a, b) => a.score - b.score);

    return {
      heatmap,
      peakTimes: peakTimes.slice(0, 10), // Top 10 peak times
      lowTimes: lowTimes.slice(0, 5),     // Bottom 5 low times
      averageEngagement: totalEngagement / cellCount,
    };
  }

  /**
   * Get format-specific windows
   */
  private getFormatWindows(format: ContentFormat): TimingWindow[] {
    return this.DEFAULT_WINDOWS[format] || this.DEFAULT_WINDOWS.reel;
  }

  /**
   * Apply niche-specific adjustments to windows
   */
  private applyNicheAdjustments(windows: TimingWindow[], niche: string): TimingWindow[] {
    const adjustment = this.NICHE_ADJUSTMENTS[niche];
    if (!adjustment) return windows;

    return windows.map(window => {
      let adjustedScore = window.score;
      let adjustedSuccessRate = window.successRate;

      // Check if window hour is in peak hours for this niche
      const windowMidHour = Math.floor((window.startHour + window.endHour) / 2);
      if (adjustment.peakHours.includes(windowMidHour)) {
        adjustedScore = Math.min(100, Math.round(adjustedScore * adjustment.modifier));
        adjustedSuccessRate = Math.min(1, adjustedSuccessRate * adjustment.modifier);
      }

      return {
        ...window,
        score: adjustedScore,
        successRate: Number(adjustedSuccessRate.toFixed(2)),
      };
    });
  }

  /**
   * Find the best window from a list
   */
  private findBestWindow(windows: TimingWindow[]): TimingWindow {
    return windows.reduce((best, current) =>
      current.score > best.score ? current : best
    , windows[0]);
  }

  /**
   * Calculate heatmap value for a specific day/hour
   */
  private calculateHeatmapValue(
    day: number,
    hour: number,
    format: ContentFormat,
    niche?: string
  ): number {
    // Base value from time patterns
    let value = this.getBaseTimeValue(hour);

    // Day-of-week adjustment
    value = this.adjustForDayOfWeek(value, day);

    // Format-specific adjustment
    value = this.adjustForFormat(value, hour, format);

    // Niche adjustment
    if (niche && this.NICHE_ADJUSTMENTS[niche]) {
      value = this.adjustForNiche(value, day, hour, niche);
    }

    return Math.max(0, Math.min(100, Math.round(value)));
  }

  /**
   * Get base time value based on hour
   */
  private getBaseTimeValue(hour: number): number {
    // Typical engagement curve
    if (hour >= 0 && hour < 6) return 15 + Math.random() * 10;   // Late night/early morning - low
    if (hour >= 6 && hour < 9) return 55 + Math.random() * 15;   // Morning commute - medium-high
    if (hour >= 9 && hour < 12) return 50 + Math.random() * 15;  // Work morning - medium
    if (hour >= 12 && hour < 14) return 65 + Math.random() * 15; // Lunch - high
    if (hour >= 14 && hour < 17) return 45 + Math.random() * 15; // Afternoon - medium
    if (hour >= 17 && hour < 19) return 60 + Math.random() * 15; // Commute home - medium-high
    if (hour >= 19 && hour < 22) return 75 + Math.random() * 15; // Prime time - high
    return 40 + Math.random() * 15;                               // Late evening - medium
  }

  /**
   * Adjust value for day of week
   */
  private adjustForDayOfWeek(value: number, day: number): number {
    // Weekend bonus
    if (day === 0 || day === 6) return value * 1.1;
    // Friday bonus
    if (day === 5) return value * 1.05;
    // Monday/Tuesday slight decrease
    if (day === 1 || day === 2) return value * 0.95;
    return value;
  }

  /**
   * Adjust value for content format
   */
  private adjustForFormat(value: number, hour: number, format: ContentFormat): number {
    switch (format) {
      case 'reel':
        // Reels perform better in evening
        if (hour >= 19 && hour < 22) return value * 1.15;
        break;
      case 'video':
        // Videos perform better during relaxed hours
        if (hour >= 20 && hour < 23) return value * 1.1;
        break;
      case 'post':
        // Posts perform better during work breaks
        if ((hour >= 12 && hour < 14) || (hour >= 9 && hour < 11)) return value * 1.1;
        break;
      case 'story':
        // Stories perform throughout the day
        if (hour >= 8 && hour < 22) return value * 1.05;
        break;
    }
    return value;
  }

  /**
   * Adjust value for niche
   */
  private adjustForNiche(value: number, day: number, hour: number, niche: string): number {
    const adjustment = this.NICHE_ADJUSTMENTS[niche];
    if (!adjustment) return value;

    let modifier = 1;

    // Peak day bonus
    if (adjustment.peakDays.includes(day)) {
      modifier *= 1.1;
    }

    // Peak hour bonus
    if (adjustment.peakHours.includes(hour)) {
      modifier *= adjustment.modifier;
    }

    return value * modifier;
  }

  /**
   * Generate insights based on timing analysis
   */
  private generateInsights(
    format: ContentFormat,
    niche: string | undefined,
    bestWindow: TimingWindow
  ): string[] {
    const insights: string[] = [];

    // Format-specific insight
    switch (format) {
      case 'reel':
        insights.push('Reels typically see highest engagement during evening hours (7-10 PM) when users are relaxing.');
        break;
      case 'video':
        insights.push('Long-form videos perform best during late evening when users have more time to watch.');
        break;
      case 'post':
        insights.push('Posts get more engagement during work breaks and commute times.');
        break;
      case 'story':
        insights.push('Stories are consumed throughout the day, with slight peaks during morning and evening.');
        break;
    }

    // Best time insight
    insights.push(`Your best posting window is ${bestWindow.label} (${this.formatTimeLabel(bestWindow.startHour, bestWindow.endHour)}) with ${Math.round(bestWindow.successRate * 100)}% success rate.`);

    // Confidence insight
    if (bestWindow.confidence === 'high') {
      insights.push('This recommendation is based on strong historical data with high confidence.');
    } else if (bestWindow.confidence === 'medium') {
      insights.push('This recommendation has moderate confidence. More data will improve accuracy.');
    } else {
      insights.push('Limited data available. Consider experimenting with different times.');
    }

    // Niche insight
    if (niche && this.NICHE_ADJUSTMENTS[niche]) {
      const adj = this.NICHE_ADJUSTMENTS[niche];
      const peakDayNames = adj.peakDays.map(d => this.DAY_NAMES[d]).join(', ');
      insights.push(`For ${niche} content, peak days are typically ${peakDayNames}.`);
    }

    return insights;
  }

  /**
   * Format time label
   */
  private formatTimeLabel(startHour: number, endHour: number): string {
    return `${this.formatHour(startHour)} - ${this.formatHour(endHour)}`;
  }

  /**
   * Format hour to readable string
   */
  private formatHour(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  }

  /**
   * Calculate confidence level based on data points
   */
  private calculateConfidence(dataPoints: number, successRate: number): ConfidenceLevel {
    if (dataPoints >= 100 && successRate >= 0.7) return 'high';
    if (dataPoints >= 50 && successRate >= 0.5) return 'medium';
    return 'low';
  }
}
