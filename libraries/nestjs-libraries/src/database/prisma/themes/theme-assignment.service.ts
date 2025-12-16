import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { ThemeClusteringService } from './theme-clustering.service';

@Injectable()
export class ThemeAssignmentService {
  private readonly logger = new Logger(ThemeAssignmentService.name);

  constructor(
    private _prismaService: PrismaService,
    private _clusteringService: ThemeClusteringService
  ) {}

  /**
   * Assign new content to existing themes based on keyword similarity
   * Called after content ingestion
   */
  async assignNewContent(contentId: string): Promise<void> {
    try {
      const content = await this._prismaService.analyticsContent.findUnique({
        where: { id: contentId },
        select: {
          id: true,
          organizationId: true,
          caption: true,
          hashtags: true,
        },
      });

      if (!content) {
        this.logger.warn(`Content ${contentId} not found for theme assignment`);
        return;
      }

      // Extract keywords from content
      const contentKeywords = this._clusteringService.extractKeywords(
        content.caption,
        content.hashtags
      );

      if (contentKeywords.length === 0) {
        this.logger.debug(`Content ${contentId} has no keywords, skipping theme assignment`);
        return;
      }

      // Find existing themes
      const themes = await this._prismaService.theme.findMany({
        where: {
          organizationId: content.organizationId,
          deletedAt: null,
        },
        select: {
          id: true,
          keywords: true,
        },
      });

      if (themes.length === 0) {
        this.logger.debug(`No themes found for org ${content.organizationId}`);
        return;
      }

      // Find best matching theme
      let bestTheme: any = null;
      let bestSimilarity = 0;
      const similarityThreshold = 0.3;

      for (const theme of themes) {
        const themeKeywords = Array.isArray(theme.keywords) 
          ? (theme.keywords as string[])
          : [];

        const similarity = this.calculateJaccardSimilarity(
          contentKeywords,
          themeKeywords
        );

        if (similarity > bestSimilarity && similarity >= similarityThreshold) {
          bestSimilarity = similarity;
          bestTheme = theme;
        }
      }

      if (bestTheme) {
        // Check if already assigned
        const existing = await this._prismaService.themeContent.findFirst({
          where: {
            themeId: bestTheme.id,
            contentId,
          },
        });

        if (!existing) {
          await this.assignContentToTheme(contentId, bestTheme.id);
          this.logger.log(
            `Auto-assigned content ${contentId} to theme ${bestTheme.id} (similarity: ${bestSimilarity.toFixed(2)})`
          );
        }
      } else {
        this.logger.debug(
          `Content ${contentId} did not match any theme (best similarity: ${bestSimilarity.toFixed(2)})`
        );
      }
    } catch (error) {
      this.logger.error(`Failed to assign content ${contentId}: ${(error as Error).message}`);
    }
  }

  /**
   * Manually assign content to theme
   */
  async assignContentToTheme(contentId: string, themeId: string): Promise<void> {
    // Check if already assigned
    const existing = await this._prismaService.themeContent.findFirst({
      where: {
        themeId,
        contentId,
      },
    });

    if (existing) {
      this.logger.debug(`Content ${contentId} already assigned to theme ${themeId}`);
      return;
    }

    // Create assignment
    await this._prismaService.themeContent.create({
      data: {
        themeId,
        contentId,
      },
    });

    // Update theme metrics
    await this.updateThemeMetrics(themeId);

    this.logger.log(`Assigned content ${contentId} to theme ${themeId}`);
  }

  /**
   * Remove content from theme
   */
  async removeContentFromTheme(contentId: string, themeId: string): Promise<void> {
    const themeContent = await this._prismaService.themeContent.findFirst({
      where: {
        themeId,
        contentId,
      },
    });

    if (!themeContent) {
      return;
    }

    await this._prismaService.themeContent.delete({
      where: {
        id: themeContent.id,
      },
    });

    // Update theme metrics
    await this.updateThemeMetrics(themeId);

    this.logger.log(`Removed content ${contentId} from theme ${themeId}`);
  }

  /**
   * Calculate Jaccard similarity between two keyword sets
   */
  private calculateJaccardSimilarity(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);

    const intersection = new Set([...set1].filter(k => set2.has(k)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) {
      return 0;
    }

    return intersection.size / union.size;
  }

  /**
   * Update theme metrics
   */
  private async updateThemeMetrics(themeId: string) {
    const themeContent = await this._prismaService.themeContent.findMany({
      where: { themeId },
      include: {
        content: {
          include: {
            metrics: true,
          },
        },
      },
    });

    if (themeContent.length === 0) {
      return;
    }

    let totalReach = 0;
    let totalEngagement = 0;
    let contentWithMetrics = 0;

    for (const tc of themeContent) {
      const metrics = tc.content.metrics || [];
      
      let reach = 0;
      let engagement = 0;

      for (const metric of metrics) {
        if (metric.metricType === 'reach') {
          reach = Math.max(reach, metric.metricValue);
        } else if (['likes', 'comments', 'shares'].includes(metric.metricType)) {
          engagement += metric.metricValue;
        }
      }

      if (reach > 0 || engagement > 0) {
        contentWithMetrics++;
        totalReach += reach;
        totalEngagement += engagement;
      }
    }

    const avgReach = contentWithMetrics > 0 ? totalReach / contentWithMetrics : 0;
    const avgEngagement = contentWithMetrics > 0 ? totalEngagement / contentWithMetrics : 0;

    await this._prismaService.theme.update({
      where: { id: themeId },
      data: {
        contentCount: themeContent.length,
        avgReach,
        avgEngagement,
      },
    });
  }
}
