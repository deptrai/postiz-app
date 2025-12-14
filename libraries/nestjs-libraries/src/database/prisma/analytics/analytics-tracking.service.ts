import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@gitroom/nestjs-libraries/database/prisma/database.service';

@Injectable()
export class AnalyticsTrackingService {
  constructor(private _databaseService: DatabaseService) {}

  /**
   * Get list of tracked integration IDs for an organization
   * @param organizationId - Organization ID
   * @returns Array of integration IDs that are being tracked for analytics
   */
  async getTrackedIntegrations(organizationId: string): Promise<string[]> {
    const tracked = await this._databaseService.analyticsTrackedIntegration.findMany({
      where: {
        organizationId,
      },
      select: {
        integrationId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return tracked.map((t) => t.integrationId);
  }

  /**
   * Update the list of tracked integrations for an organization
   * Replaces the entire tracked list with the provided integration IDs
   * 
   * @param organizationId - Organization ID
   * @param integrationIds - Array of integration IDs to track (max 20)
   * @throws Error if more than 20 integrationIds
   * @throws Error if any integrationId does not belong to the organization
   */
  async updateTrackedIntegrations(
    organizationId: string,
    integrationIds: string[]
  ): Promise<void> {
    // Validation: Max 20 integrations
    if (integrationIds.length > 20) {
      throw new Error('Cannot track more than 20 integrations');
    }

    // Validation: All integrations must belong to the organization
    if (integrationIds.length > 0) {
      const validIntegrations = await this._databaseService.integration.findMany({
        where: {
          id: { in: integrationIds },
          organizationId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      const validIds = new Set(validIntegrations.map((i) => i.id));
      const invalidIds = integrationIds.filter((id) => !validIds.has(id));

      if (invalidIds.length > 0) {
        throw new Error(
          `Integration IDs not found or do not belong to organization: ${invalidIds.join(', ')}`
        );
      }
    }

    // Transaction: Delete all existing tracked integrations and insert new ones
    await this._databaseService.$transaction(async (tx) => {
      // Delete all existing tracked integrations for this org
      await tx.analyticsTrackedIntegration.deleteMany({
        where: {
          organizationId,
        },
      });

      // Insert new tracked integrations
      if (integrationIds.length > 0) {
        await tx.analyticsTrackedIntegration.createMany({
          data: integrationIds.map((integrationId) => ({
            organizationId,
            integrationId,
          })),
        });
      }
    });
  }

  /**
   * Check if an integration is being tracked for analytics
   * @param organizationId - Organization ID
   * @param integrationId - Integration ID to check
   * @returns True if the integration is tracked
   */
  async isIntegrationTracked(
    organizationId: string,
    integrationId: string
  ): Promise<boolean> {
    const tracked = await this._databaseService.analyticsTrackedIntegration.findUnique({
      where: {
        organizationId_integrationId: {
          organizationId,
          integrationId,
        },
      },
    });

    return !!tracked;
  }

  /**
   * Get count of tracked integrations for an organization
   * @param organizationId - Organization ID
   * @returns Number of tracked integrations
   */
  async getTrackedIntegrationsCount(organizationId: string): Promise<number> {
    return this._databaseService.analyticsTrackedIntegration.count({
      where: {
        organizationId,
      },
    });
  }
}
