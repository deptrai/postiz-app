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
  EngagementBaitService,
  BaitDetectionResult,
  PrePublishCheckResult,
  BaitReport,
} from '@gitroom/nestjs-libraries/database/prisma/quality/engagement-bait.service';

class DetectBaitDto {
  caption: string;
}

class CheckBeforePublishDto {
  contentDraft: string;
}

@ApiTags('Quality - Bait Detection')
@Controller('/quality/bait')
export class BaitController {
  constructor(private readonly _engagementBaitService: EngagementBaitService) {}

  /**
   * Detect engagement bait in caption
   * AC: #1, #2 - Flag clickbait patterns and explain why problematic
   */
  @Post('/detect')
  @ApiOperation({ summary: 'Detect engagement bait patterns in caption' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        caption: { type: 'string', description: 'Caption text to analyze' },
      },
      required: ['caption'],
    },
  })
  @ApiResponse({ status: 200, description: 'Bait detection result' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  detectBait(
    @GetOrgFromRequest() org: Organization,
    @Body() body: DetectBaitDto
  ): BaitDetectionResult {
    if (!body.caption) {
      throw new BadRequestException('Caption is required');
    }

    return this._engagementBaitService.detectEngagementBait(body.caption);
  }

  /**
   * Pre-publish check for bait patterns
   * AC: #4 - Scan for bait patterns before posting
   */
  @Post('/check')
  @ApiOperation({ summary: 'Pre-publish check for engagement bait' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contentDraft: { type: 'string', description: 'Content draft to check' },
      },
      required: ['contentDraft'],
    },
  })
  @ApiResponse({ status: 200, description: 'Pre-publish check result' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  checkBeforePublish(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CheckBeforePublishDto
  ): PrePublishCheckResult {
    if (!body.contentDraft) {
      throw new BadRequestException('Content draft is required');
    }

    return this._engagementBaitService.checkBeforePublish(body.contentDraft);
  }

  /**
   * Get bait report for organization
   * AC: #5 - Show bait score trends and flagged content
   */
  @Get('/report')
  @ApiOperation({ summary: 'Get engagement bait report for organization' })
  @ApiQuery({
    name: 'days',
    required: false,
    enum: ['7', '14', '30'],
    description: 'Number of days to analyze',
  })
  @ApiResponse({ status: 200, description: 'Bait report returned successfully' })
  async getBaitReport(
    @GetOrgFromRequest() org: Organization,
    @Query('days') days?: string
  ): Promise<BaitReport> {
    let period: 7 | 14 | 30 = 7;

    if (days === '14') {
      period = 14;
    } else if (days === '30') {
      period = 30;
    }

    return this._engagementBaitService.getBaitReport(org.id, period);
  }

  /**
   * Get available bait patterns reference
   */
  @Get('/patterns')
  @ApiOperation({ summary: 'Get list of detectable bait patterns' })
  @ApiResponse({ status: 200, description: 'Bait patterns list' })
  getBaitPatterns(): Array<{
    id: string;
    type: string;
    severity: string;
    explanation: string;
  }> {
    return this._engagementBaitService.getBaitPatterns();
  }
}
