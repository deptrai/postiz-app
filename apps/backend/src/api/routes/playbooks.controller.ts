import { Controller, Get, Post, Query, Param, Body, Delete } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { PlaybookGeneratorService } from '@gitroom/nestjs-libraries/database/prisma/playbooks/playbook-generator.service';
import { PlaybookService } from '@gitroom/nestjs-libraries/database/prisma/playbooks/playbook.service';
import { PlaybookVariantService } from '@gitroom/nestjs-libraries/database/prisma/playbooks/playbook-variant.service';

class GeneratePlaybooksDto {
  groupId?: string;
  integrationIds?: string[];
  days?: number;
  minContentItems?: number;
}

@ApiTags('Playbooks')
@Controller('/playbooks')
export class PlaybooksController {
  constructor(
    private _generatorService: PlaybookGeneratorService,
    private _playbookService: PlaybookService,
    private _variantService: PlaybookVariantService
  ) {}

  @Post('/generate')
  @ApiOperation({ summary: 'Generate playbooks from top-performing content' })
  @ApiResponse({ status: 200, description: 'Playbooks generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async generatePlaybooks(
    @GetOrgFromRequest() org: Organization,
    @Body() dto: GeneratePlaybooksDto
  ) {
    const playbookIds = await this._generatorService.generatePlaybooks(org.id, {
      groupId: dto.groupId,
      integrationIds: dto.integrationIds,
      days: dto.days || 30,
      minContentItems: dto.minContentItems || 3,
    });

    return {
      success: true,
      playbookIds,
      count: playbookIds.length,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List playbooks with filters' })
  @ApiQuery({ name: 'groupId', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['post', 'reel'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of playbooks' })
  async listPlaybooks(
    @GetOrgFromRequest() org: Organization,
    @Query('groupId') groupId?: string,
    @Query('format') format?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const playbooks = await this._playbookService.getPlaybooks(org.id, {
      groupId,
      format,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      success: true,
      playbooks,
      count: playbooks.length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get playbook details by ID' })
  @ApiResponse({ status: 200, description: 'Playbook details' })
  @ApiResponse({ status: 404, description: 'Playbook not found' })
  async getPlaybook(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const playbook = await this._playbookService.getPlaybookById(id, org.id);

    if (!playbook) {
      return {
        success: false,
        message: 'Playbook not found',
      };
    }

    return {
      success: true,
      playbook,
    };
  }

  @Get(':id/evidence')
  @ApiOperation({ summary: 'Get playbook evidence (source content with metrics)' })
  @ApiResponse({ status: 200, description: 'Playbook evidence' })
  @ApiResponse({ status: 404, description: 'Playbook not found' })
  async getPlaybookEvidence(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const evidence = await this._playbookService.getPlaybookEvidence(id, org.id);

    if (!evidence) {
      return {
        success: false,
        message: 'Playbook not found',
      };
    }

    return {
      success: true,
      ...evidence,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete playbook (soft delete)' })
  @ApiResponse({ status: 200, description: 'Playbook deleted' })
  @ApiResponse({ status: 404, description: 'Playbook not found' })
  async deletePlaybook(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const deleted = await this._playbookService.deletePlaybook(id, org.id);

    if (!deleted) {
      return {
        success: false,
        message: 'Playbook not found',
      };
    }

    return {
      success: true,
      message: 'Playbook deleted',
    };
  }

  // Variant Endpoints

  @Get(':id/variants')
  @ApiOperation({ summary: 'List variants for a playbook' })
  @ApiResponse({ status: 200, description: 'List of variants' })
  @ApiResponse({ status: 404, description: 'Playbook not found' })
  async listVariants(
    @GetOrgFromRequest() org: Organization,
    @Param('id') playbookId: string
  ) {
    try {
      const variants = await this._variantService.getVariants(playbookId, org.id);
      return {
        success: true,
        variants,
        count: variants.length,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch variants',
      };
    }
  }

  @Post(':id/variants/generate')
  @ApiOperation({ summary: 'Generate variants for a playbook' })
  @ApiResponse({ status: 201, description: 'Variants generated successfully' })
  @ApiResponse({ status: 404, description: 'Playbook not found' })
  async generateVariants(
    @GetOrgFromRequest() org: Organization,
    @Param('id') playbookId: string
  ) {
    try {
      const variants = await this._variantService.generateVariants(playbookId, org.id);
      return {
        success: true,
        variants,
        count: variants.length,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to generate variants',
      };
    }
  }

  @Get(':id/variants/:variantId')
  @ApiOperation({ summary: 'Get variant details by ID' })
  @ApiResponse({ status: 200, description: 'Variant details' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  async getVariant(
    @GetOrgFromRequest() org: Organization,
    @Param('id') playbookId: string,
    @Param('variantId') variantId: string
  ) {
    try {
      const variant = await this._variantService.getVariantById(variantId, org.id);
      
      if (!variant) {
        return {
          success: false,
          message: 'Variant not found',
        };
      }

      return {
        success: true,
        variant,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch variant',
      };
    }
  }

  @Delete(':id/variants/:variantId')
  @ApiOperation({ summary: 'Delete variant' })
  @ApiResponse({ status: 200, description: 'Variant deleted' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  async deleteVariant(
    @GetOrgFromRequest() org: Organization,
    @Param('id') playbookId: string,
    @Param('variantId') variantId: string
  ) {
    try {
      await this._variantService.deleteVariant(variantId, org.id);
      return {
        success: true,
        message: 'Variant deleted',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete variant',
      };
    }
  }
}
