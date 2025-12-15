import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { NotificationService } from './notification.service';
import { AlertType, AlertSeverity } from '@prisma/client';

interface AlertData {
  id: string;
  organizationId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
}

@Injectable()
export class AlertNotificationService {
  constructor(
    private _prismaService: PrismaService,
    private _notificationService: NotificationService
  ) {}

  async sendAlertNotification(alert: AlertData) {
    const preferences = await this.getNotificationPreferences(alert.organizationId);

    for (const pref of preferences) {
      if (!this.shouldSendNotification(pref, alert)) {
        continue;
      }

      // Send in-app notification
      if (pref.inAppEnabled) {
        await this.sendInAppNotification(alert);
      }

      // Send email notification
      if (pref.emailEnabled && this._notificationService.hasEmailProvider()) {
        await this.sendEmailNotification(alert, pref.userId);
      }
    }
  }

  private shouldSendNotification(
    pref: any,
    alert: AlertData
  ): boolean {
    // Check alert type
    if (alert.type === AlertType.KPI_DROP && !pref.kpiDropEnabled) {
      return false;
    }
    if (alert.type === AlertType.VIRAL_SPIKE && !pref.viralSpikeEnabled) {
      return false;
    }

    // Check severity
    if (alert.severity === AlertSeverity.CRITICAL && !pref.criticalEnabled) {
      return false;
    }
    if (alert.severity === AlertSeverity.WARNING && !pref.warningEnabled) {
      return false;
    }
    if (alert.severity === AlertSeverity.INFO && !pref.infoEnabled) {
      return false;
    }

    return true;
  }

  private async sendInAppNotification(alert: AlertData) {
    const content = this.formatInAppContent(alert);
    await this._notificationService.inAppNotification(
      alert.organizationId,
      alert.title,
      content,
      false, // Don't send email here, we handle it separately
      false
    );
  }

  private async sendEmailNotification(alert: AlertData, userId: string) {
    const user = await this._prismaService.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) return;

    const subject = this.formatEmailSubject(alert);
    const html = this.formatEmailHtml(alert);

    await this._notificationService.sendEmail(user.email, subject, html);
  }

  private formatInAppContent(alert: AlertData): string {
    const icon = alert.type === AlertType.VIRAL_SPIKE ? '🔥' : '⚠️';
    return `${icon} ${alert.title}: ${alert.message}`;
  }

  private formatEmailSubject(alert: AlertData): string {
    const prefix = alert.type === AlertType.VIRAL_SPIKE ? '🔥 Viral' : '⚠️ Alert';
    return `${prefix}: ${alert.title}`;
  }

  private formatEmailHtml(alert: AlertData): string {
    const isViral = alert.type === AlertType.VIRAL_SPIKE;
    const color = isViral ? '#22c55e' : this.getSeverityColor(alert.severity);
    const icon = isViral ? '🔥' : this.getSeverityIcon(alert.severity);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #1a1a2e; color: #ffffff; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #16213e; border-radius: 12px; overflow: hidden;">
    <div style="background-color: ${color}; padding: 20px; text-align: center;">
      <span style="font-size: 48px;">${icon}</span>
      <h1 style="margin: 10px 0 0; color: #ffffff; font-size: 24px;">${alert.title}</h1>
    </div>
    
    <div style="padding: 30px;">
      <p style="color: #a0aec0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        ${alert.message}
      </p>
      
      <div style="display: flex; justify-content: space-between; background-color: #0f3460; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="text-align: center; flex: 1;">
          <div style="color: #a0aec0; font-size: 12px; margin-bottom: 5px;">Previous</div>
          <div style="color: #ffffff; font-size: 20px; font-weight: bold;">${this.formatValue(alert.previousValue)}</div>
        </div>
        <div style="text-align: center; flex: 1;">
          <div style="color: #a0aec0; font-size: 12px; margin-bottom: 5px;">Current</div>
          <div style="color: ${color}; font-size: 20px; font-weight: bold;">${this.formatValue(alert.currentValue)}</div>
        </div>
        <div style="text-align: center; flex: 1;">
          <div style="color: #a0aec0; font-size: 12px; margin-bottom: 5px;">Change</div>
          <div style="color: ${color}; font-size: 20px; font-weight: bold;">${alert.changePercent > 0 ? '+' : ''}${alert.changePercent.toFixed(1)}%</div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/alerts" 
           style="display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
          View Details
        </a>
      </div>
    </div>
    
    <div style="background-color: #0f3460; padding: 15px; text-align: center;">
      <p style="color: #a0aec0; font-size: 12px; margin: 0;">
        You received this email because you have alert notifications enabled.
        <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/settings/notifications" style="color: ${color};">Manage preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '#ef4444';
      case AlertSeverity.WARNING:
        return '#f59e0b';
      case AlertSeverity.INFO:
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  }

  private getSeverityIcon(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '🚨';
      case AlertSeverity.WARNING:
        return '⚠️';
      case AlertSeverity.INFO:
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  private formatValue(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  }

  async getNotificationPreferences(organizationId: string) {
    const prefs = await this._prismaService.notificationPreferences.findMany({
      where: { organizationId },
    });

    // If no preferences exist, return default for all users in org
    if (prefs.length === 0) {
      const userOrgs = await this._prismaService.userOrganization.findMany({
        where: { organizationId },
        select: { userId: true },
      });

      // Create default preferences for each user
      const defaultPrefs = [];
      for (const userOrg of userOrgs) {
        const created = await this._prismaService.notificationPreferences.create({
          data: {
            organizationId,
            userId: userOrg.userId,
            emailEnabled: true,
            inAppEnabled: true,
            kpiDropEnabled: true,
            viralSpikeEnabled: true,
            criticalEnabled: true,
            warningEnabled: true,
            infoEnabled: false,
            digestEnabled: false,
            digestFrequency: 'daily',
          },
        });
        defaultPrefs.push(created);
      }

      return defaultPrefs;
    }

    return prefs;
  }

  async getUserNotificationPreferences(organizationId: string, userId: string) {
    let pref = await this._prismaService.notificationPreferences.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!pref) {
      pref = await this._prismaService.notificationPreferences.create({
        data: {
          organizationId,
          userId,
          emailEnabled: true,
          inAppEnabled: true,
          kpiDropEnabled: true,
          viralSpikeEnabled: true,
          criticalEnabled: true,
          warningEnabled: true,
          infoEnabled: false,
          digestEnabled: false,
          digestFrequency: 'daily',
        },
      });
    }

    return pref;
  }

  async updateNotificationPreferences(
    organizationId: string,
    userId: string,
    data: {
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
    return this._prismaService.notificationPreferences.upsert({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      update: data,
      create: {
        organizationId,
        userId,
        emailEnabled: data.emailEnabled ?? true,
        inAppEnabled: data.inAppEnabled ?? true,
        kpiDropEnabled: data.kpiDropEnabled ?? true,
        viralSpikeEnabled: data.viralSpikeEnabled ?? true,
        criticalEnabled: data.criticalEnabled ?? true,
        warningEnabled: data.warningEnabled ?? true,
        infoEnabled: data.infoEnabled ?? false,
        digestEnabled: data.digestEnabled ?? false,
        digestFrequency: data.digestFrequency ?? 'daily',
      },
    });
  }
}
