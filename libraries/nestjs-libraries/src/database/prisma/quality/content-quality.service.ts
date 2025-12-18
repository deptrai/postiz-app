import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import dayjs from 'dayjs';

export interface QualityScore {
  contentId: string;
  externalContentId: string;
  overallScore: number;
  engagementScore: number;
  watchTimeScore: number;
  complianceScore: number;
  consistencyScore: number;
  improvements: ImprovementSuggestion[];
  interpretation: string;
  calculatedAt: Date;
}

export interface ImprovementSuggestion {
  factor: 'engagement' | 'watchTime' | 'compliance' | 'consistency';
  currentScore: number;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface QualityListItem {
  contentId: string;
  externalContentId: string;
  contentType: string;
  caption: string | null;
  publishedAt: Date;
  integrationId: string;
  overallScore: number;
  engagementScore: number;
  interpretation: string;
}

export interface QualityTrendPoint {
  date: string;
  averageScore: number;
  contentCount: number;
  engagementAvg: number;
  watchTimeAvg: number;
  complianceAvg: number;
  consistencyAvg: number;
}

export interface QualityListOptions {
  sortBy?: 'score' | 'date' | 'engagement';
  sortOrder?: 'asc' | 'desc';
  minScore?: number;
  maxScore?: number;
  limit?: number;
  offset?: number;
}

// Quality factor weights as defined in story
const QUALITY_WEIGHTS = {
  engagement: 0.35,
  watchTime: 0.25,
  compliance: 0.25,
  consistency: 0.15,
};

@Injectable()
export class ContentQualityService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Calculate quality score for a single content item
   * AC: #1, #2 - Overall score 0-100 with breakdown
   */
  async calculateQualityScore(
    organizationId: string,
    contentId: string
  ): Promise<QualityScore | null> {
    // Get content
    const content = await this._prismaService.analyticsContent.findFirst({
      where: {
        id: contentId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!content) {
      return null;
    }

    // Get metrics for this content
    const metrics = await this._prismaService.analyticsDailyMetric.findMany({
      where: {
        organizationId,
        externalContentId: content.externalContentId,
        deletedAt: null,
      },
    });

    // Calculate sub-scores
    const engagementScore = this.calculateEngagementScore(metrics);
    const watchTimeScore = this.calculateWatchTimeScore(metrics, content.contentType);
    const complianceScore = await this.calculateComplianceScore(content);
    const consistencyScore = await this.calculateConsistencyScore(
      organizationId,
      content.integrationId,
      content.publishedAt
    );

    // Calculate overall score
    const overallScore = Math.round(
      engagementScore * QUALITY_WEIGHTS.engagement +
      watchTimeScore * QUALITY_WEIGHTS.watchTime +
      complianceScore * QUALITY_WEIGHTS.compliance +
      consistencyScore * QUALITY_WEIGHTS.consistency
    );

    // Get improvements for low-scoring factors
    const improvements = this.getImprovementSuggestions({
      engagementScore,
      watchTimeScore,
      complianceScore,
      consistencyScore,
    });

    return {
      contentId: content.id,
      externalContentId: content.externalContentId,
      overallScore,
      engagementScore,
      watchTimeScore,
      complianceScore,
      consistencyScore,
      improvements,
      interpretation: this.getScoreInterpretation(overallScore),
      calculatedAt: new Date(),
    };
  }

  /**
   * Get content list sorted by quality score
   * AC: #3 - List sorted by quality score
   */
  async getContentByQuality(
    organizationId: string,
    options: QualityListOptions = {}
  ): Promise<{ items: QualityListItem[]; total: number }> {
    const {
      sortBy = 'score',
      sortOrder = 'desc',
      minScore,
      maxScore,
      limit = 20,
      offset = 0,
    } = options;

    // Get all content for organization
    const content = await this._prismaService.analyticsContent.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 500, // Reasonable limit for scoring
    });

    // Calculate scores for each content
    const scoredContent: QualityListItem[] = [];

    for (const c of content) {
      const score = await this.calculateQualityScore(organizationId, c.id);
      if (!score) continue;

      // Apply score filters
      if (minScore !== undefined && score.overallScore < minScore) continue;
      if (maxScore !== undefined && score.overallScore > maxScore) continue;

      scoredContent.push({
        contentId: c.id,
        externalContentId: c.externalContentId,
        contentType: c.contentType,
        caption: c.caption,
        publishedAt: c.publishedAt,
        integrationId: c.integrationId,
        overallScore: score.overallScore,
        engagementScore: score.engagementScore,
        interpretation: score.interpretation,
      });
    }

    // Sort
    scoredContent.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'score':
          comparison = a.overallScore - b.overallScore;
          break;
        case 'date':
          comparison = a.publishedAt.getTime() - b.publishedAt.getTime();
          break;
        case 'engagement':
          comparison = a.engagementScore - b.engagementScore;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const total = scoredContent.length;
    const items = scoredContent.slice(offset, offset + limit);

    return { items, total };
  }

