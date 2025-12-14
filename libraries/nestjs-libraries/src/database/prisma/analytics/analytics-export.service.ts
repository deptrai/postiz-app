import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { stringify } from 'csv-stringify/sync';
import dayjs from 'dayjs';

export interface ExportOptions {
  groupId?: string;
  integrationIds?: string[];
  startDate: string;
  endDate: string;
  format?: 'post' | 'reel' | 'all';
  exportType: 'detailed' | 'summary';
}

export interface DetailedExportRow {
  'Content ID': string;
  'Integration Name': string;
  'Content Type': string;
  'Published Date': string;
  'Caption': string;
  'Hashtags': string;
  'Total Reach': number;
  'Total Impressions': number;
  'Total Reactions': number;
  'Total Comments': number;
  'Total Shares': number;
  'Total Video Views': number;
  'Total Engagement': number;
  'Engagement Rate (%)': string;
  'Tags': string;
}

export interface SummaryExportRow {
  'Date': string;
  'Content Count': number;
  'Total Reach': number;
  'Total Impressions': number;
  'Total Reactions': number;
  'Total Comments': number;
  'Total Shares': number;
  'Total Video Views': number;
  'Total Engagement': number;
  'Engagement Rate (%)': string;
}

@Injectable()
export class AnalyticsExportService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Generate CSV export of analytics data
   * Supports both detailed (per content) and summary (per day) export types
   */
  async generateCSV(
    organizationId: string,
    options: ExportOptions
  ): Promise<string> {
    if (options.exportType === 'detailed') {
      return this.generateDetailedCSV(organizationId, options);
    } else {
      return this.generateSummaryCSV(organizationId, options);
    }
  }

  /**
   * Generate detailed CSV with one row per content item
   * Uses AnalyticsDailyMetric for metrics aggregation
   */
  private async generateDetailedCSV(
    organizationId: string,
    options: ExportOptions
  ): Promise<string> {
    const startDate = dayjs(options.startDate).startOf('day').toDate();
    const endDate = dayjs(options.endDate).endOf('day').toDate();

    // Get integration IDs if groupId provided
    const integrationIds = options.groupId
      ? await this.getIntegrationIdsFromGroup(organizationId, options.groupId)
      : options.integrationIds || [];

    // Build where clause for content query
    const contentWhere: any = {
      organizationId,
      publishedAt: { gte: startDate, lte: endDate },
      deletedAt: null,
    };

    if (integrationIds.length > 0) {
      contentWhere.integrationId = { in: integrationIds };
    }

    if (options.format && options.format !== 'all') {
      contentWhere.contentType = options.format;
    }

    // Query content with integration and tags
    const content = await this._prismaService.analyticsContent.findMany({
      where: contentWhere,
      include: {
        integration: {
          select: {
            name: true,
          },
        },
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

    // Batch fetch all metrics for all content items (fixes N+1 query problem)
    const externalContentIds = content.map((c) => c.externalContentId);
    const allMetrics = externalContentIds.length > 0
      ? await this._prismaService.analyticsDailyMetric.findMany({
          where: {
            organizationId,
            externalContentId: { in: externalContentIds },
            date: { gte: startDate, lte: endDate },
            deletedAt: null,
          },
        })
      : [];

    // Group metrics by externalContentId for efficient lookup
    const metricsMap = new Map<string, typeof allMetrics>();
    allMetrics.forEach((metric) => {
      const existing = metricsMap.get(metric.externalContentId) || [];
      existing.push(metric);
      metricsMap.set(metric.externalContentId, existing);
    });

    // Format data for CSV using pre-fetched metrics
    const rows: DetailedExportRow[] = content.map((item) => {
      const dailyMetrics = metricsMap.get(item.externalContentId) || [];

      // Aggregate metrics across all days
      const totalReach = dailyMetrics.reduce(
        (sum: number, m) => sum + (m.reach || 0),
        0
      );
      const totalImpressions = dailyMetrics.reduce(
        (sum: number, m) => sum + (m.impressions || 0),
        0
      );
      const totalReactions = dailyMetrics.reduce(
        (sum: number, m) => sum + (m.reactions || 0),
        0
      );
      const totalComments = dailyMetrics.reduce(
        (sum: number, m) => sum + (m.comments || 0),
        0
      );
      const totalShares = dailyMetrics.reduce(
        (sum: number, m) => sum + (m.shares || 0),
        0
      );
      const totalVideoViews = dailyMetrics.reduce(
        (sum: number, m) => sum + (m.videoViews || 0),
        0
      );
      const totalEngagement = totalReactions + totalComments + totalShares;
      const engagementRate =
        totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

      // Format tags
      const tags = item.tags.map((t) => t.tag.name).join(',');

      // Parse hashtags from JSON string
      let hashtags = '';
      try {
        const hashtagsArray = JSON.parse(item.hashtags || '[]');
        hashtags = Array.isArray(hashtagsArray) ? hashtagsArray.join(',') : '';
      } catch {
        hashtags = '';
      }

      return {
        'Content ID': item.id,
        'Integration Name': item.integration?.name || 'Unknown',
        'Content Type': item.contentType,
        'Published Date': dayjs(item.publishedAt).format('YYYY-MM-DD HH:mm:ss'),
        'Caption': (item.caption || '').replace(/[\r\n]+/g, ' '), // Remove newlines for CSV
        'Hashtags': hashtags,
        'Total Reach': totalReach,
        'Total Impressions': totalImpressions,
        'Total Reactions': totalReactions,
        'Total Comments': totalComments,
        'Total Shares': totalShares,
        'Total Video Views': totalVideoViews,
        'Total Engagement': totalEngagement,
        'Engagement Rate (%)': engagementRate.toFixed(2),
        'Tags': tags,
      };
    });

    // Generate CSV with headers
    const csv = stringify(rows, {
      header: true,
      quoted: true,
    });

    return csv;
  }

  /**
   * Generate summary CSV with one row per day (aggregated metrics)
   */
  private async generateSummaryCSV(
    organizationId: string,
    options: ExportOptions
  ): Promise<string> {
    const startDate = dayjs(options.startDate).startOf('day').toDate();
    const endDate = dayjs(options.endDate).endOf('day').toDate();

    const integrationIds = options.groupId
      ? await this.getIntegrationIdsFromGroup(organizationId, options.groupId)
      : options.integrationIds || [];

    // If format filter is applied, we need to get externalContentIds from AnalyticsContent first
    let filteredExternalContentIds: string[] | null = null;
    if (options.format && options.format !== 'all') {
      const contentWhere: any = {
        organizationId,
        publishedAt: { gte: startDate, lte: endDate },
        deletedAt: null,
        contentType: options.format,
      };
      if (integrationIds.length > 0) {
        contentWhere.integrationId = { in: integrationIds };
      }
      const filteredContent = await this._prismaService.analyticsContent.findMany({
        where: contentWhere,
        select: { externalContentId: true },
      });
      filteredExternalContentIds = filteredContent.map((c) => c.externalContentId);
    }

    // Build where clause for metrics query
    const metricsWhere: any = {
      organizationId,
      date: { gte: startDate, lte: endDate },
      deletedAt: null,
    };

    if (integrationIds.length > 0) {
      metricsWhere.integrationId = { in: integrationIds };
    }

    // Apply format filter via externalContentIds
    if (filteredExternalContentIds !== null) {
      if (filteredExternalContentIds.length === 0) {
        // No content matches the format filter, return empty CSV with headers
        const emptyRow: SummaryExportRow = {
          'Date': '',
          'Content Count': 0,
          'Total Reach': 0,
          'Total Impressions': 0,
          'Total Reactions': 0,
          'Total Comments': 0,
          'Total Shares': 0,
          'Total Video Views': 0,
          'Total Engagement': 0,
          'Engagement Rate (%)': '0.00',
        };
        return stringify([], { header: true, columns: Object.keys(emptyRow) });
      }
      metricsWhere.externalContentId = { in: filteredExternalContentIds };
    }

    // Query daily metrics
    const metrics = await this._prismaService.analyticsDailyMetric.findMany({
      where: metricsWhere,
      orderBy: {
        date: 'asc',
      },
    });

    // Group metrics by date
    const dailyMap = new Map<
      string,
      {
        date: string;
        contentCount: number;
        reach: number;
        impressions: number;
        reactions: number;
        comments: number;
        shares: number;
        videoViews: number;
      }
    >();

    metrics.forEach((metric) => {
      const dateKey = dayjs(metric.date).format('YYYY-MM-DD');
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          contentCount: 0,
          reach: 0,
          impressions: 0,
          reactions: 0,
          comments: 0,
          shares: 0,
          videoViews: 0,
        });
      }
      const daily = dailyMap.get(dateKey)!;
      daily.contentCount++;
      daily.reach += metric.reach || 0;
      daily.impressions += metric.impressions || 0;
      daily.reactions += metric.reactions || 0;
      daily.comments += metric.comments || 0;
      daily.shares += metric.shares || 0;
      daily.videoViews += metric.videoViews || 0;
    });

    // Format for CSV
    const rows: SummaryExportRow[] = Array.from(dailyMap.values()).map(
      (daily) => {
        const totalEngagement =
          daily.reactions + daily.comments + daily.shares;
        const engagementRate =
          daily.reach > 0 ? (totalEngagement / daily.reach) * 100 : 0;

        return {
          'Date': daily.date,
          'Content Count': daily.contentCount,
          'Total Reach': daily.reach,
          'Total Impressions': daily.impressions,
          'Total Reactions': daily.reactions,
          'Total Comments': daily.comments,
          'Total Shares': daily.shares,
          'Total Video Views': daily.videoViews,
          'Total Engagement': totalEngagement,
          'Engagement Rate (%)': engagementRate.toFixed(2),
        };
      }
    );

    const csv = stringify(rows, {
      header: true,
      quoted: true,
    });

    return csv;
  }

  /**
   * Get integration IDs from a group
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
