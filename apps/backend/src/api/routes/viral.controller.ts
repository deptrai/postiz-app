import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import {
  ViralScoreService,
  ViralScoreResult,
  ContentComparisonResult,
  ContentMetadata,
} from '@gitroom/nestjs-libraries/database/prisma/viral/viral-score.service';
import {
  HookAnalyzerService,
  HookAnalysisResult,
  HookComparisonResult,
  HookMetadata,
  HookPattern,
  HookOpeningType,
} from '@gitroom/nestjs-libraries/database/prisma/viral/hook-analyzer.service';
import {
  ViralTimingService,
  OptimalTimingResult,
  TimingHeatmapResult,
  TimingOptions,
  ContentFormat,
} from '@gitroom/nestjs-libraries/database/prisma/viral/viral-timing.service';
import {
  ContentElementsService,
  ContentElementsAnalysis,
  SuccessfulPatterns,
  ContentMetadata as ElementsContentMetadata,
} from '@gitroom/nestjs-libraries/database/prisma/viral/content-elements.service';

// DTOs for Swagger documentation
class ContentMetadataDto {
  caption?: string;
  hashtags?: string[];
  contentType: 'reel' | 'video' | 'post' | 'story';
  scheduledTime?: string;
  hookText?: string;
}

class CalculateScoreDto {
  metadata: ContentMetadataDto;
}

class CompareContentDto {
  drafts: Array<{
    id: string;
    metadata: ContentMetadataDto;
  }>;
}

// Hook analysis DTOs
class HookMetadataDto {
  hookText: string;
  caption?: string;
  contentType?: 'reel' | 'video' | 'post' | 'story';
  hasQuickCuts?: boolean;
  hasMusic?: boolean;
  hasSoundEffects?: boolean;
  hasVoiceover?: boolean;
}

class AnalyzeHookDto {
  metadata: HookMetadataDto;
}

class CompareHooksDto {
  hooks: Array<{
    id: string;
    metadata: HookMetadataDto;
  }>;
}

// Timing DTOs
class TimingOptionsDto {
  contentType?: 'reel' | 'video' | 'post' | 'story';
  niche?: string;
  timezone?: string;
}

// Content Elements DTOs
class ContentElementsDto {
  caption?: string;
  hashtags?: string[];
  contentType?: 'reel' | 'video' | 'post' | 'story';
  videoLength?: number;
}

@ApiTags('Viral')
@Controller('viral')
export class ViralController {
  constructor(
    private readonly _viralScoreService: ViralScoreService,
    private readonly _hookAnalyzerService: HookAnalyzerService,
    private readonly _viralTimingService: ViralTimingService,
    private readonly _contentElementsService: ContentElementsService
  ) {}

