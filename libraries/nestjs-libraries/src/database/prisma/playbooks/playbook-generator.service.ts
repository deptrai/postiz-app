import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import dayjs from 'dayjs';

export interface GeneratePlaybooksOptions {
  groupId?: string;
  integrationIds?: string[];
  days?: number; // Default 30
  minContentItems?: number; // Min items for playbook (default 3)
}

export interface PlaybookRecipe {
  format: string;
  captionBucket: {
    hooks: string[];
    ctaPatterns: string[];
  };
  hashtagBucket: string[];
  timeBucket: {
    bestHours: number[];
    bestDays: number[];
  };
}

export interface PlaybookEvidence {
  medianReach: number;
  medianEngagement: number;
  engagementRate: number;
  contentCount: number;
}

@Injectable()
export class PlaybookGeneratorService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Generate playbooks from top-performing content
   */
  async generatePlaybooks(
    organizationId: string,
    options: GeneratePlaybooksOptions = {}
  ): Promise<string[]> {
    const days = options.days || 30;
    const minContentItems = options.minContentItems || 3;
    const startDate = dayjs().subtract(days, 'days').toDate();
    const endDate = new Date();

    // Get integration IDs
    let integrationIds = options.integrationIds || [];
    if (options.groupId) {
      integrationIds = await this.getIntegrationIdsFromGroup(
        organizationId,
        options.groupId
      );
    }

    // Get top content with metrics
    const topContent = await this.getTopContent(
      organizationId,
      integrationIds,
      startDate,
      endDate
    );

    console.log(`[PlaybookGenerator] Found ${topContent.length} top content items`);

    if (topContent.length === 0) {
      console.log('[PlaybookGenerator] No top content found, returning empty');
      return [];
    }

    // Group content by format and optionally by group
    const groupedContent = this.groupContentByFormat(topContent);

    const playbookIds: string[] = [];

    // Generate playbook for each format group
    for (const [format, contents] of Object.entries(groupedContent)) {
      if (contents.length < minContentItems) {
        continue; // Skip if not enough content
      }

      // Extract patterns
      const recipe = this.extractPatterns(contents);
      const evidence = this.calculateEvidence(contents);
      const consistencyScore = this.calculateConsistencyScore(contents);

      // Create playbook
      const playbook = await this._prismaService.playbook.create({
        data: {
          name: `${format} Playbook - ${dayjs().format('YYYY-MM-DD')}`,
          organizationId,
          groupId: options.groupId || null,
          format,
          recipe: recipe as any,
          evidence: evidence as any,
          consistencyScore,
          sourceContent: {
            create: contents.map((c) => ({
              contentId: c.id,
            })),
          },
        },
      });

      playbookIds.push(playbook.id);
    }

    return playbookIds;
  }

  /**
   * Get top-performing content from analytics
   */
  private async getTopContent(
    organizationId: string,
    integrationIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const whereClause: any = {
      organizationId,
      publishedAt: {
        gte: startDate,
        lte: endDate,
      },
      deletedAt: null,
    };

    if (integrationIds.length > 0) {
      whereClause.integrationId = { in: integrationIds };
    }

    // Get content with tags
    console.log('[PlaybookGenerator] Querying content with:', JSON.stringify(whereClause, null, 2));
    const content = await this._prismaService.analyticsContent.findMany({
      where: whereClause,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
    console.log(`[PlaybookGenerator] Found ${content.length} content items`);

    // Get metrics for content (using analyticsMetric table)
    const contentIds = content.map((c) => c.externalContentId);
    console.log(`[PlaybookGenerator] Querying metrics for ${contentIds.length} content IDs:`, contentIds);
    const metrics = await this._prismaService.analyticsMetric.findMany({
      where: {
        organizationId,
        externalContentId: { in: contentIds },
        date: { gte: startDate, lte: endDate },
      },
    });
    console.log(`[PlaybookGenerator] Found ${metrics.length} metrics`);

    // Group metrics by content
    const metricsByContent = new Map<string, any[]>();
    for (const metric of metrics) {
      if (!metricsByContent.has(metric.externalContentId)) {
        metricsByContent.set(metric.externalContentId, []);
      }
      metricsByContent.get(metric.externalContentId)!.push(metric);
    }
    console.log(`[PlaybookGenerator] Grouped metrics for ${metricsByContent.size} unique content items`);

    // Calculate total reach and engagement for each content
    const contentWithMetrics = content.map((item) => {
      const metrics = metricsByContent.get(item.externalContentId) || [];
      
      // Aggregate metrics by type (AnalyticsMetric stores each metric type as separate row)
      const metricsByType = new Map<string, number>();
      for (const metric of metrics) {
        const currentValue = metricsByType.get(metric.metricType) || 0;
        metricsByType.set(metric.metricType, currentValue + (metric.metricValue || 0));
      }
      
      const totalReach = metricsByType.get('reach') || 0;
      const totalEngagement =
        (metricsByType.get('likes') || 0) +
        (metricsByType.get('comments') || 0) +
        (metricsByType.get('shares') || 0);
      const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

      return {
        ...item,
        metrics,
        totalReach,
        totalEngagement,
        engagementRate,
      };
    });

    // Filter and sort by total engagement (likes + comments)
    // If no reach data available, use engagement as primary metric
    const sorted = contentWithMetrics
      .filter((c) => c.totalEngagement > 0 || c.totalReach > 0)
      .sort((a, b) => {
        // Sort by engagement rate if reach available, otherwise by total engagement
        if (a.totalReach > 0 && b.totalReach > 0) {
          return b.engagementRate - a.engagementRate;
        }
        return b.totalEngagement - a.totalEngagement;
      });

    console.log(`[PlaybookGenerator] After filtering (has engagement or reach): ${sorted.length} items`);
    if (sorted.length > 0) {
      console.log('[PlaybookGenerator] Sample metrics:', sorted.slice(0, 3).map(c => ({
        id: c.externalContentId.substring(0, 20),
        reach: c.totalReach,
        engagement: c.totalEngagement,
        rate: c.totalReach > 0 ? c.engagementRate.toFixed(2) + '%' : 'N/A'
      })));
    }

    // Return top 25% of content, but at least 3 items if available
    const topPercentile = Math.max(Math.ceil(sorted.length * 0.25), Math.min(3, sorted.length));
    console.log(`[PlaybookGenerator] Returning top ${topPercentile} items (25% of ${sorted.length}, min 3)`);
    return sorted.slice(0, topPercentile);
    
    // Original code (commented for debugging):
    // const topPercentile = Math.ceil(sorted.length * 0.25);
    // return sorted.slice(0, topPercentile);
  }

  /**
   * Group content by format (post/reel)
   */
  private groupContentByFormat(content: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    for (const item of content) {
      const format = item.contentType || 'post';
      if (!grouped[format]) {
        grouped[format] = [];
      }
      grouped[format].push(item);
    }

    return grouped;
  }

  /**
   * Extract common patterns from content
   */
  private extractPatterns(contents: any[]): PlaybookRecipe {
    // Extract hooks (first sentence from caption)
    const hooks = this.extractHooks(contents);

    // Extract CTAs
    const ctaPatterns = this.extractCTAs(contents);

    // Extract top hashtags
    const hashtagBucket = this.extractHashtags(contents);

    // Extract best posting times
    const { bestHours, bestDays } = this.extractPostingTimes(contents);

    return {
      format: contents[0]?.contentType || 'post',
      captionBucket: {
        hooks,
        ctaPatterns,
      },
      hashtagBucket,
      timeBucket: {
        bestHours,
        bestDays,
      },
    };
  }

  /**
   * Extract hook patterns from captions
   */
  private extractHooks(contents: any[]): string[] {
    const hooks: string[] = [];

    for (const content of contents) {
      if (!content.caption) continue;

      // Extract first sentence as hook
      const firstSentence = content.caption.split(/[.!?]/)[0].trim();
      if (firstSentence.length > 10 && firstSentence.length < 100) {
        hooks.push(firstSentence);
      }
    }

    // Return top 5 unique hooks
    return [...new Set(hooks)].slice(0, 5);
  }

  /**
   * Extract CTA patterns
   */
  private extractCTAs(contents: any[]): string[] {
    const ctas: string[] = [];
    const ctaPatterns = [
      /check out/i,
      /learn more/i,
      /click link/i,
      /swipe up/i,
      /comment below/i,
      /tag a friend/i,
      /share this/i,
    ];

    for (const content of contents) {
      if (!content.caption) continue;

      for (const pattern of ctaPatterns) {
        if (pattern.test(content.caption)) {
          const match = content.caption.match(pattern);
          if (match) {
            ctas.push(match[0]);
          }
        }
      }
    }

    // Return unique CTAs
    return [...new Set(ctas)].slice(0, 5);
  }

  /**
   * Extract top hashtags
   */
  private extractHashtags(contents: any[]): string[] {
    const hashtagCounts = new Map<string, number>();

    for (const content of contents) {
      if (!content.hashtags) continue;

      try {
        const hashtags = JSON.parse(content.hashtags);
        if (Array.isArray(hashtags)) {
          for (const tag of hashtags) {
            hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
          }
        }
      } catch (e) {
        // Skip malformed JSON
      }
    }

    // Sort by frequency and return top 10
    return Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }

  /**
   * Extract best posting times
   */
  private extractPostingTimes(contents: any[]): { bestHours: number[]; bestDays: number[] } {
    const hourCounts = new Map<number, number>();
    const dayCounts = new Map<number, number>();

    for (const content of contents) {
      const date = dayjs(content.publishedAt);
      const hour = date.hour();
      const day = date.day(); // 0 = Sunday, 6 = Saturday
      
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    }

    // Return top 3 hours and top 3 days
    const bestHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    const bestDays = Array.from(dayCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);

    return { bestHours, bestDays };
  }

  /**
   * Calculate evidence metrics
   */
  private calculateEvidence(contents: any[]): PlaybookEvidence {
    const reaches = contents.map((c) => c.totalReach).sort((a, b) => a - b);
    const engagements = contents.map((c) => c.totalEngagement).sort((a, b) => a - b);
    const engagementRates = contents.map((c) => c.engagementRate).sort((a, b) => a - b);

    const medianReach = this.getMedian(reaches);
    const medianEngagement = this.getMedian(engagements);
    const engagementRate = this.getMedian(engagementRates);

    return {
      medianReach,
      medianEngagement,
      engagementRate,
      contentCount: contents.length,
    };
  }

  /**
   * Calculate consistency score
   * Score = (items above median) / (total items) * 100
   */
  private calculateConsistencyScore(contents: any[]): number {
    if (contents.length < 3) return 0;

    const reaches = contents.map((c) => c.totalReach);
    const median = this.getMedian(reaches);
    const aboveMedian = reaches.filter((r) => r >= median).length;

    return (aboveMedian / reaches.length) * 100;
  }

  /**
   * Get median value from array
   */
  private getMedian(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
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
