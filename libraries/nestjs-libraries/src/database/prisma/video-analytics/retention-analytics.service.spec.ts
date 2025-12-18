import { RetentionAnalyticsService } from './retention-analytics.service';

describe('RetentionAnalyticsService', () => {
  let service: RetentionAnalyticsService;

  beforeEach(() => {
    service = new RetentionAnalyticsService();
  });

  describe('getRetentionCurve', () => {
    it('should return retention curve with all data points', async () => {
      const result = await service.getRetentionCurve('org-1', 'video-1', {
        totalViewers: 1000,
        viewsAtIntervals: {
          0: 1000,
          10: 850,
          20: 700,
          30: 650,
          40: 600,
          50: 550,
          60: 500,
          70: 450,
          80: 400,
          90: 350,
          100: 300,
        },
        videoDuration: 60,
        videoTitle: 'Test Video',
      });

      expect(result).toBeDefined();
      expect(result.videoId).toBe('video-1');
      expect(result.videoTitle).toBe('Test Video');
      expect(result.points.length).toBe(11);
      expect(result.totalViewers).toBe(1000);
      expect(result.averageRetention).toBeGreaterThan(0);
      expect(result.completionRate).toBe(30);
    });

    it('should calculate retention percentages correctly', async () => {
      const result = await service.getRetentionCurve('org-1', 'video-1', {
        totalViewers: 1000,
        viewsAtIntervals: {
          0: 1000,
          50: 500,
          100: 250,
        },
        videoDuration: 60,
      });

      const point50 = result.points.find((p) => p.percentage === 50);
      expect(point50?.retention).toBe(50);

      const point100 = result.points.find((p) => p.percentage === 100);
      expect(point100?.retention).toBe(25);
    });

    it('should use default values when no view data provided', async () => {
      const result = await service.getRetentionCurve('org-1', 'video-1');

      expect(result).toBeDefined();
      expect(result.totalViewers).toBe(1000);
      expect(result.videoDuration).toBe(60);
      expect(result.points.length).toBe(11);
    });
  });

  describe('identifyDropOffPoints', () => {
    it('should identify drop-off points greater than 10%', async () => {
      const result = await service.getRetentionCurve('org-1', 'video-1', {
        totalViewers: 1000,
        viewsAtIntervals: {
          0: 1000,
          10: 850, // 15% drop
          20: 750, // 10% drop
          30: 680, // 7% drop (not identified)
          40: 550, // 13% drop
          50: 500, // 5% drop (not identified)
          60: 450,
          70: 400,
          80: 350,
          90: 300,
          100: 250,
        },
        videoDuration: 60,
      });

      expect(result.dropOffPoints.length).toBeGreaterThanOrEqual(2);

      // Check first drop-off at 10%
      const firstDrop = result.dropOffPoints.find((d) => d.percentage === 10);
      expect(firstDrop).toBeDefined();
      expect(firstDrop?.dropAmount).toBeGreaterThan(10);
    });

    it('should classify drop-off severity correctly', async () => {
      const result = await service.getRetentionCurve('org-1', 'video-1', {
        totalViewers: 1000,
        viewsAtIntervals: {
          0: 1000,
          10: 750, // 25% drop = high severity
          20: 650, // 10% drop = low severity
          30: 500, // 15% drop = medium severity
          40: 480,
          50: 460,
          60: 440,
          70: 420,
          80: 400,
          90: 380,
          100: 360,
        },
        videoDuration: 60,
      });

      const highDrop = result.dropOffPoints.find((d) => d.severity === 'high');
      expect(highDrop).toBeDefined();
      expect(highDrop?.dropAmount).toBeGreaterThan(20);

      const mediumDrop = result.dropOffPoints.find((d) => d.severity === 'medium');
      if (mediumDrop) {
        expect(mediumDrop.dropAmount).toBeGreaterThan(15);
        expect(mediumDrop.dropAmount).toBeLessThanOrEqual(20);
      }
    });

    it('should calculate viewer loss correctly', async () => {
      const result = await service.getRetentionCurve('org-1', 'video-1', {
        totalViewers: 1000,
        viewsAtIntervals: {
          0: 1000,
          10: 700, // 300 viewers lost
          20: 600,
          30: 500,
          40: 400,
          50: 300,
          60: 250,
          70: 200,
          80: 150,
          90: 100,
          100: 50,
        },
        videoDuration: 60,
      });

      const firstDrop = result.dropOffPoints.find((d) => d.percentage === 10);
      expect(firstDrop?.viewerLoss).toBe(300);
    });
  });

  describe('getBenchmarkComparison', () => {
    it('should return benchmark comparison for reel format', async () => {
      const result = await service.getBenchmarkComparison(
        'org-1',
        'video-1',
        'fitness',
        'reel'
      );

      expect(result).toBeDefined();
      expect(result.benchmark.format).toBe('reel');
      expect(result.benchmark.niche).toBe('fitness');
      expect(result.benchmark.points.length).toBe(11);
      expect(result.deviation).toBeDefined();
      expect(['above', 'at', 'below']).toContain(result.performance);
    });

    it('should determine performance above benchmark correctly', async () => {
      const retentionCurve = await service.getRetentionCurve('org-1', 'video-1', {
        totalViewers: 1000,
        viewsAtIntervals: {
          0: 1000,
          10: 900,
          20: 850,
          30: 800,
          40: 750,
          50: 700,
          60: 650,
          70: 600,
          80: 550,
          90: 500,
          100: 450,
        },
        videoDuration: 30,
      });

      const result = await service.getBenchmarkComparison(
        'org-1',
        'video-1',
        'fitness',
        'reel',
        retentionCurve
      );

      expect(result.performance).toBe('above');
      expect(result.deviation).toBeGreaterThan(5);
    });

    it('should determine performance below benchmark correctly', async () => {
      const retentionCurve = await service.getRetentionCurve('org-1', 'video-1', {
        totalViewers: 1000,
        viewsAtIntervals: {
          0: 1000,
          10: 600,
          20: 500,
          30: 400,
          40: 350,
          50: 300,
          60: 250,
          70: 200,
          80: 150,
          90: 100,
          100: 50,
        },
        videoDuration: 30,
      });

      const result = await service.getBenchmarkComparison(
        'org-1',
        'video-1',
        'fitness',
        'reel',
        retentionCurve
      );

      expect(result.performance).toBe('below');
      expect(result.deviation).toBeLessThan(-5);
    });

    it('should handle video format benchmark', async () => {
      const result = await service.getBenchmarkComparison(
        'org-1',
        'video-1',
        'education',
        'video'
      );

      expect(result.benchmark.format).toBe('video');
      expect(result.benchmark.averageRetention).toBeLessThan(
        result.videoRetention.averageRetention + 50
      );
    });
  });

  describe('getRetentionSuggestions', () => {
    it('should generate hook suggestions for early drop-offs', async () => {
      const retentionCurve = await service.getRetentionCurve('org-1', 'video-1', {
        totalViewers: 1000,
        viewsAtIntervals: {
          0: 1000,
          10: 650, // 35% drop
          20: 600,
          30: 550,
          40: 500,
          50: 450,
          60: 400,
          70: 350,
          80: 300,
          90: 250,
          100: 200,
        },
        videoDuration: 60,
      });

      const suggestions = await service.getRetentionSuggestions(
        'org-1',
        'video-1',
        retentionCurve
      );

      const hookSuggestion = suggestions.find((s) => s.type === 'hook');
      expect(hookSuggestion).toBeDefined();
      expect(hookSuggestion?.priority).toBe('high');
      expect(hookSuggestion?.dropOffPoint).toBeLessThanOrEqual(10);
    });

    it('should generate pacing suggestions for mid drop-offs', async () => {
      const retentionCurve = await service.getRetentionCurve('org-1', 'video-1', {
        totalViewers: 1000,
        viewsAtIntervals: {
          0: 1000,
          10: 900,
          20: 850,
          30: 800,
          40: 750,
          50: 600, // 15% drop
          60: 550,
          70: 500,
          80: 450,
          90: 400,
          100: 350,
        },
        videoDuration: 120,
      });

      const suggestions = await service.getRetentionSuggestions(
        'org-1',
        'video-1',
        retentionCurve
      );

      const pacingSuggestion = suggestions.find((s) => s.type === 'pacing');
      expect(pacingSuggestion).toBeDefined();
      expect(pacingSuggestion?.dropOffPoint).toBeGreaterThan(30);
      expect(pacingSuggestion?.dropOffPoint).toBeLessThanOrEqual(60);
    });

    it('should generate length suggestions for late drop-offs', async () => {
      const retentionCurve = await service.getRetentionCurve('org-1', 'video-1', {
        totalViewers: 1000,
        viewsAtIntervals: {
          0: 1000,
          10: 900,
          20: 850,
          30: 820,
          40: 800,
          50: 780,
          60: 760,
          70: 740,
          80: 720,
          90: 550, // 17% drop
          100: 500,
        },
        videoDuration: 180,
      });

      const suggestions = await service.getRetentionSuggestions(
        'org-1',
        'video-1',
        retentionCurve
      );

      const lengthSuggestion = suggestions.find((s) => s.type === 'length');
      expect(lengthSuggestion).toBeDefined();
      expect(lengthSuggestion?.dropOffPoint).toBeGreaterThan(60);
    });

    it('should suggest payoff for low completion rate', async () => {
      const retentionCurve = await service.getRetentionCurve('org-1', 'video-1', {
        totalViewers: 1000,
        viewsAtIntervals: {
          0: 1000,
          10: 900,
          20: 800,
          30: 700,
          40: 600,
          50: 500,
          60: 400,
          70: 350,
          80: 300,
          90: 270,
          100: 250, // 25% completion
        },
        videoDuration: 90,
      });

      const suggestions = await service.getRetentionSuggestions(
        'org-1',
        'video-1',
        retentionCurve
      );

      const payoffSuggestion = suggestions.find((s) => s.type === 'payoff');
      expect(payoffSuggestion).toBeDefined();
      expect(payoffSuggestion?.priority).toBe('high');
    });

    it('should sort suggestions by priority', async () => {
      const retentionCurve = await service.getRetentionCurve('org-1', 'video-1', {
        totalViewers: 1000,
        viewsAtIntervals: {
          0: 1000,
          10: 650, // high priority hook
          20: 600,
          30: 550,
          40: 530,
          50: 400, // medium priority pacing
          60: 380,
          70: 360,
          80: 340,
          90: 200, // low/medium priority length
          100: 180,
        },
        videoDuration: 120,
      });

      const suggestions = await service.getRetentionSuggestions(
        'org-1',
        'video-1',
        retentionCurve
      );

      expect(suggestions[0].priority).toBe('high');
      if (suggestions.length > 1) {
        const highPriorityCount = suggestions.filter((s) => s.priority === 'high').length;
        const firstNonHigh = suggestions.findIndex((s) => s.priority !== 'high');
        if (firstNonHigh > 0) {
          expect(firstNonHigh).toBe(highPriorityCount);
        }
      }
    });
  });

  describe('compareRetentionCurves', () => {
    it('should compare 2 videos successfully', async () => {
      const result = await service.compareRetentionCurves(
        'org-1',
        ['video-1', 'video-2'],
        [
          {
            videoId: 'video-1',
            videoTitle: 'Video A',
            totalViewers: 1000,
            viewsAtIntervals: {
              0: 1000,
              10: 850,
              20: 750,
              30: 700,
              40: 650,
              50: 600,
              60: 550,
              70: 500,
              80: 450,
              90: 400,
              100: 350,
            },
            videoDuration: 60,
          },
          {
            videoId: 'video-2',
            videoTitle: 'Video B',
            totalViewers: 800,
            viewsAtIntervals: {
              0: 800,
              10: 720,
              20: 640,
              30: 560,
              40: 480,
              50: 400,
              60: 320,
              70: 280,
              80: 240,
              90: 200,
              100: 160,
            },
            videoDuration: 45,
          },
        ]
      );

      expect(result.videos.length).toBe(2);
      expect(result.videos[0].videoTitle).toBe('Video A');
      expect(result.videos[1].videoTitle).toBe('Video B');
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('should throw error for less than 2 videos', async () => {
      await expect(
        service.compareRetentionCurves('org-1', ['video-1'])
      ).rejects.toThrow('Can only compare 2-3 videos');
    });

    it('should throw error for more than 3 videos', async () => {
      await expect(
        service.compareRetentionCurves('org-1', [
          'video-1',
          'video-2',
          'video-3',
          'video-4',
        ])
      ).rejects.toThrow('Can only compare 2-3 videos');
    });

    it('should generate meaningful insights', async () => {
      const result = await service.compareRetentionCurves(
        'org-1',
        ['video-1', 'video-2', 'video-3'],
        [
          {
            videoId: 'video-1',
            videoTitle: 'High Retention Video',
            totalViewers: 1000,
            viewsAtIntervals: {
              0: 1000,
              10: 900,
              20: 850,
              30: 800,
              40: 750,
              50: 700,
              60: 650,
              70: 600,
              80: 550,
              90: 500,
              100: 450,
            },
            videoDuration: 60,
          },
          {
            videoId: 'video-2',
            videoTitle: 'Medium Retention Video',
            totalViewers: 1000,
            viewsAtIntervals: {
              0: 1000,
              10: 800,
              20: 700,
              30: 650,
              40: 600,
              50: 550,
              60: 500,
              70: 450,
              80: 400,
              90: 350,
              100: 300,
            },
            videoDuration: 60,
          },
          {
            videoId: 'video-3',
            videoTitle: 'Low Retention Video',
            totalViewers: 1000,
            viewsAtIntervals: {
              0: 1000,
              10: 650,
              20: 550,
              30: 500,
              40: 450,
              50: 400,
              60: 350,
              70: 300,
              80: 250,
              90: 200,
              100: 150,
            },
            videoDuration: 60,
          },
        ]
      );

      expect(result.insights.length).toBeGreaterThanOrEqual(3);

      // Should identify highest retention video
      const retentionInsight = result.insights.find((i) =>
        i.includes('highest average retention')
      );
      expect(retentionInsight).toContain('High Retention Video');

      // Should identify best completion rate
      const completionInsight = result.insights.find((i) =>
        i.includes('best completion rate')
      );
      expect(completionInsight).toBeDefined();

      // Should identify strongest hook
      const hookInsight = result.insights.find((i) => i.includes('strongest hook'));
      expect(hookInsight).toBeDefined();
    });

    it('should identify smoothest retention curve', async () => {
      const result = await service.compareRetentionCurves(
        'org-1',
        ['video-1', 'video-2'],
        [
          {
            videoId: 'video-1',
            videoTitle: 'Smooth Video',
            totalViewers: 1000,
            viewsAtIntervals: {
              0: 1000,
              10: 950,
              20: 900,
              30: 860,
              40: 820,
              50: 780,
              60: 750,
              70: 720,
              80: 690,
              90: 660,
              100: 630,
            },
            videoDuration: 60,
          },
          {
            videoId: 'video-2',
            videoTitle: 'Choppy Video',
            totalViewers: 1000,
            viewsAtIntervals: {
              0: 1000,
              10: 650, // big drop
              20: 600,
              30: 570,
              40: 400, // big drop
              50: 380,
              60: 350,
              70: 320,
              80: 200, // big drop
              90: 180,
              100: 160,
            },
            videoDuration: 60,
          },
        ]
      );

      const smoothInsight = result.insights.find((i) =>
        i.includes('smoothest retention')
      );
      expect(smoothInsight).toContain('Smooth Video');
    });
  });

  describe('averageRetention calculation', () => {
    it('should calculate average retention correctly', async () => {
      const result = await service.getRetentionCurve('org-1', 'video-1', {
        totalViewers: 1000,
        viewsAtIntervals: {
          0: 1000,
          10: 900,
          20: 800,
          30: 700,
          40: 600,
          50: 500,
          60: 400,
          70: 300,
          80: 250,
          90: 200,
          100: 150,
        },
        videoDuration: 60,
      });

      // Average should be (100+90+80+70+60+50+40+30+25+20+15) / 11 = 52.7
      expect(result.averageRetention).toBeCloseTo(52.7, 1);
    });
  });
});
