import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

export interface WatchTimeMetrics {
  totalWatchTimeMinutes: number;
  totalWatchTimeHours: number;
  averageViewDurationSeconds: number;
  completionRate: number;
  totalViews: number;
  totalVideos: number;
  dataSource: 'real' | 'estimated' | 'mixed'; // Indicates if data is from API or estimated
}

export interface WatchTimeFilters {
  startDate?: Date;
  endDate?: Date;
  contentType?: string;
  integrationId?: string;
}

export interface WatchTimeTrend {
  date: string;
  watchTimeMinutes: number;
  views: number;
  growthRate: number;
}

export interface TopVideo {
  contentId: string;
  externalContentId: string;
  contentType: string;
  caption: string | null;
  publishedAt: Date;
  totalViews: number;
  estimatedWatchTimeMinutes: number;
  rank: number;
}

@Injectable()
export class WatchTimeAnalyticsService {
  // Duration estimates in seconds based on content type
  private readonly DURATION_ESTIMATES = {
    reel: 30,      // Reels average 30 seconds
    video: 180,    // Regular videos average 3 minutes
    post: 0,       // Posts have no watch time
    story: 15,     // Stories average 15 seconds
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive watch time metrics (AC#1, #2, #3)
   * Enhanced with filters and real data support
   */
  async getWatchTimeMetrics(
    organizationId: string,
    filters?: WatchTimeFilters
  ): Promise<WatchTimeMetrics> {
    // Build where clause with filters
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (filters?.contentType) {
      where.contentType = filters.contentType;
    }

    if (filters?.integrationId) {
      where.integrationId = filters.integrationId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.publishedAt = {};
      if (filters.startDate) {
        where.publishedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.publishedAt.lte = filters.endDate;
      }
    }

    // Get all content with view metrics
    const contentWithViews = await this.prisma.analyticsContent.findMany({
      where,
      include: {
        metrics: {
          where: {
            metricType: 'views',
          },
        },
      },
    });

    let totalViews = 0;
    let totalWatchTimeSeconds = 0;
    let totalVideos = 0;
    let hasRealData = false;
    let hasEstimatedData = false;
    let totalCompletionRate = 0;
    let completionRateCount = 0;

    // Calculate watch time based on content type and views
    for (const content of contentWithViews) {
      const contentType = content.contentType.toLowerCase();
      
      // Use real duration if available, otherwise estimate
      const durationSeconds = content.duration || this.DURATION_ESTIMATES[contentType] || 0;

      // Skip content with no duration (e.g., posts)
      if (durationSeconds === 0) continue;

      // Calculate views and watch time
      for (const metric of content.metrics) {
        const views = metric.metricValue;
        
        // Use real watch time if available, otherwise calculate from views
        let watchTimeSeconds: number;
        if (metric.watchTime) {
          watchTimeSeconds = metric.watchTime;
          hasRealData = true;
        } else {
          watchTimeSeconds = views * durationSeconds;
          hasEstimatedData = true;
        }

        totalViews += views;
        totalWatchTimeSeconds += watchTimeSeconds;

        // Aggregate completion rates
        if (metric.completionRate !== null && metric.completionRate !== undefined) {
          totalCompletionRate += metric.completionRate;
          completionRateCount++;
        }
      }
      
      totalVideos++;
    }

    // Calculate metrics
    const totalWatchTimeMinutes = totalWatchTimeSeconds / 60;
    const totalWatchTimeHours = totalWatchTimeMinutes / 60;
    const averageViewDurationSeconds = totalViews > 0 
      ? totalWatchTimeSeconds / totalViews 
      : 0;

    // Use real completion rate if available, otherwise estimate
    const completionRate = completionRateCount > 0
      ? totalCompletionRate / completionRateCount
      : (totalViews > 0 ? 70 : 0);

    // Determine data source
    let dataSource: 'real' | 'estimated' | 'mixed';
    if (hasRealData && !hasEstimatedData) {
      dataSource = 'real';
    } else if (!hasRealData && hasEstimatedData) {
      dataSource = 'estimated';
    } else if (hasRealData && hasEstimatedData) {
      dataSource = 'mixed';
    } else {
      dataSource = 'estimated';
    }

    return {
      totalWatchTimeMinutes: Math.round(totalWatchTimeMinutes),
      totalWatchTimeHours: Math.round(totalWatchTimeHours * 10) / 10,
      averageViewDurationSeconds: Math.round(averageViewDurationSeconds),
      completionRate,
      totalViews: Math.round(totalViews),
      totalVideos,
      dataSource,
    };
  }

  /**
   * Get watch time trends over specified days (AC#4)
   */
  async getWatchTimeTrends(
    organizationId: string,
    days: number = 30
  ): Promise<WatchTimeTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily metrics
    const metrics = await this.prisma.analyticsMetric.findMany({
      where: {
        organizationId,
        metricType: 'views',
        date: {
          gte: startDate,
        },
      },
      include: {
        content: {
          select: {
            contentType: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by date
    const dailyData = new Map<string, { views: number; watchTimeSeconds: number }>();

    for (const metric of metrics) {
      const dateKey = metric.date.toISOString().split('T')[0];
      const contentType = metric.content?.contentType?.toLowerCase() || 'video';
      const durationSeconds = this.DURATION_ESTIMATES[contentType] || 180;
      const watchTimeSeconds = metric.metricValue * durationSeconds;

      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { views: 0, watchTimeSeconds: 0 });
      }

      const data = dailyData.get(dateKey)!;
      data.views += metric.metricValue;
      data.watchTimeSeconds += watchTimeSeconds;
    }

    // Convert to trend array with growth rate
    const trends: WatchTimeTrend[] = [];
    const dates = Array.from(dailyData.keys()).sort();

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const data = dailyData.get(date)!;
      const watchTimeMinutes = data.watchTimeSeconds / 60;

      // Calculate growth rate compared to previous day
      let growthRate = 0;
      if (i > 0) {
        const prevData = dailyData.get(dates[i - 1])!;
        const prevWatchTime = prevData.watchTimeSeconds / 60;
        if (prevWatchTime > 0) {
          growthRate = ((watchTimeMinutes - prevWatchTime) / prevWatchTime) * 100;
        }
      }

      trends.push({
        date,
        watchTimeMinutes: Math.round(watchTimeMinutes),
        views: Math.round(data.views),
        growthRate: Math.round(growthRate * 10) / 10,
      });
    }

    return trends;
  }

  /**
   * Get top videos by watch time (AC#5)
   */
  async getTopVideosByWatchTime(
    organizationId: string,
    limit: number = 10
  ): Promise<TopVideo[]> {
    // Get all video/reel content with metrics
    const content = await this.prisma.analyticsContent.findMany({
      where: {
        organizationId,
        contentType: {
          in: ['reel', 'video', 'story'],
        },
        deletedAt: null,
      },
      include: {
        metrics: {
          where: {
            metricType: 'views',
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    // Calculate watch time for each video
    const videosWithWatchTime = content.map((c) => {
      const contentType = c.contentType.toLowerCase();
      const durationSeconds = this.DURATION_ESTIMATES[contentType] || 180;
      const totalViews = c.metrics.reduce((sum, m) => sum + m.metricValue, 0);
      const estimatedWatchTimeMinutes = (totalViews * durationSeconds) / 60;

      return {
        contentId: c.id,
        externalContentId: c.externalContentId,
        contentType: c.contentType,
        caption: c.caption,
        publishedAt: c.publishedAt,
        totalViews: Math.round(totalViews),
        estimatedWatchTimeMinutes: Math.round(estimatedWatchTimeMinutes),
        rank: 0, // Will be set after sorting
      };
    });

    // Sort by watch time descending and assign ranks
    videosWithWatchTime.sort(
      (a, b) => b.estimatedWatchTimeMinutes - a.estimatedWatchTimeMinutes
    );

    const topVideos = videosWithWatchTime.slice(0, limit).map((v, index) => ({
      ...v,
      rank: index + 1,
    }));

    return topVideos;
  }

  /**
   * Export watch time report in CSV or JSON format
   */
  async exportWatchTimeReport(
    organizationId: string,
    format: 'csv' | 'json',
    filters?: WatchTimeFilters
  ): Promise<string> {
    // Get comprehensive data
    const metrics = await this.getWatchTimeMetrics(organizationId, filters);
    const trends = await this.getWatchTimeTrends(organizationId, 30);
    const topVideos = await this.getTopVideosByWatchTime(organizationId, 20);

    if (format === 'json') {
      return JSON.stringify({
        generatedAt: new Date().toISOString(),
        organizationId,
        filters,
        metrics,
        trends,
        topVideos,
      }, null, 2);
    }

    // CSV format
    const csvLines: string[] = [];
    
    // Metrics section
    csvLines.push('# Watch Time Metrics');
    csvLines.push('Metric,Value');
    csvLines.push(`Total Watch Time (hours),${metrics.totalWatchTimeHours}`);
    csvLines.push(`Total Watch Time (minutes),${metrics.totalWatchTimeMinutes}`);
    csvLines.push(`Average View Duration (seconds),${metrics.averageViewDurationSeconds}`);
    csvLines.push(`Completion Rate (%),${metrics.completionRate}`);
    csvLines.push(`Total Views,${metrics.totalViews}`);
    csvLines.push(`Total Videos,${metrics.totalVideos}`);
    csvLines.push(`Data Source,${metrics.dataSource}`);
    csvLines.push('');

    // Trends section
    csvLines.push('# Watch Time Trends');
    csvLines.push('Date,Watch Time (minutes),Views,Growth Rate (%)');
    trends.forEach(t => {
      csvLines.push(`${t.date},${t.watchTimeMinutes},${t.views},${t.growthRate}`);
    });
    csvLines.push('');

    // Top videos section
    csvLines.push('# Top Videos by Watch Time');
    csvLines.push('Rank,Content Type,Caption,Published At,Views,Watch Time (minutes)');
    topVideos.forEach(v => {
      const caption = (v.caption || '').replace(/,/g, ';').substring(0, 100);
      csvLines.push(`${v.rank},${v.contentType},"${caption}",${v.publishedAt},${v.totalViews},${v.estimatedWatchTimeMinutes}`);
    });

    return csvLines.join('\n');
  }

  /**
   * Get watch time breakdown by content type
   */
  async getWatchTimeByContentType(organizationId: string): Promise<Record<string, number>> {
    const content = await this.prisma.analyticsContent.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        metrics: {
          where: {
            metricType: 'views',
          },
        },
      },
    });

    const breakdown: Record<string, number> = {};

    for (const c of content) {
      const contentType = c.contentType.toLowerCase();
      const durationSeconds = this.DURATION_ESTIMATES[contentType] || 0;
      const totalViews = c.metrics.reduce((sum, m) => sum + m.metricValue, 0);
      const watchTimeMinutes = (totalViews * durationSeconds) / 60;

      if (!breakdown[contentType]) {
        breakdown[contentType] = 0;
      }
      breakdown[contentType] += watchTimeMinutes;
    }

    // Round values
    for (const key in breakdown) {
      breakdown[key] = Math.round(breakdown[key]);
    }

    return breakdown;
  }
}
