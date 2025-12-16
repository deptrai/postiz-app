import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ExperimentTrackingService } from './experiment-tracking.service';

interface ContentMatchScore {
  variantId: string;
  experimentId: string;
  experimentVariantId: string;
  score: number;
  matches: {
    format?: boolean;
    hook?: boolean;
    hashtags?: number;
    time?: boolean;
    cta?: boolean;
  };
}

@Injectable()
export class ExperimentAutoTrackingService {
  private readonly logger = new Logger(ExperimentAutoTrackingService.name);

  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _experimentTrackingService: ExperimentTrackingService
  ) {}

  /**
   * Automatically track content to matching experiment variants
   * Called after content is ingested
   */
  async autoTrackContent(contentId: string): Promise<void> {
    try {
      const content = await this._prismaService.analyticsContent.findUnique({
        where: { id: contentId },
      });

      if (!content) {
        this.logger.warn(`Content ${contentId} not found for auto-tracking`);
        return;
      }

      // Find active experiments for this organization
      const activeExperiments = await this._prismaService.experiment.findMany({
        where: {
          organizationId: content.organizationId,
          status: { in: ['draft', 'active', 'completed'] }, // Track for all statuses
          deletedAt: null,
        },
        include: {
          variants: {
            include: {
              variant: {
                include: {
                  playbook: true,
                },
              },
            },
          },
        },
      });

      if (activeExperiments.length === 0) {
        this.logger.debug(`No active experiments for org ${content.organizationId}`);
        return;
      }

      // Find best matching variant across all experiments
      for (const experiment of activeExperiments) {
        const matches = await this.findMatchingVariants(content, experiment.variants);
        
        if (matches.length > 0) {
          // Track to best matching variant
          const bestMatch = matches[0];
          
          // Check if already tracked
          const existing = await this._prismaService.experimentTrackedContent.findFirst({
            where: {
              experimentVariantId: bestMatch.experimentVariantId,
              contentId,
            },
          });

          if (!existing) {
            await this._experimentTrackingService.trackContent(
              experiment.id,
              bestMatch.variantId,
              contentId,
              content.organizationId
            );

            this.logger.log(
              `Auto-tracked content ${contentId} to variant ${bestMatch.variantId} ` +
              `in experiment ${experiment.id} (score: ${bestMatch.score.toFixed(2)})`
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to auto-track content ${contentId}: ${error.message}`);
    }
  }

  /**
   * Find variants that match the content
   * Returns sorted by match score (best first)
   */
  private async findMatchingVariants(
    content: any,
    experimentVariants: any[]
  ): Promise<ContentMatchScore[]> {
    const matches: ContentMatchScore[] = [];

    for (const expVariant of experimentVariants) {
      const variant = expVariant.variant;
      const playbook = variant.playbook;

      const score = this.calculateMatchScore(content, variant, playbook);

      if (score.total > 0.3) { // Minimum threshold: 30% match
        matches.push({
          variantId: variant.id,
          experimentId: expVariant.experimentId,
          experimentVariantId: expVariant.id,
          score: score.total,
          matches: score.matches,
        });
      }
    }

    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate match score between content and variant
   * Returns score from 0 to 1
   */
  private calculateMatchScore(
    content: any,
    variant: any,
    playbook: any
  ): { total: number; matches: any } {
    let totalScore = 0;
    let maxScore = 0;
    const matches: any = {};

    // 1. Format match (20% weight)
    maxScore += 0.2;
    if (playbook.format === content.contentType) {
      totalScore += 0.2;
      matches.format = true;
    }

    // 2. Hook pattern match (30% weight)
    maxScore += 0.3;
    const hookMatch = this.matchHookPatterns(content, variant, playbook);
    if (hookMatch > 0) {
      totalScore += 0.3 * hookMatch;
      matches.hook = true;
    }

    // 3. Hashtag match (20% weight)
    maxScore += 0.2;
    const hashtagMatch = this.matchHashtags(content, playbook);
    if (hashtagMatch > 0) {
      totalScore += 0.2 * hashtagMatch;
      matches.hashtags = hashtagMatch;
    }

    // 4. Time match (15% weight)
    maxScore += 0.15;
    const timeMatch = this.matchPostingTime(content, playbook);
    if (timeMatch > 0) {
      totalScore += 0.15 * timeMatch;
      matches.time = true;
    }

    // 5. CTA match (15% weight)
    maxScore += 0.15;
    const ctaMatch = this.matchCTAPatterns(content, playbook);
    if (ctaMatch > 0) {
      totalScore += 0.15 * ctaMatch;
      matches.cta = true;
    }

    // Normalize score to 0-1 range
    const normalizedScore = maxScore > 0 ? totalScore / maxScore : 0;

    return {
      total: normalizedScore,
      matches,
    };
  }

  /**
   * Match hook patterns from variant/playbook against content caption
   */
  private matchHookPatterns(content: any, variant: any, playbook: any): number {
    if (!content.caption) return 0;

    const caption = content.caption.toLowerCase();
    let matchCount = 0;
    let totalPatterns = 0;

    // Check variant-specific hook
    if (variant.recipe?.hook) {
      totalPatterns++;
      const hookKeywords = variant.recipe.hook.toLowerCase().split(/\s+/);
      const matchedKeywords = hookKeywords.filter(kw => 
        kw.length > 2 && caption.includes(kw)
      );
      if (matchedKeywords.length > 0) {
        matchCount += matchedKeywords.length / hookKeywords.length;
      }
    }

    // Check playbook hooks
    if (playbook.recipe?.hooks && Array.isArray(playbook.recipe.hooks)) {
      totalPatterns += playbook.recipe.hooks.length;
      for (const hook of playbook.recipe.hooks) {
        const hookLower = hook.toLowerCase();
        if (caption.includes(hookLower)) {
          matchCount++;
        }
      }
    }

    return totalPatterns > 0 ? matchCount / totalPatterns : 0;
  }

  /**
   * Match hashtags between content and playbook
   */
  private matchHashtags(content: any, playbook: any): number {
    if (!content.hashtags || !playbook.recipe?.hashtags) return 0;

    const contentHashtags = Array.isArray(content.hashtags)
      ? content.hashtags.map((h: string) => h.toLowerCase().replace('#', ''))
      : [];

    const playbookHashtags = playbook.recipe.hashtags.map((h: string) => 
      h.toLowerCase().replace('#', '')
    );

    if (contentHashtags.length === 0 || playbookHashtags.length === 0) {
      return 0;
    }

    const matches = contentHashtags.filter((h: string) => 
      playbookHashtags.includes(h)
    );

    return matches.length / Math.max(contentHashtags.length, playbookHashtags.length);
  }

  /**
   * Match posting time against playbook time buckets
   */
  private matchPostingTime(content: any, playbook: any): number {
    if (!content.publishedAt || !playbook.recipe?.times) return 0;

    const publishTime = new Date(content.publishedAt);
    const hour = publishTime.getHours();

    // Map hours to time buckets
    let timeBucket: string;
    if (hour >= 6 && hour < 12) {
      timeBucket = 'morning';
    } else if (hour >= 12 && hour < 18) {
      timeBucket = 'afternoon';
    } else if (hour >= 18 && hour < 22) {
      timeBucket = 'evening';
    } else {
      timeBucket = 'night';
    }

    const playbookTimes = playbook.recipe.times || [];
    return playbookTimes.includes(timeBucket) ? 1 : 0;
  }

  /**
   * Match CTA patterns between content and playbook
   */
  private matchCTAPatterns(content: any, playbook: any): number {
    if (!content.caption || !playbook.recipe?.ctas) return 0;

    const caption = content.caption.toLowerCase();
    const ctas = playbook.recipe.ctas || [];

    if (ctas.length === 0) return 0;

    const matches = ctas.filter((cta: string) => 
      caption.includes(cta.toLowerCase())
    );

    return matches.length / ctas.length;
  }

  /**
   * Retroactively track existing content to experiments
   * Useful for initial setup or testing
   */
  async retroactiveTrack(organizationId: string): Promise<void> {
    this.logger.log(`Starting retroactive tracking for org ${organizationId}`);

    // Get all untracked content
    const allContent = await this._prismaService.analyticsContent.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 100, // Limit to recent content
    });

    this.logger.log(`Found ${allContent.length} content items to process`);

    for (const content of allContent) {
      await this.autoTrackContent(content.id);
    }

    this.logger.log(`Completed retroactive tracking for org ${organizationId}`);
  }
}
