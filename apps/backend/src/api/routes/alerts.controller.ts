import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization, AlertSeverity } from '@prisma/client';
import { AlertService } from '@gitroom/nestjs-libraries/database/prisma/alerts/alert.service';

@ApiTags('Alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  async getAlerts(
    @GetOrgFromRequest() org: Organization,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('severity') severity?: AlertSeverity,
    @Query('integrationId') integrationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.alertService.getAlerts(org.id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      isRead: unreadOnly === 'true' ? false : undefined,
      severity,
      integrationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@GetOrgFromRequest() org: Organization) {
    const count = await this.alertService.getUnreadCount(org.id);
    return { count };
  }

  @Get('config')
  async getAlertConfig(@GetOrgFromRequest() org: Organization) {
    return this.alertService.getAlertConfig(org.id);
  }

  @Put('config')
  async updateAlertConfig(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { metric: string; threshold?: number; enabled?: boolean }
  ) {
    return this.alertService.updateAlertConfig(org.id, body.metric, {
      threshold: body.threshold,
      enabled: body.enabled,
    });
  }

  @Get(':id')
  async getAlert(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.alertService.getAlert(id, org.id);
  }

  @Post(':id/read')
  async markAsRead(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    await this.alertService.markAsRead(id, org.id);
    return { success: true };
  }

  @Post('mark-all-read')
  async markAllAsRead(@GetOrgFromRequest() org: Organization) {
    await this.alertService.markAllAsRead(org.id);
    return { success: true };
  }

  @Post('check')
  async checkKPIDrops(@GetOrgFromRequest() org: Organization) {
    const alerts = await this.alertService.processKPIDropAlerts(org.id);
    return { alerts, count: alerts.length };
  }

  @Post(':id/delete')
  async deleteAlert(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    await this.alertService.deleteAlert(id, org.id);
    return { success: true };
  }

  // ==================== VIRAL SPIKE ENDPOINTS (Story 8.2) ====================

  @Post('check-viral')
  async checkViralSpikes(@GetOrgFromRequest() org: Organization) {
    const alerts = await this.alertService.processViralSpikes(org.id);
    return { alerts, count: alerts.length };
  }

  @Get('viral-history')
  async getViralHistory(
    @GetOrgFromRequest() org: Organization,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('integrationId') integrationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.alertService.getViralHistory(org.id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      integrationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }
}
