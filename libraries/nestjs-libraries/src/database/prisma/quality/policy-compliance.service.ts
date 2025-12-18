import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { EngagementBaitService } from './engagement-bait.service';
import dayjs from 'dayjs';

export type ViolationSeverity = 'critical' | 'high' | 'medium' | 'low';
export type PolicyCategory = 'partner_monetization' | 'content_monetization';

export interface PolicyRule {
  id: string;
  category: PolicyCategory;
  name: string;
  description: string;
  checkFn: (content: string) => boolean;
  severity: ViolationSeverity;
  fixSuggestion: string;
}

export interface PolicyViolation {
  ruleId: string;
  policyName: string;
  category: PolicyCategory;
  severity: ViolationSeverity;
  description: string;
  matchedContent?: string;
  fixSuggestion: string;
}

export interface ComplianceCheckResult {
  isCompliant: boolean;
  complianceScore: number;
  violations: PolicyViolation[];
  checkedPolicies: number;
  passedPolicies: number;
  recommendations: string[];
}

export interface ComplianceHistoryItem {
  contentId: string;
  externalContentId: string;
  caption: string | null;
  publishedAt: Date;
  complianceScore: number;
  violationCount: number;
  severity: ViolationSeverity | 'none';
}

export interface ComplianceTrendPoint {
  date: string;
  averageScore: number;
  contentCount: number;
  violationCount: number;
}

export interface ComplianceHistory {
  trends: ComplianceTrendPoint[];
  recentViolations: ComplianceHistoryItem[];
  totalContent: number;
  totalViolations: number;
  averageScore: number;
}

