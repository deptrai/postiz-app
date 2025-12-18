import { Injectable } from '@nestjs/common';

// Content format types
export type ContentFormat = 'reel' | 'video' | 'post' | 'story';

// Caption tone types
export type CaptionTone = 'casual' | 'professional' | 'humorous' | 'educational' | 'inspirational';

// Caption length category
export type CaptionLength = 'short' | 'medium' | 'long';

// CTA types
export type CTAType = 'engagement' | 'action' | 'save' | 'share' | 'none';

// Caption analysis result
export interface CaptionAnalysis {
  length: number;
  lengthCategory: CaptionLength;
  tone: CaptionTone;
  toneConfidence: number;
  keywords: Array<{ word: string; count: number; importance: number }>;
  emojiUsage: {
    count: number;
    emojis: string[];
    placement: 'start' | 'middle' | 'end' | 'throughout' | 'none';
  };
  readability: number; // 0-100
  suggestions: string[];
}

// Hashtag analysis result
export interface HashtagAnalysis {
  count: number;
  optimal: boolean; // 5-15 is optimal
  hashtags: Array<{
    tag: string;
    trending: boolean;
    relevanceScore: number;
    reach: 'high' | 'medium' | 'low';
  }>;
  overallScore: number;
  suggestions: string[];
}

// Format analysis result
export interface FormatAnalysis {
  format: ContentFormat;
  formatScore: number;
  videoLength?: {
    seconds: number;
    optimal: boolean;
    recommendation: string;
  };
  performanceInsights: {
    reachPotential: 'high' | 'medium' | 'low';
    engagementPotential: 'high' | 'medium' | 'low';
    recommendation: string;
  };
  suggestions: string[];
}

// CTA analysis result
export interface CTAAnalysis {
  detected: boolean;
  types: Array<{
    type: CTAType;
    text: string;
    effectiveness: number;
    position: 'start' | 'middle' | 'end';
  }>;
  overallEffectiveness: number;
  suggestions: string[];
}

// Full content elements analysis
export interface ContentElementsAnalysis {
  contentId?: string;
  caption: CaptionAnalysis;
  hashtags: HashtagAnalysis;
  format: FormatAnalysis;
  cta: CTAAnalysis;
  overallScore: number;
  topStrengths: string[];
  areasToImprove: string[];
}

// Content metadata input
export interface ContentMetadata {
  caption?: string;
  hashtags?: string[];
  contentType?: ContentFormat;
  videoLength?: number;
}

// Successful patterns result
export interface SuccessfulPatterns {
  captionPatterns: Array<{
    pattern: string;
    description: string;
    effectiveness: number;
    example: string;
  }>;
  hashtagPatterns: Array<{
    pattern: string;
    description: string;
    effectiveness: number;
    example: string[];
  }>;
  formatPatterns: Array<{
    format: ContentFormat;
    bestPractices: string[];
    optimalLength?: string;
  }>;
  ctaPatterns: Array<{
    type: CTAType;
    examples: string[];
    effectiveness: number;
  }>;
}

@Injectable()
export class ContentElementsService {
  // Emoji regex pattern
  private readonly EMOJI_REGEX = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;

  // Common viral keywords [ASSUMPTION: Based on social media best practices]
  private readonly VIRAL_KEYWORDS = [
    'free', 'new', 'exclusive', 'limited', 'secret', 'amazing', 'incredible',
    'must-see', 'viral', 'trending', 'breaking', 'shocking', 'revealed',
    'tips', 'tricks', 'hacks', 'guide', 'tutorial', 'how-to', 'learn',
    'save', 'share', 'follow', 'comment', 'like', 'subscribe'
  ];

