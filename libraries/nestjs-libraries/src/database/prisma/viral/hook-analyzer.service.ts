import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

// Hook opening types
export type HookOpeningType = 'question' | 'statement' | 'action' | 'curiosity' | 'problem' | 'unknown';

// Input interface
export interface HookMetadata {
  hookText: string;
  caption?: string;
  contentType?: 'reel' | 'video' | 'post' | 'story';
  hasQuickCuts?: boolean;
  hasMusic?: boolean;
  hasSoundEffects?: boolean;
  hasVoiceover?: boolean;
}

// Score breakdown interface
export interface HookScoreBreakdown {
  openingType: number;    // 0-100
  pacing: number;         // 0-100
  visualImpact: number;   // 0-100
  audioHook: number;      // 0-100
}

// Hook recommendation
export interface HookRecommendation {
  factor: keyof HookScoreBreakdown;
  currentScore: number;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  potentialGain: number;
}

// Hook pattern
export interface HookPattern {
  type: HookOpeningType;
  name: string;
  description: string;
  example: string;
  successRate: number;
  bestFor: string[];
}

// Main hook analysis result
export interface HookAnalysisResult {
  effectivenessScore: number;
  openingType: HookOpeningType;
  breakdown: HookScoreBreakdown;
  interpretation: string;
  recommendations: HookRecommendation[];
  matchedPatterns: HookPattern[];
}

// Comparison result
export interface HookComparisonResult {
  rankings: Array<{
    hookId: string;
    score: number;
    rank: number;
    openingType: HookOpeningType;
    breakdown: HookScoreBreakdown;
  }>;
}

@Injectable()
export class HookAnalyzerService {
  // Scoring weights (total = 100%)
  private readonly WEIGHTS = {
    openingType: 0.30,
    pacing: 0.25,
    visualImpact: 0.25,
    audioHook: 0.20,
  };

