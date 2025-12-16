import { Test, TestingModule } from '@nestjs/testing';
import { MonetizationAlertService } from './monetization-alert.service';
import { PrismaService } from '../prisma.service';
import { AlertType, AlertSeverity } from '@prisma/client';

describe('MonetizationAlertService', () => {
  let service: MonetizationAlertService;
  let prisma: PrismaService;

  const mockPrismaService = {
    alert: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    notificationPreferences: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    analyticsContent: {
      count: jest.fn(),
    },
    analyticsMetric: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonetizationAlertService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MonetizationAlertService>(MonetizationAlertService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkMonetizationMilestones', () => {
    const orgId = 'test-org-id';

    beforeEach(() => {
      // Mock notification preferences
      mockPrismaService.notificationPreferences.findFirst.mockResolvedValue({
        id: 'pref-1',
        organizationId: orgId,
        userId: 'user-1',
        monetizationMilestoneEnabled: true,
        emailEnabled: true,
        inAppEnabled: true,
        criticalEnabled: true,
        warningEnabled: true,
        infoEnabled: true,
      });

      // Mock analytics data - default to 0
      mockPrismaService.analyticsContent.count.mockResolvedValue(0);
      mockPrismaService.analyticsMetric.aggregate.mockResolvedValue({
        _sum: { metricValue: 0 },
      });
    });

    it('should create 80% milestone alert', async () => {
      // Mock progress at 85% (crossed 80% threshold)
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 8500 } }) // followers
        .mockResolvedValueOnce({ _sum: { metricValue: 25500 } }); // oneMinuteViews

      await service.checkMonetizationMilestones(orgId);

      // Should create an 80% milestone alert
      expect(mockPrismaService.alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: orgId,
            type: AlertType.MONETIZATION_MILESTONE,
            severity: AlertSeverity.INFO,
            threshold: 80,
            title: expect.stringContaining('Almost There!'),
          }),
        })
      );
    });

    it('should create 90% milestone alert', async () => {
      // Mock progress at 95% (crossed 90% threshold)
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 9500 } }) // followers
        .mockResolvedValueOnce({ _sum: { metricValue: 28500 } }); // oneMinuteViews

      await service.checkMonetizationMilestones(orgId);

      // Should create a 90% milestone alert
      expect(mockPrismaService.alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: orgId,
            type: AlertType.MONETIZATION_MILESTONE,
            severity: AlertSeverity.WARNING,
            threshold: 90,
            title: expect.stringContaining('So Close!'),
          }),
        })
      );
    });

    it('should create 100% milestone alert with celebration', async () => {
      // Mock progress at 100%
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 10000 } }) // followers
        .mockResolvedValueOnce({ _sum: { metricValue: 30000 } }); // oneMinuteViews

      await service.checkMonetizationMilestones(orgId);

      // Should create a 100% milestone alert
      expect(mockPrismaService.alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: orgId,
            type: AlertType.MONETIZATION_MILESTONE,
            severity: AlertSeverity.INFO,
            threshold: 100,
            title: expect.stringContaining('🎉'),
            title: expect.stringContaining('Congratulations'),
          }),
        })
      );
    });

    it('should not create duplicate milestone alerts', async () => {
      // Mock progress at 85% for both calls
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 8500 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 25500 } });

      // First call - should create alert
      await service.checkMonetizationMilestones(orgId);
      const firstCallCount = mockPrismaService.alert.create.mock.calls.length;

      // Reset mock
      mockPrismaService.alert.create.mockClear();

      // Mock same progress again
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 8500 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 25500 } });

      // Second call - should NOT create alert (no progress change)
      await service.checkMonetizationMilestones(orgId);
      
      expect(mockPrismaService.alert.create).not.toHaveBeenCalled();
    });

    it('should create progress drop alert', async () => {
      // First call - high progress
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 9000 } }) // 90% followers
        .mockResolvedValueOnce({ _sum: { metricValue: 27000 } }); // 90% views

      await service.checkMonetizationMilestones(orgId);

      // Reset mock
      mockPrismaService.alert.create.mockClear();

      // Second call - progress dropped by 20%
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 7000 } }) // 70% followers (dropped from 90%)
        .mockResolvedValueOnce({ _sum: { metricValue: 21000 } }); // 70% views

      await service.checkMonetizationMilestones(orgId);

      // Should create a progress drop warning
      expect(mockPrismaService.alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: orgId,
            type: AlertType.MONETIZATION_MILESTONE,
            severity: AlertSeverity.WARNING,
            title: expect.stringContaining('⚠️'),
            title: expect.stringContaining('Warning'),
            title: expect.stringContaining('Dropped'),
          }),
        })
      );
    });

    it('should respect notification preferences', async () => {
      // Mock preferences with monetization alerts disabled
      mockPrismaService.notificationPreferences.findFirst.mockResolvedValue({
        id: 'pref-1',
        organizationId: orgId,
        userId: 'user-1',
        monetizationMilestoneEnabled: false, // Disabled
        emailEnabled: true,
        inAppEnabled: true,
        criticalEnabled: true,
        warningEnabled: true,
        infoEnabled: true,
      });

      // Mock progress at 85%
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 8500 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 25500 } });

      await service.checkMonetizationMilestones(orgId);

      // Should NOT create alert because preferences disabled
      expect(mockPrismaService.alert.create).not.toHaveBeenCalled();
    });

    it('should not create drop alert if warnings disabled', async () => {
      // Mock preferences with warnings disabled
      mockPrismaService.notificationPreferences.findFirst.mockResolvedValue({
        id: 'pref-1',
        organizationId: orgId,
        userId: 'user-1',
        monetizationMilestoneEnabled: true,
        emailEnabled: true,
        inAppEnabled: true,
        criticalEnabled: true,
        warningEnabled: false, // Warnings disabled
        infoEnabled: true,
      });

      // Setup progress drop scenario
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 9000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 27000 } });

      await service.checkMonetizationMilestones(orgId);

      mockPrismaService.alert.create.mockClear();

      // Progress drops
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 7000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 21000 } });

      await service.checkMonetizationMilestones(orgId);

      // Should NOT create drop alert because warnings disabled
      expect(mockPrismaService.alert.create).not.toHaveBeenCalled();
    });

    it('should handle missing metrics gracefully', async () => {
      // Mock null analytics data
      mockPrismaService.analyticsMetric.aggregate.mockResolvedValue({
        _sum: { metricValue: null },
      });

      // Should not throw error
      await expect(service.checkMonetizationMilestones(orgId)).resolves.not.toThrow();
    });
  });

  describe('Milestone suggestions', () => {
    it('should provide appropriate suggestions for 80% milestone', async () => {
      const orgId = 'test-org-id';

      mockPrismaService.notificationPreferences.findFirst.mockResolvedValue({
        monetizationMilestoneEnabled: true,
        warningEnabled: true,
        infoEnabled: true,
      });

      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 8000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 24000 } });

      await service.checkMonetizationMilestones(orgId);

      const createCall = mockPrismaService.alert.create.mock.calls[0][0];
      expect(createCall.data.suggestions).toContain(expect.stringContaining('progress'));
    });

    it('should provide appropriate suggestions for 100% milestone', async () => {
      const orgId = 'test-org-id';

      mockPrismaService.notificationPreferences.findFirst.mockResolvedValue({
        monetizationMilestoneEnabled: true,
        warningEnabled: true,
        infoEnabled: true,
      });

      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 10000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 30000 } });

      await service.checkMonetizationMilestones(orgId);

      const createCall = mockPrismaService.alert.create.mock.calls[0][0];
      expect(createCall.data.suggestions).toContain(expect.stringContaining('monetizing'));
    });
  });
});