  /**
   * Get quality trends over time
   * AC: #4 - Quality trend over time (7/14/30 days)
   */
  async getQualityTrends(
    organizationId: string,
    days: 7 | 14 | 30 = 7
  ): Promise<QualityTrendPoint[]> {
    const endDate = dayjs();
    const startDate = endDate.subtract(days, 'day');

    const trends: QualityTrendPoint[] = [];

    for (let i = 0; i < days; i++) {
      const date = startDate.add(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');

      // Get content published on this date
      const content = await this._prismaService.analyticsContent.findMany({
        where: {
          organizationId,
          publishedAt: {
            gte: date.startOf('day').toDate(),
            lte: date.endOf('day').toDate(),
          },
          deletedAt: null,
        },
      });

      if (content.length === 0) {
        trends.push({
          date: dateStr,
          averageScore: 0,
          contentCount: 0,
          engagementAvg: 0,
          watchTimeAvg: 0,
          complianceAvg: 0,
          consistencyAvg: 0,
        });
        continue;
      }

      // Calculate scores for each content
      let totalScore = 0;
      let totalEngagement = 0;
      let totalWatchTime = 0;
      let totalCompliance = 0;
      let totalConsistency = 0;

      for (const c of content) {
        const score = await this.calculateQualityScore(organizationId, c.id);
        if (score) {
          totalScore += score.overallScore;
          totalEngagement += score.engagementScore;
          totalWatchTime += score.watchTimeScore;
          totalCompliance += score.complianceScore;
          totalConsistency += score.consistencyScore;
        }
      }

      const count = content.length;
      trends.push({
        date: dateStr,
        averageScore: Math.round(totalScore / count),
        contentCount: count,
        engagementAvg: Math.round(totalEngagement / count),
        watchTimeAvg: Math.round(totalWatchTime / count),
        complianceAvg: Math.round(totalCompliance / count),
        consistencyAvg: Math.round(totalConsistency / count),
      });
    }

    return trends;
  }

  /**
   * Calculate engagement score (0-100)
   * Based on likes, comments, shares relative to reach
   */
  private calculateEngagementScore(metrics: any[]): number {
    if (metrics.length === 0) return 50; // Default score

    const totalReach = metrics.reduce((sum, m) => sum + (m.reach || 0), 0);
    const totalReactions = metrics.reduce((sum, m) => sum + (m.reactions || 0), 0);
    const totalComments = metrics.reduce((sum, m) => sum + (m.comments || 0), 0);
    const totalShares = metrics.reduce((sum, m) => sum + (m.shares || 0), 0);

    if (totalReach === 0) return 50;

    const totalEngagement = totalReactions + totalComments + totalShares;
    const engagementRate = (totalEngagement / totalReach) * 100;

    // Normalize to 0-100 scale
    // Assuming 10% engagement rate is excellent (100 score)
    // 0% is poor (0 score)
    const score = Math.min(100, Math.round(engagementRate * 10));

    return score;
  }

  /**
   * Calculate watch time score (0-100)
   * Based on video views and completion rate
   * [ASSUMPTION: Using video views as proxy for watch time quality]
   */
  private calculateWatchTimeScore(metrics: any[], contentType: string): number {
    // For non-video content, default to 70
    if (contentType !== 'reel' && contentType !== 'video') {
      return 70;
    }

    if (metrics.length === 0) return 50;

    const totalViews = metrics.reduce((sum, m) => sum + (m.videoViews || 0), 0);
    const totalReach = metrics.reduce((sum, m) => sum + (m.reach || 0), 0);

    if (totalReach === 0) return 50;

    // View-to-reach ratio as quality indicator
    const viewRate = (totalViews / totalReach) * 100;

    // Normalize: 80% view rate = 100 score
    const score = Math.min(100, Math.round(viewRate * 1.25));

    return score;
  }

  /**
   * Calculate compliance score (0-100)
   * [ASSUMPTION: Default to 80 if no violations detected - no violation tracking yet]
   */
  private async calculateComplianceScore(content: any): Promise<number> {
    // Check for potential issues in caption
    const caption = content.caption || '';

    let score = 100;

    // Deduct for potential clickbait patterns
    const clickbaitPatterns = [
      /you won't believe/i,
      /shocking/i,
      /must see/i,
      /click here/i,
    ];

    for (const pattern of clickbaitPatterns) {
      if (pattern.test(caption)) {
        score -= 10;
      }
    }

    // Deduct for excessive caps
    const capsRatio = (caption.match(/[A-Z]/g) || []).length / (caption.length || 1);
    if (capsRatio > 0.5 && caption.length > 10) {
      score -= 15;
    }

    // Deduct for excessive hashtags
    const hashtagCount = (caption.match(/#/g) || []).length;
    if (hashtagCount > 15) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate consistency score (0-100)
   * Based on posting frequency around the content's publish date
   */
  private async calculateConsistencyScore(
    organizationId: string,
    integrationId: string,
    publishedAt: Date
  ): Promise<number> {
    // Check posting frequency in the week around this content
    const weekBefore = dayjs(publishedAt).subtract(7, 'day').toDate();
    const weekAfter = dayjs(publishedAt).add(7, 'day').toDate();

    const postsInPeriod = await this._prismaService.analyticsContent.count({
      where: {
        organizationId,
        integrationId,
        publishedAt: {
          gte: weekBefore,
          lte: weekAfter,
        },
        deletedAt: null,
      },
    });

    // Ideal: 1-2 posts per day = 7-14 posts per week
    // Score based on proximity to ideal
    if (postsInPeriod >= 7 && postsInPeriod <= 14) {
      return 100;
    } else if (postsInPeriod >= 4 && postsInPeriod < 7) {
      return 80;
    } else if (postsInPeriod >= 14 && postsInPeriod <= 21) {
      return 75;
    } else if (postsInPeriod >= 2 && postsInPeriod < 4) {
      return 60;
    } else if (postsInPeriod > 21) {
      return 50; // Over-posting
    } else {
      return 40; // Under-posting
    }
  }

  /**
   * Get improvement suggestions for low-scoring factors
   * AC: #5 - Highlight areas needing improvement
   */
  private getImprovementSuggestions(scores: {
    engagementScore: number;
    watchTimeScore: number;
    complianceScore: number;
    consistencyScore: number;
  }): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    if (scores.engagementScore < 60) {
      suggestions.push({
        factor: 'engagement',
        currentScore: scores.engagementScore,
        priority: scores.engagementScore < 40 ? 'high' : 'medium',
        suggestion: 'Tăng tương tác bằng cách đặt câu hỏi, sử dụng CTA rõ ràng, và phản hồi comments nhanh chóng.',
      });
    }

    if (scores.watchTimeScore < 60) {
      suggestions.push({
        factor: 'watchTime',
        currentScore: scores.watchTimeScore,
        priority: scores.watchTimeScore < 40 ? 'high' : 'medium',
        suggestion: 'Cải thiện hook trong 3 giây đầu, giữ video ngắn gọn và có giá trị xuyên suốt.',
      });
    }

    if (scores.complianceScore < 80) {
      suggestions.push({
        factor: 'compliance',
        currentScore: scores.complianceScore,
        priority: scores.complianceScore < 60 ? 'high' : 'low',
        suggestion: 'Tránh clickbait, giảm hashtag spam, và đảm bảo nội dung tuân thủ guidelines.',
      });
    }

    if (scores.consistencyScore < 60) {
      suggestions.push({
        factor: 'consistency',
        currentScore: scores.consistencyScore,
        priority: scores.consistencyScore < 40 ? 'high' : 'medium',
        suggestion: 'Duy trì lịch đăng bài đều đặn 1-2 bài/ngày để tối ưu reach.',
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return suggestions;
  }

  /**
   * Get score interpretation text
   */
  private getScoreInterpretation(score: number): string {
    if (score >= 80) return 'Excellent quality';
    if (score >= 60) return 'Good quality';
    if (score >= 40) return 'Average, needs improvement';
    return 'Poor quality, action required';
  }
}
