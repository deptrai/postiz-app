import { Test, TestingModule } from '@nestjs/testing';
import { AIAssistantService } from './ai-assistant.service';

describe('AIAssistantService', () => {
  let service: AIAssistantService;
  let mockPrismaService: any;
  let mockOpenaiService: any;
  let mockAnalyticsDashboardService: any;

  beforeEach(async () => {
    mockPrismaService = {
      aIConversation: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      analyticsDailyMetric: {
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    mockOpenaiService = {
      generatePosts: jest.fn(),
    };

    mockAnalyticsDashboardService = {
      getDashboardData: jest.fn(),
    };

    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        AIAssistantService,
        {
          provide: 'PrismaService',
          useValue: mockPrismaService,
        },
        {
          provide: 'OpenaiService',
          useValue: mockOpenaiService,
        },
        {
          provide: 'AnalyticsDashboardService',
          useValue: mockAnalyticsDashboardService,
        },
      ],
    }).compile();

    service = testModule.get<AIAssistantService>(AIAssistantService);
    (service as any)._prismaService = mockPrismaService;
    (service as any)._openaiService = mockOpenaiService;
    (service as any)._analyticsDashboardService = mockAnalyticsDashboardService;
  });

  describe('buildAnalyticsContext', () => {
    it('should build analytics context with metrics', async () => {
      const mockCurrentMetrics = {
        _sum: {
          reach: 10000,
          impressions: 50000,
          reactions: 2000,
          comments: 500,
          shares: 300,
          videoViews: 1000,
        },
      };

      const mockPreviousMetrics = {
        _sum: {
          reach: 8000,
          impressions: 40000,
          reactions: 1500,
          comments: 400,
          shares: 200,
        },
      };

      const mockPlatformStats = [
        { platform: 'twitter', _sum: { reach: 5000 } },
        { platform: 'facebook', _sum: { reach: 3000 } },
        { platform: 'instagram', _sum: { reach: 2000 } },
      ];

      mockPrismaService.analyticsDailyMetric.aggregate
        .mockResolvedValueOnce(mockCurrentMetrics)
        .mockResolvedValueOnce(mockPreviousMetrics);

      mockPrismaService.analyticsDailyMetric.groupBy.mockResolvedValue(mockPlatformStats);

      const context = await (service as any).buildAnalyticsContext('org-1');

      expect(context.totalReach).toBe(10000);
      expect(context.totalImpressions).toBe(50000);
      expect(context.totalReactions).toBe(2000);
      expect(context.engagementRate).toBeGreaterThan(0);
      expect(context.topPlatforms).toHaveLength(3);
      expect(context.recentTrends).toHaveLength(3);
    });

    it('should handle zero values gracefully', async () => {
      const mockMetrics = {
        _sum: {
          reach: 0,
          impressions: 0,
          reactions: 0,
          comments: 0,
          shares: 0,
          videoViews: 0,
        },
      };

      mockPrismaService.analyticsDailyMetric.aggregate.mockResolvedValue(mockMetrics);
      mockPrismaService.analyticsDailyMetric.groupBy.mockResolvedValue([]);

      const context = await (service as any).buildAnalyticsContext('org-1');

      expect(context.totalReach).toBe(0);
      expect(context.engagementRate).toBe(0);
    });

    it('should filter by integrationId when provided', async () => {
      mockPrismaService.analyticsDailyMetric.aggregate.mockResolvedValue({
        _sum: { reach: 1000, impressions: 5000, reactions: 100, comments: 50, shares: 20 },
      });
      mockPrismaService.analyticsDailyMetric.groupBy.mockResolvedValue([]);

      await (service as any).buildAnalyticsContext('org-1', 'integration-1');

      expect(mockPrismaService.analyticsDailyMetric.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            integrationId: 'integration-1',
          }),
        })
      );
    });
  });

  describe('askQuestion', () => {
    it('should create conversation record after asking question', async () => {
      const mockContext = {
        totalReach: 10000,
        totalImpressions: 50000,
        totalReactions: 2000,
        totalComments: 500,
        totalShares: 300,
        engagementRate: 5.6,
        topPlatforms: [],
        recentTrends: [],
        timeRange: { start: new Date(), end: new Date() },
      };

      mockPrismaService.analyticsDailyMetric.aggregate.mockResolvedValue({
        _sum: { reach: 10000, impressions: 50000, reactions: 2000, comments: 500, shares: 300 },
      });
      mockPrismaService.analyticsDailyMetric.groupBy.mockResolvedValue([]);
      mockPrismaService.aIConversation.findMany.mockResolvedValue([]);
      mockPrismaService.aIConversation.create.mockResolvedValue({
        id: 'conv-1',
        question: 'Why did engagement drop?',
        answer: 'Based on the data...',
      });

      jest.spyOn(service as any, 'queryLLM').mockResolvedValue('Based on the data, your engagement dropped by 10%.');

      const result = await service.askQuestion('org-1', 'user-1', 'Why did engagement drop?');

      expect(result.answer).toBeDefined();
      expect(result.tokensUsed).toBeGreaterThan(0);
      expect(mockPrismaService.aIConversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-1',
            userId: 'user-1',
            question: 'Why did engagement drop?',
          }),
        })
      );
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation history', async () => {
      const mockHistory = [
        {
          id: 'conv-1',
          question: 'Why did reach drop?',
          answer: 'Because...',
          tokensUsed: 500,
          createdAt: new Date(),
        },
        {
          id: 'conv-2',
          question: 'What platform performs best?',
          answer: 'Twitter performs best...',
          tokensUsed: 450,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.aIConversation.findMany.mockResolvedValue(mockHistory);

      const result = await service.getConversationHistory('org-1', 'user-1', 10);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.aIConversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: 'org-1',
            userId: 'user-1',
          },
          take: 10,
        })
      );
    });
  });

  describe('getRecentConversations', () => {
    it('should get recent conversations for context', async () => {
      const mockConversations = [
        { question: 'Question 1', answer: 'Answer 1' },
        { question: 'Question 2', answer: 'Answer 2' },
      ];

      mockPrismaService.aIConversation.findMany.mockResolvedValue(mockConversations);

      const result = await (service as any).getRecentConversations('org-1', 'user-1', 5);

      expect(result).toHaveLength(2);
      expect(result[0].question).toBe('Question 1');
    });
  });

  describe('estimateTokens', () => {
    it('should estimate token count correctly', () => {
      const question = 'Why did my engagement rate drop?';
      const answer = 'Your engagement rate dropped because of several factors...';
      const context = {
        totalReach: 10000,
        totalImpressions: 50000,
        totalReactions: 2000,
        totalComments: 500,
        totalShares: 300,
        engagementRate: 5.6,
        topPlatforms: [],
        recentTrends: [],
        timeRange: { start: new Date(), end: new Date() },
      };

      const tokens = (service as any).estimateTokens(question, answer, context);

      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe('getSuggestedQuestions', () => {
    it('should return default suggestions', () => {
      const context = {
        totalReach: 10000,
        totalImpressions: 50000,
        totalReactions: 2000,
        totalComments: 500,
        totalShares: 300,
        engagementRate: 5.6,
        topPlatforms: [],
        recentTrends: [
          { metric: 'reach', change: -5, period: 'last 30 days' },
          { metric: 'impressions', change: 10, period: 'last 30 days' },
          { metric: 'engagement', change: 25, period: 'last 30 days' },
        ],
        timeRange: { start: new Date(), end: new Date() },
      };

      const suggestions = service.getSuggestedQuestions(context);

      expect(suggestions).toContain('Why did my engagement rate change?');
      expect(suggestions).toContain('Which platform is performing best?');
    });

    it('should add decline suggestion when reach drops significantly', () => {
      const context = {
        totalReach: 10000,
        totalImpressions: 50000,
        totalReactions: 2000,
        totalComments: 500,
        totalShares: 300,
        engagementRate: 5.6,
        topPlatforms: [],
        recentTrends: [
          { metric: 'reach', change: -15, period: 'last 30 days' },
          { metric: 'impressions', change: 10, period: 'last 30 days' },
          { metric: 'engagement', change: 5, period: 'last 30 days' },
        ],
        timeRange: { start: new Date(), end: new Date() },
      };

      const suggestions = service.getSuggestedQuestions(context);

      expect(suggestions).toContain('Why is my reach declining?');
    });

    it('should add engagement increase suggestion when engagement spikes', () => {
      const context = {
        totalReach: 10000,
        totalImpressions: 50000,
        totalReactions: 2000,
        totalComments: 500,
        totalShares: 300,
        engagementRate: 5.6,
        topPlatforms: [],
        recentTrends: [
          { metric: 'reach', change: 5, period: 'last 30 days' },
          { metric: 'impressions', change: 10, period: 'last 30 days' },
          { metric: 'engagement', change: 25, period: 'last 30 days' },
        ],
        timeRange: { start: new Date(), end: new Date() },
      };

      const suggestions = service.getSuggestedQuestions(context);

      expect(suggestions).toContain("What's driving the increase in engagement?");
    });

    it('should add improvement suggestion when engagement rate is low', () => {
      const context = {
        totalReach: 10000,
        totalImpressions: 50000,
        totalReactions: 500,
        totalComments: 100,
        totalShares: 50,
        engagementRate: 1.3,
        topPlatforms: [],
        recentTrends: [],
        timeRange: { start: new Date(), end: new Date() },
      };

      const suggestions = service.getSuggestedQuestions(context);

      expect(suggestions).toContain('How can I improve my engagement rate?');
    });
  });
});
