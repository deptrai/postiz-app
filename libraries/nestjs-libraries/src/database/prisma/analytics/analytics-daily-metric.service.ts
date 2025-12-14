import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

export interface DailyMetricData {
  externalContentId: string;
  date: Date;
  impressions?: number;
  reach?: number;
  reactions?: number;
  comments?: number;
  shares?: number;
  videoViews?: number;
  clicks?: number;
}

@Injectable()
export class AnalyticsDailyMetricService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Upsert a single daily metric record
   * Idempotent based on unique constraint: [organizationId, integrationId, externalContentId, date, deletedAt]
   * 
   * @param organizationId - Organization ID
   * @param integrationId - Integration ID
   * @param metricData - Daily metric data
   * @returns Created or updated AnalyticsDailyMetric record
   */
  async upsertMetric(
    organizationId: string,
    integrationId: string,
    metricData: DailyMetricData
  ) {
    return this._prismaService.analyticsDailyMetric.upsert({
      where: {
        organizationId_integrationId_externalContentId_date_deletedAt: {
          organizationId,
          integrationId,
          externalContentId: metricData.externalContentId,
          date: metricData.date,
          deletedAt: null,
        },
      },
      update: {
        impressions: metricData.impressions,
        reach: metricData.reach,
        reactions: metricData.reactions,
        comments: metricData.comments,
        shares: metricData.shares,
        videoViews: metricData.videoViews,
        clicks: metricData.clicks,
        updatedAt: new Date(),
      },
      create: {
        organizationId,
        integrationId,
        externalContentId: metricData.externalContentId,
        date: metricData.date,
        impressions: metricData.impressions,
        reach: metricData.reach,
        reactions: metricData.reactions,
        comments: metricData.comments,
        shares: metricData.shares,
        videoViews: metricData.videoViews,
        clicks: metricData.clicks,
      },
    });
  }

  /**
   * Upsert multiple daily metric records in batch
   * 
   * @param organizationId - Organization ID
   * @param integrationId - Integration ID
   * @param metrics - Array of daily metric data
   * @returns Array of created or updated records
   */
  async upsertMetricBatch(
    organizationId: string,
    integrationId: string,
    metrics: DailyMetricData[]
  ) {
    const results = [];
    
    for (const metric of metrics) {
      try {
        const result = await this.upsertMetric(organizationId, integrationId, metric);
        results.push(result);
      } catch (error) {
        // Log error but continue processing other metrics
        console.error(
          `Failed to upsert metric for content ${metric.externalContentId}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    return results;
  }

  /**
   * Get metrics for a specific content item within a date range
   * 
   * @param organizationId - Organization ID
   * @param integrationId - Integration ID
   * @param externalContentId - External content ID (Facebook post/video ID)
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Array of daily metric records
   */
  async getMetricsByContentAndDateRange(
    organizationId: string,
    integrationId: string,
    externalContentId: string,
    startDate: Date,
    endDate: Date
  ) {
    return this._prismaService.analyticsDailyMetric.findMany({
      where: {
        organizationId,
        integrationId,
        externalContentId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  /**
   * Get all metrics for an integration within a date range
   * 
   * @param organizationId - Organization ID
   * @param integrationId - Integration ID
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Array of daily metric records
   */
  async getMetricsByDateRange(
    organizationId: string,
    integrationId: string,
    startDate: Date,
    endDate: Date
  ) {
    return this._prismaService.analyticsDailyMetric.findMany({
      where: {
        organizationId,
        integrationId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      orderBy: [
        { date: 'asc' },
        { externalContentId: 'asc' },
      ],
    });
  }

  /**
   * Get latest metrics for a specific date
   * 
   * @param organizationId - Organization ID
   * @param integrationId - Integration ID
   * @param date - Target date
   * @returns Array of daily metric records for that date
   */
  async getMetricsByDate(
    organizationId: string,
    integrationId: string,
    date: Date
  ) {
    return this._prismaService.analyticsDailyMetric.findMany({
      where: {
        organizationId,
        integrationId,
        date,
        deletedAt: null,
      },
    });
  }
}
