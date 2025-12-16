import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MonetizationService } from '@gitroom/nestjs-libraries/database/prisma/monetization/monetization.service';
import { RecommendationEngine } from '@gitroom/nestjs-libraries/database/prisma/monetization/recommendation.service';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';

@ApiTags('Monetization')
@Controller('/monetization')
export class MonetizationController {
  constructor(
    private readonly _monetizationService: MonetizationService,
    private readonly _recommendationEngine: RecommendationEngine
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
}
