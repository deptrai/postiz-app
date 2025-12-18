import { ContentElementsService } from './content-elements.service';

describe('ContentElementsService', () => {
  let service: ContentElementsService;

  beforeEach(() => {
    service = new ContentElementsService();
  });

  describe('analyzeContentElements', () => {
    it('should analyze content with all elements', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Check out this amazing tip! 🔥 Learn how to grow your audience fast. #viral #growth',
        hashtags: ['viral', 'growth', 'tips'],
        contentType: 'reel',
        videoLength: 25,
      });

      expect(result).toBeDefined();
      expect(result.caption).toBeDefined();
      expect(result.hashtags).toBeDefined();
      expect(result.format).toBeDefined();
      expect(result.cta).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.topStrengths).toBeInstanceOf(Array);
      expect(result.areasToImprove).toBeInstanceOf(Array);
    });

    it('should analyze content with minimal input', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Hello world',
      });

      expect(result).toBeDefined();
      expect(result.caption.length).toBe(11);
      expect(result.caption.lengthCategory).toBe('short');
      expect(result.format.format).toBe('post');
    });

    it('should extract hashtags from caption if not provided', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Great content! #viral #trending #fyp',
      });

      expect(result.hashtags.count).toBe(3);
      expect(result.hashtags.hashtags.some(h => h.tag === 'viral')).toBe(true);
    });
  });

  describe('Caption Analysis', () => {
    it('should categorize short captions correctly', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Short caption',
      });

      expect(result.caption.lengthCategory).toBe('short');
    });

    it('should categorize medium captions correctly', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'This is a medium length caption that has more content and provides some value to the reader with useful information.',
      });

      expect(result.caption.lengthCategory).toBe('medium');
    });

    it('should categorize long captions correctly', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'This is a very long caption that goes on and on with lots of content. It provides extensive value to the reader and includes many details about the topic at hand. Long captions can be effective for educational content where you need to explain complex concepts in detail.',
      });

      expect(result.caption.lengthCategory).toBe('long');
    });

    it('should detect casual tone', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Hey guys! OMG this is so lit! Gonna share some vibes with yall today lol',
      });

      expect(result.caption.tone).toBe('casual');
    });

    it('should detect educational tone', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Learn how to master this skill with our step-by-step tutorial. Did you know this fact? Here is a tip for you.',
      });

      expect(result.caption.tone).toBe('educational');
    });

    it('should count emojis correctly', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: '🔥 Amazing content! 💪 Keep going! 🚀',
      });

      expect(result.caption.emojiUsage.count).toBe(3);
      expect(result.caption.emojiUsage.emojis).toContain('🔥');
    });

    it('should extract keywords', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Learn these amazing tips and tricks for free. This exclusive guide will help you discover new strategies.',
      });

      expect(result.caption.keywords.length).toBeGreaterThan(0);
      expect(result.caption.keywords.some(k => k.word === 'free' || k.word === 'exclusive' || k.word === 'tips')).toBe(true);
    });
  });

  describe('Hashtag Analysis', () => {
    it('should mark optimal hashtag count', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Content',
        hashtags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'],
      });

      expect(result.hashtags.optimal).toBe(true);
    });

    it('should mark non-optimal hashtag count (too few)', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Content',
        hashtags: ['tag1', 'tag2'],
      });

      expect(result.hashtags.optimal).toBe(false);
    });

    it('should mark non-optimal hashtag count (too many)', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Content',
        hashtags: Array.from({ length: 20 }, (_, i) => `tag${i}`),
      });

      expect(result.hashtags.optimal).toBe(false);
    });

    it('should identify trending hashtags', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Content',
        hashtags: ['viral', 'trending', 'fyp'],
      });

      expect(result.hashtags.hashtags.filter(h => h.trending).length).toBeGreaterThan(0);
    });

    it('should calculate hashtag reach', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Content',
        hashtags: ['viral', 'mynichekeyword'],
      });

      const viralTag = result.hashtags.hashtags.find(h => h.tag === 'viral');
      expect(viralTag?.reach).toBe('high');
    });
  });

  describe('Format Analysis', () => {
    it('should analyze reel format', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Content',
        contentType: 'reel',
        videoLength: 25,
      });

      expect(result.format.format).toBe('reel');
      expect(result.format.formatScore).toBeGreaterThanOrEqual(80);
      expect(result.format.videoLength?.optimal).toBe(true);
    });

    it('should flag non-optimal reel length', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Content',
        contentType: 'reel',
        videoLength: 90,
      });

      expect(result.format.videoLength?.optimal).toBe(false);
    });

    it('should analyze video format', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Content',
        contentType: 'video',
        videoLength: 300,
      });

      expect(result.format.format).toBe('video');
      expect(result.format.videoLength?.optimal).toBe(true);
    });

    it('should provide performance insights', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Content',
        contentType: 'reel',
      });

      expect(result.format.performanceInsights.reachPotential).toBe('high');
      expect(result.format.performanceInsights.engagementPotential).toBe('high');
    });
  });

  describe('CTA Analysis', () => {
    it('should detect engagement CTA', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'What do you think? Comment below with your thoughts!',
      });

      expect(result.cta.detected).toBe(true);
      expect(result.cta.types.some(c => c.type === 'engagement')).toBe(true);
    });

    it('should detect action CTA', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Click the link in bio to learn more! Follow for more tips.',
      });

      expect(result.cta.detected).toBe(true);
      expect(result.cta.types.some(c => c.type === 'action')).toBe(true);
    });

    it('should detect save CTA', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Save this for later! You will need it.',
      });

      expect(result.cta.detected).toBe(true);
      expect(result.cta.types.some(c => c.type === 'save')).toBe(true);
    });

    it('should detect share CTA', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Tag a friend who needs to see this!',
      });

      expect(result.cta.detected).toBe(true);
      expect(result.cta.types.some(c => c.type === 'share')).toBe(true);
    });

    it('should detect no CTA', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Just a regular caption without any call to action.',
      });

      expect(result.cta.detected).toBe(false);
      expect(result.cta.types.length).toBe(0);
    });

    it('should detect multiple CTAs', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Save this for later! Comment your thoughts below. Tag a friend!',
      });

      expect(result.cta.detected).toBe(true);
      expect(result.cta.types.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getSuccessfulPatterns', () => {
    it('should return successful patterns', async () => {
      const result = await service.getSuccessfulPatterns('org-1');

      expect(result).toBeDefined();
      expect(result.captionPatterns).toBeInstanceOf(Array);
      expect(result.captionPatterns.length).toBeGreaterThan(0);
      expect(result.hashtagPatterns).toBeInstanceOf(Array);
      expect(result.hashtagPatterns.length).toBeGreaterThan(0);
      expect(result.formatPatterns).toBeInstanceOf(Array);
      expect(result.formatPatterns.length).toBeGreaterThan(0);
      expect(result.ctaPatterns).toBeInstanceOf(Array);
      expect(result.ctaPatterns.length).toBeGreaterThan(0);
    });

    it('should include pattern details', async () => {
      const result = await service.getSuccessfulPatterns('org-1');

      const captionPattern = result.captionPatterns[0];
      expect(captionPattern.pattern).toBeDefined();
      expect(captionPattern.description).toBeDefined();
      expect(captionPattern.effectiveness).toBeGreaterThan(0);
      expect(captionPattern.example).toBeDefined();
    });
  });

  describe('Overall Score Calculation', () => {
    it('should calculate higher score for optimized content', async () => {
      const optimizedResult = await service.analyzeContentElements('org-1', {
        caption: '🔥 Amazing tip! Learn how to grow your audience with these exclusive tricks. Save this for later! Comment your thoughts below! #viral #trending #fyp #growth #tips #content',
        hashtags: ['viral', 'trending', 'fyp', 'growth', 'tips', 'content', 'creator'],
        contentType: 'reel',
        videoLength: 25,
      });

      const basicResult = await service.analyzeContentElements('org-1', {
        caption: 'Hello',
        contentType: 'post',
      });

      expect(optimizedResult.overallScore).toBeGreaterThan(basicResult.overallScore);
    });

    it('should identify strengths correctly', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: '🔥 Great content with emojis! Save this for later!',
        hashtags: ['viral', 'trending', 'fyp', 'growth', 'tips', 'content', 'creator'],
        contentType: 'reel',
        videoLength: 25,
      });

      expect(result.topStrengths.length).toBeGreaterThan(0);
    });

    it('should identify areas to improve', async () => {
      const result = await service.analyzeContentElements('org-1', {
        caption: 'Short caption without CTA or emojis',
        hashtags: ['tag1'],
        contentType: 'post',
      });

      expect(result.areasToImprove.length).toBeGreaterThan(0);
    });
  });
});
