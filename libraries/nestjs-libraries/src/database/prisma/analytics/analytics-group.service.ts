import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

export interface CreateGroupDto {
  name: string;
  description?: string;
  niche?: string;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
  niche?: string;
}

export interface AssignPagesDto {
  trackedIntegrationIds: string[];
}

@Injectable()
export class AnalyticsGroupService {
  constructor(private _prismaService: PrismaService) {}

  async createGroup(organizationId: string, data: CreateGroupDto) {
    return this._prismaService.analyticsGroup.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
        niche: data.niche,
      },
      include: {
        members: {
          include: {
            trackedIntegration: {
              include: {
                integration: true,
              },
            },
          },
        },
      },
    });
  }

  async getGroups(organizationId: string, includeDeleted = false) {
    return this._prismaService.analyticsGroup.findMany({
      where: {
        organizationId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        members: {
          include: {
            trackedIntegration: {
              include: {
                integration: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getGroupById(organizationId: string, groupId: string) {
    const group = await this._prismaService.analyticsGroup.findFirst({
      where: {
        id: groupId,
        organizationId,
        deletedAt: null,
      },
      include: {
        members: {
          include: {
            trackedIntegration: {
              include: {
                integration: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    return group;
  }

  async updateGroup(
    organizationId: string,
    groupId: string,
    data: UpdateGroupDto
  ) {
    const group = await this.getGroupById(organizationId, groupId);

    return this._prismaService.analyticsGroup.update({
      where: {
        id: group.id,
      },
      data: {
        name: data.name,
        description: data.description,
        niche: data.niche,
      },
      include: {
        members: {
          include: {
            trackedIntegration: {
              include: {
                integration: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteGroup(organizationId: string, groupId: string) {
    const group = await this.getGroupById(organizationId, groupId);

    return this._prismaService.analyticsGroup.update({
      where: {
        id: group.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async assignPages(
    organizationId: string,
    groupId: string,
    data: AssignPagesDto
  ) {
    const group = await this.getGroupById(organizationId, groupId);

    // Verify all tracked integrations exist and belong to this org
    const trackedIntegrations =
      await this._prismaService.analyticsTrackedIntegration.findMany({
        where: {
          id: { in: data.trackedIntegrationIds },
          organizationId,
        },
      });

    if (trackedIntegrations.length !== data.trackedIntegrationIds.length) {
      throw new Error('One or more tracked integrations not found');
    }

    // Get existing members
    const existingMembers =
      await this._prismaService.analyticsGroupMember.findMany({
        where: {
          groupId: group.id,
        },
        select: {
          trackedIntegrationId: true,
        },
      });

    const existingIds = existingMembers.map((m) => m.trackedIntegrationId);

    // Find new assignments
    const newAssignments = data.trackedIntegrationIds.filter(
      (id) => !existingIds.includes(id)
    );

    // Create new members
    if (newAssignments.length > 0) {
      await this._prismaService.analyticsGroupMember.createMany({
        data: newAssignments.map((trackedIntegrationId) => ({
          groupId: group.id,
          trackedIntegrationId,
        })),
        skipDuplicates: true,
      });
    }

    return this.getGroupById(organizationId, groupId);
  }

  async removePage(
    organizationId: string,
    groupId: string,
    trackedIntegrationId: string
  ) {
    const group = await this.getGroupById(organizationId, groupId);

    await this._prismaService.analyticsGroupMember.deleteMany({
      where: {
        groupId: group.id,
        trackedIntegrationId,
      },
    });

    return this.getGroupById(organizationId, groupId);
  }

  async getGroupsByTrackedIntegration(
    organizationId: string,
    trackedIntegrationId: string
  ) {
    return this._prismaService.analyticsGroup.findMany({
      where: {
        organizationId,
        deletedAt: null,
        members: {
          some: {
            trackedIntegrationId,
          },
        },
      },
      include: {
        members: {
          include: {
            trackedIntegration: {
              include: {
                integration: true,
              },
            },
          },
        },
      },
    });
  }
}
