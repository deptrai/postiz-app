import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { ThemeService } from '@gitroom/nestjs-libraries/database/prisma/themes/theme.service';
import { ThemeClusteringService } from '@gitroom/nestjs-libraries/database/prisma/themes/theme-clustering.service';
import { ThemeAssignmentService } from '@gitroom/nestjs-libraries/database/prisma/themes/theme-assignment.service';
import { ThemeManagerService } from '@gitroom/nestjs-libraries/database/prisma/themes/theme-manager.service';
import { ThemeTrendingService } from '@gitroom/nestjs-libraries/database/prisma/themes/theme-trending.service';

@ApiTags('Themes')
@Controller('/themes')
export class ThemesController {
  constructor(
    private _themeService: ThemeService,
    private _clusteringService: ThemeClusteringService,
    private _assignmentService: ThemeAssignmentService,
    private _managerService: ThemeManagerService,
    private _trendingService: ThemeTrendingService
  ) {}

  /**
   * Trigger clustering pipeline to create themes from content
   * AC1: Clustering creates themes with keywords
   */
  @Post('/cluster')
  @ApiOperation({ summary: 'Run clustering to create themes from captions and hashtags' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        minClusterSize: { type: 'number', default: 3, description: 'Minimum content items per theme' },
        similarityThreshold: { type: 'number', default: 0.3, description: 'Keyword similarity threshold (0-1)' },
        maxClusters: { type: 'number', default: 20, description: 'Maximum number of themes to create' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Clustering completed successfully' })
  async runClustering(
    @GetOrgFromRequest() org: Organization,
    @Body() body: {
      minClusterSize?: number;
      similarityThreshold?: number;
      maxClusters?: number;
    }
  ) {
    const result = await this._clusteringService.runClustering(org.id, body);

    return {
      success: true,
      themesCreated: result.themes.length,
      contentClustered: result.contentClustered,
      themes: result.themes,
    };
  }

  /**
   * List themes for organization
   * AC4: Themes listed with metrics
   */
  @Get()
  @ApiOperation({ summary: 'Get all themes for organization' })
  @ApiQuery({
    name: 'groupId',
    required: false,
    description: 'Filter by group ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max number of themes to return',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset for pagination',
  })
  @ApiResponse({ status: 200, description: 'Themes retrieved successfully' })
  async listThemes(
    @GetOrgFromRequest() org: Organization,
    @Query('groupId') groupId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const themes = await this._themeService.getThemes(org.id, {
      groupId,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
    });

    return {
      success: true,
      themes,
      count: themes.length,
    };
  }

  /**
   * Get trending themes with velocity calculation
   */
  @Get('/trending')
  @ApiOperation({ summary: 'Get trending themes with velocity and direction' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max number of trending themes to return (default: 10)',
  })
  @ApiQuery({
    name: 'currentPeriodHours',
    required: false,
    type: Number,
    description: 'Hours for current period (default: 24)',
  })
  @ApiQuery({
    name: 'previousPeriodHours',
    required: false,
    type: Number,
    description: 'Hours for previous period (default: 24)',
  })
  @ApiResponse({ status: 200, description: 'Trending themes retrieved successfully' })
  async getTrendingThemes(
    @GetOrgFromRequest() org: Organization,
    @Query('limit') limit?: number,
    @Query('currentPeriodHours') currentPeriodHours?: number,
    @Query('previousPeriodHours') previousPeriodHours?: number
  ) {
    const trends = await this._trendingService.getThemeTrends(org.id, {
      limit: limit ? parseInt(limit.toString()) : 10,
      currentPeriodHours: currentPeriodHours ? parseInt(currentPeriodHours.toString()) : 24,
      previousPeriodHours: previousPeriodHours ? parseInt(previousPeriodHours.toString()) : 24,
    });

    return {
      success: true,
      trends,
      count: trends.length,
    };
  }

  /**
   * Get trending summary (rising, falling, stable counts)
   */
  @Get('/trending/summary')
  @ApiOperation({ summary: 'Get trending themes summary with counts by direction' })
  @ApiQuery({
    name: 'currentPeriodHours',
    required: false,
    type: Number,
    description: 'Hours for current period (default: 24)',
  })
  @ApiQuery({
    name: 'previousPeriodHours',
    required: false,
    type: Number,
    description: 'Hours for previous period (default: 24)',
  })
  @ApiResponse({ status: 200, description: 'Trending summary retrieved successfully' })
  async getTrendingSummary(
    @GetOrgFromRequest() org: Organization,
    @Query('currentPeriodHours') currentPeriodHours?: number,
    @Query('previousPeriodHours') previousPeriodHours?: number
  ) {
    const summary = await this._trendingService.getTrendingSummary(org.id, {
      currentPeriodHours: currentPeriodHours ? parseInt(currentPeriodHours.toString()) : 24,
      previousPeriodHours: previousPeriodHours ? parseInt(previousPeriodHours.toString()) : 24,
    });

    return {
      success: true,
      ...summary,
    };
  }

  /**
   * Get theme details with content list
   * AC2: Theme displays name, keywords, metrics, content
   */
  @Get('/:id')
  @ApiOperation({ summary: 'Get theme details by ID' })
  @ApiParam({ name: 'id', description: 'Theme ID' })
  @ApiResponse({ status: 200, description: 'Theme details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  async getTheme(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const theme = await this._themeService.getThemeById(id, org.id);

    if (!theme) {
      return {
        success: false,
        error: 'Theme not found',
      };
    }

    return {
      success: true,
      theme,
    };
  }

  /**
   * Get top-performing content for a theme
   * AC3: Show top posts related to theme
   */
  @Get('/:id/top-content')
  @ApiOperation({ summary: 'Get top-performing content for a theme' })
  @ApiParam({ name: 'id', description: 'Theme ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max number of top content items to return (default: 10)',
  })
  @ApiResponse({ status: 200, description: 'Top content retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  async getThemeTopContent(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Query('limit') limit?: number
  ) {
    try {
      const content = await this._trendingService.getThemeTopContent(
        id,
        org.id,
        limit ? parseInt(limit.toString()) : 10
      );

      return {
        success: true,
        content,
        count: content.length,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || 'Failed to get top content',
      };
    }
  }

  /**
   * Get theme content with metrics
   * AC2: Display content associated with theme
   */
  @Get('/:id/content')
  @ApiOperation({ summary: 'Get content associated with theme' })
  @ApiParam({ name: 'id', description: 'Theme ID' })
  @ApiResponse({ status: 200, description: 'Theme content retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  async getThemeContent(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const content = await this._themeService.getThemeContent(id, org.id);

    if (!content) {
      return {
        success: false,
        error: 'Theme not found',
      };
    }

    return {
      success: true,
      content,
      count: content.length,
    };
  }

  /**
   * Rename theme
   * AC2: User can rename theme
   */
  @Post('/:id/rename')
  @ApiOperation({ summary: 'Rename theme' })
  @ApiParam({ name: 'id', description: 'Theme ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Customer Success Stories' },
      },
      required: ['name'],
    },
  })
  @ApiResponse({ status: 200, description: 'Theme renamed successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  async renameTheme(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: { name: string }
  ) {
    try {
      const theme = await this._managerService.renameTheme(id, body.name, org.id);

      return {
        success: true,
        theme,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || 'Failed to rename theme',
      };
    }
  }

  /**
   * Manually assign content to theme
   * AC3: Content can be assigned to theme
   */
  @Post('/:id/assign')
  @ApiOperation({ summary: 'Assign content to theme' })
  @ApiParam({ name: 'id', description: 'Theme ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contentId: { type: 'string' },
      },
      required: ['contentId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Content assigned successfully' })
  async assignContent(
    @GetOrgFromRequest() org: Organization,
    @Param('id') themeId: string,
    @Body() body: { contentId: string }
  ) {
    await this._assignmentService.assignContentToTheme(body.contentId, themeId);

    return {
      success: true,
      message: 'Content assigned to theme',
    };
  }

  /**
   * Auto-assign content to existing themes
   * AC5: New content automatically assigned to themes
   */
  @Post('/auto-assign')
  @ApiOperation({ summary: 'Auto-assign content to matching themes' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contentId: { type: 'string' },
      },
      required: ['contentId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Content auto-assigned successfully' })
  async autoAssignContent(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { contentId: string }
  ) {
    await this._assignmentService.assignNewContent(body.contentId);

    return {
      success: true,
      message: 'Content auto-assignment completed',
    };
  }

  /**
   * Merge multiple themes into one
   * AC2: Merge themes with traceability
   */
  @Post('/merge')
  @ApiOperation({ summary: 'Merge multiple themes into one' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        themeIds: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['theme-id-1', 'theme-id-2'],
          description: 'Array of theme IDs to merge (minimum 2)'
        },
        targetName: { 
          type: 'string', 
          example: 'Merged Theme',
          description: 'Name for the merged theme'
        },
      },
      required: ['themeIds', 'targetName'],
    },
  })
  @ApiResponse({ status: 200, description: 'Themes merged successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async mergeThemes(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { themeIds: string[]; targetName: string }
  ) {
    try {
      const theme = await this._managerService.mergeThemes(
        body.themeIds,
        body.targetName,
        org.id
      );

      return {
        success: true,
        theme,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || 'Failed to merge themes',
      };
    }
  }

  /**
   * Split theme into multiple themes
   * AC3: Split theme with manual or auto mode
   */
  @Post('/:id/split')
  @ApiOperation({ summary: 'Split theme into multiple themes' })
  @ApiParam({ name: 'id', description: 'Theme ID to split' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['manual', 'auto'],
          example: 'auto',
          description: 'Split mode: manual (user-defined groups) or auto (algorithmic split)'
        },
        manualSplit: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              contentIds: { type: 'array', items: { type: 'string' } },
              name: { type: 'string' }
            }
          },
          description: 'Required for manual mode: array of content groups with names'
        },
      },
      required: ['mode'],
    },
  })
  @ApiResponse({ status: 200, description: 'Theme split successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async splitTheme(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: { mode: 'manual' | 'auto'; manualSplit?: any[] }
  ) {
    try {
      const themes = await this._managerService.splitTheme(
        id,
        {
          mode: body.mode,
          manualSplit: body.manualSplit,
        },
        org.id
      );

      return {
        success: true,
        themes,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || 'Failed to split theme',
      };
    }
  }

  /**
   * Get theme history
   * AC5: View theme change history
   */
  @Get('/:id/history')
  @ApiOperation({ summary: 'Get theme change history' })
  @ApiParam({ name: 'id', description: 'Theme ID' })
  @ApiResponse({ status: 200, description: 'Theme history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  async getThemeHistory(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    try {
      const history = await this._managerService.getThemeHistory(id, org.id);

      return {
        success: true,
        history,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || 'Failed to get theme history',
      };
    }
  }
}
