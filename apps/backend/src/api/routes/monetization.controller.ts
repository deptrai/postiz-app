import { Controller, Get, Put, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MonetizationService } from '@gitroom/nestjs-libraries/database/prisma/monetization/monetization.service';
import { RecommendationEngine } from '@gitroom/nestjs-libraries/database/prisma/monetization/recommendation.service';
import { MonetizationAlertJobService } from '@gitroom/nestjs-libraries/database/prisma/monetization/monetization-alert-job.service';
import { WatchTimeAnalyticsService } from '@gitroom/nestjs-libraries/database/prisma/monetization/watch-time-analytics.service';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';

@ApiTags('Monetization')
@Controller('/monetization')
export class MonetizationController {
  constructor(
    private readonly _monetizationService: MonetizationService,
    private readonly _recommendationEngine: RecommendationEngine,
    private readonly _monetizationAlertJobService: MonetizationAlertJobService,
    private readonly _watchTimeAnalyticsService: WatchTimeAnalyticsService,
    private readonly _prisma: PrismaService
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
  async getWatchTimeMetrics(@GetOrgFromRequest() org: Organization) {
    try {
      const metrics = await this._watchTimeAnalyticsService.getWatchTimeMetrics(org.id);
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
    @Body() body?: { limit?: number }
  ) {
    try {
      const limit = body?.limit || 10;
      const topVideos = await this._watchTimeAnalyticsService.getTopVideosByWatchTime(org.id, limit);
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
}
