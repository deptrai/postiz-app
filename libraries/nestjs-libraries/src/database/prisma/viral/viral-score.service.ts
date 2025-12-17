import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

// Input interfaces
export interface ContentMetadata {
  caption?: string;
  hashtags?: string[];
  contentType: 'reel' | 'video' | 'post' | 'story';
  scheduledTime?: Date;
  hookText?: string; // First line or hook of content
}

// Score breakdown interface
export interface ScoreBreakdown {
  hook: number;      // 0-100
  caption: number;   // 0-100
  hashtags: number;  // 0-100
  timing: number;    // 0-100
  format: number;    // 0-100
}

// Improvement suggestion interface
export interface ImprovementSuggestion {
  factor: keyof ScoreBreakdown;
  currentScore: number;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  potentialGain: number;
}

// Main viral score result
export interface ViralScoreResult {
  overallScore: number;
  breakdown: ScoreBreakdown;
  interpretation: string;
  suggestions: ImprovementSuggestion[];
}

// Comparison result
export interface ContentComparisonResult {
  rankings: Array<{
    contentId: string;
    score: number;
    rank: number;
    breakdown: ScoreBreakdown;
  }>;
}

@Injectable()
export class ViralScoreService {
  // Scoring weights (total = 100%)
  private readonly WEIGHTS = {
    hook: 0.25,
    caption: 0.20,
    hashtags: 0.15,
    timing: 0.20,
    format: 0.20,
  };

  // Optimal posting hours (0-23)
  private readonly OPTIMAL_HOURS = [6, 7, 8, 12, 13, 18, 19, 20, 21];

  // High-performing keywords
  private readonly POWER_WORDS = [
    'free', 'new', 'exclusive', 'limited', 'secret', 'amazing',
    'discover', 'learn', 'how to', 'tips', 'hack', 'viral',
    'trending', 'must see', 'don\'t miss', 'breaking',
  ];

