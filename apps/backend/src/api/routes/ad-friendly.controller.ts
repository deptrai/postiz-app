import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Organization } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  AdvertiserFriendlyService,
  AdFriendlyResult,
  AdFriendlyReport,
  SensitiveCategory,
} from '@gitroom/nestjs-libraries/database/prisma/quality/advertiser-friendly.service';

class ScoreContentDto {
  content: string;
}

@ApiTags('Quality - Advertiser-Friendly')
@Controller('/quality/ad-friendly')
export class AdFriendlyController {
  constructor(private readonly _advertiserFriendlyService: AdvertiserFriendlyService) {}

  /**
   * Score content for advertiser-friendliness
   * AC: #1, #2 - Score and show category breakdown
   */
  @Post('/score')
  @ApiOperation({ summary: 'Score content for advertiser-friendliness' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Content to score' },
      },
      required: ['content'],
    },
  })
  @ApiResponse({ status: 200, description: 'Ad-friendly score result' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  scoreContent(
    @GetOrgFromRequest() org: Organization,
    @Body() body: ScoreContentDto
  ): AdFriendlyResult {
    if (!body.content) {
      throw new BadRequestException('Content is required');
    }

    return this._advertiserFriendlyService.scoreAdFriendliness(body.content);
  }

  /**
   * Get ad-friendly report for organization
   * AC: #4, #5 - Show percentage and trends
   */
  @Get('/report')
  @ApiOperation({ summary: 'Get ad-friendly report for organization' })
  @ApiQuery({
    name: 'days',
    required: false,
    enum: ['7', '14', '30'],
    description: 'Number of days to analyze',
  })
  @ApiResponse({ status: 200, description: 'Ad-friendly report returned successfully' })
  async getReport(
    @GetOrgFromRequest() org: Organization,
    @Query('days') days?: string
  ): Promise<AdFriendlyReport> {
    let period: 7 | 14 | 30 = 7;

    if (days === '14') {
      period = 14;
    } else if (days === '30') {
      period = 30;
    }

    return this._advertiserFriendlyService.getAdFriendlyReport(org.id, period);
  }

  /**
   * Get category labels for display
   */
  @Get('/categories')
  @ApiOperation({ summary: 'Get sensitive topic category labels' })
  @ApiResponse({ status: 200, description: 'Category labels' })
  getCategories(): Record<SensitiveCategory, string> {
    return this._advertiserFriendlyService.getCategoryLabels();
  }
}