  // Hook opening type patterns
  private readonly OPENING_PATTERNS: Record<HookOpeningType, RegExp[]> = {
    question: [
      /^(did you|have you|do you|are you|can you|would you|what if|why do|how do|ever wonder)/i,
      /\?$/,
      /^(what|why|how|when|where|who|which)/i,
    ],
    statement: [
      /^(this is|here's|i'm going to|let me|watch this|check this|look at)/i,
      /^(the secret|the truth|the reason|the problem|the solution)/i,
      /(changed my life|changed everything|you need to know|you won't believe)/i,
    ],
    action: [
      /^(watch|look|see|check out|try this|do this|follow)/i,
      /^(step \d|first|next|now)/i,
      /(let's go|here we go|let's do)/i,
    ],
    curiosity: [
      /^(wait|wait for it|you'll never guess|guess what|bet you|plot twist)/i,
      /(at the end|until the end|stay tuned|keep watching)/i,
      /\.\.\./,
    ],
    problem: [
      /^(struggling|tired of|sick of|frustrated|can't|don't know how)/i,
      /^(if you|when you|ever had|having trouble)/i,
      /(problem|issue|challenge|difficulty|hard to)/i,
    ],
    unknown: [],
  };

  // Power words for hooks
  private readonly HOOK_POWER_WORDS = [
    'secret', 'amazing', 'shocking', 'incredible', 'unbelievable',
    'viral', 'trending', 'hack', 'trick', 'tip', 'mistake',
    'never', 'always', 'must', 'need', 'stop', 'start',
    'free', 'easy', 'fast', 'simple', 'proven', 'guaranteed',
  ];

  // Pre-defined hook patterns database
  private readonly HOOK_PATTERNS: HookPattern[] = [
    {
      type: 'question',
      name: 'Curiosity Question',
      description: 'Start with a thought-provoking question that makes viewers want to know the answer',
      example: 'Did you know 90% of people do this wrong?',
      successRate: 85,
      bestFor: ['educational', 'tips', 'how-to'],
    },
    {
      type: 'question',
      name: 'Personal Question',
      description: 'Ask a question that relates to viewer\'s personal experience',
      example: 'Have you ever struggled with this?',
      successRate: 78,
      bestFor: ['lifestyle', 'self-improvement', 'relatable'],
    },
    {
      type: 'statement',
      name: 'Bold Claim',
      description: 'Make a bold statement that demands attention',
      example: 'This one trick changed everything for me',
      successRate: 82,
      bestFor: ['transformation', 'results', 'testimonial'],
    },
    {
      type: 'statement',
      name: 'Secret Reveal',
      description: 'Promise to reveal insider knowledge',
      example: 'Here\'s what nobody tells you about...',
      successRate: 80,
      bestFor: ['insider tips', 'industry secrets', 'expert advice'],
    },
    {
      type: 'action',
      name: 'Direct Action',
      description: 'Jump straight into the action without preamble',
      example: 'Watch this transformation happen in real-time',
      successRate: 75,
      bestFor: ['tutorials', 'demonstrations', 'before-after'],
    },
    {
      type: 'action',
      name: 'Step-by-Step',
      description: 'Start with the first step immediately',
      example: 'Step 1: Start with this...',
      successRate: 72,
      bestFor: ['how-to', 'recipes', 'DIY'],
    },
    {
      type: 'curiosity',
      name: 'Cliffhanger',
      description: 'Create suspense that makes viewers wait for the payoff',
      example: 'Wait for it... you won\'t believe what happens',
      successRate: 88,
      bestFor: ['entertainment', 'reveals', 'surprises'],
    },
    {
      type: 'curiosity',
      name: 'Plot Twist Tease',
      description: 'Hint at an unexpected outcome',
      example: 'I thought this would fail, but then...',
      successRate: 84,
      bestFor: ['stories', 'experiments', 'challenges'],
    },
    {
      type: 'problem',
      name: 'Pain Point',
      description: 'Address a common frustration viewers experience',
      example: 'Tired of wasting money on things that don\'t work?',
      successRate: 79,
      bestFor: ['solutions', 'products', 'services'],
    },
    {
      type: 'problem',
      name: 'Common Mistake',
      description: 'Point out a mistake viewers might be making',
      example: 'Stop making this mistake that\'s costing you...',
      successRate: 81,
      bestFor: ['educational', 'warnings', 'corrections'],
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analyze hook effectiveness (AC #1, #2)
   */
  async analyzeHook(
    organizationId: string,
    metadata: HookMetadata
  ): Promise<HookAnalysisResult> {
    const { hookText } = metadata;

    // Detect opening type
    const openingType = this.detectOpeningType(hookText);

    // Calculate individual factor scores
    const breakdown: HookScoreBreakdown = {
      openingType: this.calculateOpeningTypeScore(hookText, openingType),
      pacing: this.calculatePacingScore(metadata),
      visualImpact: this.calculateVisualImpactScore(hookText, metadata),
      audioHook: this.calculateAudioHookScore(metadata),
    };

    // Calculate weighted overall score
    const effectivenessScore = Math.round(
      breakdown.openingType * this.WEIGHTS.openingType +
      breakdown.pacing * this.WEIGHTS.pacing +
      breakdown.visualImpact * this.WEIGHTS.visualImpact +
      breakdown.audioHook * this.WEIGHTS.audioHook
    );

    // Get interpretation
    const interpretation = this.getScoreInterpretation(effectivenessScore);

    // Generate recommendations (AC #4)
    const recommendations = this.generateRecommendations(breakdown, openingType);

    // Find matched patterns (AC #3)
    const matchedPatterns = this.findMatchedPatterns(hookText, openingType);

    return {
      effectivenessScore,
      openingType,
      breakdown,
      interpretation,
      recommendations,
      matchedPatterns,
    };
  }

  /**
   * Get successful hook patterns (AC #3, #4)
   */
  async getHookPatterns(
    niche?: string,
    openingType?: HookOpeningType
  ): Promise<HookPattern[]> {
    let patterns = [...this.HOOK_PATTERNS];

    // Filter by opening type if specified
    if (openingType) {
      patterns = patterns.filter((p) => p.type === openingType);
    }

    // Filter by niche if specified
    if (niche) {
      const nicheLower = niche.toLowerCase();
      patterns = patterns.filter((p) =>
        p.bestFor.some((b) => b.toLowerCase().includes(nicheLower))
      );
    }

    // Sort by success rate
    return patterns.sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Compare multiple hooks (AC #5)
   */
  async compareHooks(
    organizationId: string,
    hooks: Array<{ id: string; metadata: HookMetadata }>
  ): Promise<HookComparisonResult> {
    const analyzedHooks = await Promise.all(
      hooks.map(async (hook) => {
        const result = await this.analyzeHook(organizationId, hook.metadata);
        return {
          hookId: hook.id,
          score: result.effectivenessScore,
          openingType: result.openingType,
          breakdown: result.breakdown,
        };
      })
    );

    // Sort by score descending and assign ranks
    const rankings = analyzedHooks
      .sort((a, b) => b.score - a.score)
      .map((hook, index) => ({
        ...hook,
        rank: index + 1,
      }));

    return { rankings };
  }

  /**
   * Detect the opening type of a hook
   */
  private detectOpeningType(hookText: string): HookOpeningType {
    const text = hookText.toLowerCase().trim();

    for (const [type, patterns] of Object.entries(this.OPENING_PATTERNS)) {
      if (type === 'unknown') continue;

      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return type as HookOpeningType;
        }
      }
    }

    return 'unknown';
  }

  /**
   * Calculate opening type score
   */
  private calculateOpeningTypeScore(hookText: string, openingType: HookOpeningType): number {
    let score = 50; // Base score

    // Known opening type bonus
    if (openingType !== 'unknown') {
      score += 20;
    }

    // Power words bonus
    const lowerHook = hookText.toLowerCase();
    const powerWordCount = this.HOOK_POWER_WORDS.filter((word) =>
      lowerHook.includes(word)
    ).length;
    score += Math.min(powerWordCount * 8, 24);

    // Length optimization (5-15 words ideal)
    const wordCount = hookText.split(/\s+/).length;
    if (wordCount >= 5 && wordCount <= 15) {
      score += 10;
    } else if (wordCount < 3) {
      score -= 15; // Too short
    } else if (wordCount > 20) {
      score -= 10; // Too long
    }

    // Emoji bonus (attention-grabbing)
    if (/[\u{1F300}-\u{1F9FF}]/u.test(hookText)) {
      score += 5;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate pacing score based on metadata
   * [ASSUMPTION: Pacing is inferred from content type and metadata flags]
   */
  private calculatePacingScore(metadata: HookMetadata): number {
    let score = 50; // Base score

    // Quick cuts indicate fast pacing (good for hooks)
    if (metadata.hasQuickCuts) {
      score += 25;
    }

    // Content type affects expected pacing
    switch (metadata.contentType) {
      case 'reel':
        score += 20; // Reels are fast-paced
        break;
      case 'story':
        score += 15;
        break;
      case 'video':
        score += 10;
        break;
      case 'post':
        score += 5;
        break;
    }

    // Short hook text suggests faster pacing
    const wordCount = metadata.hookText.split(/\s+/).length;
    if (wordCount <= 8) {
      score += 10;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate visual impact score
   * [ASSUMPTION: Visual impact is inferred from text cues and content type]
   */
  private calculateVisualImpactScore(hookText: string, metadata: HookMetadata): number {
    let score = 50; // Base score

    // Visual action words
    const visualWords = ['watch', 'look', 'see', 'check', 'show', 'reveal', 'transform'];
    const lowerHook = hookText.toLowerCase();
    const visualWordCount = visualWords.filter((word) => lowerHook.includes(word)).length;
    score += Math.min(visualWordCount * 10, 20);

    // Reels and videos have higher visual impact potential
    if (metadata.contentType === 'reel' || metadata.contentType === 'video') {
      score += 15;
    }

    // Emojis add visual interest
    const emojiCount = (hookText.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    score += Math.min(emojiCount * 5, 15);

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate audio hook score
   * [ASSUMPTION: Audio presence is provided via metadata flags]
   */
  private calculateAudioHookScore(metadata: HookMetadata): number {
    let score = 40; // Base score

    // Music adds engagement
    if (metadata.hasMusic) {
      score += 25;
    }

    // Sound effects grab attention
    if (metadata.hasSoundEffects) {
      score += 20;
    }

    // Voiceover adds personal connection
    if (metadata.hasVoiceover) {
      score += 15;
    }

    // Video content types typically have audio
    if (metadata.contentType === 'reel' || metadata.contentType === 'video') {
      score += 10;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Get score interpretation text
   */
  private getScoreInterpretation(score: number): string {
    if (score >= 80) return 'Highly effective hook';
    if (score >= 60) return 'Good hook potential';
    if (score >= 40) return 'Average effectiveness';
    return 'Needs improvement';
  }

  /**
   * Generate recommendations based on scores
   */
  private generateRecommendations(
    breakdown: HookScoreBreakdown,
    openingType: HookOpeningType
  ): HookRecommendation[] {
    const recommendations: HookRecommendation[] = [];

    // Opening type recommendations
    if (breakdown.openingType < 70) {
      recommendations.push({
        factor: 'openingType',
        currentScore: breakdown.openingType,
        suggestion: openingType === 'unknown'
          ? 'Use a clear opening pattern: question, bold statement, or curiosity hook'
          : 'Add power words like "secret", "amazing", or "must-know" to strengthen your hook',
        impact: breakdown.openingType < 50 ? 'high' : 'medium',
        potentialGain: Math.min(100 - breakdown.openingType, 30),
      });
    }

    // Pacing recommendations
    if (breakdown.pacing < 70) {
      recommendations.push({
        factor: 'pacing',
        currentScore: breakdown.pacing,
        suggestion: 'Use quick cuts in the first 3 seconds to maintain viewer attention',
        impact: breakdown.pacing < 50 ? 'high' : 'medium',
        potentialGain: Math.min(100 - breakdown.pacing, 25),
      });
    }

    // Visual impact recommendations
    if (breakdown.visualImpact < 70) {
      recommendations.push({
        factor: 'visualImpact',
        currentScore: breakdown.visualImpact,
        suggestion: 'Start with visually striking content - movement, bright colors, or unexpected visuals',
        impact: breakdown.visualImpact < 50 ? 'high' : 'medium',
        potentialGain: Math.min(100 - breakdown.visualImpact, 25),
      });
    }

    // Audio hook recommendations
    if (breakdown.audioHook < 70) {
      recommendations.push({
        factor: 'audioHook',
        currentScore: breakdown.audioHook,
        suggestion: 'Add trending music or a strong voiceover to capture attention immediately',
        impact: breakdown.audioHook < 50 ? 'high' : 'medium',
        potentialGain: Math.min(100 - breakdown.audioHook, 20),
      });
    }

    // Sort by impact and potential gain
    return recommendations.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      if (impactOrder[a.impact] !== impactOrder[b.impact]) {
        return impactOrder[a.impact] - impactOrder[b.impact];
      }
      return b.potentialGain - a.potentialGain;
    });
  }

  /**
   * Find patterns that match the hook
   */
  private findMatchedPatterns(hookText: string, openingType: HookOpeningType): HookPattern[] {
    // Return patterns matching the detected opening type
    return this.HOOK_PATTERNS
      .filter((p) => p.type === openingType)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3);
  }
}
