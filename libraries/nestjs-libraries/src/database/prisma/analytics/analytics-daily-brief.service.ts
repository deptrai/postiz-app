import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { AnalyticsTrendingService } from './analytics-trending.service';
import { AnalyticsBestTimeService } from './analytics-best-time.service';
import dayjs from 'dayjs';

interface TrendingInsight {
  tag: string;
  velocityScore: number;
  currentMentions: number;
  explanation: string;
}

interface BestTimeInsight {
  timeRange: string;
  dayName: string;
  avgEngagement: number;
  confidence: number;
  explanation: string;
}

interface TopContentItem {
  id: string;
  caption: string;
  contentType: string;
  publishedAt: Date;
  integration: any;
  engagement: number;
  reach: number;
  engagementRate: number;
  explanation: string;
}

interface Recommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  action: string;
}

@Injectable()
export class AnalyticsDailyBriefService {
  constructor(
    private _trendingService: AnalyticsTrendingService,
    private _bestTimeService: AnalyticsBestTimeService,
    private _prismaService: PrismaService
  ) {}

  /**
   * Generate daily brief with all insights
   */
  async getDailyBrief(
    organizationId: string,
    options: {
      groupId?: string;
      date?: string;
    }
  ) {
    const targetDate = options.date ? dayjs(options.date) : dayjs();

    const completeness = await this.checkDataCompleteness(
      organizationId,
      targetDate.toDate()
    );

    const [trending, bestTimes, topContent, formatInsights] =
      await Promise.all([
        this.getTrendingTopics(organizationId, options.groupId),
        this.getBestTimesToday(organizationId, options.groupId),
        this.getTopContent(organizationId, options.groupId),
        this.getFormatInsights(organizationId, options.groupId),
      ]);

    const recommendations = this.generateRecommendations({
      trending,
      bestTimes,
      topContent: topContent.items,
      formatInsights,
    });

    return {
      date: targetDate.format('YYYY-MM-DD'),
      generatedAt: new Date().toISOString(),
      dataCompleteness: completeness,
      summary: {
        totalContent: topContent.total,
        trendingTopicsCount: trending.length,
        bestTimeSlotsCount: bestTimes.length,
      },
      insights: {
        trending,
        bestTimes,
        topContent: topContent.items,
        formatInsights,
      },
      recommendations,
      explainability: this.generateExplainability(completeness),
    };
  }

  private async getTrendingTopics(
    organizationId: string,
    groupId?: string
  ): Promise<TrendingInsight[]> {
    try {
      const result = await this._trendingService.getTrendingTopics(
        organizationId,
        {
          groupId,
          timeWindow: '24h',
          limit: 5,
        }
      );

      return result.map((item: any) => ({
        tag: item.tag.name,
        velocityScore: item.velocityScore,
        currentMentions: item.currentMentions,
        explanation: `Trending up ${item.velocityScore}% with ${item.currentMentions} mentions in last 24h`,
      }));
    } catch (error) {
      return [];
    }
  }

  private async getBestTimesToday(
    organizationId: string,
    groupId?: string
  ): Promise<BestTimeInsight[]> {
    try {
      const bestTime = await this._bestTimeService.getBestTimeSlots(
        organizationId,
        {
          groupId,
          format: 'all',
          days: 7,
        }
      );

      const todayDayOfWeek = dayjs().day();
      const todaySlots = bestTime.recommendations.filter(
        (rec: any) => rec.dayOfWeek === todayDayOfWeek
      );

      return todaySlots.slice(0, 3).map((slot: any) => ({
        timeRange: slot.timeRange,
        dayName: slot.dayName,
        avgEngagement: slot.avgEngagement,
        confidence: slot.confidenceScore,
        explanation: `Based on ${slot.contentCount} posts, this time achieves ${slot.avgEngagement} avg engagement`,
      }));
    } catch (error) {
      return [];
    }
  }

