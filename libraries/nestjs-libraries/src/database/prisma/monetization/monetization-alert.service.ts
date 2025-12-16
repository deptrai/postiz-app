import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AlertType, AlertSeverity } from '@prisma/client';

interface MilestoneAlert {
  feature: string;
  metric: string;
  progress: number;
  milestone: 80 | 90 | 100;
  previousProgress?: number;
}

interface ProgressDropAlert {
  feature: string;
  metric: string;
  currentProgress: number;
  previousProgress: number;
  dropPercent: number;
}

@Injectable()
export class MonetizationAlertService {
  private readonly logger = new Logger(MonetizationAlertService.name);

  // Store last known progress for each org to detect drops
  private progressCache = new Map<string, any>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check monetization milestones and create alerts
   * Called by scheduled job daily
   */
  async checkMonetizationMilestones(organizationId: string): Promise<void> {
    this.logger.log(`Checking monetization milestones for org: ${organizationId}`);

    // Get current monetization status
    const currentStatus = await this.getCurrentMonetizationStatus(organizationId);
    
    // Get previous status from cache or database
    const previousStatus = await this.getPreviousMonetizationStatus(organizationId);

    // Check for milestone alerts (80%, 90%, 100%)
    const milestoneAlerts = this.detectMilestoneAlerts(currentStatus, previousStatus);
    
    // Check for progress drop alerts
    const dropAlerts = this.detectProgressDrops(currentStatus, previousStatus);

    // Create alerts in database
    for (const alert of milestoneAlerts) {
      await this.createMilestoneAlert(organizationId, alert);
    }

    for (const alert of dropAlerts) {
      await this.createProgressDropAlert(organizationId, alert);
    }

    // Update cache
    this.progressCache.set(organizationId, currentStatus);
    
    this.logger.log(`Created ${milestoneAlerts.length} milestone alerts and ${dropAlerts.length} drop alerts`);
  }

  /**
   * Get current monetization status for an organization
   */
  private async getCurrentMonetizationStatus(organizationId: string) {
    // Calculate progress for each feature
    const features = ['In-Stream Ads', 'Reels', 'Stars', 'Fan Subscription'];
    const status: any = {};

    for (const feature of features) {
      const progress = await this.calculateFeatureProgress(organizationId, feature);
      status[feature] = progress;
    }

    return status;
  }

  /**
   * Calculate progress percentage for a specific feature
   */
  private async calculateFeatureProgress(organizationId: string, feature: string): Promise<any> {
    // Thresholds based on Story 13.1
    const thresholds: any = {
      'In-Stream Ads': { followers: 10000, oneMinuteViews: 30000 },
      'Reels': { viewedMinutes: 600000, videosCount: 5 },
      'Stars': { followers: 500 },
      'Fan Subscription': { followers: 10000, watchedMinutes: 180000, engagements: 50000 },
    };

    const required = thresholds[feature];
    if (!required) return { feature, progress: 0, metrics: {} };

    // Get current metrics from analytics
    const metrics: any = {};
    let totalProgress = 0;
    let metricCount = 0;

    for (const [metricName, threshold] of Object.entries(required)) {
      const currentValue = await this.getMetricValue(organizationId, metricName);
      const progress = Math.min(100, (currentValue / (threshold as number)) * 100);
      
      metrics[metricName] = {
        current: currentValue,
        required: threshold,
        progress: progress,
      };

      totalProgress += progress;
      metricCount++;
    }

    const overallProgress = metricCount > 0 ? totalProgress / metricCount : 0;

    return {
      feature,
      progress: overallProgress,
      metrics,
    };
  }

  /**
   * Get current value for a metric
   */
  private async getMetricValue(organizationId: string, metricName: string): Promise<number> {
    // Map metric names to database fields
    const metricMap: any = {
      followers: 'followers',
      oneMinuteViews: 'oneMinuteViews',
      viewedMinutes: 'viewedMinutes',
      watchedMinutes: 'watchedMinutes',
      engagements: 'engagements',
      videosCount: 'videosCount',
    };

    const field = metricMap[metricName];
    if (!field) return 0;

    if (field === 'videosCount') {
      // Count videos from analytics content
      const count = await this.prisma.analyticsContent.count({
        where: { organizationId },
      });
      return count;
    }

    // Sum metric values from analytics
    const result = await this.prisma.analyticsMetric.aggregate({
      where: {
        organizationId,
        metricType: field,
      },
      _sum: {
        metricValue: true,
      },
    });

    return result._sum.metricValue || 0;
  }

  /**
   * Get previous monetization status from database
   */
  private async getPreviousMonetizationStatus(organizationId: string) {
    // Check cache first
    if (this.progressCache.has(organizationId)) {
      return this.progressCache.get(organizationId);
    }

    // If not in cache, return empty (first run)
    return {};
  }

  /**
   * Detect milestone alerts (80%, 90%, 100%)
   */
  private detectMilestoneAlerts(currentStatus: any, previousStatus: any): MilestoneAlert[] {
    const alerts: MilestoneAlert[] = [];

    for (const [feature, current] of Object.entries(currentStatus)) {
      const previous = previousStatus[feature] || { progress: 0 };
      const currentProgress = (current as any).progress;
      const previousProgress = previous.progress || 0;

      // Check 80% milestone
      if (currentProgress >= 80 && previousProgress < 80) {
        alerts.push({
          feature,
          metric: 'overall',
          progress: currentProgress,
          milestone: 80,
          previousProgress,
        });
      }

      // Check 90% milestone
      if (currentProgress >= 90 && previousProgress < 90) {
        alerts.push({
          feature,
          metric: 'overall',
          progress: currentProgress,
          milestone: 90,
          previousProgress,
        });
      }

      // Check 100% milestone
      if (currentProgress >= 100 && previousProgress < 100) {
        alerts.push({
          feature,
          metric: 'overall',
          progress: currentProgress,
          milestone: 100,
          previousProgress,
        });
      }
    }

    return alerts;
  }