// Policy rules database
const POLICY_RULES: PolicyRule[] = [
  // Partner Monetization Policies
  {
    id: 'pm-original-content',
    category: 'partner_monetization',
    name: 'Original Content',
    description: 'Content must be original or properly licensed',
    checkFn: (content: string) => {
      // Check for common repost indicators
      const repostPatterns = [
        /\b(repost|via|credit|source|originally posted)\b/gi,
        /📷\s*@/gi,
        /\bDM\s+for\s+credit\b/gi,
      ];
      return !repostPatterns.some((p) => p.test(content));
    },
    severity: 'critical',
    fixSuggestion: 'Ensure content is original or properly credit the source with permission',
  },
  {
    id: 'pm-community-standards',
    category: 'partner_monetization',
    name: 'Community Standards',
    description: 'Content must comply with community standards',
    checkFn: (content: string) => {
      // Check for potentially harmful content
      const harmfulPatterns = [
        /\b(hate|violence|threat|abuse)\b/gi,
        /\b(kill|murder|attack)\b/gi,
      ];
      return !harmfulPatterns.some((p) => p.test(content));
    },
    severity: 'critical',
    fixSuggestion: 'Remove any content that promotes hate, violence, or harmful behavior',
  },

  // Content Monetization Policies
  {
    id: 'cm-clickbait',
    category: 'content_monetization',
    name: 'No Clickbait',
    description: 'Content must not use clickbait tactics',
    checkFn: (content: string) => {
      const clickbaitPatterns = [
        /\byou won't believe\b/gi,
        /\bshocking\b/gi,
        /\bmust see\b/gi,
        /\bclick here\b/gi,
        /\b(number|#)\s*\d+\s+will\s+(shock|surprise|blow)\b/gi,
        /\bwait (until|till) the end\b/gi,
      ];
      return !clickbaitPatterns.some((p) => p.test(content));
    },
    severity: 'high',
    fixSuggestion: 'Use descriptive, accurate titles instead of sensationalized language',
  },
  {
    id: 'cm-engagement-solicitation',
    category: 'content_monetization',
    name: 'No Engagement Solicitation',
    description: 'Do not explicitly ask for likes, shares, or comments',
    checkFn: (content: string) => {
      const engagementPatterns = [
        /\blike\s+(this|if)\b/gi,
        /\bshare\s+(this|if|now|with)\b/gi,
        /\bcomment\s+(yes|no|below|if)\b/gi,
        /\btag\s+\d*\s*friends?\b/gi,
        /\bhit\s+(the\s+)?like\b/gi,
        /\bsmash\s+(the\s+)?like\b/gi,
      ];
      return !engagementPatterns.some((p) => p.test(content));
    },
    severity: 'high',
    fixSuggestion: 'Focus on creating valuable content that naturally encourages engagement',
  },
  {
    id: 'cm-misleading-medical',
    category: 'content_monetization',
    name: 'No Misleading Medical Information',
    description: 'Content must not contain unverified medical claims',
    checkFn: (content: string) => {
      const medicalPatterns = [
        /\b(cure|cures|cured)\s+(cancer|diabetes|covid)\b/gi,
        /\bmiracl(e|ous)\s+(cure|treatment|remedy)\b/gi,
        /\bdoctors\s+(hate|don't want)\b/gi,
        /\b(big pharma|anti-vax|antivaxx)\b/gi,
      ];
      return !medicalPatterns.some((p) => p.test(content));
    },
    severity: 'critical',
    fixSuggestion: 'Consult medical professionals and cite reputable sources for health-related content',
  },
  {
    id: 'cm-controversial-topics',
    category: 'content_monetization',
    name: 'Sensitive Topics',
    description: 'Avoid divisive or highly controversial topics',
    checkFn: (content: string) => {
      const sensitivePatterns = [
        /\b(election fraud|rigged election)\b/gi,
        /\b(conspiracy|illuminati|deep state)\b/gi,
      ];
      return !sensitivePatterns.some((p) => p.test(content));
    },
    severity: 'medium',
    fixSuggestion: 'Present balanced perspectives and avoid promoting conspiracy theories',
  },
  {
    id: 'cm-advertiser-friendly',
    category: 'content_monetization',
    name: 'Advertiser-Friendly Content',
    description: 'Content should be suitable for all advertisers',
    checkFn: (content: string) => {
      const profanityPatterns = [
        /\b(fuck|shit|damn|ass|bitch)\b/gi,
        /\b(wtf|stfu|lmao)\b/gi,
      ];
      return !profanityPatterns.some((p) => p.test(content));
    },
    severity: 'medium',
    fixSuggestion: 'Use appropriate language suitable for all audiences',
  },
  {
    id: 'cm-excessive-caps',
    category: 'content_monetization',
    name: 'Avoid Excessive Capitalization',
    description: 'Content should not use excessive capital letters',
    checkFn: (content: string) => {
      if (content.length < 20) return true;
      const capsCount = (content.match(/[A-Z]/g) || []).length;
      const capsRatio = capsCount / content.length;
      return capsRatio < 0.5;
    },
    severity: 'low',
    fixSuggestion: 'Use normal capitalization for better readability',
  },
  {
    id: 'cm-excessive-hashtags',
    category: 'content_monetization',
    name: 'Reasonable Hashtag Usage',
    description: 'Limit hashtags to maintain content quality',
    checkFn: (content: string) => {
      const hashtagCount = (content.match(/#/g) || []).length;
      return hashtagCount <= 15;
    },
    severity: 'low',
    fixSuggestion: 'Limit hashtags to 5-10 relevant tags for optimal reach',
  },
  {
    id: 'cm-spam-patterns',
    category: 'content_monetization',
    name: 'No Spam Patterns',
    description: 'Content should not contain spam-like patterns',
    checkFn: (content: string) => {
      const spamPatterns = [
        /\b(free money|get rich quick|make \$\d+)\b/gi,
        /\b(dm me|inbox me|message me) for\b/gi,
        /\b(link in bio|check link|click link)\b/gi,
        /🔥{3,}|❤️{3,}|💰{3,}/g,
      ];
      return !spamPatterns.some((p) => p.test(content));
    },
    severity: 'high',
    fixSuggestion: 'Avoid spam-like language and excessive emojis',
  },
];

@Injectable()
export class PolicyComplianceService {
  constructor(
    private _prismaService: PrismaService,
    private _engagementBaitService: EngagementBaitService
  ) {}

  /**
   * Check content compliance against all policies
   * AC: #1, #2, #3, #4 - Check and explain violations
   */
  checkCompliance(contentDraft: string): ComplianceCheckResult {
    if (!contentDraft || contentDraft.trim().length === 0) {
      return {
        isCompliant: true,
        complianceScore: 100,
        violations: [],
        checkedPolicies: 0,
        passedPolicies: 0,
        recommendations: [],
      };
    }

    const violations: PolicyViolation[] = [];
    const recommendations: string[] = [];
    let passedCount = 0;

    for (const rule of POLICY_RULES) {
      const passes = rule.checkFn(contentDraft);
      if (passes) {
        passedCount++;
      } else {
        violations.push({
          ruleId: rule.id,
          policyName: rule.name,
          category: rule.category,
          severity: rule.severity,
          description: rule.description,
          fixSuggestion: rule.fixSuggestion,
        });
      }
    }

    // Also check with engagement bait service
    const baitResult = this._engagementBaitService.detectEngagementBait(contentDraft);
    if (baitResult.hasBait) {
      recommendations.push('Engagement bait detected. Consider rephrasing to avoid algorithm penalties.');
    }

    // Calculate compliance score (0-100, higher = more compliant)
    let score = 100;
    for (const v of violations) {
      switch (v.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }
    score = Math.max(0, score);

    // Add general recommendations
    if (violations.length > 0) {
      recommendations.push(
        'Review and address all policy violations before publishing to maintain monetization eligibility.'
      );
    }
    if (violations.some((v) => v.severity === 'critical')) {
      recommendations.push(
        'Critical violations detected. Publishing this content may result in immediate monetization suspension.'
      );
    }

    return {
      isCompliant: violations.length === 0,
      complianceScore: score,
      violations,
      checkedPolicies: POLICY_RULES.length,
      passedPolicies: passedCount,
      recommendations,
    };
  }

  /**
   * Get compliance history for organization
   * AC: #5 - Show compliance trends and past violations
   */
  async getComplianceHistory(
    organizationId: string,
    days: 7 | 14 | 30 = 7
  ): Promise<ComplianceHistory> {
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
    const recentViolations: ComplianceHistoryItem[] = [];
    const dailyData: Map<
      string,
      { scores: number[]; violations: number; total: number }
    > = new Map();

    for (const item of content) {
      const check = this.checkCompliance(item.caption || '');
      const dateStr = dayjs(item.publishedAt).format('YYYY-MM-DD');

      // Track daily data
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, { scores: [], violations: 0, total: 0 });
      }
      const dayData = dailyData.get(dateStr)!;
      dayData.scores.push(check.complianceScore);
      dayData.total++;
      if (!check.isCompliant) {
        dayData.violations++;
      }

      // Add to violations list if not compliant
      if (!check.isCompliant) {
        let maxSeverity: ViolationSeverity = 'low';
        if (check.violations.some((v) => v.severity === 'critical')) {
          maxSeverity = 'critical';
        } else if (check.violations.some((v) => v.severity === 'high')) {
          maxSeverity = 'high';
        } else if (check.violations.some((v) => v.severity === 'medium')) {
          maxSeverity = 'medium';
        }

        recentViolations.push({
          contentId: item.id,
          externalContentId: item.externalContentId,
          caption: item.caption,
          publishedAt: item.publishedAt,
          complianceScore: check.complianceScore,
          violationCount: check.violations.length,
          severity: maxSeverity,
        });
      }
    }

    // Build trends
    const trends: ComplianceTrendPoint[] = [];
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
          violationCount: dayData.violations,
        });
      } else {
        trends.push({
          date: dateStr,
          averageScore: 100,
          contentCount: 0,
          violationCount: 0,
        });
      }
    }

    // Calculate overall stats
    const totalContent = content.length;
    const totalViolations = recentViolations.length;
    const allScores = content.map(
      (c) => this.checkCompliance(c.caption || '').complianceScore
    );
    const averageScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 100;

    return {
      trends,
      recentViolations,
      totalContent,
      totalViolations,
      averageScore,
    };
  }

  /**
   * Get all policy rules (for reference)
   */
  getPolicies(): Array<{
    id: string;
    category: PolicyCategory;
    name: string;
    description: string;
    severity: ViolationSeverity;
  }> {
    return POLICY_RULES.map((r) => ({
      id: r.id,
      category: r.category,
      name: r.name,
      description: r.description,
      severity: r.severity,
    }));
  }

  /**
   * Get policies by category
   */
  getPoliciesByCategory(
    category: PolicyCategory
  ): Array<{
    id: string;
    name: string;
    description: string;
    severity: ViolationSeverity;
  }> {
    return POLICY_RULES.filter((r) => r.category === category).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      severity: r.severity,
    }));
  }
}
