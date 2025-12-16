import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface ThemeState {
  name: string;
  keywords: string[];
  contentCount: number;
}

interface SplitConfig {
  mode: 'manual' | 'auto';
  manualSplit?: {
    contentIds: string[];
    name: string;
  }[];
  minClusterSize?: number;
  similarityThreshold?: number;
}

@Injectable()
export class ThemeManagerService {
  private readonly logger = new Logger(ThemeManagerService.name);

  constructor(private _prismaService: PrismaService) {}

  /**
   * Rename theme and log to history
   */
  async renameTheme(themeId: string, newName: string, organizationId: string) {
    const theme = await this._prismaService.theme.findFirst({
      where: {
        id: themeId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!theme) {
      throw new Error('Theme not found');
    }

    const previousState: ThemeState = {
      name: theme.name,
      keywords: (theme.keywords as string[]) || [],
      contentCount: theme.contentCount,
    };

    const updatedTheme = await this._prismaService.theme.update({
      where: { id: themeId },
      data: { name: newName },
    });

    const newState: ThemeState = {
      name: newName,
      keywords: (theme.keywords as string[]) || [],
      contentCount: theme.contentCount,
    };

    // Log history
    await this._prismaService.themeHistory.create({
      data: {
        themeId,
        action: 'rename',
        previousState: previousState as any,
        newState: newState as any,
        relatedThemeIds: [],
      },
    });

    this.logger.log(`Theme renamed: ${previousState.name} -> ${newName}`);

    return updatedTheme;
  }

  /**
   * Merge multiple themes into one
   */
  async mergeThemes(
    themeIds: string[],
    targetName: string,
    organizationId: string
  ) {
    if (themeIds.length < 2) {
      throw new Error('At least 2 themes required for merge');
    }

    // Get all themes
    const themes = await this._prismaService.theme.findMany({
      where: {
        id: { in: themeIds },
        organizationId,
        deletedAt: null,
      },
      include: {
        content: true,
      },
    });

    if (themes.length !== themeIds.length) {
      throw new Error('One or more themes not found');
    }

    // Use first theme as target
    const targetTheme = themes[0];
    const sourceThemes = themes.slice(1);

    const previousState: ThemeState = {
      name: targetTheme.name,
      keywords: (targetTheme.keywords as string[]) || [],
      contentCount: targetTheme.contentCount,
    };

    // Combine keywords (unique)
    const allKeywords = new Set<string>();
    themes.forEach((theme) => {
      const keywords = (theme.keywords as string[]) || [];
      keywords.forEach((kw) => allKeywords.add(kw));
    });

    // Move content from source themes to target
    for (const sourceTheme of sourceThemes) {
      await this._prismaService.themeContent.updateMany({
        where: { themeId: sourceTheme.id },
        data: { themeId: targetTheme.id },
      });
    }

    // Count total content
    const totalContent = await this._prismaService.themeContent.count({
      where: { themeId: targetTheme.id },
    });

    // Update target theme
    const mergedTheme = await this._prismaService.theme.update({
      where: { id: targetTheme.id },
      data: {
        name: targetName,
        keywords: Array.from(allKeywords),
        contentCount: totalContent,
      },
    });

    // Soft delete source themes
    await this._prismaService.theme.updateMany({
      where: {
        id: { in: sourceThemes.map((t) => t.id) },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    const newState: ThemeState = {
      name: targetName,
      keywords: Array.from(allKeywords),
      contentCount: totalContent,
    };

    // Log history for target theme
    await this._prismaService.themeHistory.create({
      data: {
        themeId: targetTheme.id,
        action: 'merge',
        previousState: previousState as any,
        newState: newState as any,
        relatedThemeIds: sourceThemes.map((t) => t.id),
      },
    });

    // Log history for source themes (they were merged into target)
    for (const sourceTheme of sourceThemes) {
      await this._prismaService.themeHistory.create({
        data: {
          themeId: sourceTheme.id,
          action: 'merge',
          previousState: {
            name: sourceTheme.name,
            keywords: (sourceTheme.keywords as string[]) || [],
            contentCount: sourceTheme.contentCount,
          },
          newState: {
            name: `Merged into ${targetName}`,
            keywords: [],
            contentCount: 0,
          },
          relatedThemeIds: [targetTheme.id],
        },
      });
    }

    this.logger.log(`Merged ${themes.length} themes into "${targetName}"`);

    return mergedTheme;
  }

  /**
   * Split theme into multiple themes
   */
  async splitTheme(
    themeId: string,
    splitConfig: SplitConfig,
    organizationId: string
  ) {
    const theme = await this._prismaService.theme.findFirst({
      where: {
        id: themeId,
        organizationId,
        deletedAt: null,
      },
      include: {
        content: {
          include: {
            content: true,
          },
        },
      },
    });

    if (!theme) {
      throw new Error('Theme not found');
    }

    if (theme.content.length < 2) {
      throw new Error('Theme must have at least 2 content items to split');
    }

    const previousState: ThemeState = {
      name: theme.name,
      keywords: (theme.keywords as string[]) || [],
      contentCount: theme.contentCount,
    };

    const newThemes: any[] = [];

    if (splitConfig.mode === 'manual') {
      // Manual split: user provides content groups
      if (!splitConfig.manualSplit || splitConfig.manualSplit.length === 0) {
        throw new Error('Manual split requires content groups');
      }

      for (const group of splitConfig.manualSplit) {
        // Create new theme
        const newTheme = await this._prismaService.theme.create({
          data: {
            name: group.name,
            organizationId,
            keywords: [],
            contentCount: group.contentIds.length,
          },
        });

        // Move content to new theme
        await this._prismaService.themeContent.updateMany({
          where: {
            themeId: theme.id,
            contentId: { in: group.contentIds },
          },
          data: {
            themeId: newTheme.id,
          },
        });

        newThemes.push(newTheme);
      }
    } else {
      // Auto split: use clustering logic
      // [ASSUMPTION: For auto split, we'll create 2 themes by splitting content in half]
      // This is a simplified implementation - production would use proper sub-clustering
      const contentIds = theme.content.map((c) => c.contentId);
      const midpoint = Math.ceil(contentIds.length / 2);
      const group1Ids = contentIds.slice(0, midpoint);
      const group2Ids = contentIds.slice(midpoint);

      // Create first new theme
      const newTheme1 = await this._prismaService.theme.create({
        data: {
          name: `${theme.name} (Split 1)`,
          organizationId,
          keywords: [],
          contentCount: group1Ids.length,
        },
      });

      await this._prismaService.themeContent.updateMany({
        where: {
          themeId: theme.id,
          contentId: { in: group1Ids },
        },
        data: {
          themeId: newTheme1.id,
        },
      });

      // Create second new theme
      const newTheme2 = await this._prismaService.theme.create({
        data: {
          name: `${theme.name} (Split 2)`,
          organizationId,
          keywords: [],
          contentCount: group2Ids.length,
        },
      });

      await this._prismaService.themeContent.updateMany({
        where: {
          themeId: theme.id,
          contentId: { in: group2Ids },
        },
        data: {
          themeId: newTheme2.id,
        },
      });

      newThemes.push(newTheme1, newTheme2);
    }

    // Soft delete original theme
    await this._prismaService.theme.update({
      where: { id: theme.id },
      data: { deletedAt: new Date() },
    });

    // Log history
    await this._prismaService.themeHistory.create({
      data: {
        themeId: theme.id,
        action: 'split',
        previousState: previousState as any,
        newState: {
          name: `Split into ${newThemes.length} themes`,
          keywords: [],
          contentCount: 0,
        } as any,
        relatedThemeIds: newThemes.map((t) => t.id),
      },
    });

    // Log history for new themes
    for (const newTheme of newThemes) {
      await this._prismaService.themeHistory.create({
        data: {
          themeId: newTheme.id,
          action: 'split',
          previousState: {
            name: '',
            keywords: [],
            contentCount: 0,
          },
          newState: {
            name: newTheme.name,
            keywords: [],
            contentCount: newTheme.contentCount,
          },
          relatedThemeIds: [theme.id],
        },
      });
    }

    this.logger.log(`Split theme "${theme.name}" into ${newThemes.length} themes`);

    return newThemes;
  }

  /**
   * Get theme history
   */
  async getThemeHistory(themeId: string, organizationId: string) {
    const theme = await this._prismaService.theme.findFirst({
      where: {
        id: themeId,
        organizationId,
      },
    });

    if (!theme) {
      throw new Error('Theme not found');
    }

    const history = await this._prismaService.themeHistory.findMany({
      where: { themeId },
      orderBy: { createdAt: 'desc' },
    });

    return history;
  }
}
