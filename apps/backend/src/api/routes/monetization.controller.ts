import { Controller, Get, Put, Post, Body, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MonetizationService } from '@gitroom/nestjs-libraries/database/prisma/monetization/monetization.service';
import { RecommendationEngine } from '@gitroom/nestjs-libraries/database/prisma/monetization/recommendation.service';
import { MonetizationAlertJobService } from '@gitroom/nestjs-libraries/database/prisma/monetization/monetization-alert-job.service';
import { WatchTimeAnalyticsService } from '@gitroom/nestjs-libraries/database/prisma/monetization/watch-time-analytics.service';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { BullMqClient } from '@gitroom/nestjs-libraries/bull-mq-transport-new/client';
import dayjs from 'dayjs';

@ApiTags('Monetization')
@Controller('/monetization')
export class MonetizationController {
  constructor(
    private readonly _monetizationService: MonetizationService,
    private readonly _recommendationEngine: RecommendationEngine,
    private readonly _monetizationAlertJobService: MonetizationAlertJobService,
    private readonly _watchTimeAnalyticsService: WatchTimeAnalyticsService,
    private readonly _prisma: PrismaService,
    private readonly _workerServiceProducer: BullMqClient
  ) {}

  @Get('/status')
  @ApiOperation({ summary: 'Get monetization status for all features' })
  @ApiResponse({
    status: 200,
    description: 'Monetization status retrieved successfully',
  })
  async getMonetizationStatus(@GetOrgFromRequest() org: Organization) {
    try {
      const status = await this._monetizationService.getMonetizationStatus(org.id);
      return {
        success: true,
        status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('/progress')
  @ApiOperation({ summary: 'Get detailed monetization progress' })
  @ApiResponse({
    status: 200,
    description: 'Monetization progress retrieved successfully',
  })
  async getMonetizationProgress(@GetOrgFromRequest() org: Organization) {
    try {
      const status = await this._monetizationService.getMonetizationStatus(org.id);
      
      // Extract detailed progress for each feature
      const progress = {
        inStreamAds: {
          name: status.inStreamAds.name,
          status: status.inStreamAds.status,
          progress: status.inStreamAds.progress,
          currentMetrics: status.inStreamAds.currentMetrics,
          requiredMetrics: status.inStreamAds.requiredMetrics,
          gap: status.inStreamAds.gap,
          estimatedDays: status.inStreamAds.estimatedDays,
        },
        reels: {
          name: status.reels.name,
          status: status.reels.status,
          progress: status.reels.progress,
          currentMetrics: status.reels.currentMetrics,
          requiredMetrics: status.reels.requiredMetrics,
          gap: status.reels.gap,
          estimatedDays: status.reels.estimatedDays,
        },
        stars: {
          name: status.stars.name,
          status: status.stars.status,
          progress: status.stars.progress,
          currentMetrics: status.stars.currentMetrics,
          requiredMetrics: status.stars.requiredMetrics,
          gap: status.stars.gap,
          estimatedDays: status.stars.estimatedDays,
        },
        fanSubscription: {
          name: status.fanSubscription.name,
          status: status.fanSubscription.status,
          progress: status.fanSubscription.progress,
          currentMetrics: status.fanSubscription.currentMetrics,
          requiredMetrics: status.fanSubscription.requiredMetrics,
          gap: status.fanSubscription.gap,
          estimatedDays: status.fanSubscription.estimatedDays,
        },
      };

      return {
        success: true,
        progress,
        lastUpdated: status.lastUpdated,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('/gaps')
  @ApiOperation({ summary: 'Get gap analysis for monetization features' })
  @ApiResponse({
    status: 200,
    description: 'Gap analysis retrieved successfully',
  })
  async getGapAnalysis(@GetOrgFromRequest() org: Organization) {
    try {
      const gapAnalysis = await this._monetizationService.getGapAnalysis(org.id);
      return {
        success: true,
        gapAnalysis,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('/recommendations')
  @ApiOperation({ summary: 'Get recommendations to reach monetization eligibility' })
  @ApiResponse({
    status: 200,
    description: 'Recommendations retrieved successfully',
  })
  async getRecommendations(@GetOrgFromRequest() org: Organization) {
    try {
      const gapAnalysis = await this._monetizationService.getGapAnalysis(org.id);
      const status = await this._monetizationService.getMonetizationStatus(org.id);
      
      // Calculate average growth rate from all features
      const growthRates = [
        status.inStreamAds.estimatedDays,
        status.reels.estimatedDays,
        status.stars.estimatedDays,
        status.fanSubscription.estimatedDays,
      ].filter(d => d !== undefined) as number[];
      
      const avgGrowthRate = growthRates.length > 0 
        ? growthRates.reduce((sum, d) => sum + (1 / d), 0) / growthRates.length 
        : 0;

      const recommendations = await this._recommendationEngine.generateRecommendations(
        gapAnalysis.gaps,
        avgGrowthRate
      );

      return {
        success: true,
        recommendations,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('/alerts')
  @ApiOperation({ summary: 'Get monetization alerts for the organization' })
  @ApiResponse({
    status: 200,
    description: 'Alerts retrieved successfully',
  })
  async getAlerts(@GetOrgFromRequest() org: Organization) {
    try {
      const alerts = await this._prisma.alert.findMany({
        where: {
          organizationId: org.id,
          type: 'MONETIZATION_MILESTONE',
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      return {
        success: true,
        alerts,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post('/alerts/:id/read')
  @ApiOperation({ summary: 'Mark an alert as read' })
  @ApiResponse({
    status: 200,
    description: 'Alert marked as read successfully',
  })
  async markAlertAsRead(
    @GetOrgFromRequest() org: Organization,
    @Param('id') alertId: string
  ) {
    try {
      const alert = await this._prisma.alert.update({
        where: {
          id: alertId,
          organizationId: org.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return {
        success: true,
        alert,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Put('/alerts/preferences')
  @ApiOperation({ summary: 'Update notification preferences for monetization alerts' })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
  })
  async updateAlertPreferences(
    @GetOrgFromRequest() org: Organization,
    @Body() body: {
      monetizationMilestoneEnabled?: boolean;
      emailEnabled?: boolean;
      inAppEnabled?: boolean;
      criticalEnabled?: boolean;
      warningEnabled?: boolean;
      infoEnabled?: boolean;
    }
  ) {
    try {
      // Find or create preferences
      let preferences = await this._prisma.notificationPreferences.findFirst({
        where: { organizationId: org.id },
      });

      if (!preferences) {
        preferences = await this._prisma.notificationPreferences.create({
          data: {
            organizationId: org.id,
            userId: 'system', // TODO: Get actual user ID
            ...body,
          },
        });
      } else {
        preferences = await this._prisma.notificationPreferences.update({
          where: { id: preferences.id },
          data: body,
        });
      }

      return {
        success: true,
        preferences,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('/alerts/preferences')
  @ApiOperation({ summary: 'Get notification preferences for monetization alerts' })
  @ApiResponse({
    status: 200,
    description: 'Preferences retrieved successfully',
  })
  async getAlertPreferences(@GetOrgFromRequest() org: Organization) {
    try {
      let preferences = await this._prisma.notificationPreferences.findFirst({
        where: { organizationId: org.id },
      });

      if (!preferences) {
        // Create default preferences
        preferences = await this._prisma.notificationPreferences.create({
          data: {
            organizationId: org.id,
            userId: 'system', // TODO: Get actual user ID
          },
        });
      }

      return {
        success: true,
        preferences,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post('/alerts/trigger')
  @ApiOperation({ summary: 'Manually trigger monetization alert check (for testing)' })
  @ApiResponse({
    status: 200,
    description: 'Alert check triggered successfully',
  })
  async triggerAlertCheck(@GetOrgFromRequest() org: Organization) {
    try {
      await this._monetizationAlertJobService.triggerManualCheck(org.id);
      return {
        success: true,
        message: 'Alert check triggered successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('/watch-time')
  @ApiOperation({ summary: 'Get watch time metrics' })
  @ApiResponse({
    status: 200,
    description: 'Watch time metrics retrieved successfully',
  })
  async getWatchTimeMetrics(
    @GetOrgFromRequest() org: Organization,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('contentType') contentType?: string,
    @Query('integrationId') integrationId?: string,
  ) {
    try {
      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (contentType) filters.contentType = contentType;
      if (integrationId) filters.integrationId = integrationId;

      const metrics = await this._watchTimeAnalyticsService.getWatchTimeMetrics(org.id, filters);
      return {
        success: true,
        metrics,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('/watch-time/trends')
  @ApiOperation({ summary: 'Get watch time trends over time' })
  @ApiResponse({
    status: 200,
    description: 'Watch time trends retrieved successfully',
  })
  async getWatchTimeTrends(
    @GetOrgFromRequest() org: Organization,
    @Body() body?: { days?: number }
  ) {
    try {
      const days = body?.days || 30;
      const trends = await this._watchTimeAnalyticsService.getWatchTimeTrends(org.id, days);
      return {
        success: true,
        trends,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('/watch-time/top-videos')
  @ApiOperation({ summary: 'Get top videos by watch time' })
  @ApiResponse({
    status: 200,
    description: 'Top videos retrieved successfully',
  })
  async getTopVideosByWatchTime(
    @GetOrgFromRequest() org: Organization,
    @Query('limit') limit?: string,
  ) {
    try {
      const videoLimit = limit ? parseInt(limit, 10) : 10;
      const topVideos = await this._watchTimeAnalyticsService.getTopVideosByWatchTime(org.id, videoLimit);
      return {
        success: true,
        topVideos,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('/watch-time/export')
  @ApiOperation({ summary: 'Export watch time report' })
  @ApiResponse({
    status: 200,
    description: 'Watch time report exported successfully',
  })
  async exportWatchTimeReport(
    @GetOrgFromRequest() org: Organization,
    @Query('format') format?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('contentType') contentType?: string,
    @Query('integrationId') integrationId?: string,
    @Res() res?: Response,
  ) {
    try {
      const exportFormat = (format === 'json' || format === 'csv') ? format : 'csv';
      
      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (contentType) filters.contentType = contentType;
      if (integrationId) filters.integrationId = integrationId;

      const reportData = await this._watchTimeAnalyticsService.exportWatchTimeReport(
        org.id,
        exportFormat,
        filters
      );

      if (res) {
        const filename = `watch-time-report-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        const contentType = exportFormat === 'json' ? 'application/json' : 'text/csv';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(reportData);
      }

      return {
        success: true,
        format: exportFormat,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post('/sync-analytics')
  @ApiOperation({ summary: 'Manually trigger analytics sync for tracked integrations' })
  @ApiResponse({
    status: 200,
    description: 'Analytics sync triggered successfully',
  })
  async syncAnalytics(@GetOrgFromRequest() org: Organization) {
    try {
      // Get tracked Facebook integrations for this organization
      const trackedIntegrations = await this._prisma.analyticsTrackedIntegration.findMany({
        where: {
          integration: {
            organizationId: org.id,
            providerIdentifier: 'facebook',
            disabled: false,
            deletedAt: null,
          },
        },
        include: {
          integration: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (trackedIntegrations.length === 0) {
        return {
          success: false,
          error: 'No tracked Facebook integrations found',
        };
      }

      // Trigger ingestion for last 7 days for each integration
      const startDate = dayjs().subtract(7, 'days').format('YYYY-MM-DD');
      const endDate = dayjs().format('YYYY-MM-DD');
      
      const jobs = [];

      for (const tracked of trackedIntegrations) {
        let currentDate = dayjs(startDate);
        const end = dayjs(endDate);

        while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
          const date = currentDate.format('YYYY-MM-DD');
          const jobId = `analytics-manual-sync-${org.id}-${tracked.integration.id}-${date}`;

          // Enqueue content ingestion job
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
              organizationId: org.id,
              integrationId: tracked.integration.id,
              date,
              jobId,
            },
          });

          // Enqueue metrics ingestion job (delayed 2 minutes)
          const metricsJobId = `analytics-manual-metrics-${org.id}-${tracked.integration.id}-${date}`;
          this._workerServiceProducer.emit('analytics-ingest-metrics', {
            id: metricsJobId,
            options: {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
              delay: 120000, // 2 minutes delay
              removeOnComplete: true,
              removeOnFail: false,
            },
            payload: {
              organizationId: org.id,
              integrationId: tracked.integration.id,
              date,
              jobId: metricsJobId,
            },
          });

          jobs.push({
            integration: tracked.integration.name,
            date,
          });

          currentDate = currentDate.add(1, 'day');
        }
      }

      return {
        success: true,
        message: 'Analytics sync triggered successfully',
        integrations: trackedIntegrations.map(t => t.integration.name),
        dateRange: {
          start: startDate,
          end: endDate,
        },
        jobsEnqueued: jobs.length,
        estimatedTime: '2-5 minutes',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
