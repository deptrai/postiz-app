import { Controller, Get, Put, Body } from '@nestjs/common';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { NotificationService } from '@gitroom/nestjs-libraries/database/prisma/notifications/notification.service';
import { AlertNotificationService } from '@gitroom/nestjs-libraries/database/prisma/notifications/alert-notification.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('/notifications')
export class NotificationsController {
  constructor(
    private _notificationsService: NotificationService,
    private _alertNotificationService: AlertNotificationService
  ) {}

  @Get('/')
  async mainPageList(
    @GetUserFromRequest() user: User,
    @GetOrgFromRequest() organization: Organization
  ) {
    return this._notificationsService.getMainPageCount(
      organization.id,
      user.id
    );
  }

  @Get('/list')
  async notifications(
    @GetUserFromRequest() user: User,
    @GetOrgFromRequest() organization: Organization
  ) {
    return this._notificationsService.getNotifications(
      organization.id,
      user.id
    );
  }

  // Story 8.3: Notification Preferences API

  @Get('/preferences')
  async getPreferences(
    @GetUserFromRequest() user: User,
    @GetOrgFromRequest() organization: Organization
  ) {
    return this._alertNotificationService.getUserNotificationPreferences(
      organization.id,
      user.id
    );
  }

  @Put('/preferences')
  async updatePreferences(
    @GetUserFromRequest() user: User,
    @GetOrgFromRequest() organization: Organization,
    @Body() body: {
      emailEnabled?: boolean;
      inAppEnabled?: boolean;
      kpiDropEnabled?: boolean;
      viralSpikeEnabled?: boolean;
      criticalEnabled?: boolean;
      warningEnabled?: boolean;
      infoEnabled?: boolean;
      digestEnabled?: boolean;
      digestFrequency?: string;
    }
  ) {
    return this._alertNotificationService.updateNotificationPreferences(
      organization.id,
      user.id,
      body
    );
  }
}
