import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
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
import { AnalyticsDashboardService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-dashboard.service';
import { AnalyticsTaggingService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-tagging.service';
import { AnalyticsTrendingService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-trending.service';
import { AnalyticsBestTimeService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-best-time.service';
import { AnalyticsDailyBriefService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-daily-brief.service';
import { AnalyticsExportService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-export.service';
import { DashboardFiltersDto } from '@gitroom/nestjs-libraries/dtos/analytics/dashboard-filters.dto';
import { DashboardKPIsResponseDto, DashboardTopContentResponseDto } from '@gitroom/nestjs-libraries/dtos/analytics/dashboard-response.dto';

@ApiTags('Analytics')
@Controller('/analytics')
export class AnalyticsController {
  constructor(
    private readonly _starsService: StarsService,
    private readonly _integrationService: IntegrationService,
    private readonly _analyticsTrackingService: AnalyticsTrackingService,
    private readonly _analyticsGroupService: AnalyticsGroupService,
    private readonly _analyticsDashboardService: AnalyticsDashboardService,
    private readonly _analyticsTaggingService: AnalyticsTaggingService,
    private readonly _analyticsTrendingService: AnalyticsTrendingService,
    private readonly _analyticsBestTimeService: AnalyticsBestTimeService,
    private readonly _analyticsDailyBriefService: AnalyticsDailyBriefService,
    private readonly _analyticsExportService: AnalyticsExportService
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

  @ApiOperation({ summary: 'Get Daily Brief analytics (deprecated - use /dashboard/kpis)' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'groupId', required: false, description: 'Analytics group ID' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'markdown'], description: 'Response format' })
  @ApiResponse({ status: 200, description: 'Daily brief data returned successfully' })
  @Get('/daily-brief')
  async getDailyBrief(
    @GetOrgFromRequest() org: Organization,
    @Query() query: DailyBriefQueryDto
  ) {
    // Use last 7 days by default
    const endDate = query.date ? dayjs(query.date) : dayjs();
    const startDate = endDate.subtract(6, 'days');

    const kpis = await this._analyticsDashboardService.getKPIs(org.id, {
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      groupId: query.groupId,
      format: 'all',
    });

    const topContent = await this._analyticsDashboardService.getTopContent(
      org.id,
      {
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        groupId: query.groupId,
        format: 'all',
      },
      5
    );

    return {
      date: endDate.format('YYYY-MM-DD'),
      organizationId: org.id,
      summary: {
        totalPosts: kpis.totalPosts,
        totalEngagement: kpis.totalEngagement,
        topPerformer: topContent[0]?.externalContentId || null,
      },
      recommendations: [],
      trends: [],
      format: query.format || 'json',
      kpis,
      topContent,
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

  // Dashboard KPIs and Top Content - Story 3.2

  @Get('/dashboard/kpis')
  @ApiOperation({ summary: 'Get dashboard KPI summary with filters' })
  @ApiResponse({ status: 200, description: 'KPI summary returned', type: DashboardKPIsResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid filters' })
  async getDashboardKPIs(
    @GetOrgFromRequest() org: Organization,
    @Query() filters: DashboardFiltersDto
  ): Promise<DashboardKPIsResponseDto> {
    const kpis = await this._analyticsDashboardService.getKPIs(org.id, {
      startDate: new Date(filters.startDate),
      endDate: new Date(filters.endDate),
      groupId: filters.groupId,
      integrationIds: filters.integrationIds,
      format: filters.format || 'all',
    });

    return {
      kpis,
      filters: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        groupId: filters.groupId,
        integrationIds: filters.integrationIds,
        format: filters.format || 'all',
      },
    };
  }

  @Get('/dashboard/top-content')
  @ApiOperation({ summary: 'Get top performing content ranked by engagement' })
  @ApiResponse({ status: 200, description: 'Top content returned', type: DashboardTopContentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid filters' })
  async getDashboardTopContent(
    @GetOrgFromRequest() org: Organization,
    @Query() filters: DashboardFiltersDto
  ): Promise<DashboardTopContentResponseDto> {
    const limit = filters.limit || 10;
    
    const topContent = await this._analyticsDashboardService.getTopContent(
      org.id,
      {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
        groupId: filters.groupId,
        integrationIds: filters.integrationIds,
        format: filters.format || 'all',
      },
      limit
    );

    return {
      topContent,
      count: topContent.length,
      filters: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        groupId: filters.groupId,
        integrationIds: filters.integrationIds,
        format: filters.format || 'all',
        limit,
      },
    };
  }

  @Get('/dashboard/format-breakdown')
  @ApiOperation({ summary: 'Get format breakdown (Posts vs Reels) with engagement rates' })
  @ApiResponse({ status: 200, description: 'Format breakdown returned' })
  @ApiResponse({ status: 400, description: 'Invalid filters' })
  async getFormatBreakdown(
    @GetOrgFromRequest() org: Organization,
    @Query() filters: DashboardFiltersDto
  ) {
    try {
      return await this._analyticsDashboardService.getFormatBreakdown(org.id, {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
        groupId: filters.groupId,
        integrationIds: filters.integrationIds,
      });
    } catch (error: any) {
      if (error.message?.includes('Invalid')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
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
    try {
      return await this._analyticsGroupService.getGroupById(org.id, groupId);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
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
    try {
      return await this._analyticsGroupService.updateGroup(org.id, groupId, data);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
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
    try {
      return await this._analyticsGroupService.assignPages(org.id, groupId, data);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Delete('/groups/:groupId')
  @ApiOperation({ summary: 'Delete a page group (soft delete)' })
  @ApiResponse({ status: 200, description: 'Group deleted successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async deleteGroup(
    @GetOrgFromRequest() org: Organization,
    @Param('groupId') groupId: string
  ) {
    try {
      return await this._analyticsGroupService.deleteGroup(org.id, groupId);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Delete('/groups/:groupId/pages/:trackedIntegrationId')
  @ApiOperation({ summary: 'Remove a page from a group' })
  @ApiResponse({ status: 200, description: 'Page removed successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async removePage(
    @GetOrgFromRequest() org: Organization,
    @Param('groupId') groupId: string,
    @Param('trackedIntegrationId') trackedIntegrationId: string
  ) {
    try {
      return await this._analyticsGroupService.removePage(org.id, groupId, trackedIntegrationId);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  // Epic 4 Endpoints - Trending Topics (Story 4.2)

  @Get('/trending/topics')
  @ApiOperation({ summary: 'Get trending topics by velocity' })
  @ApiQuery({ name: 'timeWindow', required: false, enum: ['24h', '48h', '72h'], description: 'Time window for analysis' })
  @ApiQuery({ name: 'groupId', required: false, description: 'Filter by group ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiResponse({ status: 200, description: 'Trending topics returned successfully' })
  async getTrendingTopics(
    @GetOrgFromRequest() org: Organization,
    @Query('timeWindow') timeWindow: '24h' | '48h' | '72h' = '24h',
    @Query('groupId') groupId?: string,
    @Query('limit') limit?: string
  ) {
    return this._analyticsTrendingService.getTrendingTopics(org.id, {
      timeWindow,
      groupId,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  // Epic 4 Endpoints - Best Time to Post (Story 4.3)

  @Get('/best-time')
  @ApiOperation({ summary: 'Get best time to post recommendations' })
  @ApiQuery({ name: 'groupId', required: false, description: 'Filter by group ID' })
  @ApiQuery({ name: 'integrationIds', required: false, description: 'Filter by integration IDs (comma-separated)' })
  @ApiQuery({ name: 'days', required: false, enum: ['7', '14'], description: 'Number of days to analyze' })
  @ApiResponse({ status: 200, description: 'Best time recommendations returned successfully' })
  async getBestTimeSlots(
    @GetOrgFromRequest() org: Organization,
    @Query('groupId') groupId?: string,
    @Query('integrationIds') integrationIds?: string,
    @Query('days') days?: string
  ) {
    const ids = integrationIds ? integrationIds.split(',') : undefined;
    return this._analyticsBestTimeService.getBestTimeSlots(org.id, {
      groupId,
      integrationIds: ids,
      days: days === '14' ? 14 : 7,
    });
  }

  // Epic 4 Endpoints - Tagging (Story 4.1)

  @Get('/tags')
  @ApiOperation({ summary: 'Get all tags for organization' })
  @ApiResponse({ status: 200, description: 'Tags returned successfully' })
  async getTags(@GetOrgFromRequest() org: Organization) {
    return this._analyticsTaggingService.getTags(org.id);
  }

  @Post('/tags')
  @ApiOperation({ summary: 'Create a new manual tag' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Tag name' },
      },
      required: ['name'],
    },
  })
  @ApiResponse({ status: 201, description: 'Tag created successfully' })
  async createTag(
    @GetOrgFromRequest() org: Organization,
    @Body() data: { name: string }
  ) {
    return this._analyticsTaggingService.createManualTag(org.id, data.name);
  }

  @Put('/tags/:tagId')
  @ApiOperation({ summary: 'Update a tag' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'New tag name' },
      },
      required: ['name'],
    },
  })
  @ApiResponse({ status: 200, description: 'Tag updated successfully' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async updateTag(
    @GetOrgFromRequest() org: Organization,
    @Param('tagId') tagId: string,
    @Body() data: { name: string }
  ) {
    try {
      return await this._analyticsTaggingService.updateTag(org.id, tagId, data.name);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Delete('/tags/:tagId')
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({ status: 200, description: 'Tag deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async deleteTag(
    @GetOrgFromRequest() org: Organization,
    @Param('tagId') tagId: string
  ) {
    try {
      return await this._analyticsTaggingService.deleteTag(org.id, tagId);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Post('/content/:contentId/tags/:tagId')
  @ApiOperation({ summary: 'Assign a tag to content' })
  @ApiResponse({ status: 200, description: 'Tag assigned successfully' })
  async assignTagToContent(
    @GetOrgFromRequest() org: Organization,
    @Param('contentId') contentId: string,
    @Param('tagId') tagId: string
  ) {
    return this._analyticsTaggingService.assignTagToContent(org.id, contentId, tagId);
  }

  @Delete('/content/:contentId/tags/:tagId')
  @ApiOperation({ summary: 'Remove tag from content' })
  @ApiResponse({ status: 200, description: 'Tag removed successfully' })
  async removeTagFromContent(
    @Param('contentId') contentId: string,
    @Param('tagId') tagId: string
  ) {
    return this._analyticsTaggingService.removeTagFromContent(contentId, tagId);
  }

  // Epic 5 Endpoints - Export CSV (Story 5.1)

  @Get('/export/csv')
  @ApiOperation({ summary: 'Export analytics data as CSV file' })
  @ApiQuery({ name: 'groupId', required: false, description: 'Filter by analytics group ID' })
  @ApiQuery({ name: 'integrationIds', required: false, description: 'Comma-separated integration IDs' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'format', required: false, enum: ['post', 'reel', 'all'], description: 'Content format filter' })
  @ApiQuery({ name: 'exportType', required: false, enum: ['detailed', 'summary'], description: 'Export type: detailed (per content) or summary (per day)' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async exportCSV(
    @GetOrgFromRequest() org: Organization,
    @Query('groupId') groupId?: string,
    @Query('integrationIds') integrationIds?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format: 'post' | 'reel' | 'all' = 'all',
    @Query('exportType') exportType: 'detailed' | 'summary' = 'detailed',
    @Res() res?: Response
  ) {
    // Validate required dates
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    // Validate date format
    if (!dayjs(startDate, 'YYYY-MM-DD', true).isValid() ||
        !dayjs(endDate, 'YYYY-MM-DD', true).isValid()) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    // Validate date range (max 90 days)
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    if (end.isBefore(start)) {
      throw new BadRequestException('endDate must be after startDate');
    }
    if (end.diff(start, 'days') > 90) {
      throw new BadRequestException('Date range cannot exceed 90 days');
    }

    // Generate CSV
    const csv = await this._analyticsExportService.generateCSV(org.id, {
      groupId,
      integrationIds: integrationIds?.split(',').filter(Boolean),
      startDate,
      endDate,
      format,
      exportType,
    });

    // Set response headers for file download
    const filename = `analytics-export-${startDate}-to-${endDate}.csv`;
    res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res!.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res!.send(csv);
  }

}
