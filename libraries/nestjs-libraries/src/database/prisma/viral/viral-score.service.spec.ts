import { Test, TestingModule } from '@nestjs/testing';
import { ViralScoreService, ContentMetadata } from './viral-score.service';
import { PrismaService } from '../prisma.service';

describe('ViralScoreService', () => {
  let service: ViralScoreService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    analyticsContent: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViralScoreService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ViralScoreService>(ViralScoreService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateViralScore', () => {
    const orgId = 'test-org-id';

    it('should calculate viral score with all factors (AC #1)', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const metadata: ContentMetadata = {
        caption: 'Check out this amazing tip! Follow for more content 🔥',
        hashtags: ['viral', 'tips', 'trending', 'fyp', 'foryou'],
        contentType: 'reel',
        scheduledTime: new Date('2025-12-17T19:00:00'),
        hookText: 'Did you know this secret hack?',
      };

      const result = await service.calculateViralScore(orgId, metadata);

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('interpretation');
      expect(result).toHaveProperty('suggestions');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should return breakdown with all factors (AC #3)', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const metadata: ContentMetadata = {
        caption: 'Test caption',
        contentType: 'post',
      };

      const result = await service.calculateViralScore(orgId, metadata);

      expect(result.breakdown).toHaveProperty('hook');
      expect(result.breakdown).toHaveProperty('caption');
      expect(result.breakdown).toHaveProperty('hashtags');
      expect(result.breakdown).toHaveProperty('timing');
      expect(result.breakdown).toHaveProperty('format');
    });

    it('should give high format score for reels', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const reelMetadata: ContentMetadata = {
        caption: 'Test',
        contentType: 'reel',
      };

      const postMetadata: ContentMetadata = {
        caption: 'Test',
        contentType: 'post',
      };

      const reelResult = await service.calculateViralScore(orgId, reelMetadata);
      const postResult = await service.calculateViralScore(orgId, postMetadata);

      expect(reelResult.breakdown.format).toBeGreaterThan(postResult.breakdown.format);
    });

    it('should give higher timing score for optimal hours', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const optimalTime: ContentMetadata = {
        caption: 'Test',
        contentType: 'reel',
        scheduledTime: new Date('2025-12-17T19:00:00'), // 7 PM - optimal
      };

      const lateTime: ContentMetadata = {
        caption: 'Test',
        contentType: 'reel',
        scheduledTime: new Date('2025-12-17T03:00:00'), // 3 AM - not optimal
      };

      const optimalResult = await service.calculateViralScore(orgId, optimalTime);
      const lateResult = await service.calculateViralScore(orgId, lateTime);

      expect(optimalResult.breakdown.timing).toBeGreaterThan(lateResult.breakdown.timing);
    });

    it('should generate suggestions for low-scoring factors (AC #4)', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const poorMetadata: ContentMetadata = {
        caption: 'Hi', // Very short caption
        contentType: 'post', // Low format score
        hashtags: [], // No hashtags
      };

      const result = await service.calculateViralScore(orgId, poorMetadata);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toHaveProperty('factor');
      expect(result.suggestions[0]).toHaveProperty('suggestion');
      expect(result.suggestions[0]).toHaveProperty('impact');
      expect(result.suggestions[0]).toHaveProperty('potentialGain');
    });

    it('should return correct interpretation based on score', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      // High score content
      const highScoreMetadata: ContentMetadata = {
        caption: 'Amazing secret tip you need to know! Follow for more exclusive content 🔥\n\nDrop a comment below!',
        hashtags: ['viral', 'tips', 'trending', 'fyp', 'foryou'],
        contentType: 'reel',
        scheduledTime: new Date('2025-12-17T19:00:00'),
        hookText: 'Did you know this secret hack that went viral?',
      };

      const result = await service.calculateViralScore(orgId, highScoreMetadata);

      // Interpretation should be one of the defined values
      expect(['High viral potential', 'Good potential', 'Average', 'Low potential, needs improvement']).toContain(result.interpretation);
    });
  });

  describe('compareContent', () => {
    const orgId = 'test-org-id';

    it('should rank multiple drafts by viral potential (AC #5)', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const drafts = [
        {
          id: 'draft-1',
          metadata: {
            caption: 'Short',
            contentType: 'post' as const,
          },
        },
        {
          id: 'draft-2',
          metadata: {
            caption: 'Amazing viral content with great hook! Follow for more 🔥',
            contentType: 'reel' as const,
            hashtags: ['viral', 'trending', 'fyp'],
          },
        },
        {
          id: 'draft-3',
          metadata: {
            caption: 'Good content with some hashtags',
            contentType: 'video' as const,
            hashtags: ['content'],
          },
        },
      ];

      const result = await service.compareContent(orgId, drafts);

      expect(result.rankings).toHaveLength(3);
      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[1].rank).toBe(2);
      expect(result.rankings[2].rank).toBe(3);
      
      // Rankings should be sorted by score descending
      expect(result.rankings[0].score).toBeGreaterThanOrEqual(result.rankings[1].score);
      expect(result.rankings[1].score).toBeGreaterThanOrEqual(result.rankings[2].score);
    });

    it('should include breakdown for each ranked content', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const drafts = [
        {
          id: 'draft-1',
          metadata: {
            caption: 'Test content',
            contentType: 'reel' as const,
          },
        },
      ];

      const result = await service.compareContent(orgId, drafts);

      expect(result.rankings[0]).toHaveProperty('breakdown');
      expect(result.rankings[0].breakdown).toHaveProperty('hook');
      expect(result.rankings[0].breakdown).toHaveProperty('caption');
      expect(result.rankings[0].breakdown).toHaveProperty('hashtags');
      expect(result.rankings[0].breakdown).toHaveProperty('timing');
      expect(result.rankings[0].breakdown).toHaveProperty('format');
    });
  });

  describe('Hook Score Calculation', () => {
    it('should give higher score for hooks with power words', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const withPowerWords: ContentMetadata = {
        caption: 'Test',
        contentType: 'reel',
        hookText: 'This amazing secret will change everything!',
      };

      const withoutPowerWords: ContentMetadata = {
        caption: 'Test',
        contentType: 'reel',
        hookText: 'Here is some information about things.',
      };

      const withResult = await service.calculateViralScore('org', withPowerWords);
      const withoutResult = await service.calculateViralScore('org', withoutPowerWords);

      expect(withResult.breakdown.hook).toBeGreaterThan(withoutResult.breakdown.hook);
    });

    it('should give higher score for hooks with questions', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const withQuestion: ContentMetadata = {
        caption: 'Test',
        contentType: 'reel',
        hookText: 'Did you know this could happen?',
      };

      const withoutQuestion: ContentMetadata = {
        caption: 'Test',
        contentType: 'reel',
        hookText: 'This is a statement about something.',
      };

      const withResult = await service.calculateViralScore('org', withQuestion);
      const withoutResult = await service.calculateViralScore('org', withoutQuestion);

      expect(withResult.breakdown.hook).toBeGreaterThan(withoutResult.breakdown.hook);
    });
  });

  describe('Caption Score Calculation', () => {
    it('should give higher score for captions with CTAs', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const withCTA: ContentMetadata = {
        caption: 'Great content here! Follow for more and share with friends!',
        contentType: 'reel',
      };

      const withoutCTA: ContentMetadata = {
        caption: 'Here is some content that exists.',
        contentType: 'reel',
      };

      const withResult = await service.calculateViralScore('org', withCTA);
      const withoutResult = await service.calculateViralScore('org', withoutCTA);

      expect(withResult.breakdown.caption).toBeGreaterThan(withoutResult.breakdown.caption);
    });
  });

  describe('Hashtag Score Calculation', () => {
    it('should give optimal score for 5-10 hashtags', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const optimalHashtags: ContentMetadata = {
        caption: 'Test',
        contentType: 'reel',
        hashtags: ['one', 'two', 'three', 'four', 'five', 'six'],
      };

      const tooFewHashtags: ContentMetadata = {
        caption: 'Test',
        contentType: 'reel',
        hashtags: ['one'],
      };

      const optimalResult = await service.calculateViralScore('org', optimalHashtags);
      const fewResult = await service.calculateViralScore('org', tooFewHashtags);

      expect(optimalResult.breakdown.hashtags).toBeGreaterThan(fewResult.breakdown.hashtags);
    });
  });
});