  // CTA patterns [ASSUMPTION: Common CTA phrases in social media]
  private readonly CTA_PATTERNS: Record<CTAType, RegExp[]> = {
    engagement: [
      /comment\s+(below|your|what)/i,
      /share\s+your\s+(thoughts|opinion)/i,
      /what\s+do\s+you\s+think/i,
      /let\s+me\s+know/i,
      /tell\s+me/i,
      /drop\s+a/i,
    ],
    action: [
      /click\s+(the\s+)?link/i,
      /follow\s+(me|us|for)/i,
      /subscribe/i,
      /check\s+out/i,
      /visit/i,
      /download/i,
      /sign\s+up/i,
    ],
    save: [
      /save\s+(this|for)/i,
      /bookmark/i,
      /save\s+it/i,
    ],
    share: [
      /tag\s+(a\s+)?friend/i,
      /share\s+(this|with)/i,
      /send\s+(this\s+)?to/i,
      /repost/i,
    ],
    none: [],
  };

  // Tone indicators [ASSUMPTION: Word patterns indicating tone]
  private readonly TONE_INDICATORS: Record<CaptionTone, string[]> = {
    casual: ['hey', 'omg', 'lol', 'btw', 'gonna', 'wanna', 'gotta', 'yall', 'vibes', 'lit', 'lowkey'],
    professional: ['announcing', 'introducing', 'presenting', 'launching', 'discover', 'explore', 'experience'],
    humorous: ['joke', 'funny', 'hilarious', 'lmao', 'rofl', 'dead', 'crying', 'bruh', 'mood'],
    educational: ['learn', 'tip', 'trick', 'how to', 'guide', 'tutorial', 'step', 'fact', 'did you know'],
    inspirational: ['believe', 'dream', 'achieve', 'success', 'motivation', 'inspire', 'never give up', 'mindset'],
  };

  // Trending hashtags [ASSUMPTION: Sample trending hashtags - in production would be fetched from API]
  private readonly TRENDING_HASHTAGS = [
    'viral', 'trending', 'fyp', 'foryou', 'foryoupage', 'explore', 'reels',
    'instagram', 'tiktok', 'motivation', 'fitness', 'lifestyle', 'fashion',
    'beauty', 'food', 'travel', 'tech', 'business', 'entrepreneur'
  ];

  /**
   * Analyze all content elements
   */
  async analyzeContentElements(
    organizationId: string,
    metadata: ContentMetadata,
    contentId?: string
  ): Promise<ContentElementsAnalysis> {
    const caption = metadata.caption || '';
    const hashtags = metadata.hashtags || this.extractHashtags(caption);
    const contentType = metadata.contentType || 'post';
    const videoLength = metadata.videoLength;

    // Perform all analyses
    const captionAnalysis = this.analyzeCaption(caption);
    const hashtagAnalysis = this.analyzeHashtags(hashtags);
    const formatAnalysis = this.analyzeFormat(contentType, videoLength);
    const ctaAnalysis = this.analyzeCTA(caption);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      captionAnalysis,
      hashtagAnalysis,
      formatAnalysis,
      ctaAnalysis
    );

    // Identify strengths and areas to improve
    const { strengths, improvements } = this.identifyStrengthsAndImprovements(
      captionAnalysis,
      hashtagAnalysis,
      formatAnalysis,
      ctaAnalysis
    );

