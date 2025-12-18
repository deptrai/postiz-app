import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import {
  RetentionAnalyticsService,
  RetentionCurve,
  BenchmarkComparison,
  RetentionSuggestion,
  VideoComparison,
  VideoFormat,
} from '@gitroom/nestjs-libraries/database/prisma/video-analytics/retention-analytics.service';
import {
  VideoLengthAnalyticsService,
  PerformanceByLengthResult,
  OptimalLengthRecommendation,
  LengthBenchmark,
  LengthOptimizationTip,
  VideoFormat as LengthVideoFormat,
} from '@gitroom/nestjs-libraries/database/prisma/video-analytics/video-length-analytics.service';
import {
  ThumbnailAnalyticsService,
  ThumbnailPerformanceResult,
  StylePerformanceResult,
  ThumbnailSuggestion,
  SuccessPatternsResult,
  ThumbnailStyle,
} from '@gitroom/nestjs-libraries/database/prisma/video-analytics/thumbnail-analytics.service';

// DTOs for Swagger documentation
class VideoRetentionDto {
  totalViewers: number;
  viewsAtIntervals: Record<number, number>;
  videoDuration: number;
  videoTitle?: string;
}

class CompareVideosDto {
  videoIds: string[];
  videoData?: Array<{
    videoId: string;
    videoTitle: string;
    totalViewers: number;
    viewsAtIntervals: Record<number, number>;
    videoDuration: number;
  }>;
}

@ApiTags('Video Analytics')
@Controller('video-analytics')
export class VideoAnalyticsController {
  constructor(
    private readonly _retentionAnalyticsService: RetentionAnalyticsService,
    private readonly _videoLengthAnalyticsService: VideoLengthAnalyticsService,
    private readonly _thumbnailAnalyticsService: ThumbnailAnalyticsService
  ) {}

