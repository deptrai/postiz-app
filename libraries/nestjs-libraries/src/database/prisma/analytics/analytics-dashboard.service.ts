import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import dayjs from 'dayjs';

export interface DashboardFilters {
  startDate: Date;
  endDate: Date;
  groupId?: string;
  integrationIds?: string[];
  format?: 'post' | 'reel' | 'all';
}

export interface KPISummary {
  totalPosts: number;
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  engagementRate: number;
  totalVideoViews: number;
  averageEngagementPerPost: number;
}

export interface TopContentItem {
  id: string;
  externalContentId: string;
  contentType: string;
  caption: string | null;
  publishedAt: Date;
  integrationId: string;
  totalReach: number;
  totalEngagement: number;
  engagementRate: number;
  reactions: number;
  comments: number;
  shares: number;
  videoViews: number;
}

@Injectable()
export class AnalyticsDashboardService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Get aggregated KPIs for the dashboard
   * 
   * @param organizationId - Organization ID
   * @param filters - Date range and optional filters (group, pages, format)
   * @returns KPI summary with totals and rates
   */
  async getKPIs(
    organizationId: string,
    filters: DashboardFilters
  ): Promise<KPISummary> {
    const { startDate, endDate, groupId, integrationIds, format } = filters;

    // Build where clause for filtering
    const whereClause: any = {
      organizationId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      deletedAt: null,
    };

    // Filter by group if specified
    if (groupId) {
      whereClause.integration = {
        analyticsTrackedIntegration: {
          some: {
            groupMembers: {
              some: {
                groupId,
              },
            },
          },
        },
      };
    }

    // Filter by specific integrations
    if (integrationIds && integrationIds.length > 0) {
      whereClause.integrationId = { in: integrationIds };
    }

    // Aggregate metrics from AnalyticsDailyMetric
    const metricsAgg = await this._prismaService.analyticsDailyMetric.groupBy({
      by: ['externalContentId'],
      where: whereClause,
      _sum: {
        impressions: true,
        reach: true,
        reactions: true,
        comments: true,
        shares: true,
        videoViews: true,
      },
    });

    // Calculate totals
    const totalReach = metricsAgg.reduce((sum: number, m: any) => sum + (m._sum.reach || 0), 0);
    const totalImpressions = metricsAgg.reduce((sum: number, m: any) => sum + (m._sum.impressions || 0), 0);
    const totalReactions = metricsAgg.reduce((sum: number, m: any) => sum + (m._sum.reactions || 0), 0);
    const totalComments = metricsAgg.reduce((sum: number, m: any) => sum + (m._sum.comments || 0), 0);
    const totalShares = metricsAgg.reduce((sum: number, m: any) => sum + (m._sum.shares || 0), 0);
    const totalVideoViews = metricsAgg.reduce((sum: number, m: any) => sum + (m._sum.videoViews || 0), 0);

    const totalEngagement = totalReactions + totalComments + totalShares;
    const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

    // Count unique posts (filter by format if specified)
    const contentWhereClause: any = {
      organizationId,
      publishedAt: {
        gte: startDate,
        lte: endDate,
      },
      deletedAt: null,
    };

    if (format && format !== 'all') {
      contentWhereClause.contentType = format;
    }

    if (groupId) {
      contentWhereClause.integration = {
        analyticsTrackedIntegration: {
          some: {
            groupMembers: {
              some: {
                groupId,
              },
            },
          },
        },
      };
    }

    if (integrationIds && integrationIds.length > 0) {
      contentWhereClause.integrationId = { in: integrationIds };
    }

    const totalPosts = await this._prismaService.analyticsContent.count({
      where: contentWhereClause,
    });

    const averageEngagementPerPost = totalPosts > 0 ? totalEngagement / totalPosts : 0;

    return {
      totalPosts,
      totalReach,
      totalImpressions,
      totalEngagement,
      engagementRate: Math.round(engagementRate * 100) / 100, // Round to 2 decimals
      totalVideoViews,
      averageEngagementPerPost: Math.round(averageEngagementPerPost * 100) / 100,
    };
  }

  /**
   * Get top performing content ranked by engagement
   * 
   * @param organizationId - Organization ID
   * @param filters - Date range and optional filters
   * @param limit - Number of top items to return (default 10)
   * @returns Array of top content items with metrics
   */
  async getTopContent(
    organizationId: string,
    filters: DashboardFilters,
    limit: number = 10
  ): Promise<TopContentItem[]> {
    const { startDate, endDate, groupId, integrationIds, format } = filters;

    // Build where clause for content
    const contentWhereClause: any = {
      organizationId,
      publishedAt: {
        gte: startDate,
        lte: endDate,
      },
      deletedAt: null,
    };

    if (format && format !== 'all') {
      contentWhereClause.contentType = format;
    }

    if (groupId) {
      contentWhereClause.integration = {
        analyticsTrackedIntegration: {
          some: {
            groupMembers: {
              some: {
                groupId,
              },
            },
          },
        },
      };
    }

    if (integrationIds && integrationIds.length > 0) {
      contentWhereClause.integrationId = { in: integrationIds };
    }

    // Get content with metrics
    const content = await this._prismaService.analyticsContent.findMany({
      where: contentWhereClause,
      select: {
        id: true,
        externalContentId: true,
        contentType: true,
        caption: true,
        publishedAt: true,
        integrationId: true,
      },
      take: 1000, // Reasonable limit for aggregation
    });

    // For each content, aggregate metrics
    const contentWithMetrics = await Promise.all(
      content.map(async (c) => {
        const metricsAgg = await this._prismaService.analyticsDailyMetric.groupBy({
          by: ['externalContentId'],
          where: {
            organizationId,
            externalContentId: c.externalContentId,
            date: {
              gte: startDate,
              lte: endDate,
            },
            deletedAt: null,
          },
          _sum: {
            reach: true,
            reactions: true,
            comments: true,
            shares: true,
            videoViews: true,
          },
        });

        const metrics: any = metricsAgg[0]?._sum || {};
        const totalReach = (metrics.reach as number) || 0;
        const reactions = (metrics.reactions as number) || 0;
        const comments = (metrics.comments as number) || 0;
        const shares = (metrics.shares as number) || 0;
        const videoViews = (metrics.videoViews as number) || 0;
        const totalEngagement = reactions + comments + shares;
        const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

        return {
          id: c.id,
          externalContentId: c.externalContentId,
          contentType: c.contentType,
          caption: c.caption,
          publishedAt: c.publishedAt,
          integrationId: c.integrationId,
          totalReach,
          totalEngagement,
          engagementRate: Math.round(engagementRate * 100) / 100,
          reactions,
          comments,
          shares,
          videoViews,
        };
      })
    );

    // Sort by total engagement (descending) and take top N
    const topContent = contentWithMetrics
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, limit);

    return topContent;
  }

  // Story 3.3: Format Breakdown
  async getFormatBreakdown(
    organizationId: string,
    filters: DashboardFilters
  ): Promise<{
    posts: FormatMetrics;
    reels: FormatMetrics;
    winner: 'posts' | 'reels' | 'tie';
    winnerBy: number;
  }> {
    const { startDate, endDate, groupId, integrationIds } = filters;

    // Get metrics for posts
    const postsMetrics = await this.getFormatMetrics(
      organizationId,
      startDate,
      endDate,
      groupId,
      integrationIds,
      'post'
    );

    // Get metrics for reels
    const reelsMetrics = await this.getFormatMetrics(
      organizationId,
      startDate,
      endDate,
      groupId,
      integrationIds,
      'reel'
    );

    // Calculate engagement rates
    const postsEngagementRate = this.calculateEngagementRate(postsMetrics);
    const reelsEngagementRate = this.calculateEngagementRate(reelsMetrics);

    // Determine winner
    let winner: 'posts' | 'reels' | 'tie';
    let winnerBy = 0;

    if (reelsEngagementRate > postsEngagementRate) {
      winner = 'reels';
      winnerBy = reelsEngagementRate - postsEngagementRate;
    } else if (postsEngagementRate > reelsEngagementRate) {
      winner = 'posts';
      winnerBy = postsEngagementRate - reelsEngagementRate;
    } else {
      winner = 'tie';
    }

    return {
      posts: {
        ...postsMetrics,
        engagementRate: postsEngagementRate,
      },
      reels: {
        ...reelsMetrics,
        engagementRate: reelsEngagementRate,
      },
      winner,
      winnerBy: Math.round(winnerBy * 10) / 10,
    };
  }

  private async getFormatMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    groupId?: string,
    integrationIds?: string[],
    contentType?: 'post' | 'reel'
  ): Promise<{
    totalContent: number;
    totalReach: number;
    totalEngagement: number;
    metrics: {
      reactions: number;
      comments: number;
      shares: number;
      videoViews?: number;
    };
  }> {
    const whereClause: any = {
      organizationId,
      publishedAt: {
        gte: startDate,
        lte: endDate,
      },
      deletedAt: null,
    };

    if (contentType) {
      whereClause.contentType = contentType;
    }

    if (groupId) {
      whereClause.integration = {
        analyticsTrackedIntegration: {
          some: {
            groupMembers: {
              some: {
                groupId,
              },
            },
          },
        },
      };
    }

    if (integrationIds && integrationIds.length > 0) {
      whereClause.integrationId = { in: integrationIds };
    }

    const content = await this._prismaService.analyticsContent.findMany({
      where: whereClause,
      select: {
        id: true,
        externalContentId: true,
      },
    });

    if (content.length === 0) {
      return {
        totalContent: 0,
        totalReach: 0,
        totalEngagement: 0,
        metrics: {
          reactions: 0,
          comments: 0,
          shares: 0,
          ...(contentType === 'reel' && { videoViews: 0 }),
        },
      };
    }

    const externalContentIds = content.map((c) => c.externalContentId);

    const metricsAgg = await this._prismaService.analyticsDailyMetric.groupBy({
      by: ['externalContentId'],
      where: {
        organizationId,
        externalContentId: { in: externalContentIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      _sum: {
        reach: true,
        reactions: true,
        comments: true,
        shares: true,
        videoViews: true,
      },
    });

    const totalReach = metricsAgg.reduce((sum: number, m: any) => sum + ((m._sum.reach as number) || 0), 0);
    const totalReactions = metricsAgg.reduce((sum: number, m: any) => sum + ((m._sum.reactions as number) || 0), 0);
    const totalComments = metricsAgg.reduce((sum: number, m: any) => sum + ((m._sum.comments as number) || 0), 0);
    const totalShares = metricsAgg.reduce((sum: number, m: any) => sum + ((m._sum.shares as number) || 0), 0);
    const totalVideoViews = metricsAgg.reduce((sum: number, m: any) => sum + ((m._sum.videoViews as number) || 0), 0);

    const totalEngagement = totalReactions + totalComments + totalShares;

    return {
      totalContent: content.length,
      totalReach,
      totalEngagement,
      metrics: {
        reactions: totalReactions,
        comments: totalComments,
        shares: totalShares,
        ...(contentType === 'reel' && { videoViews: totalVideoViews }),
      },
    };
  }

  private calculateEngagementRate(formatData: {
    totalReach: number;
    totalEngagement: number;
  }): number {
    if (formatData.totalReach === 0) return 0;
    return Math.round((formatData.totalEngagement / formatData.totalReach) * 1000) / 10;
  }
}

export interface FormatMetrics {
  totalContent: number;
  totalReach: number;
  totalEngagement: number;
  engagementRate: number;
  metrics: {
    reactions: number;
    comments: number;
    shares: number;
    videoViews?: number;
  };
}
