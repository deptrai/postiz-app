import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Transport } from '@nestjs/microservices';

interface AnalyticsIngestPayload {
  organizationId: string;
  integrationId: string;
  date: string;
  jobId: string;
  isBackfill?: boolean;
}

interface AnalyticsAggregatePayload {
  date: string;
  jobId: string;
  organizationId?: string;
}

@Controller()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  /**
   * Process analytics ingestion job
   * Fetches content metadata and daily metrics from Facebook API
   */
  @EventPattern('analytics-ingest', Transport.REDIS)
  async processIngestion(payload: AnalyticsIngestPayload) {
    const { organizationId, integrationId, date, jobId, isBackfill } = payload;

    this.logger.log(
      `Processing ingestion job | jobId: ${jobId}, org: ${organizationId}, integration: ${integrationId}, date: ${date}, backfill: ${isBackfill || false}`
    );

    try {
      // TODO: Epic 2 - Story 2.2: Implement content metadata ingestion
      // TODO: Epic 2 - Story 2.3: Implement daily metrics ingestion
      
      // Placeholder for now - will be implemented in Epic 2
      this.logger.log(
        `[PLACEHOLDER] Ingestion logic not yet implemented. This will fetch Facebook data for integration: ${integrationId} on ${date}`
      );

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));

      this.logger.log(
        `Completed ingestion job | jobId: ${jobId}, org: ${organizationId}, integration: ${integrationId}, date: ${date}`
      );

      return {
        success: true,
        organizationId,
        integrationId,
        date,
        jobId,
      };
    } catch (error) {
      this.handleIngestionError(error, payload);
      // Return error result for non-throwing cases
      return {
        success: false,
        organizationId,
        integrationId,
        date,
        jobId,
        error: error.message,
      };
    }
  }

  /**
   * Process analytics aggregation job
   * Aggregates metrics across integrations and groups
   */
  @EventPattern('analytics-aggregate', Transport.REDIS)
  async processAggregation(payload: AnalyticsAggregatePayload) {
    const { date, jobId, organizationId } = payload;

    this.logger.log(
      `Processing aggregation job | jobId: ${jobId}, date: ${date}, org: ${organizationId || 'all'}`
    );

    try {
      // TODO: Epic 2 - Story 2.4: Implement aggregation logic
      
      // Placeholder for now
      this.logger.log(
        `[PLACEHOLDER] Aggregation logic not yet implemented. This will aggregate metrics for ${date}`
      );

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));

      this.logger.log(
        `Completed aggregation job | jobId: ${jobId}, date: ${date}`
      );

      return {
        success: true,
        date,
        jobId,
      };
    } catch (error) {
      this.logger.error(
        `Aggregation job failed | jobId: ${jobId}, date: ${date}, error: ${error.message}`,
        error.stack
      );

      // Aggregation failures are non-blocking, log and continue
      return {
        success: false,
        date,
        jobId,
        error: error.message,
      };
    }
  }

  /**
   * Handle ingestion errors with classification
   * Determines if error is transient (retry) or permanent (stop retry)
   */
  private handleIngestionError(error: any, payload: AnalyticsIngestPayload) {
    const { organizationId, integrationId, date, jobId } = payload;

    // Classify error type
    const errorType = this.classifyError(error);

    this.logger.error(
      `Ingestion job failed | jobId: ${jobId}, org: ${organizationId}, integration: ${integrationId}, date: ${date}, errorType: ${errorType}, error: ${error.message}`,
      error.stack
    );

    // Permanent errors should stop retry
    if (errorType === 'permanent') {
      this.logger.warn(
        `Permanent error detected | jobId: ${jobId}, stopping retries. Reason: ${error.message}`
      );

      // TODO: Epic 2 - Store error in database for monitoring
      // await this._databaseService.errors.create({
      //   data: {
      //     message: `Analytics ingestion failed: ${error.message}`,
      //     body: JSON.stringify({ organizationId, integrationId, date, errorType }),
      //     platform: 'facebook',
      //     organizationId,
      //     postId: 'N/A', // or create separate analytics error table
      //   }
      // });

      // Throw with specific message to prevent further retries
      throw new Error(`PERMANENT_ERROR: ${error.message}`);
    }

    // Transient errors will be retried by BullMQ
    this.logger.warn(
      `Transient error detected | jobId: ${jobId}, will retry. Reason: ${error.message}`
    );

    throw error; // Re-throw for BullMQ retry mechanism
  }

  /**
   * Classify error as transient (network/5xx) or permanent (auth/permission)
   */
  private classifyError(error: any): 'transient' | 'permanent' {
    const message = error.message?.toLowerCase() || '';
    const statusCode = error.statusCode || error.status;

    // Permanent error patterns
    const permanentPatterns = [
      'invalid token',
      'token expired',
      'permission denied',
      'access denied',
      'unauthorized',
      'forbidden',
      'invalid credentials',
      'authentication failed',
      'oauth',
    ];

    if (permanentPatterns.some(pattern => message.includes(pattern))) {
      return 'permanent';
    }

    // HTTP 401, 403 are permanent
    if (statusCode === 401 || statusCode === 403) {
      return 'permanent';
    }

    // HTTP 400 (bad request) is permanent
    if (statusCode === 400) {
      return 'permanent';
    }

    // All other errors are transient (network, 5xx, timeouts, etc.)
    return 'transient';
  }
}
