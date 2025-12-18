import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import dayjs from 'dayjs';

export interface BaitPattern {
  id: string;
  type: 'like' | 'share' | 'comment' | 'tag' | 'vote' | 'reaction';
  pattern: RegExp;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  authenticAlternative: string;
}

export interface DetectedBait {
  patternId: string;
  type: string;
  matchedText: string;
  startIndex: number;
  endIndex: number;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  authenticAlternative: string;
}

export interface BaitDetectionResult {
  caption: string;
  baitScore: number;
  hasBait: boolean;
  detectedPatterns: DetectedBait[];
  overallSeverity: 'high' | 'medium' | 'low' | 'none';
  suggestions: string[];
}

export interface PrePublishCheckResult {
  isClean: boolean;
  baitScore: number;
  warnings: Array<{
    type: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
  recommendations: string[];
}

export interface BaitReportItem {
  contentId: string;
  externalContentId: string;
  caption: string | null;
  publishedAt: Date;
  baitScore: number;
  detectedPatterns: number;
  severity: 'high' | 'medium' | 'low' | 'none';
}

export interface BaitTrendPoint {
  date: string;
  averageBaitScore: number;
  contentCount: number;
  flaggedCount: number;
}

export interface BaitReport {
  trends: BaitTrendPoint[];
  flaggedContent: BaitReportItem[];
  totalContent: number;
  totalFlagged: number;
  averageBaitScore: number;
}

// Bait patterns database based on story requirements
const BAIT_PATTERNS: BaitPattern[] = [
  // Like Bait - High Severity
  {
    id: 'like-1',
    type: 'like',
    pattern: /\blike\s+this\s*(post|video|photo|pic)?\s*[!.]*\b/gi,
    severity: 'high',
    explanation: 'Directly asking for likes is considered engagement bait by Facebook and can reduce your reach.',
    authenticAlternative: 'What do you think about this?',
  },
  {
    id: 'like-2',
    type: 'like',
    pattern: /\bhit\s+(that\s+)?like\s+button\b/gi,
    severity: 'high',
    explanation: 'Asking users to hit the like button is flagged as engagement bait.',
    authenticAlternative: 'Let me know your thoughts!',
  },
  {
    id: 'like-3',
    type: 'like',
    pattern: /\bsmash\s+(that\s+)?like\b/gi,
    severity: 'high',
    explanation: 'Aggressive like requests are penalized by social media algorithms.',
    authenticAlternative: 'Did you find this helpful?',
  },
  {
    id: 'like-4',
    type: 'like',
    pattern: /\bdouble\s+tap\s+if\b/gi,
    severity: 'medium',
    explanation: 'Conditional like requests are considered engagement bait.',
    authenticAlternative: 'Can you relate to this?',
  },

  // Share Bait - High Severity
  {
    id: 'share-1',
    type: 'share',
    pattern: /\bshare\s+(this\s+)?(now|today|immediately)\s*[!.]*\b/gi,
    severity: 'high',
    explanation: 'Urgently asking for shares is flagged as engagement bait.',
    authenticAlternative: 'Know someone who would find this helpful?',
  },
  {
    id: 'share-2',
    type: 'share',
    pattern: /\bshare\s+(with|to)\s+(your\s+)?friends\b/gi,
    severity: 'high',
    explanation: 'Directly asking to share with friends is considered bait.',
    authenticAlternative: 'Who comes to mind when you see this?',
  },
  {
    id: 'share-3',
    type: 'share',
    pattern: /\bshare\s+if\s+you\s+agree\b/gi,
    severity: 'high',
    explanation: 'Conditional share requests are penalized.',
    authenticAlternative: 'Do you agree with this perspective?',
  },

  // Comment Bait - Medium Severity
  {
    id: 'comment-1',
    type: 'comment',
    pattern: /\bcomment\s+(yes|no|amen|done)\s*(if|below)?\b/gi,
    severity: 'medium',
    explanation: 'Asking for specific word comments is engagement bait.',
    authenticAlternative: 'Share your experience in the comments',
  },
  {
    id: 'comment-2',
    type: 'comment',
    pattern: /\btype\s+(yes|amen|done)\s+in\s+(the\s+)?comments?\b/gi,
    severity: 'medium',
    explanation: 'Requesting specific typed responses is flagged.',
    authenticAlternative: 'What are your thoughts on this?',
  },
  {
    id: 'comment-3',
    type: 'comment',
    pattern: /\bdrop\s+a\s+(comment|emoji)\b/gi,
    severity: 'medium',
    explanation: 'Asking users to drop comments is considered bait.',
    authenticAlternative: 'I would love to hear your perspective',
  },

  // Tag Bait - Medium Severity
  {
    id: 'tag-1',
    type: 'tag',
    pattern: /\btag\s+(\d+\s+)?friends?\b/gi,
    severity: 'medium',
    explanation: 'Asking to tag friends is engagement bait.',
    authenticAlternative: 'Who comes to mind when you see this?',
  },
  {
    id: 'tag-2',
    type: 'tag',
    pattern: /\btag\s+someone\s+who\b/gi,
    severity: 'medium',
    explanation: 'Tag requests are penalized by algorithms.',
    authenticAlternative: 'Does this remind you of anyone?',
  },

  // Vote Bait - High Severity
  {
    id: 'vote-1',
    type: 'vote',
    pattern: /\blike\s+for\s+\w+[,\s]+(comment|share)\s+for\s+\w+\b/gi,
    severity: 'high',
    explanation: 'Vote-style engagement requests are heavily penalized.',
    authenticAlternative: 'Which option do you prefer and why?',
  },
  {
    id: 'vote-2',
    type: 'vote',
    pattern: /\breact\s+with\s+.+\s+for\b/gi,
    severity: 'high',
    explanation: 'Reaction voting is flagged as engagement bait.',
    authenticAlternative: 'What is your choice? Share in the comments!',
  },

  // Reaction Bait - Medium Severity
  {
    id: 'reaction-1',
    type: 'reaction',
    pattern: /\breact\s+with\s+(❤️|😍|😢|😡|👍|🔥)\s+if\b/gi,
    severity: 'medium',
    explanation: 'Conditional reaction requests are engagement bait.',
    authenticAlternative: 'How does this make you feel?',
  },
  {
    id: 'reaction-2',
    type: 'reaction',
    pattern: /\b(❤️|😍|😢|😡|👍)\s*=\s*\w+\b/gi,
    severity: 'medium',
    explanation: 'Emoji voting is considered engagement bait.',
    authenticAlternative: 'Share your reaction in the comments!',
  },
];

@Injectable()
export class EngagementBaitService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Detect engagement bait patterns in caption
   * AC: #1, #2 - Flag clickbait patterns and explain why problematic
   */
  detectEngagementBait(caption: string): BaitDetectionResult {
    if (!caption || caption.trim().length === 0) {
      return {
        caption,
        baitScore: 0,
        hasBait: false,
        detectedPatterns: [],
        overallSeverity: 'none',
        suggestions: [],
      };
    }

    const detectedPatterns: DetectedBait[] = [];
    const suggestions: string[] = [];

    for (const baitPattern of BAIT_PATTERNS) {
      const matches = caption.matchAll(baitPattern.pattern);

      for (const match of matches) {
        if (match.index !== undefined) {
          detectedPatterns.push({
            patternId: baitPattern.id,
            type: baitPattern.type,
            matchedText: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            severity: baitPattern.severity,
            explanation: baitPattern.explanation,
            authenticAlternative: baitPattern.authenticAlternative,
          });

          if (!suggestions.includes(baitPattern.authenticAlternative)) {
            suggestions.push(baitPattern.authenticAlternative);
          }
        }
      }
    }

    // Calculate bait score (0-100, higher = more bait)
    let baitScore = 0;
    for (const pattern of detectedPatterns) {
      switch (pattern.severity) {
        case 'high':
          baitScore += 30;
          break;
        case 'medium':
          baitScore += 20;
          break;
        case 'low':
          baitScore += 10;
          break;
      }
    }
    baitScore = Math.min(100, baitScore);

    // Determine overall severity
    let overallSeverity: 'high' | 'medium' | 'low' | 'none' = 'none';
    if (detectedPatterns.some((p) => p.severity === 'high')) {
      overallSeverity = 'high';
    } else if (detectedPatterns.some((p) => p.severity === 'medium')) {
      overallSeverity = 'medium';
    } else if (detectedPatterns.length > 0) {
      overallSeverity = 'low';
    }

    return {
      caption,
      baitScore,
      hasBait: detectedPatterns.length > 0,
      detectedPatterns,
      overallSeverity,
      suggestions,
    };
  }

