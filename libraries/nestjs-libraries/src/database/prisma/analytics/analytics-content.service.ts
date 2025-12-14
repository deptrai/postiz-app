import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

export interface ContentMetadata {
  externalContentId: string;
  contentType: 'post' | 'reel' | 'story';
  caption?: string;
  hashtags?: string[];
  publishedAt: Date;
}

@Injectable()
export class AnalyticsContentService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Upsert content metadata with idempotency
   * Uses unique constraint [organizationId, integrationId, externalContentId, deletedAt]
   * 
   * @param organizationId - Organization ID
   * @param integrationId - Integration ID
   * @param metadata - Content metadata to store
   * @returns Created or updated content record
   */
  async upsertContent(
    organizationId: string,
    integrationId: string,
    metadata: ContentMetadata
  ) {
    const { externalContentId, contentType, caption, hashtags, publishedAt } = metadata;

    // Upsert using unique constraint for idempotency
    return this._prismaService.analyticsContent.upsert({
      where: {
        organizationId_integrationId_externalContentId_deletedAt: {
          organizationId,
          integrationId,
          externalContentId,
          deletedAt: null,
        },
      },
      update: {
        contentType,
        caption,
        hashtags: hashtags ? JSON.stringify(hashtags) : null,
        publishedAt,
        updatedAt: new Date(),
      },
      create: {
        organizationId,
        integrationId,
        externalContentId,
        contentType,
        caption,
        hashtags: hashtags ? JSON.stringify(hashtags) : null,
        publishedAt,
      },
    });
  }

  /**
   * Upsert multiple content items in batch
   * 
   * @param organizationId - Organization ID
   * @param integrationId - Integration ID
   * @param items - Array of content metadata
   * @returns Array of created/updated records
   */
  async upsertContentBatch(
    organizationId: string,
    integrationId: string,
    items: ContentMetadata[]
  ) {
    const results = [];

    for (const item of items) {
      const result = await this.upsertContent(organizationId, integrationId, item);
      results.push(result);
    }

    return results;
  }

  /**
   * Extract hashtags from caption text
   * 
   * @param caption - Post caption text
   * @returns Array of hashtags without # symbol
   */
  extractHashtags(caption: string | null | undefined): string[] {
    if (!caption) return [];

    const hashtagRegex = /#(\w+)/g;
    const matches = caption.match(hashtagRegex);

    if (!matches) return [];

    // Remove # symbol and return unique hashtags
    return [...new Set(matches.map((tag) => tag.substring(1)))];
  }

  /**
   * Get content by external ID
   * 
   * @param organizationId - Organization ID
   * @param integrationId - Integration ID
   * @param externalContentId - Facebook post/reel ID
   * @returns Content record or null
   */
  async getContentByExternalId(
    organizationId: string,
    integrationId: string,
    externalContentId: string
  ) {
    return this._prismaService.analyticsContent.findFirst({
      where: {
        organizationId,
        integrationId,
        externalContentId,
        deletedAt: null,
      },
    });
  }

  /**
   * Get content for date range
   * 
   * @param organizationId - Organization ID
   * @param integrationId - Integration ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of content records
   */
  async getContentByDateRange(
    organizationId: string,
    integrationId: string,
    startDate: Date,
    endDate: Date
  ) {
    return this._prismaService.analyticsContent.findMany({
      where: {
        organizationId,
        integrationId,
        publishedAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
  }
}