  // CTA keywords
  private readonly CTA_WORDS = [
    'follow', 'like', 'share', 'comment', 'save', 'tag',
    'click', 'link', 'bio', 'dm', 'subscribe', 'join',
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate viral score for content (AC #1, #2, #3)
   */
  async calculateViralScore(
    organizationId: string,
    metadata: ContentMetadata
  ): Promise<ViralScoreResult> {
    // Calculate individual factor scores
    const breakdown: ScoreBreakdown = {
      hook: this.calculateHookScore(metadata.hookText || metadata.caption?.split('\n')[0] || ''),
      caption: this.calculateCaptionScore(metadata.caption || ''),
      hashtags: await this.calculateHashtagScore(organizationId, metadata.hashtags || []),
      timing: this.calculateTimingScore(metadata.scheduledTime),
      format: this.calculateFormatScore(metadata.contentType),
    };

    // Calculate weighted overall score
    const overallScore = Math.round(
      breakdown.hook * this.WEIGHTS.hook +
      breakdown.caption * this.WEIGHTS.caption +
      breakdown.hashtags * this.WEIGHTS.hashtags +
      breakdown.timing * this.WEIGHTS.timing +
      breakdown.format * this.WEIGHTS.format
    );

    // Get interpretation
    const interpretation = this.getScoreInterpretation(overallScore);

    // Generate improvement suggestions (AC #4)
    const suggestions = this.generateSuggestions(breakdown);

    return {
      overallScore,
      breakdown,
      interpretation,
      suggestions,
    };
  }

  /**
   * Compare multiple content drafts (AC #5)
   */
  async compareContent(
    organizationId: string,
    drafts: Array<{ id: string; metadata: ContentMetadata }>
  ): Promise<ContentComparisonResult> {
    const scoredDrafts = await Promise.all(
      drafts.map(async (draft) => {
        const result = await this.calculateViralScore(organizationId, draft.metadata);
        return {
          contentId: draft.id,
          score: result.overallScore,
          breakdown: result.breakdown,
        };
      })
    );

    // Sort by score descending and assign ranks
    const rankings = scoredDrafts
      .sort((a, b) => b.score - a.score)
      .map((draft, index) => ({
        ...draft,
        rank: index + 1,
      }));

    return { rankings };
  }

  /**
   * Calculate hook score (first 3 seconds effectiveness)
   * Factors: Length, power words, question, emoji
   */
  private calculateHookScore(hookText: string): number {
    if (!hookText) return 30; // Default low score for missing hook

    let score = 50; // Base score

    // Optimal hook length (5-15 words)
    const wordCount = hookText.split(/\s+/).length;
    if (wordCount >= 5 && wordCount <= 15) {
      score += 15;
    } else if (wordCount < 5) {
      score -= 10; // Too short
    } else if (wordCount > 25) {
      score -= 15; // Too long
    }

    // Contains power words
    const lowerHook = hookText.toLowerCase();
    const powerWordCount = this.POWER_WORDS.filter(word => 
      lowerHook.includes(word)
    ).length;
    score += Math.min(powerWordCount * 10, 20);

    // Starts with question or hook phrase
    if (hookText.includes('?') || /^(how|what|why|when|did you|have you)/i.test(hookText)) {
      score += 10;
    }

    // Contains emoji (engagement boost)
    if (/[\u{1F300}-\u{1F9FF}]/u.test(hookText)) {
      score += 5;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate caption score
   * Factors: Length, CTAs, keywords, structure
   */
  private calculateCaptionScore(caption: string): number {
    if (!caption) return 20;

    let score = 40; // Base score

    // Optimal caption length (100-300 characters)
    const length = caption.length;
    if (length >= 100 && length <= 300) {
      score += 20;
    } else if (length >= 50 && length < 100) {
      score += 10;
    } else if (length > 300 && length <= 500) {
      score += 10;
    } else if (length > 500) {
      score -= 10; // Too long
    }

    // Contains CTA
    const lowerCaption = caption.toLowerCase();
    const ctaCount = this.CTA_WORDS.filter(word => 
      lowerCaption.includes(word)
    ).length;
    score += Math.min(ctaCount * 8, 20);

    // Contains line breaks (better readability)
    const lineBreaks = (caption.match(/\n/g) || []).length;
    if (lineBreaks >= 2 && lineBreaks <= 5) {
      score += 10;
    }

    // Contains emojis
    const emojiCount = (caption.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount >= 1 && emojiCount <= 5) {
      score += 10;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate hashtag score
   * Factors: Count, relevance, trending (compare with historical)
   */
  private async calculateHashtagScore(
    organizationId: string,
    hashtags: string[]
  ): Promise<number> {
    if (!hashtags || hashtags.length === 0) return 30;

    let score = 40; // Base score

    // Optimal hashtag count (3-10)
    if (hashtags.length >= 3 && hashtags.length <= 10) {
      score += 20;
    } else if (hashtags.length < 3) {
      score += 5; // Too few
    } else if (hashtags.length > 15) {
      score -= 10; // Too many (looks spammy)
    }

    // Check against historical top-performing hashtags (AC #2)
    try {
      const topContent = await this.prisma.analyticsContent.findMany({
        where: {
          organizationId,
          hashtags: { not: null },
        },
        include: {
          metrics: {
            where: { metricType: 'views' },
          },
        },
        take: 50,
        orderBy: { publishedAt: 'desc' },
      });

      // Extract hashtags from top content
      const historicalHashtags = new Set<string>();
      topContent.forEach(content => {
        if (content.hashtags) {
          try {
            const tags = JSON.parse(content.hashtags);
            tags.forEach((tag: string) => historicalHashtags.add(tag.toLowerCase()));
          } catch {}
        }
      });

      // Check overlap with historical hashtags
      const matchCount = hashtags.filter(tag => 
        historicalHashtags.has(tag.toLowerCase())
      ).length;
      
      if (matchCount > 0) {
        score += Math.min(matchCount * 5, 20);
      }
    } catch {
      // If historical data unavailable, use base scoring
    }

    // Mix of niche and broad hashtags (length heuristic)
    const shortTags = hashtags.filter(h => h.length <= 10).length;
    const longTags = hashtags.filter(h => h.length > 10).length;
    if (shortTags > 0 && longTags > 0) {
      score += 10; // Good mix
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate timing score
   * Factors: Hour of day, day of week
   */
  private calculateTimingScore(scheduledTime?: Date): number {
    if (!scheduledTime) return 50; // Neutral if not scheduled

    let score = 40; // Base score

    const hour = scheduledTime.getHours();
    const dayOfWeek = scheduledTime.getDay(); // 0 = Sunday

    // Optimal hours (morning, lunch, evening)
    if (this.OPTIMAL_HOURS.includes(hour)) {
      score += 30;
    } else if (hour >= 9 && hour <= 17) {
      score += 15; // Daytime is okay
    } else if (hour >= 22 || hour <= 5) {
      score -= 10; // Late night/early morning
    }

    // Weekday vs weekend
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      score += 15; // Weekdays generally better
    } else {
      score += 10; // Weekends okay
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate format score
   * Reels > Videos > Posts
   */
  private calculateFormatScore(contentType: string): number {
    const formatScores: Record<string, number> = {
      reel: 90,    // Reels have highest viral potential
      video: 75,   // Videos good for engagement
      story: 60,   // Stories for existing audience
      post: 50,    // Posts lowest viral potential
    };

    return formatScores[contentType] || 50;
  }

  /**
   * Get score interpretation text
   */
  private getScoreInterpretation(score: number): string {
    if (score >= 80) return 'High viral potential';
    if (score >= 60) return 'Good potential';
    if (score >= 40) return 'Average';
    return 'Low potential, needs improvement';
  }

  /**
   * Generate improvement suggestions (AC #4)
   */
  private generateSuggestions(breakdown: ScoreBreakdown): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // Hook suggestions
    if (breakdown.hook < 70) {
      suggestions.push({
        factor: 'hook',
        currentScore: breakdown.hook,
        suggestion: 'Start with a question or power word to grab attention in the first 3 seconds',
        impact: breakdown.hook < 50 ? 'high' : 'medium',
        potentialGain: Math.min(100 - breakdown.hook, 25),
      });
    }

    // Caption suggestions
    if (breakdown.caption < 70) {
      suggestions.push({
        factor: 'caption',
        currentScore: breakdown.caption,
        suggestion: 'Add a clear call-to-action and use line breaks for better readability',
        impact: breakdown.caption < 50 ? 'high' : 'medium',
        potentialGain: Math.min(100 - breakdown.caption, 20),
      });
    }

    // Hashtag suggestions
    if (breakdown.hashtags < 70) {
      suggestions.push({
        factor: 'hashtags',
        currentScore: breakdown.hashtags,
        suggestion: 'Use 5-10 relevant hashtags mixing niche and broader tags',
        impact: 'medium',
        potentialGain: Math.min(100 - breakdown.hashtags, 15),
      });
    }

    // Timing suggestions
    if (breakdown.timing < 70) {
      suggestions.push({
        factor: 'timing',
        currentScore: breakdown.timing,
        suggestion: 'Schedule for peak hours: 6-8 AM, 12-1 PM, or 6-9 PM on weekdays',
        impact: breakdown.timing < 50 ? 'high' : 'medium',
        potentialGain: Math.min(100 - breakdown.timing, 20),
      });
    }

    // Format suggestions
    if (breakdown.format < 70) {
      suggestions.push({
        factor: 'format',
        currentScore: breakdown.format,
        suggestion: 'Consider converting to Reels format for higher viral potential',
        impact: 'high',
        potentialGain: Math.min(100 - breakdown.format, 20),
      });
    }

    // Sort by impact (high first) then by potential gain
    return suggestions.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      if (impactOrder[a.impact] !== impactOrder[b.impact]) {
        return impactOrder[a.impact] - impactOrder[b.impact];
      }
      return b.potentialGain - a.potentialGain;
    });
  }
}