    return {
      contentId,
      caption: captionAnalysis,
      hashtags: hashtagAnalysis,
      format: formatAnalysis,
      cta: ctaAnalysis,
      overallScore,
      topStrengths: strengths,
      areasToImprove: improvements,
    };
  }

  /**
   * Get successful patterns
   */
  async getSuccessfulPatterns(organizationId: string): Promise<SuccessfulPatterns> {
    return {
      captionPatterns: [
        {
          pattern: 'hook-value-cta',
          description: 'Start with a hook, provide value, end with CTA',
          effectiveness: 85,
          example: '🔥 This changed everything! Here are 5 tips that doubled my engagement. Save this for later! 👇',
        },
        {
          pattern: 'question-story-ask',
          description: 'Ask a question, tell a story, ask for engagement',
          effectiveness: 78,
          example: 'Ever wondered why some posts go viral? I tested 100 posts and here\'s what I found... What\'s your experience?',
        },
        {
          pattern: 'list-format',
          description: 'Numbered list of tips or points',
          effectiveness: 82,
          example: '3 things I wish I knew earlier:\n1. Consistency > perfection\n2. Engage with your audience\n3. Quality over quantity',
        },
        {
          pattern: 'controversy-opinion',
          description: 'Share a controversial opinion to spark discussion',
          effectiveness: 75,
          example: 'Unpopular opinion: Posting every day is NOT the key to growth. Here\'s why...',
        },
      ],
      hashtagPatterns: [
        {
          pattern: 'mixed-reach',
          description: 'Mix of high, medium, and low competition hashtags',
          effectiveness: 88,
          example: ['#viral', '#contentcreator', '#smallbusiness', '#growthstrategies', '#nichekeyword'],
        },
        {
          pattern: 'niche-focused',
          description: 'Highly relevant hashtags for your niche',
          effectiveness: 82,
          example: ['#fitnessmotivation', '#workoutideas', '#healthylifestyle', '#gymlife'],
        },
        {
          pattern: 'trending-plus-niche',
          description: 'Combine trending hashtags with niche-specific ones',
          effectiveness: 85,
          example: ['#trending', '#fyp', '#yourniche', '#specifichashtag'],
        },
      ],
      formatPatterns: [
        {
          format: 'reel',
          bestPractices: [
            'Keep under 30 seconds for highest completion rate',
            'Hook in first 3 seconds',
            'Use trending audio',
            'Add captions/text overlay',
          ],
          optimalLength: '15-30 seconds',
        },
        {
          format: 'video',
          bestPractices: [
            'Strong thumbnail',
            'Clear value proposition',
            'Chapters for longer videos',
            'End screen with CTA',
          ],
          optimalLength: '3-10 minutes',
        },
        {
          format: 'post',
          bestPractices: [
            'High-quality images',
            'Carousel for higher engagement',
            'First slide as hook',
            'Consistent aesthetic',
          ],
        },
        {
          format: 'story',
          bestPractices: [
            'Interactive elements (polls, questions)',
            'Behind-the-scenes content',
            'Multiple slides for engagement',
            'Link stickers for traffic',
          ],
        },
      ],
      ctaPatterns: [
        {
          type: 'engagement',
          examples: [
            'Comment "YES" if you agree!',
            'Drop a 🔥 in the comments!',
            'What do you think? Let me know below!',
          ],
          effectiveness: 85,
        },
        {
          type: 'save',
          examples: [
            'Save this for later! 📌',
            'Bookmark this post!',
            'You\'ll want to save this one!',
          ],
          effectiveness: 78,
        },
        {
          type: 'share',
          examples: [
            'Tag someone who needs to see this!',
            'Share this with a friend!',
            'Send this to someone who...',
          ],
          effectiveness: 72,
        },
        {
          type: 'action',
          examples: [
            'Click the link in bio!',
            'Follow for more tips!',
            'Subscribe for weekly content!',
          ],
          effectiveness: 65,
        },
      ],
    };
  }

  // ========== CAPTION ANALYSIS ==========

  /**
   * Analyze caption
   */
  private analyzeCaption(caption: string): CaptionAnalysis {
    const cleanCaption = this.cleanCaption(caption);
    const length = cleanCaption.length;
    const lengthCategory = this.getCaptionLengthCategory(length);
    const { tone, confidence } = this.detectTone(cleanCaption);
    const keywords = this.extractKeywords(cleanCaption);
    const emojiUsage = this.analyzeEmojiUsage(caption);
    const readability = this.calculateReadability(cleanCaption);
    const suggestions = this.generateCaptionSuggestions(
      lengthCategory,
      tone,
      keywords,
      emojiUsage
    );

    return {
      length,
      lengthCategory,
      tone,
      toneConfidence: confidence,
      keywords,
      emojiUsage,
      readability,
      suggestions,
    };
  }

  private cleanCaption(caption: string): string {
    return caption
      .replace(/#\w+/g, '') // Remove hashtags
      .replace(this.EMOJI_REGEX, '') // Remove emojis
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private getCaptionLengthCategory(length: number): CaptionLength {
    if (length < 50) return 'short';
    if (length <= 150) return 'medium';
    return 'long';
  }

  private detectTone(caption: string): { tone: CaptionTone; confidence: number } {
    const lowerCaption = caption.toLowerCase();
    const scores: Record<CaptionTone, number> = {
      casual: 0,
      professional: 0,
      humorous: 0,
      educational: 0,
      inspirational: 0,
    };

    for (const [tone, indicators] of Object.entries(this.TONE_INDICATORS)) {
      for (const indicator of indicators) {
        if (lowerCaption.includes(indicator)) {
          scores[tone as CaptionTone] += 1;
        }
      }
    }

    const maxScore = Math.max(...Object.values(scores));
    const detectedTone = (Object.entries(scores).find(([, score]) => score === maxScore)?.[0] || 'casual') as CaptionTone;
    const confidence = maxScore > 0 ? Math.min(100, (maxScore / 3) * 100) : 50;

    return { tone: detectedTone, confidence };
  }

  private extractKeywords(caption: string): Array<{ word: string; count: number; importance: number }> {
    const words = caption.toLowerCase().split(/\s+/);
    const wordCounts: Record<string, number> = {};

    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
      }
    }

    return Object.entries(wordCounts)
      .map(([word, count]) => ({
        word,
        count,
        importance: this.VIRAL_KEYWORDS.includes(word) ? 100 : count * 20,
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
  }

  private analyzeEmojiUsage(caption: string): CaptionAnalysis['emojiUsage'] {
    const emojis = caption.match(this.EMOJI_REGEX) || [];
    const count = emojis.length;

    if (count === 0) {
      return { count: 0, emojis: [], placement: 'none' };
    }

    const firstEmojiIndex = caption.search(this.EMOJI_REGEX);
    const lastEmojiIndex = caption.length - [...caption].reverse().join('').search(this.EMOJI_REGEX);
    const captionLength = caption.length;

    let placement: CaptionAnalysis['emojiUsage']['placement'] = 'throughout';
    if (firstEmojiIndex < captionLength * 0.2) {
      placement = 'start';
    } else if (lastEmojiIndex > captionLength * 0.8) {
      placement = 'end';
    } else if (firstEmojiIndex > captionLength * 0.3 && lastEmojiIndex < captionLength * 0.7) {
      placement = 'middle';
    }

    return { count, emojis: [...new Set(emojis)], placement };
  }

  private calculateReadability(caption: string): number {
    const words = caption.split(/\s+/).filter(w => w.length > 0);
    const sentences = caption.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (words.length === 0 || sentences.length === 0) return 50;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength = words.join('').length / words.length;

    // Simple readability score (higher = easier to read)
    let score = 100 - (avgWordsPerSentence * 2) - (avgWordLength * 5);
    return Math.max(0, Math.min(100, score));
  }

  private generateCaptionSuggestions(
    lengthCategory: CaptionLength,
    tone: CaptionTone,
    keywords: Array<{ word: string; count: number; importance: number }>,
    emojiUsage: CaptionAnalysis['emojiUsage']
  ): string[] {
    const suggestions: string[] = [];

    if (lengthCategory === 'short') {
      suggestions.push('Consider adding more context or storytelling to increase engagement');
    } else if (lengthCategory === 'long') {
      suggestions.push('Long captions can work, but ensure the hook is in the first line');
    }

    if (emojiUsage.count === 0) {
      suggestions.push('Add 1-3 relevant emojis to increase visual appeal');
    } else if (emojiUsage.count > 10) {
      suggestions.push('Consider reducing emoji usage for a cleaner look');
    }

    const hasViralKeywords = keywords.some(k => this.VIRAL_KEYWORDS.includes(k.word));
    if (!hasViralKeywords) {
      suggestions.push('Include action words like "discover", "learn", or "exclusive"');
    }

    return suggestions;
  }

  // ========== HASHTAG ANALYSIS ==========

  /**
   * Analyze hashtags
   */
  private analyzeHashtags(hashtags: string[]): HashtagAnalysis {
    const count = hashtags.length;
    const optimal = count >= 5 && count <= 15;

    const analyzedTags = hashtags.map(tag => {
      const cleanTag = tag.replace('#', '').toLowerCase();
      const trending = this.TRENDING_HASHTAGS.includes(cleanTag);
      const relevanceScore = this.calculateHashtagRelevance(cleanTag);
      const reach = this.estimateHashtagReach(cleanTag);

      return { tag, trending, relevanceScore, reach };
    });

    const overallScore = this.calculateHashtagOverallScore(analyzedTags, count);
    const suggestions = this.generateHashtagSuggestions(analyzedTags, count);

    return {
      count,
      optimal,
      hashtags: analyzedTags,
      overallScore,
      suggestions,
    };
  }

  private extractHashtags(caption: string): string[] {
    const matches = caption.match(/#\w+/g) || [];
    return matches.map(tag => tag.substring(1));
  }

  private calculateHashtagRelevance(tag: string): number {
    if (this.TRENDING_HASHTAGS.includes(tag)) return 90;
    if (tag.length < 5) return 40;
    if (tag.length > 20) return 50;
    return 70;
  }

  private estimateHashtagReach(tag: string): 'high' | 'medium' | 'low' {
    if (this.TRENDING_HASHTAGS.includes(tag)) return 'high';
    if (tag.length < 8) return 'medium';
    return 'low';
  }

  private calculateHashtagOverallScore(
    hashtags: HashtagAnalysis['hashtags'],
    count: number
  ): number {
    if (count === 0) return 0;

    let score = 50;

    // Count bonus/penalty
    if (count >= 5 && count <= 15) score += 20;
    else if (count < 5) score -= 10;
    else score -= 5;

    // Trending bonus
    const trendingCount = hashtags.filter(h => h.trending).length;
    score += trendingCount * 5;

    // Relevance average
    const avgRelevance = hashtags.reduce((sum, h) => sum + h.relevanceScore, 0) / count;
    score += (avgRelevance - 50) / 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateHashtagSuggestions(
    hashtags: HashtagAnalysis['hashtags'],
    count: number
  ): string[] {
    const suggestions: string[] = [];

    if (count === 0) {
      suggestions.push('Add 5-15 relevant hashtags to increase discoverability');
    } else if (count < 5) {
      suggestions.push('Add more hashtags (optimal: 5-15) for better reach');
    } else if (count > 15) {
      suggestions.push('Consider reducing hashtags - too many can look spammy');
    }

    const trendingCount = hashtags.filter(h => h.trending).length;
    if (trendingCount === 0) {
      suggestions.push('Include 1-2 trending hashtags to boost visibility');
    }

    const hasNicheHashtags = hashtags.some(h => h.reach === 'low');
    if (!hasNicheHashtags && count > 0) {
      suggestions.push('Add niche-specific hashtags for targeted reach');
    }

    return suggestions;
  }

  // ========== FORMAT ANALYSIS ==========

  /**
   * Analyze format
   */
  private analyzeFormat(contentType: ContentFormat, videoLength?: number): FormatAnalysis {
    const formatScore = this.calculateFormatScore(contentType, videoLength);
    const videoLengthAnalysis = videoLength ? this.analyzeVideoLength(contentType, videoLength) : undefined;
    const performanceInsights = this.getPerformanceInsights(contentType, videoLength);
    const suggestions = this.generateFormatSuggestions(contentType, videoLength);

    return {
      format: contentType,
      formatScore,
      videoLength: videoLengthAnalysis,
      performanceInsights,
      suggestions,
    };
  }

  private calculateFormatScore(contentType: ContentFormat, videoLength?: number): number {
    const baseScores: Record<ContentFormat, number> = {
      reel: 90,
      video: 75,
      post: 70,
      story: 65,
    };

    let score = baseScores[contentType];

    if (videoLength && (contentType === 'reel' || contentType === 'video')) {
      const optimalLength = contentType === 'reel' ? 30 : 300; // 30s for reels, 5min for videos
      const deviation = Math.abs(videoLength - optimalLength) / optimalLength;
      score -= deviation * 20;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private analyzeVideoLength(contentType: ContentFormat, seconds: number): FormatAnalysis['videoLength'] {
    let optimal = false;
    let recommendation = '';

    if (contentType === 'reel') {
      optimal = seconds >= 15 && seconds <= 30;
      if (seconds < 15) recommendation = 'Consider making it slightly longer (15-30s optimal)';
      else if (seconds > 30) recommendation = 'Shorter reels (15-30s) tend to have higher completion rates';
      else recommendation = 'Perfect length for maximum engagement!';
    } else if (contentType === 'video') {
      optimal = seconds >= 180 && seconds <= 600;
      if (seconds < 180) recommendation = 'Consider adding more value (3-10 min optimal)';
      else if (seconds > 600) recommendation = 'Long videos work but ensure high retention throughout';
      else recommendation = 'Good length for in-depth content!';
    }

    return { seconds, optimal, recommendation };
  }

  private getPerformanceInsights(contentType: ContentFormat, videoLength?: number): FormatAnalysis['performanceInsights'] {
    const insights: Record<ContentFormat, FormatAnalysis['performanceInsights']> = {
      reel: {
        reachPotential: 'high',
        engagementPotential: 'high',
        recommendation: 'Reels have the highest organic reach. Focus on hook and quick value.',
      },
      video: {
        reachPotential: 'medium',
        engagementPotential: 'high',
        recommendation: 'Videos build deeper connections. Use strong thumbnails and chapters.',
      },
      post: {
        reachPotential: 'medium',
        engagementPotential: 'medium',
        recommendation: 'Carousels outperform single images. Tell a story across slides.',
      },
      story: {
        reachPotential: 'low',
        engagementPotential: 'medium',
        recommendation: 'Stories are great for engagement. Use polls and questions.',
      },
    };

    return insights[contentType];
  }

  private generateFormatSuggestions(contentType: ContentFormat, videoLength?: number): string[] {
    const suggestions: string[] = [];

    if (contentType === 'post') {
      suggestions.push('Consider creating a Reel version for higher reach');
    }

    if (contentType === 'reel' && videoLength && videoLength > 60) {
      suggestions.push('Break this into multiple shorter reels for a series');
    }

    if (contentType === 'video') {
      suggestions.push('Create a teaser Reel to drive traffic to the full video');
    }

    return suggestions;
  }

  // ========== CTA ANALYSIS ==========

  /**
   * Analyze CTA
   */
  private analyzeCTA(caption: string): CTAAnalysis {
    const detectedCTAs: CTAAnalysis['types'] = [];

    for (const [type, patterns] of Object.entries(this.CTA_PATTERNS)) {
      if (type === 'none') continue;

      for (const pattern of patterns) {
        const match = caption.match(pattern);
        if (match) {
          const position = this.getCTAPosition(caption, match.index || 0);
          detectedCTAs.push({
            type: type as CTAType,
            text: match[0],
            effectiveness: this.getCTAEffectiveness(type as CTAType),
            position,
          });
          break; // Only count one per type
        }
      }
    }

    const detected = detectedCTAs.length > 0;
    const overallEffectiveness = detected
      ? Math.round(detectedCTAs.reduce((sum, cta) => sum + cta.effectiveness, 0) / detectedCTAs.length)
      : 0;

    const suggestions = this.generateCTASuggestions(detectedCTAs);

    return {
      detected,
      types: detectedCTAs,
      overallEffectiveness,
      suggestions,
    };
  }

  private getCTAPosition(caption: string, index: number): 'start' | 'middle' | 'end' {
    const ratio = index / caption.length;
    if (ratio < 0.3) return 'start';
    if (ratio > 0.7) return 'end';
    return 'middle';
  }

  private getCTAEffectiveness(type: CTAType): number {
    const effectiveness: Record<CTAType, number> = {
      engagement: 85,
      save: 78,
      share: 72,
      action: 65,
      none: 0,
    };
    return effectiveness[type];
  }

  private generateCTASuggestions(ctas: CTAAnalysis['types']): string[] {
    const suggestions: string[] = [];

    if (ctas.length === 0) {
      suggestions.push('Add a clear call-to-action to increase engagement');
      suggestions.push('Try: "Save this for later!" or "Comment your thoughts below!"');
    } else {
      const hasEndCTA = ctas.some(cta => cta.position === 'end');
      if (!hasEndCTA) {
        suggestions.push('Place your main CTA at the end of the caption for better results');
      }

      if (ctas.length === 1) {
        suggestions.push('Consider adding a secondary CTA (e.g., save + comment)');
      }
    }

    return suggestions;
  }

  // ========== OVERALL SCORE ==========

  private calculateOverallScore(
    caption: CaptionAnalysis,
    hashtags: HashtagAnalysis,
    format: FormatAnalysis,
    cta: CTAAnalysis
  ): number {
    const weights = {
      caption: 0.3,
      hashtags: 0.2,
      format: 0.3,
      cta: 0.2,
    };

    const captionScore = caption.readability * 0.5 + (caption.emojiUsage.count > 0 ? 25 : 0) + 25;
    const hashtagScore = hashtags.overallScore;
    const formatScore = format.formatScore;
    const ctaScore = cta.detected ? cta.overallEffectiveness : 30;

    const overall = (
      captionScore * weights.caption +
      hashtagScore * weights.hashtags +
      formatScore * weights.format +
      ctaScore * weights.cta
    );

    return Math.round(Math.max(0, Math.min(100, overall)));
  }

  private identifyStrengthsAndImprovements(
    caption: CaptionAnalysis,
    hashtags: HashtagAnalysis,
    format: FormatAnalysis,
    cta: CTAAnalysis
  ): { strengths: string[]; improvements: string[] } {
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Caption
    if (caption.readability > 70) {
      strengths.push('Easy to read caption');
    } else {
      improvements.push('Improve caption readability with shorter sentences');
    }

    if (caption.emojiUsage.count >= 1 && caption.emojiUsage.count <= 5) {
      strengths.push('Good emoji usage');
    }

    // Hashtags
    if (hashtags.optimal) {
      strengths.push('Optimal number of hashtags');
    } else if (hashtags.count > 0) {
      improvements.push('Adjust hashtag count to 5-15 for best results');
    }

    if (hashtags.hashtags.some(h => h.trending)) {
      strengths.push('Using trending hashtags');
    }

    // Format
    if (format.formatScore >= 80) {
      strengths.push(`Great format choice (${format.format})`);
    }

    if (format.videoLength?.optimal) {
      strengths.push('Optimal video length');
    } else if (format.videoLength) {
      improvements.push(format.videoLength.recommendation);
    }

    // CTA
    if (cta.detected && cta.overallEffectiveness >= 70) {
      strengths.push('Strong call-to-action');
    } else if (!cta.detected) {
      improvements.push('Add a clear call-to-action');
    }

    return {
      strengths: strengths.slice(0, 5),
      improvements: improvements.slice(0, 5),
    };
  }
}
