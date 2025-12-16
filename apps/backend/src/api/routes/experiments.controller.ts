import { Controller, Get, Post, Delete, Query, Param, Body } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { ExperimentService } from '@gitroom/nestjs-libraries/database/prisma/experiments/experiment.service';
import { ExperimentTrackingService } from '@gitroom/nestjs-libraries/database/prisma/experiments/experiment-tracking.service';
import { ExperimentAnalysisService } from '@gitroom/nestjs-libraries/database/prisma/experiments/experiment-analysis.service';

@ApiTags('Experiments')
@Controller('/experiments')
export class ExperimentsController {
  constructor(
    private _experimentService: ExperimentService,
    private _trackingService: ExperimentTrackingService,
    private _analysisService: ExperimentAnalysisService
  ) {}

  /**
   * Create a new experiment
   * AC1: Select 2-3 variants to test
   * AC2: Configure name, timeframe, success metric
   */
  @Post()
  @ApiOperation({ summary: 'Create new experiment from playbook variants' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Hook Test A vs B' },
        playbookId: { type: 'string' },
        variantIds: { 
          type: 'array', 
          items: { type: 'string' },
          minItems: 2,
          maxItems: 3,
          example: ['variant-id-1', 'variant-id-2']
        },
        successMetric: { 
          type: 'string', 
          enum: ['reach', 'engagement', 'combined'],
          example: 'engagement'
        },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
      },
      required: ['name', 'playbookId', 'variantIds', 'successMetric'],
    },
  })
  @ApiResponse({ status: 201, description: 'Experiment created successfully' })
  async createExperiment(
    @GetOrgFromRequest() org: Organization,
    @Body() body: {
      name: string;
      playbookId: string;
      variantIds: string[];
      successMetric: 'reach' | 'engagement' | 'combined';
      startDate?: string;
      endDate?: string;
    }
  ) {
    const experiment = await this._experimentService.createExperiment(org.id, {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });

    return {
      success: true,
      experiment,
    };
  }

  /**
   * List experiments with optional filters
   * AC6: List experiments with status and filters
   */
  @Get()
  @ApiOperation({ summary: 'Get all experiments for organization' })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: ['draft', 'active', 'completed'],
    description: 'Filter by experiment status'
  })
  @ApiResponse({ status: 200, description: 'Experiments retrieved successfully' })
  async listExperiments(
    @GetOrgFromRequest() org: Organization,
    @Query('status') status?: 'draft' | 'active' | 'completed'
  ) {
    const experiments = await this._experimentService.getExperiments(org.id, { status });

    return {
      success: true,
      experiments,
      count: experiments.length,
    };
  }

  /**
   * Get experiment by ID with full details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get experiment details by ID' })
  @ApiResponse({ status: 200, description: 'Experiment details retrieved' })
  async getExperiment(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const experiment = await this._experimentService.getExperimentById(id, org.id);

    return {
      success: true,
      experiment,
    };
  }

  /**
   * Start an experiment
   */
  @Post(':id/start')
  @ApiOperation({ summary: 'Start experiment (change status to active)' })
  @ApiResponse({ status: 200, description: 'Experiment started' })
  async startExperiment(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const experiment = await this._experimentService.startExperiment(id, org.id);

    return {
      success: true,
      message: 'Experiment started',
      experiment,
    };
  }

  /**
   * Complete an experiment
   */
  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete experiment (change status to completed)' })
  @ApiResponse({ status: 200, description: 'Experiment completed' })
  async completeExperiment(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const experiment = await this._experimentService.completeExperiment(id, org.id);

    return {
      success: true,
      message: 'Experiment completed',
      experiment,
    };
  }

  /**
   * Track content for experiment variant
   * AC3: Track performance metrics
   */
  @Post(':id/track')
  @ApiOperation({ summary: 'Track content for experiment variant' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        variantId: { type: 'string' },
        contentId: { type: 'string' },
      },
      required: ['variantId', 'contentId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Content tracked successfully' })
  async trackContent(
    @GetOrgFromRequest() org: Organization,
    @Param('id') experimentId: string,
    @Body() body: { variantId: string; contentId: string }
  ) {
    const tracked = await this._trackingService.trackContent(
      experimentId,
      body.variantId,
      body.contentId,
      org.id
    );

    return {
      success: true,
      message: 'Content tracked for variant',
      tracked,
    };
  }

  /**
   * Get experiment results with win rates
   * AC4: Show win rate, statistical comparison, winner
   */
  @Get(':id/results')
  @ApiOperation({ summary: 'Get experiment results with win rates and statistical analysis' })
  @ApiResponse({ status: 200, description: 'Results retrieved successfully' })
  async getResults(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const results = await this._analysisService.getExperimentResults(id, org.id);

    return {
      success: true,
      ...results,
    };
  }

  /**
   * Confirm winner and update playbook
   * AC5: Update playbook score when winner confirmed
   */
  @Post(':id/confirm-winner')
  @ApiOperation({ summary: 'Confirm experiment winner and update playbook' })
  @ApiResponse({ status: 200, description: 'Winner confirmed, playbook updated' })
  async confirmWinner(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const result = await this._analysisService.updatePlaybookWithWinner(id, org.id);

    return result;
  }

  /**
   * Delete experiment
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete experiment (soft delete)' })
  @ApiResponse({ status: 200, description: 'Experiment deleted' })
  async deleteExperiment(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const result = await this._experimentService.deleteExperiment(id, org.id);

    return result;
  }
}