  private async getTopContent(organizationId: string, groupId?: string) {
    const startDate = dayjs().subtract(7, 'days').toDate();
    const endDate = new Date();

    const whereClause: any = {
      organizationId,
      publishedAt: { gte: startDate, lte: endDate },
      deletedAt: null,
    };

    if (groupId) {
      whereClause.integration = {
        groupMembers: {
          some: { groupId },
        },
      };
    }

    const content = await this._prismaService.analyticsContent.findMany({
      where: whereClause,
      include: {
        metrics: {
          where: {
            date: { gte: startDate, lte: endDate },
          },
        },
        integration: {
          select: {
            name: true,
            picture: true,
          },
        },
      },
      take: 100,
    });

    const ranked = content
      .map((item) => {
        const totalEngagement = item.metrics.reduce(
          (sum: number, m: any) =>
            sum +
            ((m.reactions as number) || 0) +
            ((m.comments as number) || 0) +
            ((m.shares as number) || 0),
          0
        );
        const totalReach = item.metrics.reduce(
          (sum: number, m: any) => sum + ((m.reach as number) || 0),
          0
        );
        return {
          ...item,
          totalEngagement,
          totalReach,
          engagementRate:
            totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, 5);

    return {
      total: content.length,
      items: ranked.map((item) => ({
        id: item.id,
        caption: item.caption
          ? item.caption.substring(0, 100) + '...'
          : 'No caption',
        contentType: item.contentType,
        publishedAt: item.publishedAt,
        integration: item.integration,
        engagement: item.totalEngagement,
        reach: item.totalReach,
        engagementRate: Math.round(item.engagementRate * 10) / 10,
        explanation: `${item.totalEngagement} total engagement with ${item.engagementRate.toFixed(1)}% engagement rate`,
      })),
    };
  }

  private async getFormatInsights(organizationId: string, groupId?: string) {
    const startDate = dayjs().subtract(7, 'days').toDate();

    const posts = await this.getFormatPerformance(
      organizationId,
      groupId,
      'post',
      startDate
    );
    const reels = await this.getFormatPerformance(
      organizationId,
      groupId,
      'reel',
      startDate
    );

    const winner =
      reels.avgEngagementRate > posts.avgEngagementRate ? 'reels' : 'posts';

    return {
      posts,
      reels,
      winner,
      explanation:
        winner === 'reels'
          ? `Reels performing ${(reels.avgEngagementRate - posts.avgEngagementRate).toFixed(1)}% better`
          : `Posts performing ${(posts.avgEngagementRate - reels.avgEngagementRate).toFixed(1)}% better`,
    };
  }

  private async getFormatPerformance(
    organizationId: string,
    groupId: string | undefined,
    format: string,
    startDate: Date
  ) {
    const whereClause: any = {
      organizationId,
      contentType: format,
      publishedAt: { gte: startDate },
      deletedAt: null,
    };

    if (groupId) {
      whereClause.integration = {
        groupMembers: {
          some: { groupId },
        },
      };
    }

    const content = await this._prismaService.analyticsContent.findMany({
      where: whereClause,
      include: {
        metrics: {
          where: {
            date: { gte: startDate },
          },
        },
      },
    });

    const totalEngagement = content.reduce(
      (sum, c) =>
        sum +
        c.metrics.reduce(
          (s: number, m: any) =>
            s +
            ((m.reactions as number) || 0) +
            ((m.comments as number) || 0) +
            ((m.shares as number) || 0),
          0
        ),
      0
    );
    const totalReach = content.reduce(
      (sum, c) =>
        sum +
        c.metrics.reduce((s: number, m: any) => s + ((m.reach as number) || 0), 0),
      0
    );

    return {
      count: content.length,
      totalEngagement,
      totalReach,
      avgEngagementRate:
        totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0,
    };
  }

  private generateRecommendations(data: any): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (data.trending.length > 0) {
      const topTrending = data.trending[0];
      recommendations.push({
        type: 'trending',
        priority: 'high',
        title: `Create content about "${topTrending.tag}"`,
        description: `This topic is trending up ${topTrending.velocityScore}% with ${topTrending.currentMentions} mentions`,
        action: 'Create post',
      });
    }

    if (data.bestTimes.length > 0) {
      const nextSlot = data.bestTimes[0];
      recommendations.push({
        type: 'timing',
        priority: 'medium',
        title: `Post today at ${nextSlot.timeRange}`,
        description: `Historically achieves ${nextSlot.avgEngagement} avg engagement`,
        action: 'Schedule post',
      });
    }

    if (data.formatInsights.winner) {
      recommendations.push({
        type: 'format',
        priority: 'medium',
        title: `Focus on ${data.formatInsights.winner}`,
        description: data.formatInsights.explanation,
        action: `Create ${data.formatInsights.winner}`,
      });
    }

    if (data.topContent.length > 0) {
      const topItem = data.topContent[0];
      recommendations.push({
        type: 'template',
        priority: 'low',
        title: 'Replicate top performer',
        description: `Similar to "${topItem.caption}" (${topItem.engagement} engagement)`,
        action: 'Use template',
      });
    }

    return recommendations;
  }

  private async checkDataCompleteness(organizationId: string, date: Date) {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const contentCount = await this._prismaService.analyticsContent.count({
      where: {
        organizationId,
        publishedAt: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
    });

    const metricsCount = await this._prismaService.analyticsDailyMetric.count({
      where: {
        organizationId,
        date: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
    });

    const isComplete = contentCount > 0 && metricsCount > 0;
    const completenessPercentage =
      contentCount > 0 && metricsCount > 0
        ? 100
        : contentCount > 0
        ? 50
        : 0;

    return {
      isComplete,
      percentage: completenessPercentage,
      contentCount,
      metricsCount,
      message: isComplete
        ? 'Data complete'
        : contentCount > 0
        ? 'Content ingested, metrics pending'
        : 'Ingestion incomplete for this date',
    };
  }

  private generateExplainability(completeness: any): string {
    if (completeness.isComplete) {
      return 'All recommendations based on complete data from your tracked pages';
    }

    return `Note: ${completeness.message}. Recommendations may be partial or based on available data only.`;
  }
}
