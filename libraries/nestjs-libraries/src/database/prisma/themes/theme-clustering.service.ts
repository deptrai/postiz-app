import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

// Vietnamese and English stopwords
const STOPWORDS = new Set([
  // English common words
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'them', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  // Vietnamese common words
  'của', 'và', 'là', 'có', 'được', 'đã', 'sẽ', 'cho', 'từ', 'với', 'trong', 'không', 'này', 'đó', 'các', 'để', 'như',
  'một', 'vì', 'khi', 'đến', 'về', 'hay', 'nếu', 'mà', 'thì', 'cũng', 'đang', 'vào', 'ra', 'lên', 'xuống', 'trên', 'dưới',
  'sau', 'trước', 'giữa', 'ngoài', 'trong', 'nữa', 'rất', 'quá', 'thật', 'còn', 'đều', 'đã', 'sẽ', 'bị', 'bởi', 'tại',
  // Emojis and special chars (will be filtered separately)
  'emoji', 'link', 'http', 'https', 'www',
]);

export interface ClusteringOptions {
  minClusterSize?: number;
  similarityThreshold?: number;
  maxClusters?: number;
}

@Injectable()
export class ThemeClusteringService {
  private readonly logger = new Logger(ThemeClusteringService.name);

  constructor(private _prismaService: PrismaService) {}

