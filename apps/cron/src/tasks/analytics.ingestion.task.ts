import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BullMqClient } from '@gitroom/nestjs-libraries/bull-mq-transport-new/client';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { AnalyticsTrackingService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-tracking.service';
import dayjs from 'dayjs';

@Injectable()
export class AnalyticsIngestionTask {
  private readonly logger = new Logger(AnalyticsIngestionTask.name);

  constructor(
    private _workerServiceProducer: BullMqClient,
    private _prismaService: PrismaService,
    private _analyticsTrackingService: AnalyticsTrackingService
  ) {}

  /**
   * Daily analytics ingestion job - runs at 2 AM daily
   * Enqueues ingestion jobs for tracked integrations only
   */
  @Cron('0 2 * * *')
  async handleDailyIngestion() {
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    
    this.logger.log(`Starting daily analytics ingestion for date: ${yesterday}`);

    try {
      // Get all tracked integrations (from Story 2.1)
      const trackedIntegrations = await this._prismaService.analyticsTrackedIntegration.findMany({
        where: {
          integration: {
            providerIdentifier: 'facebook',
            disabled: false,
            deletedAt: null,
          },
        },
        include: {
          integration: {
            select: {
              id: true,
              organizationId: true,
              name: true,
              providerIdentifier: true,
            },
          },
        },
      });

      this.logger.log(`Found ${trackedIntegrations.length} tracked Facebook integrations`);

      // Enqueue ingestion job for each tracked integration
      for (const tracked of trackedIntegrations) {
        const integration = tracked.integration;
        const jobId = `analytics-ingest-${integration.organizationId}-${integration.id}-${yesterday}`;
        
        this._workerServiceProducer.emit('analytics-ingest', {
          id: jobId,
          options: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
          payload: {
            organizationId: integration.organizationId,
            integrationId: integration.id,
            date: yesterday,
            jobId,
          },
        });

        this.logger.log(
          `Enqueued ingestion job for org: ${integration.organizationId}, integration: ${integration.id} (${integration.name}), date: ${yesterday}`
        );
      }

      // Enqueue aggregation job after all ingestions
      const aggregationJobId = `analytics-aggregate-${yesterday}`;
      this._workerServiceProducer.emit('analytics-aggregate', {
        id: aggregationJobId,
        options: {
          delay: 30 * 60 * 1000, // 30 minutes delay to allow ingestions to complete
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
        payload: {
          date: yesterday,
          jobId: aggregationJobId,
        },
      });

      this.logger.log(
        `Enqueued aggregation job for date: ${yesterday} (delayed 30 minutes)`
      );
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to enqueue analytics jobs: ${errorMessage}`,
        error instanceof Error ? error.stack : ''
      );
    }
  }

  /**
   * Manual trigger for backfill - can be called via API or manually
   * @param organizationId - Organization to backfill
   * @param integrationId - Integration to backfill
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   */
  async triggerBackfill(
    organizationId: string,
    integrationId: string,
    startDate: string,
    endDate: string
  ) {
    this.logger.log(
      `Triggering backfill for org: ${organizationId}, integration: ${integrationId}, range: ${startDate} to ${endDate}`
    );

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    let current = start;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      const date = current.format('YYYY-MM-DD');
      const jobId = `analytics-backfill-${organizationId}-${integrationId}-${date}`;

      this._workerServiceProducer.emit('analytics-ingest', {
        id: jobId,
        options: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
        payload: {
          organizationId,
          integrationId,
          date,
          jobId,
          isBackfill: true,
        },
      });

      this.logger.log(`Enqueued backfill job for date: ${date}`);
      current = current.add(1, 'day');
    }
  }
}