  /**
   * Calculate viral score for content (AC #1, #3)
   */
  @Post('score')
  @ApiOperation({
    summary: 'Calculate viral score',
    description: 'Calculate viral score (0-100) with breakdown by factor for content metadata',
  })
  @ApiBody({ type: CalculateScoreDto })
  @ApiResponse({
    status: 200,
    description: 'Viral score calculated successfully',
    schema: {
      type: 'object',
      properties: {
        overallScore: { type: 'number', example: 75 },
        breakdown: {
          type: 'object',
          properties: {
            hook: { type: 'number', example: 80 },
            caption: { type: 'number', example: 70 },
            hashtags: { type: 'number', example: 65 },
            timing: { type: 'number', example: 85 },
            format: { type: 'number', example: 90 },
          },
        },
        interpretation: { type: 'string', example: 'Good potential' },
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string', example: 'hashtags' },
              currentScore: { type: 'number', example: 65 },
              suggestion: { type: 'string', example: 'Use 5-10 relevant hashtags' },
              impact: { type: 'string', example: 'medium' },
              potentialGain: { type: 'number', example: 15 },
            },
          },
        },
      },
    },
  })
  async calculateScore(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CalculateScoreDto
  ): Promise<ViralScoreResult> {
    const metadata: ContentMetadata = {
      ...body.metadata,
      scheduledTime: body.metadata.scheduledTime
        ? new Date(body.metadata.scheduledTime)
        : undefined,
    };

    return this._viralScoreService.calculateViralScore(org.id, metadata);
  }

  /**
   * Compare multiple content drafts (AC #5)
   */
  @Post('compare')
  @ApiOperation({
    summary: 'Compare content drafts',
    description: 'Compare multiple content drafts and rank them by viral potential',
  })
  @ApiBody({ type: CompareContentDto })
  @ApiResponse({
    status: 200,
    description: 'Content comparison completed',
    schema: {
      type: 'object',
      properties: {
        rankings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              contentId: { type: 'string', example: 'draft-1' },
              score: { type: 'number', example: 85 },
              rank: { type: 'number', example: 1 },
              breakdown: {
                type: 'object',
                properties: {
                  hook: { type: 'number' },
                  caption: { type: 'number' },
                  hashtags: { type: 'number' },
                  timing: { type: 'number' },
                  format: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  })
  async compareContent(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CompareContentDto
  ): Promise<ContentComparisonResult> {
    const drafts = body.drafts.map((draft) => ({
      id: draft.id,
      metadata: {
        ...draft.metadata,
        scheduledTime: draft.metadata.scheduledTime
          ? new Date(draft.metadata.scheduledTime)
          : undefined,
      } as ContentMetadata,
    }));

    return this._viralScoreService.compareContent(org.id, drafts);
  }

  // ==================== HOOK ANALYSIS ENDPOINTS ====================

  /**
   * Analyze hook effectiveness (Story 14.2 AC #1, #2)
   */
  @Post('hook/analyze')
  @ApiOperation({
    summary: 'Analyze hook effectiveness',
    description: 'Analyze the first 3 seconds hook of video content and return effectiveness score with breakdown',
  })
  @ApiBody({ type: AnalyzeHookDto })
  @ApiResponse({
    status: 200,
    description: 'Hook analysis completed',
    schema: {
      type: 'object',
      properties: {
        effectivenessScore: { type: 'number', example: 78 },
        openingType: { type: 'string', example: 'question' },
        breakdown: {
          type: 'object',
          properties: {
            openingType: { type: 'number', example: 85 },
            pacing: { type: 'number', example: 70 },
            visualImpact: { type: 'number', example: 75 },
            audioHook: { type: 'number', example: 80 },
          },
        },
        interpretation: { type: 'string', example: 'Good hook potential' },
        recommendations: { type: 'array' },
        matchedPatterns: { type: 'array' },
      },
    },
  })
  async analyzeHook(
    @GetOrgFromRequest() org: Organization,
    @Body() body: AnalyzeHookDto
  ): Promise<HookAnalysisResult> {
    return this._hookAnalyzerService.analyzeHook(org.id, body.metadata as HookMetadata);
  }

  /**
   * Get successful hook patterns (Story 14.2 AC #3, #4)
   */
  @Get('hook/patterns')
  @ApiOperation({
    summary: 'Get successful hook patterns',
    description: 'Get list of proven hook patterns from viral content, optionally filtered by niche or type',
  })
  @ApiQuery({ name: 'niche', required: false, description: 'Filter by content niche' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by opening type' })
  @ApiResponse({
    status: 200,
    description: 'Hook patterns retrieved',
    schema: {
      type: 'object',
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'question' },
              name: { type: 'string', example: 'Curiosity Question' },
              description: { type: 'string' },
              example: { type: 'string', example: 'Did you know 90% of people do this wrong?' },
              successRate: { type: 'number', example: 85 },
              bestFor: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  })
  async getHookPatterns(
    @Query('niche') niche?: string,
    @Query('type') type?: HookOpeningType
  ): Promise<{ patterns: HookPattern[] }> {
    const patterns = await this._hookAnalyzerService.getHookPatterns(niche, type);
    return { patterns };
  }

  /**
   * Compare multiple hooks (Story 14.2 AC #5)
   */
  @Post('hook/compare')
  @ApiOperation({
    summary: 'Compare multiple hooks',
    description: 'Compare multiple hooks and rank them by effectiveness score',
  })
  @ApiBody({ type: CompareHooksDto })
  @ApiResponse({
    status: 200,
    description: 'Hook comparison completed',
    schema: {
      type: 'object',
      properties: {
        rankings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hookId: { type: 'string', example: 'hook-1' },
              score: { type: 'number', example: 82 },
              rank: { type: 'number', example: 1 },
              openingType: { type: 'string', example: 'curiosity' },
              breakdown: { type: 'object' },
            },
          },
        },
      },
    },
  })
  async compareHooks(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CompareHooksDto
  ): Promise<HookComparisonResult> {
    return this._hookAnalyzerService.compareHooks(
      org.id,
      body.hooks.map((h) => ({ id: h.id, metadata: h.metadata as HookMetadata }))
    );
  }

  // ========== VIRAL TIMING ENDPOINTS ==========

  /**
   * Get optimal viral timing (AC #1, #2, #3, #4, #5)
   */
  @Get('timing')
  @ApiOperation({
    summary: 'Get optimal viral timing',
    description: 'Get recommended posting windows for maximum viral potential based on historical data, audience patterns, and content format',
  })
  @ApiQuery({ name: 'contentType', required: false, enum: ['reel', 'video', 'post', 'story'] })
  @ApiQuery({ name: 'niche', required: false, type: String })
  @ApiQuery({ name: 'timezone', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Optimal timing recommendations',
    schema: {
      type: 'object',
      properties: {
        recommendedWindows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              startHour: { type: 'number', example: 19 },
              endHour: { type: 'number', example: 22 },
              dayOfWeek: { type: 'number', example: 3 },
              label: { type: 'string', example: 'Prime Time' },
              score: { type: 'number', example: 90 },
              confidence: { type: 'string', example: 'high' },
              successRate: { type: 'number', example: 0.78 },
              dataPoints: { type: 'number', example: 200 },
            },
          },
        },
        bestOverallTime: {
          type: 'object',
          properties: {
            dayOfWeek: { type: 'number', example: 3 },
            hour: { type: 'number', example: 20 },
            dayName: { type: 'string', example: 'Wednesday' },
            timeLabel: { type: 'string', example: '7 PM - 10 PM' },
            confidence: { type: 'string', example: 'high' },
            successRate: { type: 'number', example: 0.78 },
          },
        },
        formatSpecific: {
          type: 'object',
          properties: {
            format: { type: 'string', example: 'reel' },
            windows: { type: 'array' },
          },
        },
        nicheSpecific: {
          type: 'object',
          nullable: true,
          properties: {
            niche: { type: 'string', example: 'fitness' },
            windows: { type: 'array' },
          },
        },
        insights: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async getOptimalTiming(
    @GetOrgFromRequest() org: Organization,
    @Query('contentType') contentType?: ContentFormat,
    @Query('niche') niche?: string,
    @Query('timezone') timezone?: string
  ): Promise<OptimalTimingResult> {
    return this._viralTimingService.getOptimalViralTiming(org.id, {
      contentType,
      niche,
      timezone,
    });
  }

  /**
   * Get timing heatmap (AC #2)
   */
  @Get('timing/heatmap')
  @ApiOperation({
    summary: 'Get timing heatmap',
    description: 'Get a visual heatmap of engagement by day and hour',
  })
  @ApiQuery({ name: 'contentType', required: false, enum: ['reel', 'video', 'post', 'story'] })
  @ApiQuery({ name: 'niche', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Timing heatmap data',
    schema: {
      type: 'object',
      properties: {
        heatmap: {
          type: 'array',
          description: '7x24 grid of engagement values',
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                dayOfWeek: { type: 'number' },
                hour: { type: 'number' },
                value: { type: 'number' },
                label: { type: 'string' },
              },
            },
          },
        },
        peakTimes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dayOfWeek: { type: 'number' },
              hour: { type: 'number' },
              score: { type: 'number' },
            },
          },
        },
        lowTimes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dayOfWeek: { type: 'number' },
              hour: { type: 'number' },
              score: { type: 'number' },
            },
          },
        },
        averageEngagement: { type: 'number' },
      },
    },
  })
  async getTimingHeatmap(
    @GetOrgFromRequest() org: Organization,
    @Query('contentType') contentType?: ContentFormat,
    @Query('niche') niche?: string
  ): Promise<TimingHeatmapResult> {
    return this._viralTimingService.getTimingHeatmap(org.id, {
      contentType,
      niche,
    });
  }

  // ========== CONTENT ELEMENTS ENDPOINTS ==========

  /**
   * Analyze content elements (AC #1, #2, #3, #4, #5)
   */
  @Post('elements/analyze')
  @ApiOperation({
    summary: 'Analyze content elements',
    description: 'Analyze all content elements including caption, hashtags, format, and CTA',
  })
  @ApiBody({ type: ContentElementsDto })
  @ApiResponse({
    status: 200,
    description: 'Content elements analysis',
    schema: {
      type: 'object',
      properties: {
        caption: {
          type: 'object',
          properties: {
            length: { type: 'number' },
            lengthCategory: { type: 'string', enum: ['short', 'medium', 'long'] },
            tone: { type: 'string' },
            keywords: { type: 'array' },
            emojiUsage: { type: 'object' },
          },
        },
        hashtags: {
          type: 'object',
          properties: {
            count: { type: 'number' },
            optimal: { type: 'boolean' },
            hashtags: { type: 'array' },
          },
        },
        format: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            formatScore: { type: 'number' },
            performanceInsights: { type: 'object' },
          },
        },
        cta: {
          type: 'object',
          properties: {
            detected: { type: 'boolean' },
            types: { type: 'array' },
            overallEffectiveness: { type: 'number' },
          },
        },
        overallScore: { type: 'number' },
        topStrengths: { type: 'array', items: { type: 'string' } },
        areasToImprove: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async analyzeContentElements(
    @GetOrgFromRequest() org: Organization,
    @Body() body: ContentElementsDto
  ): Promise<ContentElementsAnalysis> {
    return this._contentElementsService.analyzeContentElements(
      org.id,
      body as ElementsContentMetadata
    );
  }

  /**
   * Get successful patterns (AC #1)
   */
  @Get('elements/patterns')
  @ApiOperation({
    summary: 'Get successful content patterns',
    description: 'Get patterns from successful viral content for caption, hashtags, format, and CTA',
  })
  @ApiResponse({
    status: 200,
    description: 'Successful patterns',
    schema: {
      type: 'object',
      properties: {
        captionPatterns: { type: 'array' },
        hashtagPatterns: { type: 'array' },
        formatPatterns: { type: 'array' },
        ctaPatterns: { type: 'array' },
      },
    },
  })
  async getSuccessfulPatterns(
    @GetOrgFromRequest() org: Organization
  ): Promise<SuccessfulPatterns> {
    return this._contentElementsService.getSuccessfulPatterns(org.id);
  }
}
