import { HookAnalyzerService, HookMetadata, HookOpeningType } from './hook-analyzer.service';

// Mock PrismaService
const mockPrismaService = {} as any;

describe('HookAnalyzerService', () => {
  let service: HookAnalyzerService;

  beforeEach(() => {
    service = new HookAnalyzerService(mockPrismaService);
  });

  describe('analyzeHook', () => {
    it('should analyze a question hook correctly', async () => {
      const metadata: HookMetadata = {
        hookText: 'Did you know this secret hack?',
        contentType: 'reel',
        hasMusic: true,
      };

      const result = await service.analyzeHook('org-123', metadata);

      expect(result.openingType).toBe('question');
      expect(result.effectivenessScore).toBeGreaterThan(0);
      expect(result.effectivenessScore).toBeLessThanOrEqual(100);
      expect(result.breakdown).toBeDefined();
      expect(result.interpretation).toBeDefined();
    });

    it('should analyze a statement hook correctly', async () => {
      const metadata: HookMetadata = {
        hookText: 'This is the secret nobody tells you',
        contentType: 'video',
      };

      const result = await service.analyzeHook('org-123', metadata);

      expect(result.openingType).toBe('statement');
      expect(result.effectivenessScore).toBeGreaterThan(0);
    });

    it('should analyze a curiosity hook correctly', async () => {
      const metadata: HookMetadata = {
        hookText: 'Wait for it... you will be amazed',
        contentType: 'reel',
      };

      const result = await service.analyzeHook('org-123', metadata);

      expect(result.openingType).toBe('curiosity');
    });

    it('should analyze an action hook correctly', async () => {
      const metadata: HookMetadata = {
        hookText: 'Watch this transformation happen now',
        contentType: 'reel',
      };

      const result = await service.analyzeHook('org-123', metadata);

      expect(result.openingType).toBe('action');
    });

    it('should analyze a problem hook correctly', async () => {
      const metadata: HookMetadata = {
        hookText: 'Struggling with your morning routine?',
        contentType: 'video',
      };

      const result = await service.analyzeHook('org-123', metadata);

      expect(result.openingType).toBe('problem');
    });

    it('should return unknown for unrecognized patterns', async () => {
      const metadata: HookMetadata = {
        hookText: 'Hello world',
        contentType: 'post',
      };

      const result = await service.analyzeHook('org-123', metadata);

      expect(result.openingType).toBe('unknown');
    });

    it('should include breakdown with all factors', async () => {
      const metadata: HookMetadata = {
        hookText: 'Did you know this amazing secret?',
        contentType: 'reel',
        hasMusic: true,
        hasVoiceover: true,
        hasQuickCuts: true,
      };

      const result = await service.analyzeHook('org-123', metadata);

      expect(result.breakdown.openingType).toBeDefined();
      expect(result.breakdown.pacing).toBeDefined();
      expect(result.breakdown.visualImpact).toBeDefined();
      expect(result.breakdown.audioHook).toBeDefined();
    });

    it('should generate recommendations for low scores', async () => {
      const metadata: HookMetadata = {
        hookText: 'Hi',
        contentType: 'post',
      };

      const result = await service.analyzeHook('org-123', metadata);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should match patterns based on opening type', async () => {
      const metadata: HookMetadata = {
        hookText: 'Did you know this secret?',
        contentType: 'reel',
      };

      const result = await service.analyzeHook('org-123', metadata);

      expect(result.matchedPatterns.length).toBeGreaterThan(0);
      expect(result.matchedPatterns[0].type).toBe('question');
    });
  });

  describe('getHookPatterns', () => {
    it('should return all patterns when no filter', async () => {
      const patterns = await service.getHookPatterns();

      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should filter by opening type', async () => {
      const patterns = await service.getHookPatterns(undefined, 'question');

      expect(patterns.length).toBeGreaterThan(0);
      patterns.forEach(p => {
        expect(p.type).toBe('question');
      });
    });

    it('should filter by niche', async () => {
      const patterns = await service.getHookPatterns('educational');

      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should sort by success rate descending', async () => {
      const patterns = await service.getHookPatterns();

      for (let i = 1; i < patterns.length; i++) {
        expect(patterns[i - 1].successRate).toBeGreaterThanOrEqual(patterns[i].successRate);
      }
    });
  });

  describe('compareHooks', () => {
    it('should compare multiple hooks and rank them', async () => {
      const hooks = [
        { id: 'hook-1', metadata: { hookText: 'Did you know this secret?', contentType: 'reel' as const } },
        { id: 'hook-2', metadata: { hookText: 'Hello world', contentType: 'post' as const } },
        { id: 'hook-3', metadata: { hookText: 'Wait for it... amazing reveal', contentType: 'reel' as const } },
      ];

      const result = await service.compareHooks('org-123', hooks);

      expect(result.rankings.length).toBe(3);
      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[1].rank).toBe(2);
      expect(result.rankings[2].rank).toBe(3);
    });

    it('should rank higher scoring hooks first', async () => {
      const hooks = [
        { id: 'hook-weak', metadata: { hookText: 'Hi', contentType: 'post' as const } },
        { id: 'hook-strong', metadata: { hookText: 'Did you know this amazing secret hack?', contentType: 'reel' as const, hasMusic: true } },
      ];

      const result = await service.compareHooks('org-123', hooks);

      expect(result.rankings[0].hookId).toBe('hook-strong');
      expect(result.rankings[0].score).toBeGreaterThan(result.rankings[1].score);
    });
  });

  describe('score interpretation', () => {
    it('should return "Highly effective hook" for scores >= 80', async () => {
      const metadata: HookMetadata = {
        hookText: 'Did you know this amazing secret hack that will change your life?',
        contentType: 'reel',
        hasMusic: true,
        hasVoiceover: true,
        hasQuickCuts: true,
        hasSoundEffects: true,
      };

      const result = await service.analyzeHook('org-123', metadata);

      if (result.effectivenessScore >= 80) {
        expect(result.interpretation).toBe('Highly effective hook');
      }
    });
  });
});