  /**
   * Get retention curve for a video (AC #1, #2)
   */
  @Get('retention/:videoId')
  @ApiOperation({
    summary: 'Get retention curve',
    description: 'Get retention curve showing % viewers remaining at each point with drop-off indicators',
  })
  @ApiParam({
    name: 'videoId',
    description: 'Video ID',
    type: String,
  })
  @ApiQuery({
    name: 'totalViewers',
    required: false,
    type: Number,
    description: 'Total number of viewers',
  })
  @ApiQuery({
    name: 'videoDuration',
    required: false,
    type: Number,
    description: 'Video duration in seconds',
  })
  @ApiResponse({
    status: 200,
    description: 'Retention curve with drop-off points',
    schema: {
      type: 'object',
      properties: {
        videoId: { type: 'string' },
        videoTitle: { type: 'string' },
        videoDuration: { type: 'number' },
        totalViewers: { type: 'number' },
        points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              percentage: { type: 'number', example: 50 },
              retention: { type: 'number', example: 60 },
              viewersCount: { type: 'number', example: 600 },
            },
          },
        },
        dropOffPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              percentage: { type: 'number', example: 10 },
              dropAmount: { type: 'number', example: 15 },
              severity: { type: 'string', enum: ['low', 'medium', 'high'] },
              viewerLoss: { type: 'number', example: 150 },
            },
          },
        },
        averageRetention: { type: 'number', example: 55.5 },
        completionRate: { type: 'number', example: 35 },
      },
    },
  })
  async getRetentionCurve(
    @GetOrgFromRequest() org: Organization,
    @Param('videoId') videoId: string,
    @Query('totalViewers') totalViewers?: number,
    @Query('videoDuration') videoDuration?: number
  ): Promise<RetentionCurve> {
    const viewData = totalViewers && videoDuration
      ? {
          totalViewers,
          videoDuration,
          viewsAtIntervals: {},
        }
      : undefined;

    return this._retentionAnalyticsService.getRetentionCurve(
      org.id,
      videoId,
      viewData
    );
  }

  /**
   * Get benchmark comparison (AC #3)
   */
  @Get('retention/:videoId/benchmark')
  @ApiOperation({
    summary: 'Get benchmark comparison',
    description: 'Compare video retention with niche benchmark',
  })
  @ApiParam({
    name: 'videoId',
    description: 'Video ID',
    type: String,
  })
  @ApiQuery({
    name: 'niche',
    required: true,
    type: String,
    description: 'Content niche (e.g., fitness, education, entertainment)',
    example: 'fitness',
  })
  @ApiQuery({
    name: 'format',
    required: true,
    enum: ['reel', 'video', 'story'],
    description: 'Video format',
  })
  @ApiResponse({
    status: 200,
    description: 'Benchmark comparison',
    schema: {
      type: 'object',
      properties: {
        videoRetention: {
          type: 'object',
          description: 'Video retention curve',
        },
        benchmark: {
          type: 'object',
          properties: {
            niche: { type: 'string', example: 'fitness' },
            format: { type: 'string', enum: ['reel', 'video', 'story'] },
            points: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  percentage: { type: 'number' },
                  retention: { type: 'number' },
                },
              },
            },
            averageRetention: { type: 'number', example: 52.5 },
          },
        },
        deviation: { type: 'number', example: 7.5, description: '% difference from benchmark' },
        performance: { type: 'string', enum: ['above', 'at', 'below'] },
      },
    },
  })
  async getBenchmarkComparison(
    @GetOrgFromRequest() org: Organization,
    @Param('videoId') videoId: string,
    @Query('niche') niche: string,
    @Query('format') format: VideoFormat
  ): Promise<BenchmarkComparison> {
    return this._retentionAnalyticsService.getBenchmarkComparison(
      org.id,
      videoId,
      niche,
      format
    );
  }

  /**
   * Get retention improvement suggestions (AC #4)
   */
  @Get('retention/:videoId/suggestions')
  @ApiOperation({
    summary: 'Get retention suggestions',
    description: 'Get improvement suggestions based on drop-off patterns',
  })
  @ApiParam({
    name: 'videoId',
    description: 'Video ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Retention improvement suggestions',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['hook', 'pacing', 'length', 'content', 'payoff'] },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          dropOffPoint: { type: 'number', example: 10 },
          issue: { type: 'string', example: '35% of viewers left within the first 10% of the video' },
          suggestion: { type: 'string', example: 'Improve your opening hook...' },
          expectedImprovement: { type: 'string', example: '+15-25% retention in first 10 seconds' },
        },
      },
    },
  })
  async getRetentionSuggestions(
    @GetOrgFromRequest() org: Organization,
    @Param('videoId') videoId: string
  ): Promise<RetentionSuggestion[]> {
    return this._retentionAnalyticsService.getRetentionSuggestions(
      org.id,
      videoId
    );
  }

  /**
   * Compare retention curves of multiple videos (AC #5)
   */
  @Post('retention/compare')
  @ApiOperation({
    summary: 'Compare retention curves',
    description: 'Compare retention curves of 2-3 videos',
  })
  @ApiBody({ type: CompareVideosDto })
  @ApiResponse({
    status: 200,
    description: 'Video comparison with insights',
    schema: {
      type: 'object',
      properties: {
        videos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              videoId: { type: 'string' },
              videoTitle: { type: 'string' },
              curve: {
                type: 'object',
                description: 'Retention curve data',
              },
            },
          },
        },
        insights: {
          type: 'array',
          items: { type: 'string' },
          example: [
            '"Video A" has the highest average retention at 65.5%',
            '"Video B" has the best completion rate at 45.0%',
          ],
        },
      },
    },
  })
  async compareRetentionCurves(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CompareVideosDto
  ): Promise<VideoComparison> {
    return this._retentionAnalyticsService.compareRetentionCurves(
      org.id,
      body.videoIds,
      body.videoData
    );
  }

  // ==================== Video Length Analytics Endpoints ====================

  /**
   * Get performance breakdown by video length ranges (AC #1)
   */
  @Get('length')
  @ApiOperation({
    summary: 'Get performance by length',
    description: 'Get performance breakdown by video length ranges (0-15s, 15-30s, 30-60s, 60-180s, 180s+)',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['reel', 'video', 'story'],
    description: 'Filter by video format',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance breakdown by length ranges',
    schema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        format: { type: 'string', enum: ['reel', 'video', 'story'] },
        performances: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              range: { type: 'string', example: '15-30' },
              rangeLabel: { type: 'string', example: '15-30 seconds (Medium-Short)' },
              videoCount: { type: 'number', example: 25 },
              avgViews: { type: 'number', example: 15000 },
              avgEngagementRate: { type: 'number', example: 8.5 },
              avgCompletionRate: { type: 'number', example: 65 },
            },
          },
        },
        totalVideos: { type: 'number', example: 100 },
        bestPerformingRange: { type: 'string', example: '15-30' },
      },
    },
  })
  async getPerformanceByLength(
    @GetOrgFromRequest() org: Organization,
    @Query('format') format?: LengthVideoFormat
  ): Promise<PerformanceByLengthResult> {
    return this._videoLengthAnalyticsService.getPerformanceByLength(org.id, { format });
  }

  /**
   * Get optimal length recommendation (AC #2, #4)
   */
  @Get('length/optimal')
  @ApiOperation({
    summary: 'Get optimal length recommendation',
    description: 'Get optimal video length recommendation with sweet spot and confidence score',
  })
  @ApiQuery({
    name: 'format',
    required: true,
    enum: ['reel', 'video', 'story'],
    description: 'Video format to analyze',
  })
  @ApiResponse({
    status: 200,
    description: 'Optimal length recommendation',
    schema: {
      type: 'object',
      properties: {
        format: { type: 'string', example: 'reel' },
        optimalRange: { type: 'string', example: '15-30' },
        optimalRangeLabel: { type: 'string', example: '15-30 seconds (Medium-Short)' },
        sweetSpotSeconds: {
          type: 'object',
          properties: {
            min: { type: 'number', example: 15 },
            max: { type: 'number', example: 30 },
          },
        },
        confidenceScore: { type: 'number', example: 85 },
        reasoning: { type: 'string' },
        userAvgLength: { type: 'number', example: 25 },
        recommendedAdjustment: { type: 'string', enum: ['shorter', 'longer', 'optimal'] },
      },
    },
  })
  async getOptimalLength(
    @GetOrgFromRequest() org: Organization,
    @Query('format') format: LengthVideoFormat
  ): Promise<OptimalLengthRecommendation> {
    return this._videoLengthAnalyticsService.getOptimalLength(org.id, format);
  }

  /**
   * Get niche benchmark comparison (AC #3)
   */
  @Get('length/benchmark')
  @ApiOperation({
    summary: 'Get length benchmark comparison',
    description: 'Compare your optimal length with industry benchmarks for your niche',
  })
  @ApiQuery({
    name: 'niche',
    required: true,
    description: 'Content niche (e.g., fitness, education, entertainment)',
  })
  @ApiQuery({
    name: 'format',
    required: true,
    enum: ['reel', 'video', 'story'],
    description: 'Video format',
  })
  @ApiResponse({
    status: 200,
    description: 'Benchmark comparison',
    schema: {
      type: 'object',
      properties: {
        niche: { type: 'string', example: 'fitness' },
        format: { type: 'string', example: 'reel' },
        industryOptimal: {
          type: 'object',
          properties: {
            min: { type: 'number', example: 17 },
            max: { type: 'number', example: 33 },
          },
        },
        industryOptimalLabel: { type: 'string', example: '17-33 seconds' },
        userOptimal: {
          type: 'object',
          properties: {
            min: { type: 'number', example: 15 },
            max: { type: 'number', example: 30 },
          },
        },
        userOptimalLabel: { type: 'string', example: '15-30 seconds' },
        deviation: { type: 'number', example: -5 },
        performance: { type: 'string', enum: ['above', 'at', 'below'] },
        insights: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async getLengthBenchmark(
    @GetOrgFromRequest() org: Organization,
    @Query('niche') niche: string,
    @Query('format') format: LengthVideoFormat
  ): Promise<LengthBenchmark> {
    return this._videoLengthAnalyticsService.getNicheLengthBenchmarks(org.id, niche, format);
  }

  /**
   * Get length optimization tips (AC #5)
   */
  @Get('length/tips')
  @ApiOperation({
    summary: 'Get length optimization tips',
    description: 'Get actionable tips to optimize your video length',
  })
  @ApiQuery({
    name: 'format',
    required: true,
    enum: ['reel', 'video', 'story'],
    description: 'Video format',
  })
  @ApiResponse({
    status: 200,
    description: 'List of optimization tips',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          category: { type: 'string', enum: ['hook', 'pacing', 'content', 'format', 'general'] },
          issue: { type: 'string' },
          tip: { type: 'string' },
          example: { type: 'string' },
          expectedImprovement: { type: 'string' },
        },
      },
    },
  })
  async getLengthOptimizationTips(
    @GetOrgFromRequest() org: Organization,
    @Query('format') format: LengthVideoFormat
  ): Promise<LengthOptimizationTip[]> {
    return this._videoLengthAnalyticsService.getLengthOptimizationTips(org.id, format);
  }

  // ==================== Thumbnail Analytics Endpoints ====================

  /**
   * Get thumbnail performance for all videos (AC #1)
   */
  @Get('thumbnail')
  @ApiOperation({
    summary: 'Get thumbnail performance',
    description: 'Get CTR analysis for all video thumbnails',
  })
  @ApiQuery({
    name: 'style',
    required: false,
    enum: ['text-heavy', 'face', 'action', 'minimal', 'before-after', 'curiosity-gap'],
    description: 'Filter by thumbnail style',
  })
  @ApiResponse({
    status: 200,
    description: 'Thumbnail performance data',
    schema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        thumbnails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              videoId: { type: 'string' },
              videoTitle: { type: 'string' },
              style: { type: 'string' },
              impressions: { type: 'number' },
              clicks: { type: 'number' },
              ctr: { type: 'number', example: 8.5 },
            },
          },
        },
        totalVideos: { type: 'number' },
        avgCtr: { type: 'number' },
      },
    },
  })
  async getThumbnailPerformance(
    @GetOrgFromRequest() org: Organization,
    @Query('style') style?: ThumbnailStyle
  ): Promise<ThumbnailPerformanceResult> {
    return this._thumbnailAnalyticsService.getThumbnailPerformance(org.id, { style });
  }

  /**
   * Get performance breakdown by thumbnail style (AC #2, #3)
   */
  @Get('thumbnail/styles')
  @ApiOperation({
    summary: 'Get style performance',
    description: 'Get CTR breakdown by thumbnail style with rankings',
  })
  @ApiResponse({
    status: 200,
    description: 'Style performance data',
    schema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        styles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              style: { type: 'string' },
              styleLabel: { type: 'string' },
              avgCtr: { type: 'number' },
              videoCount: { type: 'number' },
              rank: { type: 'number' },
              benchmark: { type: 'number' },
              vsIndustry: { type: 'string', enum: ['above', 'at', 'below'] },
            },
          },
        },
        bestStyle: { type: 'string' },
        worstStyle: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getStylePerformance(
    @GetOrgFromRequest() org: Organization
  ): Promise<StylePerformanceResult> {
    return this._thumbnailAnalyticsService.getStylePerformance(org.id);
  }

  /**
   * Get A/B test suggestions and best practices (AC #4)
   */
  @Get('thumbnail/suggestions')
  @ApiOperation({
    summary: 'Get thumbnail suggestions',
    description: 'Get A/B test ideas and best practices for thumbnails',
  })
  @ApiResponse({
    status: 200,
    description: 'Thumbnail suggestions',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['ab-test', 'best-practice'] },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          title: { type: 'string' },
          description: { type: 'string' },
          expectedImprovement: { type: 'string' },
          actionItems: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  })
  async getThumbnailSuggestions(
    @GetOrgFromRequest() org: Organization
  ): Promise<ThumbnailSuggestion[]> {
    return this._thumbnailAnalyticsService.getThumbnailSuggestions(org.id);
  }

  /**
   * Get success patterns from top-performing thumbnails (AC #5)
   */
  @Get('thumbnail/patterns')
  @ApiOperation({
    summary: 'Get success patterns',
    description: 'Get common elements and patterns from top-performing thumbnails',
  })
  @ApiResponse({
    status: 200,
    description: 'Success patterns data',
    schema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              elementLabel: { type: 'string' },
              frequency: { type: 'number' },
              avgCtrImpact: { type: 'number' },
              description: { type: 'string' },
            },
          },
        },
        topPerformers: { type: 'array' },
        insights: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getSuccessPatterns(
    @GetOrgFromRequest() org: Organization
  ): Promise<SuccessPatternsResult> {
    return this._thumbnailAnalyticsService.getSuccessPatterns(org.id);
  }
}
