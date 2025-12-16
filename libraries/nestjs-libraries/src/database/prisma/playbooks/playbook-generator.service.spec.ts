import { Test, TestingModule } from '@nestjs/testing';
import { PlaybookGeneratorService } from './playbook-generator.service';
import { PrismaService } from '../prisma.service';

describe('PlaybookGeneratorService', () => {
  let service: PlaybookGeneratorService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaybookGeneratorService,
        {
          provide: PrismaService,
          useValue: {
            analyticsContent: {
              findMany: jest.fn(),
            },
            analyticsDailyMetric: {
              findMany: jest.fn(),
            },
            analyticsGroup: {
              findFirst: jest.fn(),
            },
            playbook: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PlaybookGeneratorService>(PlaybookGeneratorService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePlaybooks', () => {
    it('should generate playbooks from top content', async () => {
      const mockContent = [
        {
          id: 'content1',
          externalContentId: 'ext1',
          contentType: 'post',
          caption: 'Check out this amazing product. Learn more now!',
          hashtags: '["#tech","#startup"]',
          publishedAt: new Date('2025-01-10T14:00:00Z'),
          tags: [],
        },
        {
          id: 'content2',
          externalContentId: 'ext2',
          contentType: 'post',
          caption: 'Share this with your friends. Click link in bio!',
          hashtags: '["#tech","#innovation"]',
          publishedAt: new Date('2025-01-11T10:00:00Z'),
          tags: [],
        },
        {
          id: 'content3',
          externalContentId: 'ext3',
          contentType: 'post',
          caption: 'Tag a friend who needs to see this. Comment below!',
          hashtags: '["#startup","#business"]',
          publishedAt: new Date('2025-01-12T15:00:00Z'),
          tags: [],
        },
      ];

      const mockMetrics = [
        {
          externalContentId: 'ext1',
          reach: 10000,
          reactions: 500,
          comments: 50,
          shares: 20,
        },
        {
          externalContentId: 'ext2',
          reach: 8000,
          reactions: 400,
          comments: 40,
          shares: 15,
        },
        {
          externalContentId: 'ext3',
          reach: 12000,
          reactions: 600,
          comments: 60,
          shares: 25,
        },
      ];

      jest.spyOn(prismaService.analyticsContent, 'findMany').mockResolvedValue(mockContent as any);
      jest.spyOn(prismaService.analyticsDailyMetric, 'findMany').mockResolvedValue(mockMetrics as any);
      jest.spyOn(prismaService.playbook, 'create').mockResolvedValue({
        id: 'playbook1',
        name: 'post Playbook - 2025-01-15',
        organizationId: 'org1',
        format: 'post',
      } as any);

      const result = await service.generatePlaybooks('org1', {
        days: 30,
        minContentItems: 3,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('playbook1');
      expect(prismaService.playbook.create).toHaveBeenCalled();
    });

    it('should return empty array when no content found', async () => {
      jest.spyOn(prismaService.analyticsContent, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.analyticsDailyMetric, 'findMany').mockResolvedValue([]);

      const result = await service.generatePlaybooks('org1', {});

      expect(result).toEqual([]);
      expect(prismaService.playbook.create).not.toHaveBeenCalled();
    });

    it('should skip format groups with insufficient content', async () => {
      const mockContent = [
        {
          id: 'content1',
          externalContentId: 'ext1',
          contentType: 'post',
          caption: 'Test post',
          hashtags: '[]',
          publishedAt: new Date(),
          tags: [],
        },
        {
          id: 'content2',
          externalContentId: 'ext2',
          contentType: 'reel',
          caption: 'Test reel',
          hashtags: '[]',
          publishedAt: new Date(),
          tags: [],
        },
      ];

      const mockMetrics = [
        { externalContentId: 'ext1', reach: 1000, reactions: 50, comments: 5, shares: 2 },
        { externalContentId: 'ext2', reach: 2000, reactions: 100, comments: 10, shares: 4 },
      ];

      jest.spyOn(prismaService.analyticsContent, 'findMany').mockResolvedValue(mockContent as any);
      jest.spyOn(prismaService.analyticsDailyMetric, 'findMany').mockResolvedValue(mockMetrics as any);

      const result = await service.generatePlaybooks('org1', {
        minContentItems: 3, // Require at least 3 items
      });

      expect(result).toEqual([]);
      expect(prismaService.playbook.create).not.toHaveBeenCalled();
    });
  });

  describe('Pattern extraction', () => {
    it('should extract hooks from captions', () => {
      const contents = [
        { caption: 'Amazing product launch today. Check it out!' },
        { caption: 'Top 5 tips for success. Learn more now.' },
        { caption: 'New feature alert! Try it today.' },
      ];

      const hooks = (service as any).extractHooks(contents);

      expect(hooks.length).toBeGreaterThan(0);
      expect(hooks).toContain('Amazing product launch today');
      expect(hooks).toContain('Top 5 tips for success');
      expect(hooks).toContain('New feature alert');
    });

    it('should extract CTAs from captions', () => {
      const contents = [
        { caption: 'Check out our new product. Learn more here!' },
        { caption: 'Comment below with your thoughts.' },
        { caption: 'Tag a friend who needs this!' },
      ];

      const ctas = (service as any).extractCTAs(contents);

      expect(ctas.length).toBeGreaterThan(0);
      expect(ctas).toContain('learn more');
      expect(ctas).toContain('Comment below');
      expect(ctas).toContain('Tag a friend');
    });

    it('should extract top hashtags', () => {
      const contents = [
        { hashtags: '["#tech","#startup","#innovation"]' },
        { hashtags: '["#tech","#business"]' },
        { hashtags: '["#startup","#tech"]' },
      ];

      const hashtags = (service as any).extractHashtags(contents);

      expect(hashtags).toContain('#tech');
      expect(hashtags).toContain('#startup');
    });

    it('should extract posting times', () => {
      const contents = [
        { publishedAt: new Date('2025-01-10T14:00:00Z') },
        { publishedAt: new Date('2025-01-11T14:30:00Z') },
        { publishedAt: new Date('2025-01-12T10:00:00Z') },
      ];

      const times = (service as any).extractPostingTimes(contents);

      expect(times.length).toBeGreaterThan(0);
      expect(times).toContain('14:00');
    });
  });

  describe('Consistency score calculation', () => {
    it('should calculate consistency score correctly', () => {
      const contents = [
        { totalReach: 10000 },
        { totalReach: 12000 },
        { totalReach: 9000 },
        { totalReach: 11000 },
        { totalReach: 8000 },
      ];

      const score = (service as any).calculateConsistencyScore(contents);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return 0 for insufficient content', () => {
      const contents = [
        { totalReach: 10000 },
        { totalReach: 12000 },
      ];

      const score = (service as any).calculateConsistencyScore(contents);

      expect(score).toBe(0);
    });
  });

  describe('Median calculation', () => {
    it('should calculate median for odd-length array', () => {
      const values = [1, 3, 5, 7, 9];
      const median = (service as any).getMedian(values);
      expect(median).toBe(5);
    });

    it('should calculate median for even-length array', () => {
      const values = [1, 2, 3, 4];
      const median = (service as any).getMedian(values);
      expect(median).toBe(2.5);
    });

    it('should return 0 for empty array', () => {
      const values: number[] = [];
      const median = (service as any).getMedian(values);
      expect(median).toBe(0);
    });
  });
});
