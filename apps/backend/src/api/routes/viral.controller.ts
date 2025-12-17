import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import {
  ViralScoreService,
  ViralScoreResult,
  ContentComparisonResult,
  ContentMetadata,
} from '@gitroom/nestjs-libraries/database/prisma/viral/viral-score.service';

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

@ApiTags('Viral')
@Controller('viral')
export class ViralController {
  constructor(private readonly _viralScoreService: ViralScoreService) {}

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
}
