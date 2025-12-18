import { ThumbnailAnalyticsService } from './thumbnail-analytics.service';

describe('ThumbnailAnalyticsService', () => {
  let service: ThumbnailAnalyticsService;

  beforeEach(() => {
    service = new ThumbnailAnalyticsService();
  });

  describe('getThumbnailPerformance', () => {
    it('should return thumbnail performance data', async () => {
      const result = await service.getThumbnailPerformance('org-123');

      expect(result).toBeDefined();
      expect(result.organizationId).toBe('org-123');
      expect(result.thumbnails).toBeDefined();
      expect(Array.isArray(result.thumbnails)).toBe(true);
      expect(result.totalVideos).toBeGreaterThan(0);
      expect(result.avgCtr).toBeGreaterThanOrEqual(0);
    });

    it('should include best and worst performers', async () => {
      const result = await service.getThumbnailPerformance('org-123');

      expect(result.bestPerformer).toBeDefined();
      expect(result.worstPerformer).toBeDefined();
      expect(result.bestPerformer!.ctr).toBeGreaterThanOrEqual(result.worstPerformer!.ctr);
    });

    it('should filter by style', async () => {
      const result = await service.getThumbnailPerformance('org-123', { style: 'face' });

      result.thumbnails.forEach((t) => {
        expect(t.style).toBe('face');
      });
    });

    it('should filter by minCtr', async () => {
      const result = await service.getThumbnailPerformance('org-123', { minCtr: 5 });

      result.thumbnails.forEach((t) => {
        expect(t.ctr).toBeGreaterThanOrEqual(5);
      });
    });

    it('should filter by maxCtr', async () => {
      const result = await service.getThumbnailPerformance('org-123', { maxCtr: 10 });

      result.thumbnails.forEach((t) => {
        expect(t.ctr).toBeLessThanOrEqual(10);
      });
    });

    it('should have valid CTR values', async () => {
      const result = await service.getThumbnailPerformance('org-123');

      result.thumbnails.forEach((t) => {
        expect(t.ctr).toBeGreaterThanOrEqual(0);
        expect(t.ctr).toBeLessThanOrEqual(100);
        expect(t.impressions).toBeGreaterThan(0);
        expect(t.clicks).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getStylePerformance', () => {
    it('should return style performance breakdown', async () => {
      const result = await service.getStylePerformance('org-123');

      expect(result).toBeDefined();
      expect(result.organizationId).toBe('org-123');
      expect(result.styles).toBeDefined();
      expect(Array.isArray(result.styles)).toBe(true);
      expect(result.styles.length).toBe(6);
    });

    it('should include all thumbnail styles', async () => {
      const result = await service.getStylePerformance('org-123');
      const styleNames = result.styles.map((s) => s.style);

      expect(styleNames).toContain('text-heavy');
      expect(styleNames).toContain('face');
      expect(styleNames).toContain('action');
      expect(styleNames).toContain('minimal');
      expect(styleNames).toContain('before-after');
      expect(styleNames).toContain('curiosity-gap');
    });

    it('should rank styles by CTR', async () => {
      const result = await service.getStylePerformance('org-123');

      for (let i = 0; i < result.styles.length - 1; i++) {
        expect(result.styles[i].avgCtr).toBeGreaterThanOrEqual(result.styles[i + 1].avgCtr);
      }
    });

    it('should include best and worst style', async () => {
      const result = await service.getStylePerformance('org-123');

      expect(result.bestStyle).toBeDefined();
      expect(result.worstStyle).toBeDefined();
      expect(result.styles[0].style).toBe(result.bestStyle);
      expect(result.styles[result.styles.length - 1].style).toBe(result.worstStyle);
    });

    it('should include industry comparison', async () => {
      const result = await service.getStylePerformance('org-123');

      result.styles.forEach((s) => {
        expect(s.benchmark).toBeGreaterThan(0);
        expect(['above', 'at', 'below']).toContain(s.vsIndustry);
      });
    });

    it('should include confidence scores', async () => {
      const result = await service.getStylePerformance('org-123');

      result.styles.forEach((s) => {
        expect(s.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(s.confidenceScore).toBeLessThanOrEqual(100);
      });
    });

    it('should include recommendations', async () => {
      const result = await service.getStylePerformance('org-123');

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('getThumbnailSuggestions', () => {
    it('should return suggestions array', async () => {
      const result = await service.getThumbnailSuggestions('org-123');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include both A/B tests and best practices', async () => {
      const result = await service.getThumbnailSuggestions('org-123');
      const types = result.map((s) => s.type);

      expect(types).toContain('ab-test');
      expect(types).toContain('best-practice');
    });

    it('should have valid priority levels', async () => {
      const result = await service.getThumbnailSuggestions('org-123');

      result.forEach((s) => {
        expect(['high', 'medium', 'low']).toContain(s.priority);
      });
    });

    it('should be sorted by priority', async () => {
      const result = await service.getThumbnailSuggestions('org-123');
      const priorityOrder = { high: 0, medium: 1, low: 2 };

      for (let i = 0; i < result.length - 1; i++) {
        expect(priorityOrder[result[i].priority]).toBeLessThanOrEqual(
          priorityOrder[result[i + 1].priority]
        );
      }
    });

    it('should include action items', async () => {
      const result = await service.getThumbnailSuggestions('org-123');

      result.forEach((s) => {
        expect(s.actionItems).toBeDefined();
        expect(Array.isArray(s.actionItems)).toBe(true);
        expect(s.actionItems.length).toBeGreaterThan(0);
      });
    });

    it('should include expected improvement', async () => {
      const result = await service.getThumbnailSuggestions('org-123');

      result.forEach((s) => {
        expect(s.expectedImprovement).toBeDefined();
        expect(typeof s.expectedImprovement).toBe('string');
      });
    });
  });

  describe('getSuccessPatterns', () => {
    it('should return success patterns', async () => {
      const result = await service.getSuccessPatterns('org-123');

      expect(result).toBeDefined();
      expect(result.organizationId).toBe('org-123');
      expect(result.patterns).toBeDefined();
      expect(Array.isArray(result.patterns)).toBe(true);
    });

    it('should include pattern elements', async () => {
      const result = await service.getSuccessPatterns('org-123');

      result.patterns.forEach((p) => {
        expect(p.element).toBeDefined();
        expect(p.elementLabel).toBeDefined();
        expect(p.frequency).toBeGreaterThanOrEqual(0);
        expect(p.avgCtrImpact).toBeGreaterThanOrEqual(0);
      });
    });

    it('should include top performers', async () => {
      const result = await service.getSuccessPatterns('org-123');

      expect(result.topPerformers).toBeDefined();
      expect(Array.isArray(result.topPerformers)).toBe(true);
      expect(result.topPerformers.length).toBeGreaterThan(0);
    });

    it('should include insights', async () => {
      const result = await service.getSuccessPatterns('org-123');

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('should sort patterns by frequency', async () => {
      const result = await service.getSuccessPatterns('org-123');

      for (let i = 0; i < result.patterns.length - 1; i++) {
        expect(result.patterns[i].frequency).toBeGreaterThanOrEqual(
          result.patterns[i + 1].frequency
        );
      }
    });

    it('should include examples in patterns', async () => {
      const result = await service.getSuccessPatterns('org-123');

      result.patterns.forEach((p) => {
        expect(p.examples).toBeDefined();
        expect(Array.isArray(p.examples)).toBe(true);
      });
    });
  });
});