  /**
   * Get authentic alternatives for detected bait patterns
   * AC: #3 - Suggest authentic alternatives
   */
  getAuthenticAlternatives(
    detectedPatterns: DetectedBait[]
  ): Array<{ original: string; alternative: string; type: string }> {
    return detectedPatterns.map((pattern) => ({
      original: pattern.matchedText,
      alternative: pattern.authenticAlternative,
      type: pattern.type,
    }));
  }

  /**
   * Pre-publish check for bait patterns
   * AC: #4 - Scan for bait patterns before posting
   */
  checkBeforePublish(contentDraft: string): PrePublishCheckResult {
    const detection = this.detectEngagementBait(contentDraft);

    const warnings = detection.detectedPatterns.map((pattern) => ({
      type: pattern.type,
      message: `Found "${pattern.matchedText}" - ${pattern.explanation}`,
      severity: pattern.severity,
      suggestion: pattern.authenticAlternative,
    }));

    const recommendations: string[] = [];

    if (detection.hasBait) {
      recommendations.push(
        'Consider removing or rephrasing engagement bait phrases to avoid algorithm penalties.'
      );
      recommendations.push(
        'Focus on creating valuable content that naturally encourages engagement.'
      );
    }

    if (detection.overallSeverity === 'high') {
      recommendations.push(
        'High-severity bait detected. This content may be significantly penalized by Facebook.'
      );
    }

    return {
      isClean: !detection.hasBait,
      baitScore: detection.baitScore,
      warnings,
      recommendations,
    };
  }

