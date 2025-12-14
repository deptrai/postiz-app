import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

@Injectable()
export class AnalyticsTaggingService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Extract keywords from caption using simple rule-based extraction
   */
  private extractKeywords(caption: string): string[] {
    if (!caption) return [];

    const text = caption.toLowerCase();
    const withoutUrls = text.replace(/https?:\/\/[^\s]+/g, '');
    const cleaned = withoutUrls.replace(/[^a-z0-9\s-]/g, ' ');
    const words = cleaned.split(/\s+/).filter((w) => w.length > 0);

    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'this', 'that',
      'it', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may',
      'might', 'can', 'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your',
    ]);

    const keywords = words
      .filter((word) => word.length >= 3)
      .filter((word) => !stopwords.has(word))
      .filter((word) => !/^\d+$/.test(word));

    return Array.from(new Set(keywords));
  }

  /**
   * Parse hashtags from JSON string
   */
  private parseHashtags(hashtagsJson: string): string[] {
    if (!hashtagsJson) return [];

    try {
      const hashtags = JSON.parse(hashtagsJson);
      if (!Array.isArray(hashtags)) return [];

      return hashtags
        .map((tag: string) => tag.toLowerCase().replace(/^#/, '').trim())
        .filter((tag: string) => tag.length > 0);
    } catch (error) {
      return [];
    }
  }

  /**
   * Normalize tags: lowercase, trim, filter length, deduplicate, limit count
   */
  private normalizeTags(tags: string[]): string[] {
    return tags
      .map((tag) => tag.toLowerCase().trim())
      .filter((tag) => tag.length >= 2 && tag.length <= 50)
      .slice(0, 20);
  }

  /**
   * Auto-tag content based on caption and hashtags
   * Idempotent - can be re-run without creating duplicates
   */
  async autoTagContent(contentId: string): Promise<void> {
    const content = await this._prismaService.analyticsContent.findUnique({
      where: { id: contentId },
      include: { tags: { include: { tag: true } } },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    const keywords = this.extractKeywords(content.caption || '');
    const hashtags = this.parseHashtags(content.hashtags || '');
    const allTags = this.normalizeTags([...keywords, ...hashtags]);

    const existingAutoTags = content.tags
      .filter((ct: any) => ct.tag.type === 'AUTO')
      .map((ct: any) => ct.tag.name);

    const newTags = allTags.filter((tag) => !existingAutoTags.includes(tag));

    if (newTags.length === 0) {
      return;
    }

    for (const tagName of newTags) {
      const tag = await this._prismaService.analyticsTag.upsert({
        where: {
          organizationId_name_type_deletedAt: {
            organizationId: content.organizationId,
            name: tagName,
            type: 'AUTO',
            deletedAt: null,
          },
        },
        update: {},
        create: {
          organizationId: content.organizationId,
          name: tagName,
          type: 'AUTO',
        },
      });

      await this._prismaService.analyticsContentTag.upsert({
        where: {
          contentId_tagId: {
            contentId: content.id,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          contentId: content.id,
          tagId: tag.id,
        },
      });
    }
  }

  /**
   * Auto-tag multiple content items in batch
   */
  async autoTagBatch(
    contentIds: string[]
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ contentId: string; error: string }>;
  }> {
    const errors: Array<{ contentId: string; error: string }> = [];
    let success = 0;

    for (const contentId of contentIds) {
      try {
        await this.autoTagContent(contentId);
        success++;
      } catch (error: any) {
        errors.push({
          contentId,
          error: error.message,
        });
      }
    }

    return {
      success,
      failed: errors.length,
      errors,
    };
  }

  /**
   * Create manual campaign tag
   */
  async createManualTag(organizationId: string, name: string) {
    return this._prismaService.analyticsTag.create({
      data: {
        organizationId,
        name: name.toLowerCase().trim(),
        type: 'MANUAL',
      },
    });
  }

  /**
   * Get all tags for organization
   */
  async getTags(organizationId: string, type?: 'AUTO' | 'MANUAL') {
    return this._prismaService.analyticsTag.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(type && { type }),
      },
      include: {
        _count: {
          select: { content: true },
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Update tag name
   */
  async updateTag(organizationId: string, tagId: string, name: string) {
    const tag = await this._prismaService.analyticsTag.findFirst({
      where: {
        id: tagId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!tag) {
      throw new Error('Tag not found');
    }

    if (tag.type === 'AUTO') {
      throw new Error('Cannot update AUTO tags');
    }

    return this._prismaService.analyticsTag.update({
      where: { id: tagId },
      data: { name: name.toLowerCase().trim() },
    });
  }

  /**
   * Delete tag (soft delete)
   */
  async deleteTag(organizationId: string, tagId: string) {
    const tag = await this._prismaService.analyticsTag.findFirst({
      where: {
        id: tagId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!tag) {
      throw new Error('Tag not found');
    }

    return this._prismaService.analyticsTag.update({
      where: { id: tagId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Assign manual tag to content
   */
  async assignTagToContent(
    organizationId: string,
    contentId: string,
    tagId: string
  ) {
    const tag = await this._prismaService.analyticsTag.findFirst({
      where: {
        id: tagId,
        organizationId,
        type: 'MANUAL',
        deletedAt: null,
      },
    });

    if (!tag) {
      throw new Error('Manual tag not found');
    }

    const content = await this._prismaService.analyticsContent.findFirst({
      where: {
        id: contentId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    return this._prismaService.analyticsContentTag.upsert({
      where: {
        contentId_tagId: {
          contentId,
          tagId,
        },
      },
      update: {},
      create: {
        contentId,
        tagId,
      },
    });
  }

  /**
   * Remove tag from content
   */
  async removeTagFromContent(contentId: string, tagId: string) {
    return this._prismaService.analyticsContentTag.delete({
      where: {
        contentId_tagId: {
          contentId,
          tagId,
        },
      },
    });
  }

  /**
   * Get content with tags
   */
  async getContentTags(contentId: string) {
    return this._prismaService.analyticsContentTag.findMany({
      where: { contentId },
      include: { tag: true },
    });
  }
}
