import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import dayjs from 'dayjs';

export interface TimeSlot {
  dayOfWeek: number;
  hour: number;
  contentCount: number;
  totalEngagement: number;
  avgEngagement: number;
  confidenceScore: number;
}

export interface HeatmapCell {
  hour: number;
  engagement: number;
  count: number;
  confidence: number;
}

export interface Recommendation {
  dayOfWeek: number;
  dayName: string;
  hour: number;
  timeRange: string;
  avgEngagement: number;
  contentCount: number;
  confidenceScore: number;
  recommendation: string;
}

@Injectable()
export class AnalyticsBestTimeService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Get best time slots for posting
   */
  async getBestTimeSlots(
    organizationId: string,
    options: {
      groupId?: string;
      integrationIds?: string[];
      format?: 'post' | 'reel' | 'all';
      days: 7 | 14;
    }
  ) {
    const startDate = dayjs().subtract(options.days, 'days').toDate();
    const endDate = new Date();

    let integrationIds = options.integrationIds || [];
    if (options.groupId) {
      integrationIds = await this.getIntegrationIdsFromGroup(
        organizationId,
        options.groupId
      );
    }

    const whereClause: any = {
      organizationId,
      publishedAt: { gte: startDate, lte: endDate },
      deletedAt: null,
    };

    if (integrationIds.length > 0) {
      whereClause.integrationId = { in: integrationIds };
    }

    if (options.format && options.format !== 'all') {
      whereClause.contentType = options.format;
    }

    const content = await this._prismaService.analyticsContent.findMany({
      where: whereClause,
      include: {
        metrics: {
          where: {
            date: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    const slots = this.calculateSlotPerformance(content);
    const heatmap = this.generateHeatmap(slots);
    const recommendations = this.getTopRecommendations(slots, 5);

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: options.days,
      },
      totalContent: content.length,
      format: options.format || 'all',
      heatmap,
      recommendations,
    };
  }

  /**
   * Calculate performance metrics for each time slot
   */
  private calculateSlotPerformance(content: any[]): TimeSlot[] {
    const slotMap = new Map<
      string,
      {
        count: number;
        totalEngagement: number;
      }
    >();

    for (const item of content) {
      if (!item.publishedAt) continue;

      const publishedAt = dayjs(item.publishedAt);
      const dayOfWeek = publishedAt.day();
      const hour = publishedAt.hour();
      const slotKey = `${dayOfWeek}-${hour}`;

      if (!slotMap.has(slotKey)) {
        slotMap.set(slotKey, { count: 0, totalEngagement: 0 });
      }

      const slot = slotMap.get(slotKey)!;
      slot.count++;

      const engagement = item.metrics.reduce(
        (sum: number, m: any) =>
          sum +
          ((m.reactions as number) || 0) +
          ((m.comments as number) || 0) +
          ((m.shares as number) || 0),
        0
      );
      slot.totalEngagement += engagement;
    }

    const slots: TimeSlot[] = [];
    slotMap.forEach((data, key) => {
      const [dayOfWeek, hour] = key.split('-').map(Number);
      const avgEngagement =
        data.count > 0 ? data.totalEngagement / data.count : 0;
      const confidenceScore = Math.min(data.count / 5, 1);

      slots.push({
        dayOfWeek,
        hour,
        contentCount: data.count,
        totalEngagement: data.totalEngagement,
        avgEngagement: Math.round(avgEngagement),
        confidenceScore: Math.round(confidenceScore * 100) / 100,
      });
    });

    return slots;
  }

  /**
   * Generate 7×24 heatmap grid
   */
  private generateHeatmap(slots: TimeSlot[]): HeatmapCell[][] {
    const grid: HeatmapCell[][] = [];

    for (let day = 0; day < 7; day++) {
      grid[day] = [];
      for (let hour = 0; hour < 24; hour++) {
        const slot = slots.find(
          (s) => s.dayOfWeek === day && s.hour === hour
        );
        grid[day][hour] = {
          hour,
          engagement: slot?.avgEngagement || 0,
          count: slot?.contentCount || 0,
          confidence: slot?.confidenceScore || 0,
        };
      }
    }

    return grid;
  }

  /**
   * Get top N recommended time slots
   */
  private getTopRecommendations(
    slots: TimeSlot[],
    limit: number
  ): Recommendation[] {
    const qualifiedSlots = slots.filter((s) => s.confidenceScore >= 0.4);

    const sorted = qualifiedSlots.sort(
      (a, b) => b.avgEngagement - a.avgEngagement
    );

    return sorted.slice(0, limit).map((slot) => ({
      dayOfWeek: slot.dayOfWeek,
      dayName: this.getDayName(slot.dayOfWeek),
      hour: slot.hour,
      timeRange: `${slot.hour}:00-${slot.hour + 1}:00`,
      avgEngagement: slot.avgEngagement,
      contentCount: slot.contentCount,
      confidenceScore: slot.confidenceScore,
      recommendation: this.generateRecommendation(slot),
    }));
  }

  /**
   * Get day name from day of week number
   */
  private getDayName(dayOfWeek: number): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[dayOfWeek];
  }

  /**
   * Generate recommendation text
   */
  private generateRecommendation(slot: TimeSlot): string {
    return `Best time: ${this.getDayName(slot.dayOfWeek)} at ${slot.hour}:00-${
      slot.hour + 1
    }:00 (avg ${slot.avgEngagement} engagement)`;
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
