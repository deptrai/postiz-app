import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Organization } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { StarsService } from '@gitroom/nestjs-libraries/database/prisma/stars/stars.service';
import dayjs from 'dayjs';
import { StarsListDto } from '@gitroom/nestjs-libraries/dtos/analytics/stars.list.dto';
import { DailyBriefQueryDto } from '@gitroom/nestjs-libraries/dtos/analytics/daily-brief.query.dto';
import { UpdateTrackedPagesDto } from '@gitroom/nestjs-libraries/dtos/analytics/update-tracked-pages.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { AnalyticsTrackingService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-tracking.service';
import { IntegrationManager } from '@gitroom/nestjs-libraries/integrations/integration.manager';
import { BadRequestException, NotFoundException, Put } from '@nestjs/common';
import { AnalyticsGroupService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-group.service';

@ApiTags('Analytics')
@Controller('/analytics')
export class AnalyticsController {
  constructor(
    private _starsService: StarsService,
    private _integrationService: IntegrationService,
    private _analyticsTrackingService: AnalyticsTrackingService,
    private _analyticsGroupService: AnalyticsGroupService
  ) {}
  @Get('/')
  async getStars(@GetOrgFromRequest() org: Organization) {
    return this._starsService.getStars(org.id);
  }

  @Get('/trending')
  async getTrending() {
    const todayTrending = dayjs(dayjs().format('YYYY-MM-DDT12:00:00'));
    const last = todayTrending.isAfter(dayjs())
      ? todayTrending.subtract(1, 'day')
      : todayTrending;
    const nextTrending = last.add(1, 'day');

    return {
      last: last.format('YYYY-MM-DD HH:mm:ss'),
      predictions: nextTrending.format('YYYY-MM-DD HH:mm:ss'),
    };
  }

  @Post('/stars')
  async getStarsFilter(
    @GetOrgFromRequest() org: Organization,
    @Body() starsFilter: StarsListDto
  ) {
    return {
      stars: await this._starsService.getStarsFilter(org.id, starsFilter),
    };
  }

  @ApiOperation({ summary: 'Get Daily Brief analytics stub' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'groupId', required: false, description: 'Analytics group ID' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'markdown'], description: 'Response format' })
  @ApiResponse({ status: 200, description: 'Daily brief data returned successfully' })
  @Get('/daily-brief')
  async getDailyBrief(
    @GetOrgFromRequest() org: Organization,
    @Query() query: DailyBriefQueryDto
  ) {
    return {
      date: query.date || dayjs().format('YYYY-MM-DD'),
      organizationId: org.id,
      summary: {
        totalPosts: 0,
        totalEngagement: 0,
        topPerformer: null,
      },
      recommendations: [],
      trends: [],
      format: query.format || 'json',
    };
  }

  @ApiOperation({ summary: 'Get tracked Facebook Pages for analytics' })
  @ApiResponse({ status: 200, description: 'List of tracked integration IDs', type: [String] })
  @Get('/tracked-pages')
  async getTrackedPages(@GetOrgFromRequest() org: Organization): Promise<string[]> {
    return this._analyticsTrackingService.getTrackedIntegrations(org.id);
  }

  @ApiOperation({ summary: 'Update tracked Facebook Pages for analytics (max 20)' })
  @ApiBody({ type: UpdateTrackedPagesDto })
  @ApiResponse({ status: 200, description: 'Tracked pages updated successfully' })
  @ApiResponse({ status: 400, description: 'More than 20 integrations or validation error' })
  @ApiResponse({ status: 404, description: 'One or more integrationIds not found or do not belong to organization' })
  @Put('/tracked-pages')
  async updateTrackedPages(
    @GetOrgFromRequest() org: Organization,
    @Body() body: UpdateTrackedPagesDto
  ): Promise<{ success: boolean; trackedCount: number }> {
    try {
      await this._analyticsTrackingService.updateTrackedIntegrations(
        org.id,
        body.integrationIds
      );

      return {
        success: true,
        trackedCount: body.integrationIds.length,
      };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Cannot track more than 20')) {
        throw new BadRequestException(errorMessage);
      }
      if (errorMessage.includes('not found or do not belong')) {
        throw new NotFoundException(errorMessage);
      }
      throw error;
    }
  }

  @Get('/:integration')
  async getIntegration(
    @GetOrgFromRequest() org: Organization,
    @Param('integration') integration: string,
    @Query('date') date: string
  ) {
    return this._integrationService.checkAnalytics(org, integration, date);
  }

  // Page Groups Management - Story 3.1

  @Post('/groups')
  @ApiOperation({ summary: 'Create a new page group' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Group name' },
        description: { type: 'string', description: 'Optional description' },
        niche: { type: 'string', description: 'Optional niche/category' }
      },
      required: ['name']
    }
  })
  @ApiResponse({ status: 201, description: 'Group created successfully' })
  async createGroup(
    @GetOrgFromRequest() org: Organization,
    @Body() data: { name: string; description?: string; niche?: string }
  ) {
    return this._analyticsGroupService.createGroup(org.id, data);
  }

  @Get('/groups')
  @ApiOperation({ summary: 'Get all page groups' })
  @ApiResponse({ status: 200, description: 'List of groups returned' })
  async getGroups(@GetOrgFromRequest() org: Organization) {
    return this._analyticsGroupService.getGroups(org.id);
  }

  @Get('/groups/:groupId')
  @ApiOperation({ summary: 'Get a specific group by ID' })
  @ApiResponse({ status: 200, description: 'Group details returned' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroup(
    @GetOrgFromRequest() org: Organization,
    @Param('groupId') groupId: string
  ) {
    return this._analyticsGroupService.getGroupById(org.id, groupId);
  }

  @Put('/groups/:groupId')
  @ApiOperation({ summary: 'Update a page group' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        niche: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Group updated successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async updateGroup(
    @GetOrgFromRequest() org: Organization,
    @Param('groupId') groupId: string,
    @Body() data: { name?: string; description?: string; niche?: string }
  ) {
    return this._analyticsGroupService.updateGroup(org.id, groupId, data);
  }

  @Post('/groups/:groupId/pages')
  @ApiOperation({ summary: 'Assign pages to a group' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        trackedIntegrationIds: { 
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tracked integration IDs to assign'
        }
      },
      required: ['trackedIntegrationIds']
    }
  })
  @ApiResponse({ status: 200, description: 'Pages assigned successfully' })
  @ApiResponse({ status: 404, description: 'Group or tracked integration not found' })
  async assignPages(
    @GetOrgFromRequest() org: Organization,
    @Param('groupId') groupId: string,
    @Body() data: { trackedIntegrationIds: string[] }
  ) {
    return this._analyticsGroupService.assignPages(org.id, groupId, data);
  }
}
