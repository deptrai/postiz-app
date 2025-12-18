import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import dayjs from 'dayjs';

export type SensitiveCategory =
  | 'violence'
  | 'adult'
  | 'controversial'
  | 'drugs_alcohol'
  | 'profanity'
  | 'tragedy'
  | 'misinformation';

export type AdImpact = 'no_ads' | 'limited' | 'some_restrictions' | 'none';

export interface SensitiveTopic {
  category: SensitiveCategory;
  matchedKeywords: string[];
  impact: AdImpact;
  severity: 'critical' | 'high' | 'medium' | 'low';
  explanation: string;
  suggestion: string;
}

export interface CategoryScore {
  category: SensitiveCategory;
  score: number;
  flagged: boolean;
  keywords: string[];
}

export interface AdFriendlyResult {
  overallScore: number;
  isAdFriendly: boolean;
  interpretation: string;
  categoryBreakdown: CategoryScore[];
  sensitiveTopics: SensitiveTopic[];
  suggestions: string[];
}

export interface AdFriendlyReportItem {
  contentId: string;
  externalContentId: string;
  caption: string | null;
  publishedAt: Date;
  adFriendlyScore: number;
  isAdFriendly: boolean;
  flaggedCategories: SensitiveCategory[];
}

export interface AdFriendlyTrendPoint {
  date: string;
  averageScore: number;
  contentCount: number;
  adFriendlyCount: number;
  adFriendlyPercentage: number;
}

export interface AdFriendlyReport {
  totalContent: number;
  adFriendlyCount: number;
  adFriendlyPercentage: number;
  averageScore: number;
  categoryStats: Record<SensitiveCategory, number>;
  flaggedContent: AdFriendlyReportItem[];
  trends: AdFriendlyTrendPoint[];
}

// Sensitive topics database with keywords
const SENSITIVE_TOPICS_DB: Record<
  SensitiveCategory,
  {
    keywords: RegExp[];
    impact: AdImpact;
    severity: 'critical' | 'high' | 'medium' | 'low';
    explanation: string;
    suggestion: string;
  }
> = {
  violence: {
    keywords: [
      /\b(kill|murder|shoot|stab|fight|attack|assault|weapon|gun|knife)\b/gi,
      /\b(blood|gore|death|die|dead|dying|wound|injury)\b/gi,
      /\b(violence|violent|brutality|torture|abuse)\b/gi,
    ],
    impact: 'limited',
    severity: 'high',
    explanation: 'Content contains violence-related keywords that may limit ad availability',
    suggestion: 'Consider removing or softening violent references to improve ad eligibility',
  },
  adult: {
    keywords: [
      /\b(sex|sexual|nude|nudity|porn|erotic|xxx)\b/gi,
      /\b(naked|strip|explicit|nsfw)\b/gi,
      /\b(18\+|adult only|mature content)\b/gi,
    ],
    impact: 'no_ads',
    severity: 'critical',
    explanation: 'Adult content is not eligible for monetization',
    suggestion: 'Remove all adult or sexually suggestive content',
  },
  controversial: {
    keywords: [
      /\b(politic|political|democrat|republican|liberal|conservative)\b/gi,
      /\b(religion|religious|atheist|muslim|christian|jewish|hindu)\b/gi,
      /\b(abortion|immigration|refugee|racist|racism)\b/gi,
      /\b(war|military|soldier|army|terrorist|terrorism)\b/gi,
    ],
    impact: 'limited',
    severity: 'medium',
    explanation: 'Controversial topics may limit advertiser participation',
    suggestion: 'Consider presenting balanced perspectives or focusing on non-divisive aspects',
  },
  drugs_alcohol: {
    keywords: [
      /\b(drug|drugs|weed|marijuana|cocaine|heroin|meth)\b/gi,
      /\b(alcohol|drunk|drinking|beer|wine|vodka|whiskey)\b/gi,
      /\b(smoke|smoking|cigarette|vape|vaping)\b/gi,
      /\b(high|stoned|intoxicated|hangover)\b/gi,
    ],
    impact: 'limited',
    severity: 'high',
    explanation: 'Drug and alcohol content has limited advertiser support',
    suggestion: 'Minimize references to substance use or promote responsible messaging',
  },
  profanity: {
    keywords: [
      /\b(fuck|shit|damn|ass|bitch|bastard)\b/gi,
      /\b(crap|hell|piss)\b/gi,
      /\b(wtf|stfu|lmao|af)\b/gi,
    ],
    impact: 'limited',
    severity: 'medium',
    explanation: 'Strong language may reduce ad variety',
    suggestion: 'Replace profanity with milder alternatives or remove entirely',
  },
  tragedy: {
    keywords: [
      /\b(disaster|earthquake|flood|hurricane|tornado)\b/gi,
      /\b(accident|crash|collision|fire|explosion)\b/gi,
      /\b(tragedy|tragic|death|funeral|mourning|grief)\b/gi,
      /\b(suicide|self-harm|mental health crisis)\b/gi,
    ],
    impact: 'limited',
    severity: 'medium',
    explanation: 'Tragedy-related content may have limited ad support',
    suggestion: 'Consider timing and sensitivity when discussing tragic events',
  },
  misinformation: {
    keywords: [
      /\b(fake news|hoax|conspiracy|cover-up)\b/gi,
      /\b(illuminati|deep state|new world order)\b/gi,
      /\b(miracle cure|big pharma|anti-vax)\b/gi,
      /\b(rigged|fraud|stolen election)\b/gi,
    ],
    impact: 'no_ads',
    severity: 'critical',
    explanation: 'Misinformation content is not eligible for monetization',
    suggestion: 'Ensure all claims are fact-checked and cite reliable sources',
  },
};

