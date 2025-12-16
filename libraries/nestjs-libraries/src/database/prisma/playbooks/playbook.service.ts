import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

export interface GetPlaybooksFilters {
  groupId?: string;
  format?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class PlaybookService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Get playbooks for organization with filters
   */
  async getPlaybooks(organizationId: string, filters: GetPlaybooksFilters = {}) {
    const whereClause: any = {
      organizationId,
      deletedAt: null,
    };

    if (filters.groupId) {
      whereClause.groupId = filters.groupId;
    }

    if (filters.format) {
      whereClause.format = filters.format;
    }

    const playbooks = await this._prismaService.playbook.findMany({
      where: whereClause,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            niche: true,
          },
        },
        variants: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            sourceContent: true,
            variants: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    // Transform to match frontend interface
    return playbooks.map((playbook) => ({
      id: playbook.id,
      name: playbook.name,
      format: playbook.format,
      recipe: playbook.recipe,
      evidence: playbook.evidence,
      consistencyScore: playbook.consistencyScore,
      variants: playbook.variants.map(v => ({
        id: v.id,
        name: v.name,
        type: v.type,
      })),
      createdAt: playbook.createdAt.toISOString(),
      group: playbook.group,
    }));
  }

  /**
   * Get playbook by ID with full details
   */
  async getPlaybookById(playbookId: string, organizationId: string) {
    const playbook = await this._prismaService.playbook.findFirst({
      where: {
        id: playbookId,
        organizationId,
        deletedAt: null,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        sourceContent: {
          include: {
            content: {
              select: {
                id: true,
                externalContentId: true,
                caption: true,
                contentType: true,
                publishedAt: true,
              },
            },
          },
        },
        variants: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!playbook) {
      return null;
    }

    return playbook;
  }

  /**
   * Get playbook evidence (source content with metrics)
   */
  async getPlaybookEvidence(playbookId: string, organizationId: string) {
    const playbook = await this._prismaService.playbook.findFirst({
      where: {
        id: playbookId,
        organizationId,
        deletedAt: null,
      },
      include: {
        sourceContent: {
          include: {
            content: {
              select: {
                id: true,
                externalContentId: true,
                caption: true,
                hashtags: true,
                contentType: true,
                publishedAt: true,
                integration: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!playbook) {
      return null;
    }

    // Get metrics for source content
    const contentIds = playbook.sourceContent.map((sc) => sc.content.externalContentId);
    const metrics = await this._prismaService.analyticsDailyMetric.findMany({
      where: {
        organizationId,
        externalContentId: { in: contentIds },
        deletedAt: null,
      },
    });

    // Group metrics by content
    const metricsByContent = new Map<string, any[]>();
    for (const metric of metrics) {
      if (!metricsByContent.has(metric.externalContentId)) {
        metricsByContent.set(metric.externalContentId, []);
      }
      metricsByContent.get(metric.externalContentId)!.push(metric);
    }

    // Add aggregated metrics to each content
    const sourceContentWithMetrics = playbook.sourceContent.map((sc) => {
      const contentMetrics = metricsByContent.get(sc.content.externalContentId) || [];
      const totalReach = contentMetrics.reduce((sum, m) => sum + (m.reach || 0), 0);
      const totalEngagement =
        contentMetrics.reduce((sum, m) => sum + (m.reactions || 0), 0) +
        contentMetrics.reduce((sum, m) => sum + (m.comments || 0), 0) +
        contentMetrics.reduce((sum, m) => sum + (m.shares || 0), 0);

      return {
        ...sc.content,
        totalReach,
        totalEngagement,
        engagementRate: totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0,
      };
    });

    return {
      playbook: {
        id: playbook.id,
        name: playbook.name,
        format: playbook.format,
        recipe: playbook.recipe,
        evidence: playbook.evidence,
        consistencyScore: playbook.consistencyScore,
      },
      sourceContent: sourceContentWithMetrics,
    };
  }

  /**
   * Delete playbook (soft delete)
   */
  async deletePlaybook(playbookId: string, organizationId: string) {
    const playbook = await this._prismaService.playbook.findFirst({
      where: {
        id: playbookId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!playbook) {
      return false;
    }

    await this._prismaService.playbook.update({
      where: { id: playbookId },
      data: { deletedAt: new Date() },
    });

    return true;
  }
}
