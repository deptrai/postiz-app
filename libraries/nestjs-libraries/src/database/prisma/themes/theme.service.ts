import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

export interface GetThemesFilters {
  groupId?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ThemeService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Get themes for organization with filters
   */
  async getThemes(organizationId: string, filters: GetThemesFilters = {}) {
    const whereClause: any = {
      organizationId,
      deletedAt: null,
    };

    const themes = await this._prismaService.theme.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            content: true,
          },
        },
      },
      orderBy: {
        contentCount: 'desc',
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    return themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      keywords: theme.keywords,
      contentCount: theme._count.content,
      avgReach: theme.avgReach,
      avgEngagement: theme.avgEngagement,
      createdAt: theme.createdAt.toISOString(),
      updatedAt: theme.updatedAt.toISOString(),
    }));
  }

  /**
   * Get theme by ID with content list
   */
  async getThemeById(themeId: string, organizationId: string) {
    const theme = await this._prismaService.theme.findFirst({
      where: {
        id: themeId,
        organizationId,
        deletedAt: null,
      },
      include: {
        content: {
          include: {
            content: {
              select: {
                id: true,
                caption: true,
                hashtags: true,
                contentType: true,
                publishedAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!theme) {
      return null;
    }

    return {
      id: theme.id,
      name: theme.name,
      keywords: theme.keywords,
      contentCount: theme.contentCount,
      avgReach: theme.avgReach,
      avgEngagement: theme.avgEngagement,
      content: theme.content.map(tc => ({
        id: tc.content.id,
        caption: tc.content.caption,
        hashtags: tc.content.hashtags,
        contentType: tc.content.contentType,
        publishedAt: tc.content.publishedAt.toISOString(),
      })),
      createdAt: theme.createdAt.toISOString(),
      updatedAt: theme.updatedAt.toISOString(),
    };
  }

  /**
   * Get theme content
   */
  async getThemeContent(themeId: string, organizationId: string) {
    const theme = await this._prismaService.theme.findFirst({
      where: {
        id: themeId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!theme) {
      return null;
    }

    const content = await this._prismaService.themeContent.findMany({
      where: {
        themeId,
      },
      include: {
        content: {
          include: {
            metrics: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const themeKeywords = Array.isArray(theme.keywords) 
      ? (theme.keywords as string[])
      : [];

    return content.map(tc => {
      // Calculate metrics from raw data
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

      const engagementRate = reach > 0 ? (engagement / reach) * 100 : 0;

      // Calculate similarity between content keywords and theme keywords
      const contentKeywords = tc.content.hashtags 
        ? tc.content.hashtags.split(',').map(k => k.trim().toLowerCase()) 
        : [];
      const similarity = this.calculateJaccardSimilarity(contentKeywords, themeKeywords);

      return {
        id: tc.content.id,
        externalContentId: tc.content.externalContentId,
        caption: tc.content.caption,
        hashtags: tc.content.hashtags,
        contentType: tc.content.contentType,
        publishedAt: tc.content.publishedAt.toISOString(),
        similarity,
        totalReach: reach,
        totalEngagement: engagement,
        engagementRate,
      };
    });
  }

  /**
   * Calculate Jaccard similarity between two keyword sets
   */
  private calculateJaccardSimilarity(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Update theme metrics by aggregating content performance
   */
  async updateThemeMetrics(themeId: string) {
    const themeContent = await this._prismaService.themeContent.findMany({
      where: {
        themeId,
      },
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

    return {
      contentCount: themeContent.length,
      avgReach,
      avgEngagement,
    };
  }

  /**
   * Rename theme
   */
  async renameTheme(themeId: string, organizationId: string, name: string) {
    const theme = await this._prismaService.theme.findFirst({
      where: {
        id: themeId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!theme) {
      return null;
    }

    return await this._prismaService.theme.update({
      where: { id: themeId },
      data: { name },
    });
  }

  /**
   * Delete theme (soft delete)
   */
  async deleteTheme(themeId: string, organizationId: string) {
    const theme = await this._prismaService.theme.findFirst({
      where: {
        id: themeId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!theme) {
      return null;
    }

    return await this._prismaService.theme.update({
      where: { id: themeId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get trending themes based on engagement metrics and recency
   */
  async getTrendingThemes(organizationId: string, options: { limit?: number } = {}) {
    const limit = options.limit || 5;

    // Get themes sorted by engagement and recency
    const themes = await this._prismaService.theme.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            content: true,
          },
        },
      },
      orderBy: [
        { avgEngagement: 'desc' },
        { contentCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      keywords: theme.keywords,
      contentCount: theme._count.content,
      avgReach: theme.avgReach,
      avgEngagement: theme.avgEngagement,
      createdAt: theme.createdAt.toISOString(),
      updatedAt: theme.updatedAt.toISOString(),
    }));
  }
}
