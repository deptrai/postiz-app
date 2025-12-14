import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import dayjs from 'dayjs';

export interface TagMentionData {
  tag: any;
  mentions: number;
  totalEngagement: number;
  avgEngagement: number;
}

export interface TrendingResult {
  tag: any;
  currentMentions: number;
  previousMentions: number;
  mentionVelocity: number;
  currentAvgEngagement: number;
  previousAvgEngagement: number;
  engagementVelocity: number;
  velocityScore: number;
  isNew: boolean;
}

@Injectable()
export class AnalyticsTrendingService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Get trending topics by velocity
   */
  async getTrendingTopics(
    organizationId: string,
    options: {
      groupId?: string;
      integrationIds?: string[];
      timeWindow: '24h' | '48h' | '72h';
      limit?: number;
    }
  ): Promise<TrendingResult[]> {
    const limit = options.limit || 10;
    const hours = this.parseTimeWindow(options.timeWindow);

    const now = new Date();
    const currentPeriodStart = dayjs(now).subtract(hours, 'hours').toDate();
    const previousPeriodStart = dayjs(now).subtract(hours * 2, 'hours').toDate();
    const previousPeriodEnd = currentPeriodStart;

    let integrationIds = options.integrationIds || [];
    if (options.groupId) {
      integrationIds = await this.getIntegrationIdsFromGroup(
        organizationId,
        options.groupId
      );
    }

    const currentPeriodTags = await this.getTagMentions(
      organizationId,
      integrationIds,
      currentPeriodStart,
      now
    );

    const previousPeriodTags = await this.getTagMentions(
      organizationId,
      integrationIds,
      previousPeriodStart,
      previousPeriodEnd
    );

    const trendingTags = this.calculateVelocities(
      currentPeriodTags,
      previousPeriodTags
    );

    const sorted = trendingTags.sort((a, b) => b.velocityScore - a.velocityScore);

    return sorted.slice(0, limit);
  }

  /**
   * Get tag mentions and engagement for a time period
   */
  private async getTagMentions(
    organizationId: string,
    integrationIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<TagMentionData[]> {
    const whereClause: any = {
      organizationId,
      publishedAt: { gte: startDate, lte: endDate },
      deletedAt: null,
    };

    if (integrationIds.length > 0) {
      whereClause.integrationId = { in: integrationIds };
    }

    const content = await this._prismaService.analyticsContent.findMany({
      where: whereClause,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        metrics: {
          where: {
            date: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    const tagMap = new Map<
      string,
      {
        tag: any;
        mentions: number;
        totalEngagement: number;
        contentIds: Set<string>;
      }
    >();

    for (const item of content) {
      for (const { tag } of item.tags) {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, {
            tag,
            mentions: 0,
            totalEngagement: 0,
            contentIds: new Set(),
          });
        }

        const tagData = tagMap.get(tag.id)!;
        tagData.contentIds.add(item.id);
        tagData.mentions = tagData.contentIds.size;

        const contentEngagement = item.metrics.reduce(
          (sum: number, m: any) =>
            sum +
            ((m.reactions as number) || 0) +
            ((m.comments as number) || 0) +
            ((m.shares as number) || 0),
          0
        );
        tagData.totalEngagement += contentEngagement;
      }
    }

    return Array.from(tagMap.values()).map((data) => ({
      tag: data.tag,
      mentions: data.mentions,
      totalEngagement: data.totalEngagement,
      avgEngagement:
        data.mentions > 0 ? data.totalEngagement / data.mentions : 0,
    }));
  }

  /**
   * Calculate velocity scores for tags
   */
  private calculateVelocities(
    currentPeriod: TagMentionData[],
    previousPeriod: TagMentionData[]
  ): TrendingResult[] {
    const previousMap = new Map(
      previousPeriod.map((item) => [item.tag.id, item])
    );

    return currentPeriod
      .map((current) => {
        const previous = previousMap.get(current.tag.id);

        if (!previous) {
          return {
            tag: current.tag,
            currentMentions: current.mentions,
            previousMentions: 0,
            mentionVelocity: 100,
            currentAvgEngagement: Math.round(current.avgEngagement),
            previousAvgEngagement: 0,
            engagementVelocity: 100,
            velocityScore: 100,
            isNew: true,
          };
        }

        const mentionVelocity =
          previous.mentions > 0
            ? ((current.mentions - previous.mentions) / previous.mentions) * 100
            : 0;

        const engagementVelocity =
          previous.avgEngagement > 0
            ? ((current.avgEngagement - previous.avgEngagement) /
                previous.avgEngagement) *
              100
            : 0;

        const velocityScore = mentionVelocity * 0.4 + engagementVelocity * 0.6;

        return {
          tag: current.tag,
          currentMentions: current.mentions,
          previousMentions: previous.mentions,
          mentionVelocity: Math.round(mentionVelocity * 10) / 10,
          currentAvgEngagement: Math.round(current.avgEngagement),
          previousAvgEngagement: Math.round(previous.avgEngagement),
          engagementVelocity: Math.round(engagementVelocity * 10) / 10,
          velocityScore: Math.round(velocityScore * 10) / 10,
          isNew: false,
        };
      })
      .filter((item) => item.velocityScore > 0);
  }

  /**
   * Parse time window string to hours
   */
  private parseTimeWindow(window: '24h' | '48h' | '72h'): number {
    const map: Record<string, number> = { '24h': 24, '48h': 48, '72h': 72 };
    return map[window] || 24;
  }

  /**
   * Get integration IDs from group
   */
  private async getIntegrationIdsFromGroup(
    organizationId: string,
    groupId: string
  ): Promise<string[]> {
    const group = await this._prismaService.analyticsGroup.findFirst({
      where: {
        id: groupId,
        organizationId,
        deletedAt: null,
      },
      include: {
        members: {
          include: {
            trackedIntegration: true,
          },
        },
      },
    });

    if (!group) return [];

    return group.members.map((m) => m.trackedIntegration.integrationId);
  }
}
