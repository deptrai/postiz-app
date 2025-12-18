import { Test, TestingModule } from '@nestjs/testing';
import { PolicyComplianceService } from './policy-compliance.service';
import { EngagementBaitService } from './engagement-bait.service';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

describe('PolicyComplianceService', () => {
  let service: PolicyComplianceService;
  let engagementBaitService: jest.Mocked<EngagementBaitService>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    analyticsContent: {
      findMany: jest.fn(),
    },
  };

  const mockEngagementBaitService = {
    detectEngagementBait: jest.fn(),
  };

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyComplianceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EngagementBaitService,
          useValue: mockEngagementBaitService,
        },
      ],
    }).compile();

    service = testModule.get<PolicyComplianceService>(PolicyComplianceService);
    engagementBaitService = testModule.get(EngagementBaitService);
    prismaService = testModule.get(PrismaService);

    jest.clearAllMocks();
    mockEngagementBaitService.detectEngagementBait.mockReturnValue({
      hasBait: false,
      baitScore: 0,
      detectedPatterns: [],
    });
  });

  describe('checkCompliance', () => {
    it('should return compliant for empty content', () => {
      const result = service.checkCompliance('');

      expect(result.isCompliant).toBe(true);
      expect(result.complianceScore).toBe(100);
      expect(result.violations).toHaveLength(0);
    });

    it('should return compliant for clean content', () => {
      const result = service.checkCompliance('Check out our amazing new product!');

      expect(result.isCompliant).toBe(true);
      expect(result.complianceScore).toBe(100);
    });

    it('should detect clickbait patterns', () => {
      const result = service.checkCompliance('You wont believe what happened next!');

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some((v) => v.ruleId === 'cm-clickbait')).toBe(true);
    });

    it('should detect engagement solicitation', () => {
      const result = service.checkCompliance('Like this post if you agree!');

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some((v) => v.ruleId === 'cm-engagement-solicitation')).toBe(true);
    });

    it('should detect misleading medical claims', () => {
      const result = service.checkCompliance('This miracle cure will heal everything!');

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some((v) => v.ruleId === 'cm-misleading-medical')).toBe(true);
    });

    it('should detect profanity', () => {
      const result = service.checkCompliance('This is fucking amazing!');

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some((v) => v.ruleId === 'cm-advertiser-friendly')).toBe(true);
    });

    it('should detect excessive hashtags', () => {
      const hashtags = '#a #b #c #d #e #f #g #h #i #j #k #l #m #n #o #p #q';
      const result = service.checkCompliance(hashtags);

      expect(result.violations.some((v) => v.ruleId === 'cm-excessive-hashtags')).toBe(true);
    });

    it('should detect spam patterns', () => {
      const result = service.checkCompliance('DM me for free money! Get rich quick!');

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some((v) => v.ruleId === 'cm-spam-patterns')).toBe(true);
    });

    it('should detect repost indicators', () => {
      const result = service.checkCompliance('Repost from @someone - great content!');

      expect(result.violations.some((v) => v.ruleId === 'pm-original-content')).toBe(true);
    });

    it('should calculate score based on severity', () => {
      // Critical violation should reduce score by 30
      const result = service.checkCompliance('This miracle cure cures cancer!');

      expect(result.complianceScore).toBeLessThanOrEqual(70);
    });

    it('should provide fix suggestions for violations', () => {
      const result = service.checkCompliance('Like this post!');

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].fixSuggestion).toBeDefined();
    });

    it('should add recommendations for bait detection', () => {
      mockEngagementBaitService.detectEngagementBait.mockReturnValue({
        hasBait: true,
        baitScore: 50,
        detectedPatterns: [{ type: 'like' }],
      });

      const result = service.checkCompliance('Some content');

      expect(result.recommendations.some((r) => r.includes('Engagement bait'))).toBe(true);
    });
  });

  describe('getComplianceHistory', () => {
    it('should return history with trends', async () => {
      const mockContent = [
        {
          id: 'content-1',
          externalContentId: 'ext-1',
          caption: 'Clean content',
          publishedAt: new Date(),
          organizationId: 'org-1',
          deletedAt: null,
        },
        {
          id: 'content-2',
          externalContentId: 'ext-2',
          caption: 'Like this post!',
          publishedAt: new Date(),
          organizationId: 'org-1',
          deletedAt: null,
        },
      ];

      mockPrismaService.analyticsContent.findMany.mockResolvedValue(mockContent);

      const result = await service.getComplianceHistory('org-1', 7);

      expect(result.trends).toBeDefined();
      expect(result.trends.length).toBe(7);
      expect(result.totalContent).toBe(2);
      expect(result.recentViolations).toBeDefined();
    });

    it('should return empty history for no content', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const result = await service.getComplianceHistory('org-1', 7);

      expect(result.totalContent).toBe(0);
      expect(result.totalViolations).toBe(0);
      expect(result.averageScore).toBe(100);
    });
  });

  describe('getPolicies', () => {
    it('should return list of policies', () => {
      const policies = service.getPolicies();

      expect(policies.length).toBeGreaterThan(0);
      expect(policies[0].id).toBeDefined();
      expect(policies[0].name).toBeDefined();
      expect(policies[0].category).toBeDefined();
      expect(policies[0].severity).toBeDefined();
    });
  });

  describe('getPoliciesByCategory', () => {
    it('should filter by partner monetization', () => {
      const policies = service.getPoliciesByCategory('partner_monetization');

      expect(policies.length).toBeGreaterThan(0);
      policies.forEach((p) => {
        expect(p.id).toContain('pm-');
      });
    });

    it('should filter by content monetization', () => {
      const policies = service.getPoliciesByCategory('content_monetization');

      expect(policies.length).toBeGreaterThan(0);
      policies.forEach((p) => {
        expect(p.id).toContain('cm-');
      });
    });
  });
});
