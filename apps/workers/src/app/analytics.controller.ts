import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Transport } from '@nestjs/microservices';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { AnalyticsContentService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-content.service';
import { AnalyticsDailyMetricService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-daily-metric.service';
import { ExperimentAutoTrackingService } from '@gitroom/nestjs-libraries/database/prisma/experiments/experiment-auto-tracking.service';
import dayjs from 'dayjs';

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

  constructor(
    private _prismaService: PrismaService,
    private _analyticsContentService: AnalyticsContentService,
    private _analyticsDailyMetricService: AnalyticsDailyMetricService,
    private _experimentAutoTrackingService: ExperimentAutoTrackingService
  ) {}

  /**
   * Process analytics ingestion job
   * Fetches content metadata and daily metrics from Facebook API
   */
  @EventPattern('analytics-ingest', Transport.REDIS)
  async processIngestion(data: {
    organizationId: string;
    integrationId: string;
    date: string;
  }) {
    const { organizationId, integrationId, date } = data;

    this.logger.log(
      `Processing analytics ingestion for org=${organizationId}, integration=${integrationId}, date=${date}`
    );

    try {
      // Fetch integration to get access token
      const integration = await this._prismaService.integration.findFirst({
        where: {
          id: integrationId,
          organizationId,
          deletedAt: null,
        },
      });

      if (!integration) {
        throw new Error('Integration not found or does not belong to organization');
      }

      if (!integration.providerIdentifier || integration.providerIdentifier !== 'facebook') {
        throw new Error('Integration is not a Facebook page');
      }

      // Fetch content from Facebook Graph API
      const content = await this.fetchFacebookContent(
        integration.internalId, // Facebook page ID
        integration.token, // Access token
        date
      );

      this.logger.log(
        `Fetched ${content.length} content items from Facebook for integration=${integrationId}`
      );

      // Store content metadata using upsert for idempotency
      const stored = await this._analyticsContentService.upsertContentBatch(
        organizationId,
        integrationId,
        content
      );

      this.logger.log(
        `Stored ${stored.length} content items for integration=${integrationId}`
      );

      // Auto-track content to active experiments
      for (const content of stored) {
        try {
          await this._experimentAutoTrackingService.autoTrackContent(content.id);
        } catch (error) {
          this.logger.error(`Failed to auto-track content ${content.id}: ${error.message}`);
          // Don't fail the entire ingestion if auto-tracking fails
        }
      }

      return {
        success: true,
        organizationId,
        integrationId,
        date,
        contentCount: stored.length,
        message: 'Content metadata ingestion completed',
      };
    } catch (error: any) {
      // Classify error for retry logic
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isTransient = this.isTransientError(errorMessage);

      this.logger.error(
        `Analytics ingestion failed for integration=${integrationId}: ${errorMessage}`,
        {
          organizationId,
          integrationId,
          date,
          error: errorMessage,
          isTransient,
        }
      );

      if (isTransient) {
        // Re-throw to trigger BullMQ retry
        throw error;
      }

      // Permanent failure - log and return error state
      return {
        success: false,
        organizationId,
        integrationId,
        date,
        error: errorMessage,
        isPermanent: true,
      };
    }
  }

  /**
   * Fetch content metadata from Facebook Graph API
   * 
   * @param pageId - Facebook page ID
   * @param accessToken - Facebook access token
   * @param date - Date to fetch content for (YYYY-MM-DD)
   * @returns Array of content metadata
   */
  private async fetchFacebookContent(
    pageId: string,
    accessToken: string,
    date: string
  ): Promise<Array<{
    externalContentId: string;
    contentType: 'post' | 'reel' | 'story';
    caption?: string;
    hashtags?: string[];
    publishedAt: Date;
  }>> {
    const targetDate = dayjs(date);
    const since = targetDate.startOf('day').unix();
    const until = targetDate.endOf('day').unix();

    const content: Array<any> = [];

    // Fetch posts
    const postsUrl = `https://graph.facebook.com/v20.0/${pageId}/posts?fields=id,message,created_time&since=${since}&until=${until}&access_token=${accessToken}`;
    const postsResponse = await fetch(postsUrl);

    if (!postsResponse.ok) {
      const errorText = await postsResponse.text();
      throw new Error(`Facebook API error: ${errorText}`);
    }

    const postsData = await postsResponse.json();
    if (postsData.data) {
      for (const post of postsData.data) {
        const caption = post.message || '';
        content.push({
          externalContentId: post.id,
          contentType: 'post' as const,
          caption,
          hashtags: this._analyticsContentService.extractHashtags(caption),
          publishedAt: new Date(post.created_time),
        });
      }
    }

    // Fetch videos/reels
    const videosUrl = `https://graph.facebook.com/v20.0/${pageId}/videos?fields=id,description,created_time,is_instagram_eligible&since=${since}&until=${until}&access_token=${accessToken}`;
    const videosResponse = await fetch(videosUrl);

    if (!videosResponse.ok) {
      const errorText = await videosResponse.text();
      // Log but don't fail if videos endpoint fails (might not have permission)
      this.logger.warn(`Facebook videos API error: ${errorText}`);
    } else {
      const videosData = await videosResponse.json();
      if (videosData.data) {
        for (const video of videosData.data) {
          const caption = video.description || '';
          content.push({
            externalContentId: video.id,
            contentType: 'reel' as const, // Classify videos as reels for now
            caption,
            hashtags: this._analyticsContentService.extractHashtags(caption),
            publishedAt: new Date(video.created_time),
          });
        }
      }
    }

    return content;
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
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Aggregation job failed | jobId: ${jobId}, date: ${date}, error: ${errorMessage}`,
        error instanceof Error ? error.stack : ''
      );

      // Aggregation failures are non-blocking, log and continue
      return {
        success: false,
        date,
        jobId,
        error: errorMessage,
      };
    }
  }

  /**
   * Classify errors as transient (retry) or permanent (don't retry)
   * 
   * @param errorMessage - Error message
   * @returns True if error is transient and should be retried
   */
  private isTransientError(errorMessage: string): boolean {
    // Permanent errors (token invalid, permission denied)
    const permanentPatterns = [
      'Error validating access token',
      'access token',
      'REVOKED_ACCESS_TOKEN',
      'expired',
      'permission',
      'not found',
      'does not belong',
      'not a Facebook page',
      '190', // Facebook invalid token error code
      '490', // Facebook session expired
    ];

    const lowerMessage = errorMessage.toLowerCase();
    
    // Check for permanent errors first
    const isPermanent = permanentPatterns.some((pattern) =>
      lowerMessage.includes(pattern.toLowerCase())
    );

    if (isPermanent) {
      return false; // Don't retry permanent errors
    }

    // Transient errors (network, rate limit, temporary service issues)
    const transientPatterns = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'network',
      'timeout',
      'rate limit',
      '429', // Too Many Requests
      '500', // Internal Server Error
      '502', // Bad Gateway
      '503', // Service Unavailable
      '504', // Gateway Timeout
    ];

    return transientPatterns.some((pattern) =>
      lowerMessage.includes(pattern.toLowerCase())
    );
  }

  /**
   * Process analytics metrics ingestion job
   * Fetches daily metrics (reach, views, engagement) from Facebook API
   */
  @EventPattern('analytics-ingest-metrics', Transport.REDIS)
  async processMetricsIngestion(data: {
    organizationId: string;
    integrationId: string;
    date: string;
  }) {
    const { organizationId, integrationId, date } = data;

    this.logger.log(
      `Processing analytics metrics ingestion for org=${organizationId}, integration=${integrationId}, date=${date}`
    );

    try {
      // Fetch integration to get access token
      const integration = await this._prismaService.integration.findFirst({
        where: {
          id: integrationId,
          organizationId,
          deletedAt: null,
        },
      });

      if (!integration) {
        throw new Error('Integration not found or does not belong to organization');
      }

      if (!integration.providerIdentifier || integration.providerIdentifier !== 'facebook') {
        throw new Error('Integration is not a Facebook page');
      }

      // Fetch content items for this integration and date
      const targetDate = dayjs(date);
      const content = await this._analyticsContentService.getContentByDateRange(
        organizationId,
        integrationId,
        targetDate.startOf('day').toDate(),
        targetDate.endOf('day').toDate()
      );

      if (content.length === 0) {
        this.logger.log(
          `No content found for integration=${integrationId}, date=${date}. Skipping metrics ingestion.`
        );
        return {
          success: true,
          organizationId,
          integrationId,
          date,
          contentCount: 0,
          message: 'No content to fetch metrics for',
        };
      }

      this.logger.log(
        `Fetching metrics for ${content.length} content items for integration=${integrationId}`
      );

      // Fetch metrics for each content item
      const results = [];
      for (const contentItem of content) {
        try {
          const metrics = await this.fetchPostMetrics(
            contentItem.externalContentId,
            integration.token
          );

          await this._analyticsDailyMetricService.upsertMetric(
            organizationId,
            integrationId,
            {
              externalContentId: contentItem.externalContentId,
              date: targetDate.toDate(),
              ...metrics,
            }
          );

          results.push({ success: true, contentId: contentItem.externalContentId });
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to fetch metrics for content ${contentItem.externalContentId}: ${errorMessage}`
          );
          results.push({
            success: false,
            contentId: contentItem.externalContentId,
            error: errorMessage,
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failedContent = results.filter((r) => !r.success);

      this.logger.log(
        `Metrics ingestion complete for integration=${integrationId}: ${successCount}/${content.length} successful`
      );

      return {
        success: true,
        organizationId,
        integrationId,
        date,
        contentCount: content.length,
        successCount,
        failedContent,
        message: 'Metrics ingestion completed',
      };
    } catch (error: any) {
      // Classify error for retry logic
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isTransient = this.isTransientError(errorMessage);

      this.logger.error(
        `Analytics metrics ingestion failed for integration=${integrationId}: ${errorMessage}`,
        {
          organizationId,
          integrationId,
          date,
          error: errorMessage,
          isTransient,
        }
      );

      if (isTransient) {
        // Re-throw to trigger BullMQ retry
        throw error;
      }

      // Permanent failure - log and return error state
      return {
        success: false,
        organizationId,
        integrationId,
        date,
        error: errorMessage,
        isPermanent: true,
      };
    }
  }

  /**
   * Fetch metrics for a single post/video from Facebook Graph API
   * 
   * @param postId - Facebook post/video ID
   * @param accessToken - Facebook access token
   * @returns Parsed metrics object
   */
  private async fetchPostMetrics(
    postId: string,
    accessToken: string
  ): Promise<{
    impressions?: number;
    reach?: number;
    reactions?: number;
    comments?: number;
    shares?: number;
    videoViews?: number;
    clicks?: number;
  }> {
    // Facebook Insights API endpoint
    const metricsToFetch = [
      'post_impressions',
      'post_impressions_unique',
      'post_engaged_users',
      'post_reactions_by_type_total',
      'post_clicks',
      'post_video_views',
    ].join(',');

    const url = `https://graph.facebook.com/v20.0/${postId}/insights?metric=${metricsToFetch}&access_token=${accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Facebook Insights API error: ${errorText}`);
    }

    const data = await response.json();

    // Parse metrics response
    return this.parseMetricsResponse(data);
  }

  /**
   * Parse Facebook Insights API response into our metric fields
   * Handles missing/null values gracefully (AC #3)
   * 
   * @param data - Facebook API response
   * @returns Parsed metrics object with nullable fields
   */
  private parseMetricsResponse(data: any): {
    impressions?: number;
    reach?: number;
    reactions?: number;
    comments?: number;
    shares?: number;
    videoViews?: number;
    clicks?: number;
  } {
    const metrics: Record<string, number | undefined> = {};

    if (!data || !data.data) {
      return metrics;
    }

    for (const metric of data.data) {
      const value = metric.values?.[0]?.value;

      if (value !== undefined && value !== null) {
        switch (metric.name) {
          case 'post_impressions':
            metrics.impressions = typeof value === 'number' ? value : undefined;
            break;
          case 'post_impressions_unique':
            metrics.reach = typeof value === 'number' ? value : undefined;
            break;
          case 'post_engaged_users':
            // Use engaged users as a proxy for total engagement
            // In future, could sum reactions+comments+shares separately
            break;
          case 'post_reactions_by_type_total':
            // This is an object with reaction types, sum them
            if (typeof value === 'object') {
              metrics.reactions = Object.values(value as Record<string, number>).reduce(
                (sum: number, count) => sum + (typeof count === 'number' ? count : 0),
                0
              );
            }
            break;
          case 'post_clicks':
            metrics.clicks = typeof value === 'number' ? value : undefined;
            break;
          case 'post_video_views':
            metrics.videoViews = typeof value === 'number' ? value : undefined;
            break;
        }
      }
    }

    // Fetch comments and shares from post object (not insights)
    // Note: For full implementation, would need separate API call to get post object
    // For MVP, leaving these as undefined (to be fetched in future enhancement)

    return metrics;
  }
}
