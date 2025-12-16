import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ExperimentTrackingService {
  constructor(private readonly _prismaService: PrismaService) {}

  /**
   * Track content for a specific experiment variant
   * AC3: Track performance metrics for each variant
   */
  async trackContent(
    experimentId: string,
    variantId: string,
    contentId: string,
    organizationId: string
  ) {
    // Verify experiment exists and belongs to organization
    const experiment = await this._prismaService.experiment.findFirst({
      where: {
        id: experimentId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!experiment) {
      throw new NotFoundException('Experiment not found');
    }

    // Verify experiment variant exists
    const experimentVariant = await this._prismaService.experimentVariant.findFirst({
      where: {
        experimentId,
        variantId,
      },
    });

    if (!experimentVariant) {
      throw new NotFoundException('Variant not in this experiment');
    }

    // Verify content exists
    const content = await this._prismaService.analyticsContent.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Check if content already tracked
    const existing = await this._prismaService.experimentTrackedContent.findFirst({
      where: {
        experimentVariantId: experimentVariant.id,
        contentId,
      },
    });

    if (existing) {
      throw new BadRequestException('Content already tracked for this variant');
    }

    // Create tracked content record
    const trackedContent = await this._prismaService.experimentTrackedContent.create({
      data: {
        experimentVariantId: experimentVariant.id,
        contentId,
      },
      include: {
        content: true,
      },
    });

    // Update variant metrics after tracking new content
    await this.updateVariantMetrics(experimentVariant.id);

    return trackedContent;
  }

  /**
   * Update metrics for an experiment variant
   * Aggregates metrics from all tracked content
   */
  async updateVariantMetrics(experimentVariantId: string) {
    // Get all tracked content for this variant
    const trackedContents = await this._prismaService.experimentTrackedContent.findMany({
      where: {
        experimentVariantId,
      },
      include: {
        content: {
          include: {
            metrics: true,
          },
        },
      },
    });

    if (trackedContents.length === 0) {
      return;
    }

    // Calculate aggregate metrics
    let totalReach = 0;
    let totalEngagement = 0;
    let totalEngagementRate = 0;

    for (const tracked of trackedContents) {
      const content = tracked.content;
      const metrics = content.metrics || [];
      
      // Get latest metrics for each type
      let reach = 0;
      let likes = 0;
      let comments = 0;
      let shares = 0;

      for (const metric of metrics) {
        if (metric.metricType === 'reach') {
          reach = Math.max(reach, metric.metricValue);
        } else if (metric.metricType === 'likes') {
          likes = Math.max(likes, metric.metricValue);
        } else if (metric.metricType === 'comments') {
          comments = Math.max(comments, metric.metricValue);
        } else if (metric.metricType === 'shares') {
          shares = Math.max(shares, metric.metricValue);
        }
      }
      
      // Sum reach
      totalReach += reach;
      
      // Sum engagement (likes + comments + shares)
      const engagement = likes + comments + shares;
      totalEngagement += engagement;
      
      // Calculate engagement rate for this content
      if (reach > 0) {
        const engagementRate = (engagement / reach) * 100;
        totalEngagementRate += engagementRate;
      }
    }

    // Calculate average engagement rate
    const avgEngagementRate = trackedContents.length > 0
      ? totalEngagementRate / trackedContents.length
      : 0;

    // Update experiment variant with aggregated metrics
    await this._prismaService.experimentVariant.update({
      where: { id: experimentVariantId },
      data: {
        totalReach,
        totalEngagement,
        contentCount: trackedContents.length,
        avgEngagementRate,
      },
    });

    return {
      totalReach,
      totalEngagement,
      contentCount: trackedContents.length,
      avgEngagementRate,
    };
  }

  /**
   * Get tracked content for an experiment variant
   */
  async getTrackedContent(experimentVariantId: string) {
    const trackedContents = await this._prismaService.experimentTrackedContent.findMany({
      where: {
        experimentVariantId,
      },
      include: {
        content: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return trackedContents;
  }

  /**
   * Remove tracked content from experiment variant
   */
  async untrackContent(
    experimentVariantId: string,
    contentId: string
  ) {
    const trackedContent = await this._prismaService.experimentTrackedContent.findFirst({
      where: {
        experimentVariantId,
        contentId,
      },
    });

    if (!trackedContent) {
      throw new NotFoundException('Tracked content not found');
    }

    await this._prismaService.experimentTrackedContent.delete({
      where: { id: trackedContent.id },
    });

    // Update metrics after removing content
    await this.updateVariantMetrics(experimentVariantId);

    return { success: true, message: 'Content untracked' };
  }
}
