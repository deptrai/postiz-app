import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface MonetizationThresholds {
  inStreamAds: {
    followers: number;
    oneMinuteViews: number;
    daysWindow: number;
    minVideoDuration: number;
  };
  reels: {
    viewedMinutes: number;
    minVideos: number;
  };
  stars: {
    followers: number;
    daysContinuous: number;
  };
  fanSubscription: {
    followers: number;
    watchedMinutes: number;
    engagements: number;
  };
}

export interface MonetizationMetrics {
  followers: number;
  oneMinuteViews: number;
  viewedMinutes: number;
  watchedMinutes: number;
  engagements: number;
  videosCount: number;
}

export interface FeatureProgress {
  name: string;
  status: 'eligible' | 'not_eligible' | 'close';
  progress: number;
  currentMetrics: Partial<MonetizationMetrics>;
  requiredMetrics: any;
  gap: any;
  estimatedDays?: number;
}

export interface MonetizationStatus {
  inStreamAds: FeatureProgress;
  reels: FeatureProgress;
  stars: FeatureProgress;
  fanSubscription: FeatureProgress;
  lastUpdated: Date;
}

@Injectable()
export class MonetizationService {
  private readonly thresholds: MonetizationThresholds = {
    inStreamAds: {
      followers: 10000,
      oneMinuteViews: 30000,
      daysWindow: 60,
      minVideoDuration: 3,
    },
    reels: {
      viewedMinutes: 600000,
      minVideos: 5,
    },
    stars: {
      followers: 500,
      daysContinuous: 30,
    },
    fanSubscription: {
      followers: 10000,
      watchedMinutes: 180000,
      engagements: 50000,
    },
  };

  constructor(private readonly _prismaService: PrismaService) {}

  async getMonetizationStatus(organizationId: string): Promise<MonetizationStatus> {
    const metrics = await this.getCurrentMetrics(organizationId);
    const growthRate = await this.calculateGrowthRate(organizationId);

    const inStreamAds = this.calculateFeatureProgress(
      'In-Stream Ads',
      metrics,
      {
        followers: this.thresholds.inStreamAds.followers,
        oneMinuteViews: this.thresholds.inStreamAds.oneMinuteViews,
      },
      growthRate
    );

    const reels = this.calculateFeatureProgress(
      'Reels',
      metrics,
      {
        viewedMinutes: this.thresholds.reels.viewedMinutes,
        videosCount: this.thresholds.reels.minVideos,
      },
      growthRate
    );

    const stars = this.calculateFeatureProgress(
      'Stars',
      metrics,
      {
        followers: this.thresholds.stars.followers,
      },
      growthRate
    );

    const fanSubscription = this.calculateFeatureProgress(
      'Fan Subscription',
      metrics,
      {
        followers: this.thresholds.fanSubscription.followers,
        watchedMinutes: this.thresholds.fanSubscription.watchedMinutes,
        engagements: this.thresholds.fanSubscription.engagements,
      },
      growthRate
    );

    return {
      inStreamAds,
      reels,
      stars,
      fanSubscription,
      lastUpdated: new Date(),
    };
  }

