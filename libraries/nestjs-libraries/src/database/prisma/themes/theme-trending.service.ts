import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface TrendOptions {
  limit?: number;
  currentPeriodHours?: number;
  previousPeriodHours?: number;
  minVelocityThreshold?: number;
}

export interface ThemeTrend {
  id: string;
  name: string;
  keywords: string[];
  velocity: number;
  direction: 'rising' | 'stable' | 'falling';
  currentPeriodMetrics: {
    contentCount: number;
    totalReach: number;
    totalEngagement: number;
  };
  previousPeriodMetrics: {
    contentCount: number;
    totalReach: number;
    totalEngagement: number;
  };
}

@Injectable()
export class ThemeTrendingService {
  private readonly logger = new Logger(ThemeTrendingService.name);

  constructor(private _prismaService: PrismaService) {}

  /**
   * Get trending themes with velocity calculation
   * Velocity = (current_period_engagement - previous_period_engagement) / previous_period_engagement * 100
   */
  async getThemeTrends(
    organizationId: string,
    options: TrendOptions = {}
  ): Promise<ThemeTrend[]> {
    const {
      limit = 10,
      currentPeriodHours = 24,
      previousPeriodHours = 24,
    } = options;

    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - currentPeriodHours * 60 * 60 * 1000);
    const previousPeriodStart = new Date(
      currentPeriodStart.getTime() - previousPeriodHours * 60 * 60 * 1000
    );

    // Get all active themes
    const themes = await this._prismaService.theme.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        content: {
          include: {
            content: true,
          },
        },
      },
    });

    // Calculate metrics for each theme
    const themeTrends: ThemeTrend[] = [];

    for (const theme of themes) {
      // Current period metrics
      const currentContent = theme.content.filter((tc) => {
        const createdAt = new Date(tc.content.createdAt);
        return createdAt >= currentPeriodStart && createdAt <= now;
      });

      const currentMetrics = this.calculateMetrics(currentContent);

      // Previous period metrics
      const previousContent = theme.content.filter((tc) => {
        const createdAt = new Date(tc.content.createdAt);
        return createdAt >= previousPeriodStart && createdAt < currentPeriodStart;
      });

      const previousMetrics = this.calculateMetrics(previousContent);

      // Calculate velocity based on engagement
      let velocity = 0;
      if (previousMetrics.totalEngagement > 0) {
        velocity =
          ((currentMetrics.totalEngagement - previousMetrics.totalEngagement) /
            previousMetrics.totalEngagement) *
          100;
      } else if (currentMetrics.totalEngagement > 0) {
        velocity = 100; // New theme with engagement
      }

      // Determine direction
      let direction: 'rising' | 'stable' | 'falling' = 'stable';
      if (velocity > 10) {
        direction = 'rising';
      } else if (velocity < -10) {
        direction = 'falling';
      }

      themeTrends.push({
        id: theme.id,
        name: theme.name,
        keywords: (theme.keywords as string[]) || [],
        velocity,
        direction,
        currentPeriodMetrics: currentMetrics,
        previousPeriodMetrics: previousMetrics,
      });
    }

    // Sort by absolute velocity (highest change first)
    themeTrends.sort((a, b) => Math.abs(b.velocity) - Math.abs(a.velocity));

    return themeTrends.slice(0, limit);
  }

  /**
   * Get trending summary (rising, falling, stable counts)
   */
  async getTrendingSummary(
    organizationId: string,
    options: TrendOptions = {}
  ) {
    const trends = await this.getThemeTrends(organizationId, {
      ...options,
      limit: 1000, // Get all themes
    });

    const risingCount = trends.filter((t) => t.direction === 'rising').length;
    const fallingCount = trends.filter((t) => t.direction === 'falling').length;
    const stableCount = trends.filter((t) => t.direction === 'stable').length;

    const risingThemes = trends
      .filter((t) => t.direction === 'rising')
      .slice(0, 5);
    const fallingThemes = trends
      .filter((t) => t.direction === 'falling')
      .slice(0, 5);

    return {
      summary: {
        total: trends.length,
        rising: risingCount,
        falling: fallingCount,
        stable: stableCount,
      },
      risingThemes,
      fallingThemes,
    };
  }

  /**
   * Get top-performing content for a theme
   */
  async getThemeTopContent(
    themeId: string,
    organizationId: string,
    limit: number = 10
  ) {
    const theme = await this._prismaService.theme.findFirst({
      where: {
        id: themeId,
        organizationId,
        deletedAt: null,
      },
      include: {
        content: {
          include: {
            content: true,
          },
        },
      },
    });

    if (!theme) {
      throw new Error('Theme not found');
    }

    // Sort content by engagement (calculated from content metrics)
    const sortedContent = theme.content
      .map((tc) => {
        const content = tc.content as any; // AnalyticsContent has dynamic fields
        return {
          id: tc.id,
          externalContentId: content.externalContentId,
          contentType: content.contentType,
          caption: content.caption,
          url: content.url || null,
          totalReach: content.totalReach || 0,
          totalEngagement: content.totalEngagement || 0,
          engagementRate: content.engagementRate || 0,
          createdAt: content.createdAt,
        };
      })
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, limit);

    return sortedContent;
  }

  /**
   * Calculate aggregated metrics for content
   */
  private calculateMetrics(content: any[]) {
    let totalReach = 0;
    let totalEngagement = 0;

    for (const tc of content) {
      totalReach += tc.content.totalReach || 0;
      totalEngagement += tc.content.totalEngagement || 0;
    }

    return {
      contentCount: content.length,
      totalReach,
      totalEngagement,
    };
  }
}