  /**
   * Run clustering on organization content to create themes
   */
  async runClustering(organizationId: string, options: ClusteringOptions = {}) {
    const minClusterSize = options.minClusterSize || 2;
    const similarityThreshold = options.similarityThreshold || 0.2;
    const maxClusters = options.maxClusters || 15;

    this.logger.log(`Starting clustering for org ${organizationId}`);

    // Soft delete existing themes to avoid duplicates
    await this._prismaService.theme.updateMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Archived existing themes for org ${organizationId}`);

    // Get all content for clustering
    const contents = await this._prismaService.analyticsContent.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        caption: true,
        hashtags: true,
        contentType: true,
        publishedAt: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 500, // Limit to recent content
    });

    if (contents.length < minClusterSize) {
      this.logger.warn(`Not enough content (${contents.length}) for clustering`);
      return { themes: [], contentClustered: 0 };
    }

    this.logger.log(`Clustering ${contents.length} content items`);

    // Extract keywords for each content
    const contentKeywords = contents.map(content => ({
      id: content.id,
      keywords: this.extractKeywords(content.caption, content.hashtags),
      content,
    }));

    // Filter out content with no keywords
    const validContent = contentKeywords.filter(ck => ck.keywords.length > 0);

    if (validContent.length < minClusterSize) {
      this.logger.warn(`Not enough valid content with keywords (${validContent.length})`);
      return { themes: [], contentClustered: 0 };
    }

    this.logger.log(`${validContent.length} content items have keywords`);

    // Perform clustering
    const clusters = this.clusterContent(validContent, similarityThreshold, maxClusters);

    this.logger.log(`Created ${clusters.length} clusters`);

    // Create themes from clusters
    const themes = [];
    let totalContentClustered = 0;

    for (const cluster of clusters) {
      if (cluster.contentIds.length < minClusterSize) {
        this.logger.debug(`Skipping small cluster with ${cluster.contentIds.length} items`);
        continue;
      }

      // Generate theme name from top keywords
      const themeName = this.generateThemeName(cluster.keywords);

      // Create theme
      const theme = await this._prismaService.theme.create({
        data: {
          name: themeName,
          organizationId,
          keywords: cluster.keywords,
          contentCount: cluster.contentIds.length,
        },
      });

      // Link content to theme
      for (const contentId of cluster.contentIds) {
        await this._prismaService.themeContent.create({
          data: {
            themeId: theme.id,
            contentId,
          },
        });
      }

      themes.push(theme);
      totalContentClustered += cluster.contentIds.length;

      this.logger.log(`Created theme "${themeName}" with ${cluster.contentIds.length} content items`);
    }

    // Update metrics for all themes
    for (const theme of themes) {
      await this.updateThemeMetrics(theme.id);
    }

    this.logger.log(`Clustering complete: ${themes.length} themes, ${totalContentClustered} content items`);

    return {
      themes,
      contentClustered: totalContentClustered,
    };
  }

  /**
   * Extract keywords from caption and hashtags
   */
  extractKeywords(caption: string | null, hashtags: any): string[] {
    const keywords = new Set<string>();

    // Extract from hashtags
    if (hashtags) {
      let hashtagList: string[] = [];
      
      // Handle different hashtag formats
      if (typeof hashtags === 'string') {
        try {
          hashtagList = JSON.parse(hashtags);
        } catch {
          hashtagList = hashtags.split(/[\s,]+/).filter(h => h.startsWith('#'));
        }
      } else if (Array.isArray(hashtags)) {
        hashtagList = hashtags;
      }

      for (const tag of hashtagList) {
        const cleaned = tag.toLowerCase().replace(/[#@]/g, '').trim();
        if (cleaned.length > 2 && !STOPWORDS.has(cleaned)) {
          keywords.add(cleaned);
        }
      }
    }

    // Extract from caption
    if (caption) {
      // Remove emojis, URLs, and special characters
      const cleanedCaption = caption
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
        .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
        .replace(/[^\p{L}\p{N}\s]/gu, '') // Keep only letters, numbers, spaces
        .toLowerCase();

      // Split into words
      const words = cleanedCaption.split(/\s+/);

      for (const word of words) {
        const cleaned = word.trim();
        // Keep words longer than 2 chars and not stopwords
        if (cleaned.length > 2 && !STOPWORDS.has(cleaned)) {
          keywords.add(cleaned);
        }
      }
    }

    return Array.from(keywords);
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
   * Cluster content based on keyword similarity
   */
  private clusterContent(
    contentKeywords: Array<{ id: string; keywords: string[]; content: any }>,
    similarityThreshold: number,
    maxClusters: number
  ): Array<{ keywords: string[]; contentIds: string[] }> {
    const clusters: Array<{ keywords: string[]; contentIds: string[]; centroid: string[] }> = [];

    for (const item of contentKeywords) {
      let bestCluster: any = null;
      let bestSimilarity = 0;

      // Find best matching cluster
      for (const cluster of clusters) {
        const similarity = this.calculateJaccardSimilarity(item.keywords, cluster.centroid);
        if (similarity > bestSimilarity && similarity >= similarityThreshold) {
          bestSimilarity = similarity;
          bestCluster = cluster;
        }
      }

      if (bestCluster) {
        // Add to existing cluster
        bestCluster.contentIds.push(item.id);
        bestCluster.keywords.push(...item.keywords);
        
        // Update centroid (most common keywords)
        bestCluster.centroid = this.calculateCentroid(
          contentKeywords.filter(ck => bestCluster.contentIds.includes(ck.id))
        );
      } else if (clusters.length < maxClusters) {
        // Create new cluster
        clusters.push({
          keywords: [...item.keywords],
          contentIds: [item.id],
          centroid: item.keywords,
        });
      } else {
        // Max clusters reached, force add to most similar cluster even if below threshold
        let fallbackCluster = clusters[0];
        let fallbackSimilarity = 0;
        
        for (const cluster of clusters) {
          const similarity = this.calculateJaccardSimilarity(item.keywords, cluster.centroid);
          if (similarity > fallbackSimilarity) {
            fallbackSimilarity = similarity;
            fallbackCluster = cluster;
          }
        }
        
        fallbackCluster.contentIds.push(item.id);
        fallbackCluster.keywords.push(...item.keywords);
        fallbackCluster.centroid = this.calculateCentroid(
          contentKeywords.filter(ck => fallbackCluster.contentIds.includes(ck.id))
        );
      }
    }

    // Consolidate keywords for each cluster (top keywords)
    return clusters.map(cluster => ({
      keywords: this.getTopKeywords(cluster.keywords, 10),
      contentIds: cluster.contentIds,
    }));
  }

  /**
   * Calculate centroid (most representative keywords) for a cluster
   */
  private calculateCentroid(items: Array<{ keywords: string[] }>): string[] {
    const keywordFreq = new Map<string, number>();

    for (const item of items) {
      for (const keyword of item.keywords) {
        keywordFreq.set(keyword, (keywordFreq.get(keyword) || 0) + 1);
      }
    }

    // Return top 10 most frequent keywords
    return Array.from(keywordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);
  }

  /**
   * Get top N keywords by frequency
   */
  private getTopKeywords(keywords: string[], topN: number = 10): string[] {
    const freq = new Map<string, number>();

    for (const keyword of keywords) {
      freq.set(keyword, (freq.get(keyword) || 0) + 1);
    }

    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([keyword]) => keyword);
  }

  /**
   * Generate theme name from top keywords
   */
  private generateThemeName(keywords: string[]): string {
    const topKeywords = keywords.slice(0, 3);
    return topKeywords.join('-');
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