  /**
   * Get bait report for organization
   * AC: #5 - Show bait score trends and flagged content
   */
  async getBaitReport(
    organizationId: string,
    days: 7 | 14 | 30 = 7
  ): Promise<BaitReport> {
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
    const flaggedContent: BaitReportItem[] = [];
    const dailyData: Map<
      string,
      { scores: number[]; flagged: number; total: number }
    > = new Map();

    for (const item of content) {
      const detection = this.detectEngagementBait(item.caption || '');
      const dateStr = dayjs(item.publishedAt).format('YYYY-MM-DD');

      // Track daily data
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, { scores: [], flagged: 0, total: 0 });
      }
      const dayData = dailyData.get(dateStr)!;
      dayData.scores.push(detection.baitScore);
      dayData.total++;
      if (detection.hasBait) {
        dayData.flagged++;
      }

      // Add to flagged content if bait detected
      if (detection.hasBait) {
        flaggedContent.push({
          contentId: item.id,
          externalContentId: item.externalContentId,
          caption: item.caption,
          publishedAt: item.publishedAt,
          baitScore: detection.baitScore,
          detectedPatterns: detection.detectedPatterns.length,
          severity: detection.overallSeverity,
        });
      }
    }

    // Build trends
    const trends: BaitTrendPoint[] = [];
    for (let i = 0; i < days; i++) {
      const date = startDate.add(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const dayData = dailyData.get(dateStr);

      if (dayData && dayData.total > 0) {
        const avgScore =
          dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length;
        trends.push({
          date: dateStr,
          averageBaitScore: Math.round(avgScore),
          contentCount: dayData.total,
          flaggedCount: dayData.flagged,
        });
      } else {
        trends.push({
          date: dateStr,
          averageBaitScore: 0,
          contentCount: 0,
          flaggedCount: 0,
        });
      }
    }

    // Calculate overall stats
    const totalContent = content.length;
    const totalFlagged = flaggedContent.length;
    const allScores = content.map(
      (c) => this.detectEngagementBait(c.caption || '').baitScore
    );
    const averageBaitScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0;

    return {
      trends,
      flaggedContent,
      totalContent,
      totalFlagged,
      averageBaitScore,
    };
  }

  /**
   * Get all available bait patterns (for reference)
   */
  getBaitPatterns(): Array<{
    id: string;
    type: string;
    severity: string;
    explanation: string;
  }> {
    return BAIT_PATTERNS.map((p) => ({
      id: p.id,
      type: p.type,
      severity: p.severity,
      explanation: p.explanation,
    }));
  }
}