  private async getCurrentMetrics(organizationId: string): Promise<MonetizationMetrics> {
    // [ASSUMPTION: Using mock data since Epic 2 metrics structure not fully specified]
    // In production, this would query actual metrics from database
    
    // Get follower count from analytics
    const followerData = await this._prismaService.analyticsMetric.aggregate({
      where: {
        organizationId,
        metricType: 'followers',
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      _max: {
        metricValue: true,
      },
    });

    // Get video view metrics
    const viewMetrics = await this._prismaService.analyticsMetric.aggregate({
      where: {
        organizationId,
        metricType: 'views',
        date: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Last 60 days
        },
      },
      _sum: {
        metricValue: true,
      },
    });

    // Get watch time metrics
    const watchTimeMetrics = await this._prismaService.analyticsMetric.aggregate({
      where: {
        organizationId,
        metricType: 'watch_time',
      },
      _sum: {
        metricValue: true,
      },
    });

    // Get engagement metrics
    const engagementMetrics = await this._prismaService.analyticsMetric.aggregate({
      where: {
        organizationId,
        metricType: {
          in: ['likes', 'comments', 'shares'],
        },
      },
      _sum: {
        metricValue: true,
      },
    });

    // Count videos
    const videosCount = await this._prismaService.analyticsContent.count({
      where: {
        organizationId,
        contentType: {
          in: ['video', 'reel'],
        },
      },
    });

    return {
      followers: followerData._max.metricValue || 0,
      oneMinuteViews: viewMetrics._sum.metricValue || 0,
      viewedMinutes: (watchTimeMetrics._sum.metricValue || 0) / 60, // Convert seconds to minutes
      watchedMinutes: (watchTimeMetrics._sum.metricValue || 0) / 60,
      engagements: engagementMetrics._sum.metricValue || 0,
      videosCount,
    };
  }

  private async calculateGrowthRate(organizationId: string): Promise<number> {
    // Calculate daily growth rate based on last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const recentFollowers = await this._prismaService.analyticsMetric.aggregate({
      where: {
        organizationId,
        metricType: 'followers',
        date: {
          gte: thirtyDaysAgo,
        },
      },
      _max: {
        metricValue: true,
      },
    });

    const previousFollowers = await this._prismaService.analyticsMetric.aggregate({
      where: {
        organizationId,
        metricType: 'followers',
        date: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
      _max: {
        metricValue: true,
      },
    });

    const recent = recentFollowers._max.metricValue || 0;
    const previous = previousFollowers._max.metricValue || 0;

    if (previous === 0) {
      return recent / 30; // Daily growth if no previous data
    }

    const growth = recent - previous;
    return growth / 30; // Daily growth rate
  }

  private calculateFeatureProgress(
    name: string,
    currentMetrics: MonetizationMetrics,
    requiredMetrics: any,
    dailyGrowthRate: number
  ): FeatureProgress {
    const gap: Record<string, number> = {};
    let totalProgress = 0;
    let metricsCount = 0;

    // Calculate progress for each required metric
    for (const [key, required] of Object.entries(requiredMetrics)) {
      const requiredValue = Number(required);
      const current = (currentMetrics as any)[key] || 0;
      gap[key] = Math.max(0, requiredValue - current);
      
      const progress = requiredValue > 0 ? Math.min(100, (current / requiredValue) * 100) : 100;
      totalProgress += progress;
      metricsCount++;
    }

    // Average progress across all metrics
    const overallProgress = metricsCount > 0 ? totalProgress / metricsCount : 0;

    // Determine status
    let status: 'eligible' | 'not_eligible' | 'close';
    if (overallProgress >= 100) {
      status = 'eligible';
    } else if (overallProgress >= 80) {
      status = 'close';
    } else {
      status = 'not_eligible';
    }

    // Calculate estimated days to eligibility
    let estimatedDays: number | undefined;
    if (status !== 'eligible' && dailyGrowthRate > 0) {
      // Use the largest gap to estimate time
      const gapValues = Object.values(gap).filter(v => typeof v === 'number') as number[];
      const largestGap = gapValues.length > 0 ? Math.max(...gapValues) : 0;
      estimatedDays = Math.ceil(largestGap / dailyGrowthRate);
    }

    return {
      name,
      status,
      progress: Math.round(overallProgress * 10) / 10, // Round to 1 decimal
      currentMetrics: this.extractRelevantMetrics(currentMetrics, requiredMetrics),
      requiredMetrics,
      gap,
      estimatedDays,
    };
  }

  private extractRelevantMetrics(
    allMetrics: MonetizationMetrics,
    requiredMetrics: any
  ): Partial<MonetizationMetrics> {
    const relevant: Partial<MonetizationMetrics> = {};
    for (const key of Object.keys(requiredMetrics)) {
      relevant[key as keyof MonetizationMetrics] = allMetrics[key as keyof MonetizationMetrics];
    }
    return relevant;
  }
}