const CATEGORY_LABELS: Record<SensitiveCategory, string> = {
  violence: 'Violence',
  adult: 'Adult Content',
  controversial: 'Controversial Topics',
  drugs_alcohol: 'Drugs & Alcohol',
  profanity: 'Profanity',
  tragedy: 'Tragedy',
  misinformation: 'Misinformation',
};

@Injectable()
export class AdvertiserFriendlyService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Score content for advertiser-friendliness
   * AC: #1, #2 - Score and show category breakdown
   */
  scoreAdFriendliness(content: string): AdFriendlyResult {
    if (!content || content.trim().length === 0) {
      return {
        overallScore: 100,
        isAdFriendly: true,
        interpretation: 'Fully ad-friendly, all advertisers',
        categoryBreakdown: this._getEmptyCategoryBreakdown(),
        sensitiveTopics: [],
        suggestions: [],
      };
    }

    const sensitiveTopics: SensitiveTopic[] = [];
    const categoryBreakdown: CategoryScore[] = [];
    let totalPenalty = 0;

    for (const [category, config] of Object.entries(SENSITIVE_TOPICS_DB)) {
      const cat = category as SensitiveCategory;
      const matchedKeywords: string[] = [];

      for (const regex of config.keywords) {
        const matches = content.match(regex);
        if (matches) {
          matchedKeywords.push(...matches.map((m) => m.toLowerCase()));
        }
      }

      // Remove duplicates
      const uniqueKeywords = [...new Set(matchedKeywords)];
      const flagged = uniqueKeywords.length > 0;

      // Calculate category score (100 = clean, 0 = heavily flagged)
      let categoryScore = 100;
      if (flagged) {
        const penalty = this._getPenalty(config.impact, uniqueKeywords.length);
        categoryScore = Math.max(0, 100 - penalty);
        totalPenalty += penalty;

        sensitiveTopics.push({
          category: cat,
          matchedKeywords: uniqueKeywords,
          impact: config.impact,
          severity: config.severity,
          explanation: config.explanation,
          suggestion: config.suggestion,
        });
      }

      categoryBreakdown.push({
        category: cat,
        score: categoryScore,
        flagged,
        keywords: uniqueKeywords,
      });
    }

    // Calculate overall score
    const overallScore = Math.max(0, 100 - totalPenalty);
    const isAdFriendly = overallScore >= 70;

    // Determine interpretation
    let interpretation: string;
    if (overallScore >= 90) {
      interpretation = 'Fully ad-friendly, all advertisers';
    } else if (overallScore >= 70) {
      interpretation = 'Mostly ad-friendly, some restrictions';
    } else if (overallScore >= 50) {
      interpretation = 'Limited ad-friendly, many restrictions';
    } else {
      interpretation = 'Not ad-friendly, minimal/no ads';
    }

    // Generate suggestions
    const suggestions = this._generateSuggestions(sensitiveTopics, overallScore);

    return {
      overallScore,
      isAdFriendly,
      interpretation,
      categoryBreakdown,
      sensitiveTopics,
      suggestions,
    };
  }

  /**
   * Get ad-friendly report for organization
   * AC: #4, #5 - Show percentage and trends
   */
  async getAdFriendlyReport(
    organizationId: string,
    days: 7 | 14 | 30 = 7
  ): Promise<AdFriendlyReport> {
    const endDate = dayjs();
    const startDate = endDate.subtract(days, 'day');

    // Get content for the period
    const content = await this._prismaService.analyticsContent.findMany({
      where: {
        organizationId,
        publishedAt: {
          gte: startDate.toDate(),
          lte: endDate.toDate(),
        },
        deletedAt: null,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    // Analyze each content item
    const flaggedContent: AdFriendlyReportItem[] = [];
    const dailyData: Map<
      string,
      { scores: number[]; adFriendlyCount: number; total: number }
    > = new Map();
    const categoryStats: Record<SensitiveCategory, number> = {
      violence: 0,
      adult: 0,
      controversial: 0,
      drugs_alcohol: 0,
      profanity: 0,
      tragedy: 0,
      misinformation: 0,
    };

    let totalAdFriendly = 0;
    const allScores: number[] = [];

    for (const item of content) {
      const result = this.scoreAdFriendliness(item.caption || '');
      const dateStr = dayjs(item.publishedAt).format('YYYY-MM-DD');

      allScores.push(result.overallScore);

      // Track daily data
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, { scores: [], adFriendlyCount: 0, total: 0 });
      }
      const dayData = dailyData.get(dateStr)!;
      dayData.scores.push(result.overallScore);
      dayData.total++;
      if (result.isAdFriendly) {
        dayData.adFriendlyCount++;
        totalAdFriendly++;
      }

      // Track category stats
      for (const topic of result.sensitiveTopics) {
        categoryStats[topic.category]++;
      }

      // Add to flagged list if not ad-friendly
      if (!result.isAdFriendly) {
        flaggedContent.push({
          contentId: item.id,
          externalContentId: item.externalContentId,
          caption: item.caption,
          publishedAt: item.publishedAt,
          adFriendlyScore: result.overallScore,
          isAdFriendly: result.isAdFriendly,
          flaggedCategories: result.sensitiveTopics.map((t) => t.category),
        });
      }
    }

    // Build trends
    const trends: AdFriendlyTrendPoint[] = [];
    for (let i = 0; i < days; i++) {
      const date = startDate.add(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const dayData = dailyData.get(dateStr);

      if (dayData && dayData.total > 0) {
        const avgScore =
          dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length;
        trends.push({
          date: dateStr,
          averageScore: Math.round(avgScore),
          contentCount: dayData.total,
          adFriendlyCount: dayData.adFriendlyCount,
          adFriendlyPercentage: Math.round(
            (dayData.adFriendlyCount / dayData.total) * 100
          ),
        });
      } else {
        trends.push({
          date: dateStr,
          averageScore: 100,
          contentCount: 0,
          adFriendlyCount: 0,
          adFriendlyPercentage: 100,
        });
      }
    }

    // Calculate overall stats
    const totalContent = content.length;
    const adFriendlyPercentage =
      totalContent > 0 ? Math.round((totalAdFriendly / totalContent) * 100) : 100;
    const averageScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 100;

    return {
      totalContent,
      adFriendlyCount: totalAdFriendly,
      adFriendlyPercentage,
      averageScore,
      categoryStats,
      flaggedContent,
      trends,
    };
  }

  /**
   * Get category labels for display
   */
  getCategoryLabels(): Record<SensitiveCategory, string> {
    return CATEGORY_LABELS;
  }

  /**
   * Get penalty based on impact and keyword count
   */
  private _getPenalty(impact: AdImpact, keywordCount: number): number {
    const basePenalty: Record<AdImpact, number> = {
      no_ads: 50,
      limited: 25,
      some_restrictions: 15,
      none: 0,
    };

    // Add extra penalty for multiple keywords (up to 2x base)
    const multiplier = Math.min(2, 1 + keywordCount * 0.2);
    return Math.round(basePenalty[impact] * multiplier);
  }

  /**
   * Generate suggestions based on detected topics
   */
  private _generateSuggestions(
    topics: SensitiveTopic[],
    score: number
  ): string[] {
    const suggestions: string[] = [];

    if (topics.length === 0) {
      return ['Your content is ad-friendly! Keep up the good work.'];
    }

    // Add specific suggestions from topics
    for (const topic of topics) {
      suggestions.push(`${CATEGORY_LABELS[topic.category]}: ${topic.suggestion}`);
    }

    // Add general recommendations
    if (score < 50) {
      suggestions.push(
        'Consider significantly revising content to improve monetization potential.'
      );
    } else if (score < 70) {
      suggestions.push(
        'Minor adjustments could help improve ad eligibility for more advertisers.'
      );
    }

    if (topics.some((t) => t.impact === 'no_ads')) {
      suggestions.push(
        'Critical: Content contains elements that prevent all ad monetization.'
      );
    }

    return suggestions;
  }

  /**
   * Get empty category breakdown for clean content
   */
  private _getEmptyCategoryBreakdown(): CategoryScore[] {
    return Object.keys(SENSITIVE_TOPICS_DB).map((cat) => ({
      category: cat as SensitiveCategory,
      score: 100,
      flagged: false,
      keywords: [],
    }));
  }
}
