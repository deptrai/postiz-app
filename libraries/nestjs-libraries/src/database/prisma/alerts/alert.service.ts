import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { AlertType, AlertSeverity } from '@prisma/client';
import { AlertNotificationService } from '@gitroom/nestjs-libraries/database/prisma/notifications/alert-notification.service';

// Metric field mapping for AnalyticsDailyMetric
const METRIC_FIELDS = ['reach', 'impressions', 'reactions', 'comments', 'shares', 'videoViews', 'clicks'] as const;
type MetricField = typeof METRIC_FIELDS[number];

@Injectable()
export class AlertService {
  constructor(
    private _prismaService: PrismaService,
    @Inject(forwardRef(() => AlertNotificationService))
    private _alertNotificationService?: AlertNotificationService
  ) {}

  async checkKPIDrops(organizationId: string, integrationId?: string) {
    const now = new Date();
    const currentPeriodEnd = now;
    const currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = currentPeriodStart;
    const previousPeriodStart = new Date(previousPeriodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const configs = await this.getAlertConfig(organizationId);
    const enabledConfigs = configs.filter(c => c.enabled);

    if (enabledConfigs.length === 0) {
      return [];
    }

    const whereClause: any = {
      organizationId,
      deletedAt: null,
    };

    if (integrationId) {
      whereClause.integrationId = integrationId;
    }

    const currentMetrics = await this._prismaService.analyticsDailyMetric.findMany({
      where: {
        ...whereClause,
        date: {
          gte: currentPeriodStart,
          lte: currentPeriodEnd,
        },
      },
    });

    const previousMetrics = await this._prismaService.analyticsDailyMetric.findMany({
      where: {
        ...whereClause,
        date: {
          gte: previousPeriodStart,
          lt: previousPeriodEnd,
        },
      },
    });

    // Group and average metrics by integration
    const currentGrouped = this.groupMetricsByIntegration(currentMetrics);
    const previousGrouped = this.groupMetricsByIntegration(previousMetrics);

    const alerts = [];

    for (const intId of Object.keys(currentGrouped)) {
      const currentAvg = currentGrouped[intId];
      const previousAvg = previousGrouped[intId];

      if (!previousAvg) continue;

      // Check each metric field
      for (const metricField of METRIC_FIELDS) {
        const currentValue = currentAvg[metricField];
        const previousValue = previousAvg[metricField];

        if (!previousValue || previousValue === 0 || !currentValue) continue;

        const changePercent = ((currentValue - previousValue) / previousValue) * 100;

        // Map field name to config metric name
        const metricName = this.fieldToMetricName(metricField);
        const metricConfig = enabledConfigs.find(c => c.metric === metricName);
        if (!metricConfig) continue;

        if (changePercent <= -metricConfig.threshold) {
          const severity = this.getSeverity(changePercent);
          const suggestions = this.getSuggestions(metricName, changePercent);

          const alert = await this.createAlert({
            organizationId,
            integrationId: intId,
            type: AlertType.KPI_DROP,
            severity,
            metric: metricName,
            currentValue,
            previousValue,
            changePercent,
            threshold: metricConfig.threshold,
            periodStart: currentPeriodStart,
            periodEnd: currentPeriodEnd,
            suggestions,
          });

          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  private fieldToMetricName(field: MetricField): string {
    const mapping: Record<MetricField, string> = {
      reach: 'reach',
      impressions: 'impressions',
      reactions: 'engagement_rate',
      comments: 'comments',
      shares: 'shares',
      videoViews: 'views',
      clicks: 'clicks',
    };
    return mapping[field] || field;
  }

  private groupMetricsByIntegration(metrics: any[]) {
    const grouped: Record<string, Record<MetricField, number>> = {};

    for (const m of metrics) {
      if (!grouped[m.integrationId]) {
        grouped[m.integrationId] = {
          reach: 0,
          impressions: 0,
          reactions: 0,
          comments: 0,
          shares: 0,
          videoViews: 0,
          clicks: 0,
        };
      }

      for (const field of METRIC_FIELDS) {
        if (m[field] !== null && m[field] !== undefined) {
          grouped[m.integrationId][field] += m[field];
        }
      }
    }

    // Calculate averages
    const counts: Record<string, number> = {};
    for (const m of metrics) {
      counts[m.integrationId] = (counts[m.integrationId] || 0) + 1;
    }

    for (const intId of Object.keys(grouped)) {
      const count = counts[intId] || 1;
      for (const field of METRIC_FIELDS) {
        grouped[intId][field] = grouped[intId][field] / count;
      }
    }

    return grouped;
  }

  async processKPIDropAlerts(organizationId: string) {
    const integrations = await this._prismaService.integration.findMany({
      where: {
        organizationId,
        deletedAt: null,
        disabled: false,
      },
      select: {
        id: true,
      },
    });

    const allAlerts = [];

    for (const integration of integrations) {
      const alerts = await this.checkKPIDrops(organizationId, integration.id);
      allAlerts.push(...alerts);
    }

    return allAlerts;
  }

  private getSeverity(changePercent: number): AlertSeverity {
    const absChange = Math.abs(changePercent);
    
    if (absChange >= 50) {
      return AlertSeverity.CRITICAL;
    } else if (absChange >= 30) {
      return AlertSeverity.WARNING;
    } else {
      return AlertSeverity.INFO;
    }
  }

  private getMetricThreshold(metric: string): number {
    const thresholds: Record<string, number> = {
      engagement_rate: 20,
      reach: 30,
      views: 25,
      likes: 25,
      comments: 30,
      shares: 30,
      impressions: 25,
      clicks: 30,
    };

    return thresholds[metric] || 20;
  }

  private getSuggestions(metric: string, changePercent: number): string[] {
    const suggestions: string[] = [];
    const absChange = Math.abs(changePercent);

    if (metric === 'engagement_rate') {
      suggestions.push('Review recent post content quality and relevance');
      suggestions.push('Analyze posting times and adjust schedule');
      suggestions.push('Check if hashtags are still effective');
      if (absChange >= 40) {
        suggestions.push('URGENT: Consider content audit and strategy review');
      }
    } else if (metric === 'reach') {
      suggestions.push('Optimize hashtag strategy');
      suggestions.push('Post during peak audience activity times');
      suggestions.push('Increase posting frequency');
      if (absChange >= 40) {
        suggestions.push('URGENT: Review algorithm changes and adjust content');
      }
    } else if (metric === 'views') {
      suggestions.push('Improve thumbnail quality and appeal');
      suggestions.push('Optimize video hooks in first 3 seconds');
      suggestions.push('Review title and description SEO');
      if (absChange >= 40) {
        suggestions.push('URGENT: Analyze top-performing content and replicate');
      }
    } else {
      suggestions.push(`Review ${metric} performance trends`);
      suggestions.push('Compare with industry benchmarks');
      suggestions.push('Test different content formats');
    }

    return suggestions;
  }

  async createAlert(data: {
    organizationId: string;
    integrationId?: string;
    groupId?: string;
    type: AlertType;
    severity: AlertSeverity;
    metric: string;
    currentValue: number;
    previousValue: number;
    changePercent: number;
    threshold: number;
    periodStart: Date;
    periodEnd: Date;
    suggestions: string[];
  }) {
    const title = this.generateAlertTitle(data.metric, data.changePercent, data.severity);
    const message = this.generateAlertMessage(data);

    const existingAlert = await this._prismaService.alert.findFirst({
      where: {
        organizationId: data.organizationId,
        integrationId: data.integrationId,
        metric: data.metric,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        deletedAt: null,
      },
    });

    if (existingAlert) {
      return existingAlert;
    }

    const alert = await this._prismaService.alert.create({
      data: {
        organizationId: data.organizationId,
        integrationId: data.integrationId,
        groupId: data.groupId,
        type: data.type,
        severity: data.severity,
        metric: data.metric,
        currentValue: data.currentValue,
        previousValue: data.previousValue,
        changePercent: data.changePercent,
        threshold: data.threshold,
        title,
        message,
        suggestions: data.suggestions,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        isRead: false,
      },
    });

    // Send notification for new alert (Story 8.3)
    if (this._alertNotificationService) {
      try {
        await this._alertNotificationService.sendAlertNotification({
          id: alert.id,
          organizationId: alert.organizationId,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          metric: alert.metric,
          currentValue: alert.currentValue,
          previousValue: alert.previousValue,
          changePercent: alert.changePercent,
        });
      } catch (e) {
        console.error('Failed to send alert notification:', e);
      }
    }

    return alert;
  }

  private generateAlertTitle(metric: string, changePercent: number, severity: AlertSeverity): string {
    const metricLabel = metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const change = Math.abs(changePercent).toFixed(1);
    
    if (severity === AlertSeverity.CRITICAL) {
      return `Critical: ${metricLabel} dropped ${change}%`;
    } else if (severity === AlertSeverity.WARNING) {
      return `Warning: ${metricLabel} down ${change}%`;
    } else {
      return `Notice: ${metricLabel} decreased ${change}%`;
    }
  }

  private generateAlertMessage(data: {
    metric: string;
    currentValue: number;
    previousValue: number;
    changePercent: number;
    periodStart: Date;
    periodEnd: Date;
  }): string {
    const metricLabel = data.metric.replace(/_/g, ' ');
    const change = Math.abs(data.changePercent).toFixed(1);
    const current = data.currentValue.toFixed(2);
    const previous = data.previousValue.toFixed(2);

    return `Your ${metricLabel} has dropped by ${change}% compared to the previous period. Current average: ${current}, Previous average: ${previous}. Review the suggestions below to improve performance.`;
  }

  async getAlerts(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      severity?: AlertSeverity;
      isRead?: boolean;
      integrationId?: string;
      groupId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (options?.severity) {
      where.severity = options.severity;
    }

    if (options?.isRead !== undefined) {
      where.isRead = options.isRead;
    }

    if (options?.integrationId) {
      where.integrationId = options.integrationId;
    }

    if (options?.groupId) {
      where.groupId = options.groupId;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const [alerts, total] = await Promise.all([
      this._prismaService.alert.findMany({
        where,
        orderBy: [
          { severity: 'asc' },
          { createdAt: 'desc' },
        ],
        take: options?.limit || 50,
        skip: options?.offset || 0,
        include: {
          integration: {
            select: {
              id: true,
              name: true,
              providerIdentifier: true,
            },
          },
        },
      }),
      this._prismaService.alert.count({ where }),
    ]);

    return {
      alerts,
      total,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    };
  }

  async getAlert(alertId: string, organizationId: string) {
    return this._prismaService.alert.findFirst({
      where: {
        id: alertId,
        organizationId,
        deletedAt: null,
      },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            providerIdentifier: true,
          },
        },
      },
    });
  }

  async markAsRead(alertId: string, organizationId: string) {
    return this._prismaService.alert.updateMany({
      where: {
        id: alertId,
        organizationId,
        deletedAt: null,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(organizationId: string) {
    return this._prismaService.alert.updateMany({
      where: {
        organizationId,
        isRead: false,
        deletedAt: null,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async deleteAlert(alertId: string, organizationId: string) {
    return this._prismaService.alert.updateMany({
      where: {
        id: alertId,
        organizationId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async getUnreadCount(organizationId: string) {
    return this._prismaService.alert.count({
      where: {
        organizationId,
        isRead: false,
        deletedAt: null,
      },
    });
  }

  async getAlertConfig(organizationId: string) {
    const configs = await this._prismaService.alertConfig.findMany({
      where: {
        organizationId,
      },
    });

    if (configs.length === 0) {
      const defaultMetrics = ['engagement_rate', 'reach', 'views', 'likes', 'comments'];
      const defaultConfigs = defaultMetrics.map(metric => ({
        organizationId,
        metric,
        threshold: this.getMetricThreshold(metric),
        enabled: true,
      }));

      await this._prismaService.alertConfig.createMany({
        data: defaultConfigs,
      });

      return this._prismaService.alertConfig.findMany({
        where: {
          organizationId,
        },
      });
    }

    return configs;
  }

  async updateAlertConfig(
    organizationId: string,
    metric: string,
    data: { threshold?: number; enabled?: boolean; groupId?: string }
  ) {
    const existing = await this._prismaService.alertConfig.findFirst({
      where: {
        organizationId,
        metric,
        groupId: data.groupId || null,
      },
    });

    if (existing) {
      return this._prismaService.alertConfig.update({
        where: {
          id: existing.id,
        },
        data,
      });
    } else {
      return this._prismaService.alertConfig.create({
        data: {
          organizationId,
          metric,
          threshold: data.threshold || this.getMetricThreshold(metric),
          enabled: data.enabled !== undefined ? data.enabled : true,
        },
      });
    }
  }

  // ==================== VIRAL SPIKE DETECTION (Story 8.2) ====================

  private readonly SPIKE_THRESHOLDS = {
    reactions: 200,      // >200% increase = viral engagement
    reach: 300,          // >300% increase = viral reach
    videoViews: 250,     // >250% increase = viral views
    impressions: 200,
    comments: 200,
    shares: 300,
  };

  async detectViralSpikes(organizationId: string, integrationId?: string) {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const previous24h = new Date(last24h.getTime() - 24 * 60 * 60 * 1000);

    const whereClause: any = {
      organizationId,
      deletedAt: null,
    };

    if (integrationId) {
      whereClause.integrationId = integrationId;
    }

    // Get metrics from last 24 hours
    const currentMetrics = await this._prismaService.analyticsDailyMetric.findMany({
      where: {
        ...whereClause,
        date: {
          gte: last24h,
          lte: now,
        },
      },
    });

    // Get metrics from previous 24 hours
    const previousMetrics = await this._prismaService.analyticsDailyMetric.findMany({
      where: {
        ...whereClause,
        date: {
          gte: previous24h,
          lt: last24h,
        },
      },
    });

    const currentGrouped = this.groupMetricsByIntegration(currentMetrics);
    const previousGrouped = this.groupMetricsByIntegration(previousMetrics);

    const viralAlerts = [];

    for (const intId of Object.keys(currentGrouped)) {
      const currentAvg = currentGrouped[intId];
      const previousAvg = previousGrouped[intId];

      if (!previousAvg) continue;

      for (const metricField of METRIC_FIELDS) {
        const currentValue = currentAvg[metricField];
        const previousValue = previousAvg[metricField];

        if (!previousValue || previousValue === 0 || !currentValue) continue;

        const changePercent = ((currentValue - previousValue) / previousValue) * 100;
        const threshold = this.SPIKE_THRESHOLDS[metricField as keyof typeof this.SPIKE_THRESHOLDS] || 200;

        // Check for positive spike (viral)
        if (changePercent >= threshold) {
          const metricName = this.fieldToMetricName(metricField);
          const recommendations = this.generateViralRecommendations(metricName, changePercent);

          const alert = await this.createViralAlert({
            organizationId,
            integrationId: intId,
            metric: metricName,
            currentValue,
            previousValue,
            changePercent,
            threshold,
            periodStart: last24h,
            periodEnd: now,
            recommendations,
          });

          viralAlerts.push(alert);
        }
      }
    }

    return viralAlerts;
  }

  private async createViralAlert(data: {
    organizationId: string;
    integrationId: string;
    metric: string;
    currentValue: number;
    previousValue: number;
    changePercent: number;
    threshold: number;
    periodStart: Date;
    periodEnd: Date;
    recommendations: string[];
  }) {
    const metricLabel = data.metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const change = data.changePercent.toFixed(0);

    const title = `🔥 Viral: ${metricLabel} spiked ${change}%`;
    const message = `Your ${metricLabel} has increased by ${change}% in the last 24 hours! This content is going viral. Current: ${data.currentValue.toFixed(0)}, Previous: ${data.previousValue.toFixed(0)}.`;

    // Check for existing viral alert for same metric/period
    const existingAlert = await this._prismaService.alert.findFirst({
      where: {
        organizationId: data.organizationId,
        integrationId: data.integrationId,
        type: AlertType.VIRAL_SPIKE,
        metric: data.metric,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        deletedAt: null,
      },
    });

    if (existingAlert) {
      return existingAlert;
    }

    const alert = await this._prismaService.alert.create({
      data: {
        organizationId: data.organizationId,
        integrationId: data.integrationId,
        type: AlertType.VIRAL_SPIKE,
        severity: AlertSeverity.INFO, // Viral is positive, use INFO
        metric: data.metric,
        currentValue: data.currentValue,
        previousValue: data.previousValue,
        changePercent: data.changePercent,
        threshold: data.threshold,
        title,
        message,
        suggestions: data.recommendations,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        isRead: false,
      },
    });

    // Send notification for viral alert (Story 8.3)
    if (this._alertNotificationService) {
      try {
        await this._alertNotificationService.sendAlertNotification({
          id: alert.id,
          organizationId: alert.organizationId,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          metric: alert.metric,
          currentValue: alert.currentValue,
          previousValue: alert.previousValue,
          changePercent: alert.changePercent,
        });
      } catch (e) {
        console.error('Failed to send viral alert notification:', e);
      }
    }

    return alert;
  }

  private generateViralRecommendations(metric: string, changePercent: number): string[] {
    const recommendations: string[] = [];

    recommendations.push('🎯 Capitalize on momentum - post follow-up content within 24h');
    recommendations.push('📊 Analyze what made this content successful');

    if (metric === 'engagement_rate' || metric === 'reactions') {
      recommendations.push('💬 Engage with comments to boost algorithm visibility');
      recommendations.push('🔄 Create similar content while topic is hot');
      recommendations.push('📢 Cross-post to other platforms');
    } else if (metric === 'reach' || metric === 'impressions') {
      recommendations.push('🏷️ Save the hashtags used - they are working');
      recommendations.push('⏰ Note the posting time for future reference');
      recommendations.push('👥 Consider boosting this post with ads');
    } else if (metric === 'views') {
      recommendations.push('🎬 Create a follow-up video on the same topic');
      recommendations.push('📌 Pin this content to your profile');
      recommendations.push('🔗 Add call-to-action to drive conversions');
    }

    if (changePercent >= 500) {
      recommendations.push('⚡ MEGA VIRAL: Consider live stream or Q&A session');
    }

    return recommendations;
  }

  async processViralSpikes(organizationId: string) {
    const integrations = await this._prismaService.integration.findMany({
      where: {
        organizationId,
        deletedAt: null,
        disabled: false,
      },
      select: {
        id: true,
      },
    });

    const allAlerts = [];

    for (const integration of integrations) {
      const alerts = await this.detectViralSpikes(organizationId, integration.id);
      allAlerts.push(...alerts);
    }

    return allAlerts;
  }

  async getViralHistory(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      integrationId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const where: any = {
      organizationId,
      type: AlertType.VIRAL_SPIKE,
      deletedAt: null,
    };

    if (options?.integrationId) {
      where.integrationId = options.integrationId;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const [viralAlerts, total] = await Promise.all([
      this._prismaService.alert.findMany({
        where,
        orderBy: [
          { changePercent: 'desc' },
          { createdAt: 'desc' },
        ],
        take: options?.limit || 20,
        skip: options?.offset || 0,
        include: {
          integration: {
            select: {
              id: true,
              name: true,
              providerIdentifier: true,
            },
          },
        },
      }),
      this._prismaService.alert.count({ where }),
    ]);

    // Calculate patterns
    const patterns = this.analyzeViralPatterns(viralAlerts);

    return {
      viralAlerts,
      total,
      patterns,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
    };
  }

  private analyzeViralPatterns(viralAlerts: any[]) {
    if (viralAlerts.length === 0) {
      return {
        topMetrics: [],
        avgSpikePercent: 0,
        totalViralEvents: 0,
      };
    }

    // Count metrics
    const metricCounts: Record<string, number> = {};
    let totalPercent = 0;

    for (const alert of viralAlerts) {
      metricCounts[alert.metric] = (metricCounts[alert.metric] || 0) + 1;
      totalPercent += alert.changePercent;
    }

    const topMetrics = Object.entries(metricCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([metric, count]) => ({ metric, count }));

    return {
      topMetrics,
      avgSpikePercent: Math.round(totalPercent / viralAlerts.length),
      totalViralEvents: viralAlerts.length,
    };
  }
}
