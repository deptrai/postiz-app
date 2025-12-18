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
  PolicyComplianceService,
  ComplianceCheckResult,
  ComplianceHistory,
  PolicyCategory,
} from '@gitroom/nestjs-libraries/database/prisma/quality/policy-compliance.service';

class CheckComplianceDto {
  contentDraft: string;
}

@ApiTags('Quality - Policy Compliance')
@Controller('/quality/compliance')
export class ComplianceController {
  constructor(private readonly _policyComplianceService: PolicyComplianceService) {}

  /**
   * Check content compliance against policies
   * AC: #1, #2, #3, #4 - Check content and explain violations
   */
  @Post('/check')
  @ApiOperation({ summary: 'Check content compliance against monetization policies' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contentDraft: { type: 'string', description: 'Content to check for compliance' },
      },
      required: ['contentDraft'],
    },
  })
  @ApiResponse({ status: 200, description: 'Compliance check result' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  checkCompliance(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CheckComplianceDto
  ): ComplianceCheckResult {
    if (!body.contentDraft) {
      throw new BadRequestException('Content draft is required');
    }

    return this._policyComplianceService.checkCompliance(body.contentDraft);
  }

  /**
   * Get compliance history for organization
   * AC: #5 - Show compliance score trends and past violations
   */
  @Get('/history')
  @ApiOperation({ summary: 'Get compliance history for organization' })
  @ApiQuery({
    name: 'days',
    required: false,
    enum: ['7', '14', '30'],
    description: 'Number of days to analyze',
  })
  @ApiResponse({ status: 200, description: 'Compliance history returned successfully' })
  async getComplianceHistory(
    @GetOrgFromRequest() org: Organization,
    @Query('days') days?: string
  ): Promise<ComplianceHistory> {
    let period: 7 | 14 | 30 = 7;

    if (days === '14') {
      period = 14;
    } else if (days === '30') {
      period = 30;
    }

    return this._policyComplianceService.getComplianceHistory(org.id, period);
  }

  /**
   * Get all policy rules
   */
  @Get('/policies')
  @ApiOperation({ summary: 'Get list of all policy rules' })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['partner_monetization', 'content_monetization'],
    description: 'Filter by policy category',
  })
  @ApiResponse({ status: 200, description: 'Policy rules list' })
  getPolicies(
    @Query('category') category?: string
  ): Array<{
    id: string;
    category?: PolicyCategory;
    name: string;
    description: string;
    severity: string;
  }> {
    if (category === 'partner_monetization' || category === 'content_monetization') {
      return this._policyComplianceService.getPoliciesByCategory(category);
    }
    return this._policyComplianceService.getPolicies();
  }
}
