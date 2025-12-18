import { Test, TestingModule } from '@nestjs/testing';
import { EngagementBaitService } from './engagement-bait.service';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

describe('EngagementBaitService', () => {
  let service: EngagementBaitService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    analyticsContent: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        EngagementBaitService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = testModule.get<EngagementBaitService>(EngagementBaitService);
    prismaService = testModule.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('detectEngagementBait', () => {
    it('should return no bait for empty caption', () => {
      const result = service.detectEngagementBait('');

      expect(result.hasBait).toBe(false);
      expect(result.baitScore).toBe(0);
      expect(result.detectedPatterns).toHaveLength(0);
      expect(result.overallSeverity).toBe('none');
    });

    it('should return no bait for clean caption', () => {
      const result = service.detectEngagementBait('Check out our new product launch!');

      expect(result.hasBait).toBe(false);
      expect(result.baitScore).toBe(0);
      expect(result.overallSeverity).toBe('none');
    });

    it('should detect like bait patterns', () => {
      const result = service.detectEngagementBait('Like this post if you agree!');

      expect(result.hasBait).toBe(true);
      expect(result.detectedPatterns.length).toBeGreaterThan(0);
      expect(result.detectedPatterns.some((p) => p.type === 'like')).toBe(true);
    });

    it('should detect share bait patterns', () => {
      const result = service.detectEngagementBait('Share now with your friends!');

      expect(result.hasBait).toBe(true);
      expect(result.detectedPatterns.some((p) => p.type === 'share')).toBe(true);
    });

    it('should detect comment bait patterns', () => {
      const result = service.detectEngagementBait('Comment YES if you agree!');

      expect(result.hasBait).toBe(true);
      expect(result.detectedPatterns.some((p) => p.type === 'comment')).toBe(true);
    });

    it('should detect tag bait patterns', () => {
      const result = service.detectEngagementBait('Tag 3 friends who need to see this!');

      expect(result.hasBait).toBe(true);
      expect(result.detectedPatterns.some((p) => p.type === 'tag')).toBe(true);
    });

    it('should detect multiple bait patterns', () => {
      const result = service.detectEngagementBait(
        'Like this post! Share with friends! Comment YES!'
      );

      expect(result.hasBait).toBe(true);
      expect(result.detectedPatterns.length).toBeGreaterThan(1);
      expect(result.baitScore).toBeGreaterThan(30);
    });

    it('should return high severity for high-severity patterns', () => {
      const result = service.detectEngagementBait('LIKE this post NOW!');

      expect(result.overallSeverity).toBe('high');
    });

    it('should provide authentic alternatives', () => {
      const result = service.detectEngagementBait('Like this post!');

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.detectedPatterns[0].authenticAlternative).toBeDefined();
    });

    it('should cap bait score at 100', () => {
      const result = service.detectEngagementBait(
        'Like this! Share now! Comment YES! Tag friends! Hit that like button! Share with friends!'
      );

      expect(result.baitScore).toBeLessThanOrEqual(100);
    });
  });

  describe('getAuthenticAlternatives', () => {
    it('should return alternatives for detected patterns', () => {
      const detection = service.detectEngagementBait('Like this post!');
      const alternatives = service.getAuthenticAlternatives(detection.detectedPatterns);

      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives[0].original).toBeDefined();
      expect(alternatives[0].alternative).toBeDefined();
      expect(alternatives[0].type).toBeDefined();
    });

    it('should return empty array for no patterns', () => {
      const alternatives = service.getAuthenticAlternatives([]);

      expect(alternatives).toHaveLength(0);
    });
  });

  describe('checkBeforePublish', () => {
    it('should return clean for content without bait', () => {
      const result = service.checkBeforePublish('Great content here!');

      expect(result.isClean).toBe(true);
      expect(result.baitScore).toBe(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return warnings for content with bait', () => {
      const result = service.checkBeforePublish('Like this post!');

      expect(result.isClean).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBeDefined();
      expect(result.warnings[0].message).toBeDefined();
      expect(result.warnings[0].suggestion).toBeDefined();
    });

    it('should provide recommendations for bait content', () => {
      const result = service.checkBeforePublish('Like this post!');

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should warn about high severity bait', () => {
      const result = service.checkBeforePublish('LIKE this NOW! Share with friends!');

      expect(result.recommendations.some((r) => r.includes('High-severity'))).toBe(true);
    });
  });

  describe('getBaitReport', () => {
    it('should return report with trends and flagged content', async () => {
      const mockContent = [
        {
          id: 'content-1',
          externalContentId: 'ext-1',
          caption: 'Like this post!',
          publishedAt: new Date(),
          organizationId: 'org-1',
          deletedAt: null,
        },
        {
          id: 'content-2',
          externalContentId: 'ext-2',
          caption: 'Great content here!',
          publishedAt: new Date(),
          organizationId: 'org-1',
          deletedAt: null,
        },
      ];

      mockPrismaService.analyticsContent.findMany.mockResolvedValue(mockContent);

      const result = await service.getBaitReport('org-1', 7);

      expect(result.trends).toBeDefined();
      expect(result.trends.length).toBe(7);
      expect(result.flaggedContent).toBeDefined();
      expect(result.totalContent).toBe(2);
      expect(result.totalFlagged).toBe(1);
    });

    it('should return empty report for no content', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const result = await service.getBaitReport('org-1', 7);

      expect(result.totalContent).toBe(0);
      expect(result.totalFlagged).toBe(0);
      expect(result.averageBaitScore).toBe(0);
    });
  });

  describe('getBaitPatterns', () => {
    it('should return list of bait patterns', () => {
      const patterns = service.getBaitPatterns();

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].id).toBeDefined();
      expect(patterns[0].type).toBeDefined();
      expect(patterns[0].severity).toBeDefined();
      expect(patterns[0].explanation).toBeDefined();
    });
  });
});
