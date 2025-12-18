import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Organization } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  ContentQualityService,
  QualityScore,
  QualityListItem,
  QualityTrendPoint,
} from '@gitroom/nestjs-libraries/database/prisma/quality/content-quality.service';

@ApiTags('Quality')
@Controller('/quality')
export class QualityController {
  constructor(private readonly _contentQualityService: ContentQualityService) {}

  /**
   * Get quality score for a single content item
   * AC: #1, #2 - Overall score 0-100 with breakdown
   */
  @Get('/score/:contentId')
  @ApiOperation({ summary: 'Get quality score for a single content item' })
  @ApiParam({ name: 'contentId', description: 'Content ID to get score for' })
  @ApiResponse({ status: 200, description: 'Quality score returned successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getQualityScore(
    @GetOrgFromRequest() org: Organization,
    @Param('contentId') contentId: string
  ): Promise<QualityScore> {
    const score = await this._contentQualityService.calculateQualityScore(
      org.id,
      contentId
    );

    if (!score) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    return score;
  }

  /**
   * Get content list sorted by quality score
   * AC: #3 - List sorted by quality score
   */
  @Get('/list')
  @ApiOperation({ summary: 'Get content list sorted by quality score' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['score', 'date', 'engagement'], description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'minScore', required: false, description: 'Minimum quality score filter' })
  @ApiQuery({ name: 'maxScore', required: false, description: 'Maximum quality score filter' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items to return (default: 20)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({ status: 200, description: 'Quality list returned successfully' })
  async getQualityList(
    @GetOrgFromRequest() org: Organization,
    @Query('sortBy') sortBy?: 'score' | 'date' | 'engagement',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('minScore') minScore?: string,
    @Query('maxScore') maxScore?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ): Promise<{ items: QualityListItem[]; total: number }> {
    const options = {
      sortBy: sortBy || 'score',
      sortOrder: sortOrder || 'desc',
      minScore: minScore ? parseInt(minScore, 10) : undefined,
      maxScore: maxScore ? parseInt(maxScore, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    // Validate score ranges
    if (options.minScore !== undefined && (options.minScore < 0 || options.minScore > 100)) {
      throw new BadRequestException('minScore must be between 0 and 100');
    }
    if (options.maxScore !== undefined && (options.maxScore < 0 || options.maxScore > 100)) {
      throw new BadRequestException('maxScore must be between 0 and 100');
    }

    return this._contentQualityService.getContentByQuality(org.id, options);
  }

  /**
   * Get quality trends over time
   * AC: #4 - Quality trend over time (7/14/30 days)
   */
  @Get('/trends')
  @ApiOperation({ summary: 'Get quality trends over time' })
  @ApiQuery({ name: 'days', required: false, enum: ['7', '14', '30'], description: 'Number of days to analyze' })
  @ApiResponse({ status: 200, description: 'Quality trends returned successfully' })
  async getQualityTrends(
    @GetOrgFromRequest() org: Organization,
    @Query('days') days?: string
  ): Promise<{ trends: QualityTrendPoint[]; period: number }> {
    let period: 7 | 14 | 30 = 7;

    if (days === '14') {
      period = 14;
    } else if (days === '30') {
      period = 30;
    }

    const trends = await this._contentQualityService.getQualityTrends(org.id, period);

    return {
      trends,
      period,
    };
  }
}
