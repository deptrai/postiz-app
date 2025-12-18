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
    private readonly _retentionAnalyticsService: RetentionAnalyticsService
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
}