  /**
   * Detect progress drops
   */
  private detectProgressDrops(currentStatus: any, previousStatus: any): ProgressDropAlert[] {
    const alerts: ProgressDropAlert[] = [];
    const dropThreshold = 10; // Alert if progress drops by 10% or more

    for (const [feature, current] of Object.entries(currentStatus)) {
      const previous = previousStatus[feature];
      if (!previous) continue; // Skip if no previous data

      const currentProgress = (current as any).progress;
      const previousProgress = previous.progress;

      const drop = previousProgress - currentProgress;

      if (drop >= dropThreshold) {
        alerts.push({
          feature,
          metric: 'overall',
          currentProgress,
          previousProgress,
          dropPercent: drop,
        });
      }
    }

    return alerts;
  }

  /**
   * Create milestone alert in database
   */
  private async createMilestoneAlert(organizationId: string, alert: MilestoneAlert): Promise<void> {
    // Check user preferences
    const preferences = await this.getUserPreferences(organizationId);
    if (!preferences.monetizationMilestoneEnabled) {
      this.logger.log(`Milestone alerts disabled for org: ${organizationId}`);
      return;
    }

    let severity: AlertSeverity;
    let title: string;
    let message: string;

    if (alert.milestone === 100) {
      severity = AlertSeverity.INFO;
      title = `🎉 Congratulations! ${alert.feature} Eligible`;
      message = `You're now eligible for ${alert.feature}! You've reached 100% of the requirements.`;
    } else if (alert.milestone === 90) {
      severity = AlertSeverity.WARNING;
      title = `So Close! ${alert.feature}`;
      message = `Just 10% more to unlock ${alert.feature}. You're at ${alert.progress.toFixed(1)}% progress.`;
    } else {
      severity = AlertSeverity.INFO;
      title = `Almost There! ${alert.feature}`;
      message = `You're 80% of the way to ${alert.feature}. Keep up the great work!`;
    }

    await this.prisma.alert.create({
      data: {
        organizationId,
        type: AlertType.MONETIZATION_MILESTONE,
        severity,
        metric: 'monetization_progress',
        currentValue: alert.progress,
        previousValue: alert.previousProgress || 0,
        changePercent: alert.progress - (alert.previousProgress || 0),
        threshold: alert.milestone,
        title,
        message,
        suggestions: this.getMilestoneSuggestions(alert),
        periodStart: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        periodEnd: new Date(),
      },
    });

    this.logger.log(`Created milestone alert: ${title}`);
  }

  /**
   * Create progress drop alert in database
   */
  private async createProgressDropAlert(organizationId: string, alert: ProgressDropAlert): Promise<void> {
    // Check user preferences
    const preferences = await this.getUserPreferences(organizationId);
    if (!preferences.monetizationMilestoneEnabled || !preferences.warningEnabled) {
      return;
    }

    const title = `⚠️ Warning: ${alert.feature} Progress Dropped`;
    const message = `Your progress towards ${alert.feature} has dropped by ${alert.dropPercent.toFixed(1)}%. Take action to maintain your progress.`;

    await this.prisma.alert.create({
      data: {
        organizationId,
        type: AlertType.MONETIZATION_MILESTONE,
        severity: AlertSeverity.WARNING,
        metric: 'monetization_progress',
        currentValue: alert.currentProgress,
        previousValue: alert.previousProgress,
        changePercent: -(alert.dropPercent),
        threshold: 0,
        title,
        message,
        suggestions: this.getDropSuggestions(alert),
        periodStart: new Date(Date.now() - 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
      },
    });

    this.logger.log(`Created progress drop alert: ${title}`);
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(organizationId: string) {
    let preferences = await this.prisma.notificationPreferences.findFirst({
      where: { organizationId },
    });

    if (!preferences) {
      // Create default preferences
      preferences = await this.prisma.notificationPreferences.create({
        data: {
          organizationId,
          userId: 'system', // TODO: Get actual user ID
        },
      });
    }

    // Cast to any to handle optional new field
    return preferences as any;
  }

  /**
   * Get suggestions for milestone alerts
   */
  private getMilestoneSuggestions(alert: MilestoneAlert): string[] {
    if (alert.milestone === 100) {
      return [
        `Start monetizing your content with ${alert.feature}`,
        'Review monetization dashboard for next steps',
        'Maintain your metrics to keep eligibility',
      ];
    } else if (alert.milestone === 90) {
      return [
        'Just a little more to go!',
        'Check recommendations for tips to reach 100%',
        'Review gap analysis to see what\'s needed',
      ];
    } else {
      return [
        'You\'re making great progress!',
        'Check recommendations for optimization tips',
        'Stay consistent with your posting schedule',
      ];
    }
  }

  /**
   * Get suggestions for progress drop alerts
   */
  private getDropSuggestions(alert: ProgressDropAlert): string[] {
    return [
      'Review your recent content performance',
      'Check engagement metrics and adjust strategy',
      'Increase posting frequency if needed',
      'Review recommendations panel for guidance',
    ];
  }
}
