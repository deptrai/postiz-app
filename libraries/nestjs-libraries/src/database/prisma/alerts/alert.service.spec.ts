import { Test, TestingModule } from '@nestjs/testing';
import { AlertService } from './alert.service';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { AlertType, AlertSeverity } from '@prisma/client';

describe('AlertService', () => {
  let service: AlertService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    analyticsDailyMetric: {
      findMany: jest.fn(),
    },
    integration: {
      findMany: jest.fn(),
    },
    alert: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    alertConfig: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        AlertService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = testModule.get<AlertService>(AlertService);
    prismaService = testModule.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSeverity', () => {
    it('should return CRITICAL for drops >= 50%', () => {
      const severity = (service as any).getSeverity(-55);
      expect(severity).toBe(AlertSeverity.CRITICAL);
    });

    it('should return WARNING for drops between 30-50%', () => {
      const severity = (service as any).getSeverity(-35);
      expect(severity).toBe(AlertSeverity.WARNING);
    });

    it('should return INFO for drops between 20-30%', () => {
      const severity = (service as any).getSeverity(-25);
      expect(severity).toBe(AlertSeverity.INFO);
    });
  });

  describe('getMetricThreshold', () => {
    it('should return correct threshold for engagement_rate', () => {
      const threshold = (service as any).getMetricThreshold('engagement_rate');
      expect(threshold).toBe(20);
    });

    it('should return correct threshold for reach', () => {
      const threshold = (service as any).getMetricThreshold('reach');
      expect(threshold).toBe(30);
    });

    it('should return default threshold for unknown metric', () => {
      const threshold = (service as any).getMetricThreshold('unknown_metric');
      expect(threshold).toBe(20);
    });
  });

  describe('getSuggestions', () => {
    it('should return suggestions for engagement_rate', () => {
      const suggestions = (service as any).getSuggestions('engagement_rate', -25);
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s: string) => s.includes('content'))).toBe(true);
    });

    it('should include urgent suggestion for critical drops', () => {
      const suggestions = (service as any).getSuggestions('engagement_rate', -45);
      expect(suggestions.some((s: string) => s.includes('URGENT'))).toBe(true);
    });

    it('should return suggestions for reach', () => {
      const suggestions = (service as any).getSuggestions('reach', -35);
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.some((s: string) => s.includes('hashtag'))).toBe(true);
    });

    it('should return suggestions for views', () => {
      const suggestions = (service as any).getSuggestions('views', -30);
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.some((s: string) => s.includes('thumbnail'))).toBe(true);
    });
  });

  describe('fieldToMetricName', () => {
    it('should map reactions to engagement_rate', () => {
      const name = (service as any).fieldToMetricName('reactions');
      expect(name).toBe('engagement_rate');
    });

    it('should map videoViews to views', () => {
      const name = (service as any).fieldToMetricName('videoViews');
      expect(name).toBe('views');
    });

    it('should keep reach as reach', () => {
      const name = (service as any).fieldToMetricName('reach');
      expect(name).toBe('reach');
    });
  });

  describe('getAlerts', () => {
    it('should return alerts with pagination', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          organizationId: 'org-1',
          type: AlertType.KPI_DROP,
          severity: AlertSeverity.WARNING,
          metric: 'reach',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.alert.findMany.mockResolvedValue(mockAlerts);
      mockPrismaService.alert.count.mockResolvedValue(1);

      const result = await service.getAlerts('org-1', { limit: 10, offset: 0 });

      expect(result.alerts).toEqual(mockAlerts);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should filter by severity', async () => {
      mockPrismaService.alert.findMany.mockResolvedValue([]);
      mockPrismaService.alert.count.mockResolvedValue(0);

      await service.getAlerts('org-1', { severity: AlertSeverity.CRITICAL });

      expect(mockPrismaService.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            severity: AlertSeverity.CRITICAL,
          }),
        })
      );
    });

    it('should filter by isRead', async () => {
      mockPrismaService.alert.findMany.mockResolvedValue([]);
      mockPrismaService.alert.count.mockResolvedValue(0);

      await service.getAlerts('org-1', { isRead: false });

      expect(mockPrismaService.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isRead: false,
          }),
        })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrismaService.alert.count.mockResolvedValue(5);

      const count = await service.getUnreadCount('org-1');

      expect(count).toBe(5);
      expect(mockPrismaService.alert.count).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          isRead: false,
          deletedAt: null,
        },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark alert as read', async () => {
      mockPrismaService.alert.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsRead('alert-1', 'org-1');

      expect(mockPrismaService.alert.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'alert-1',
          organizationId: 'org-1',
          deletedAt: null,
        },
        data: expect.objectContaining({
          isRead: true,
        }),
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all alerts as read', async () => {
      mockPrismaService.alert.updateMany.mockResolvedValue({ count: 5 });

      await service.markAllAsRead('org-1');

      expect(mockPrismaService.alert.updateMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          isRead: false,
          deletedAt: null,
        },
        data: expect.objectContaining({
          isRead: true,
        }),
      });
    });
  });

  describe('deleteAlert', () => {
    it('should soft delete alert', async () => {
      mockPrismaService.alert.updateMany.mockResolvedValue({ count: 1 });

      await service.deleteAlert('alert-1', 'org-1');

      expect(mockPrismaService.alert.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'alert-1',
          organizationId: 'org-1',
          deletedAt: null,
        },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('getAlertConfig', () => {
    it('should return existing config', async () => {
      const mockConfigs = [
        { metric: 'reach', threshold: 30, enabled: true },
        { metric: 'views', threshold: 25, enabled: true },
      ];

      mockPrismaService.alertConfig.findMany.mockResolvedValue(mockConfigs);

      const result = await service.getAlertConfig('org-1');

      expect(result).toEqual(mockConfigs);
    });

    it('should create default config if none exists', async () => {
      mockPrismaService.alertConfig.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { metric: 'engagement_rate', threshold: 20, enabled: true },
        ]);
      mockPrismaService.alertConfig.createMany.mockResolvedValue({ count: 5 });

      const result = await service.getAlertConfig('org-1');

      expect(mockPrismaService.alertConfig.createMany).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('updateAlertConfig', () => {
    it('should update existing config', async () => {
      const existingConfig = {
        id: 'config-1',
        metric: 'reach',
        threshold: 30,
        enabled: true,
      };

      mockPrismaService.alertConfig.findFirst.mockResolvedValue(existingConfig);
      mockPrismaService.alertConfig.update.mockResolvedValue({
        ...existingConfig,
        threshold: 40,
      });

      const result = await service.updateAlertConfig('org-1', 'reach', {
        threshold: 40,
      });

      expect(mockPrismaService.alertConfig.update).toHaveBeenCalledWith({
        where: { id: 'config-1' },
        data: { threshold: 40 },
      });
    });

    it('should create new config if not exists', async () => {
      mockPrismaService.alertConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.alertConfig.create.mockResolvedValue({
        id: 'new-config',
        metric: 'new_metric',
        threshold: 25,
        enabled: true,
      });

      await service.updateAlertConfig('org-1', 'new_metric', {
        threshold: 25,
        enabled: true,
      });

      expect(mockPrismaService.alertConfig.create).toHaveBeenCalled();
    });
  });

  describe('checkKPIDrops', () => {
    it('should return empty array if no configs enabled', async () => {
      mockPrismaService.alertConfig.findMany.mockResolvedValue([
        { metric: 'reach', threshold: 30, enabled: false },
      ]);

      const result = await service.checkKPIDrops('org-1');

      expect(result).toEqual([]);
    });

    it('should detect KPI drops and create alerts', async () => {
      mockPrismaService.alertConfig.findMany.mockResolvedValue([
        { metric: 'reach', threshold: 30, enabled: true },
      ]);

      // Current period metrics (lower values)
      mockPrismaService.analyticsDailyMetric.findMany
        .mockResolvedValueOnce([
          { integrationId: 'int-1', reach: 500, impressions: 1000, reactions: 50, comments: 10, shares: 5, videoViews: 200, clicks: 20 },
        ])
        // Previous period metrics (higher values)
        .mockResolvedValueOnce([
          { integrationId: 'int-1', reach: 1000, impressions: 2000, reactions: 100, comments: 20, shares: 10, videoViews: 400, clicks: 40 },
        ]);

      mockPrismaService.alert.findFirst.mockResolvedValue(null);
      mockPrismaService.alert.create.mockResolvedValue({
        id: 'new-alert',
        type: AlertType.KPI_DROP,
        severity: AlertSeverity.WARNING,
      });

      const result = await service.checkKPIDrops('org-1');

      expect(mockPrismaService.alert.create).toHaveBeenCalled();
    });
  });

  describe('processKPIDropAlerts', () => {
    it('should process alerts for all integrations', async () => {
      mockPrismaService.integration.findMany.mockResolvedValue([
        { id: 'int-1' },
        { id: 'int-2' },
      ]);

      mockPrismaService.alertConfig.findMany.mockResolvedValue([]);

      const result = await service.processKPIDropAlerts('org-1');

      expect(mockPrismaService.integration.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          deletedAt: null,
          disabled: false,
        },
        select: { id: true },
      });
    });
  });

  // ==================== VIRAL SPIKE DETECTION TESTS (Story 8.2) ====================

  describe('detectViralSpikes', () => {
    it('should detect viral spikes when metrics increase >200%', async () => {
      // Current period metrics (high values - viral)
      mockPrismaService.analyticsDailyMetric.findMany
        .mockResolvedValueOnce([
          { integrationId: 'int-1', reach: 3000, impressions: 5000, reactions: 500, comments: 100, shares: 50, videoViews: 1000, clicks: 200 },
        ])
        // Previous period metrics (lower values)
        .mockResolvedValueOnce([
          { integrationId: 'int-1', reach: 1000, impressions: 1500, reactions: 150, comments: 30, shares: 15, videoViews: 300, clicks: 60 },
        ]);

      mockPrismaService.alert.findFirst.mockResolvedValue(null);
      mockPrismaService.alert.create.mockResolvedValue({
        id: 'viral-alert',
        type: 'VIRAL_SPIKE',
        severity: 'INFO',
      });

      const result = await service.detectViralSpikes('org-1');

      expect(mockPrismaService.alert.create).toHaveBeenCalled();
    });

    it('should not create alert if spike is below threshold', async () => {
      // Current period metrics (only 50% increase - not viral)
      mockPrismaService.analyticsDailyMetric.findMany
        .mockResolvedValueOnce([
          { integrationId: 'int-1', reach: 1500, impressions: 2000, reactions: 150, comments: 30, shares: 15, videoViews: 450, clicks: 90 },
        ])
        .mockResolvedValueOnce([
          { integrationId: 'int-1', reach: 1000, impressions: 1500, reactions: 100, comments: 20, shares: 10, videoViews: 300, clicks: 60 },
        ]);

      const result = await service.detectViralSpikes('org-1');

      expect(mockPrismaService.alert.create).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array if no previous metrics', async () => {
      mockPrismaService.analyticsDailyMetric.findMany
        .mockResolvedValueOnce([
          { integrationId: 'int-1', reach: 3000, impressions: 5000, reactions: 500, comments: 100, shares: 50, videoViews: 1000, clicks: 200 },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.detectViralSpikes('org-1');

      expect(result).toEqual([]);
    });
  });

  describe('generateViralRecommendations', () => {
    it('should generate recommendations for engagement metrics', () => {
      const recommendations = (service as any).generateViralRecommendations('engagement_rate', 250);
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some((r: string) => r.includes('momentum'))).toBe(true);
    });

    it('should include mega viral recommendation for >500% spike', () => {
      const recommendations = (service as any).generateViralRecommendations('views', 550);
      expect(recommendations.some((r: string) => r.includes('MEGA VIRAL'))).toBe(true);
    });

    it('should generate reach-specific recommendations', () => {
      const recommendations = (service as any).generateViralRecommendations('reach', 350);
      expect(recommendations.some((r: string) => r.includes('hashtag'))).toBe(true);
    });
  });

  describe('processViralSpikes', () => {
    it('should process viral spikes for all integrations', async () => {
      mockPrismaService.integration.findMany.mockResolvedValue([
        { id: 'int-1' },
        { id: 'int-2' },
      ]);

      mockPrismaService.analyticsDailyMetric.findMany.mockResolvedValue([]);

      const result = await service.processViralSpikes('org-1');

      expect(mockPrismaService.integration.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          deletedAt: null,
          disabled: false,
        },
        select: { id: true },
      });
    });
  });

  describe('getViralHistory', () => {
    it('should return viral history with patterns', async () => {
      const mockViralAlerts = [
        {
          id: 'viral-1',
          type: 'VIRAL_SPIKE',
          metric: 'reach',
          changePercent: 350,
          createdAt: new Date(),
        },
        {
          id: 'viral-2',
          type: 'VIRAL_SPIKE',
          metric: 'views',
          changePercent: 250,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.alert.findMany.mockResolvedValue(mockViralAlerts);
      mockPrismaService.alert.count.mockResolvedValue(2);

      const result = await service.getViralHistory('org-1');

      expect(result.viralAlerts).toEqual(mockViralAlerts);
      expect(result.total).toBe(2);
      expect(result.patterns).toBeDefined();
      expect(result.patterns.totalViralEvents).toBe(2);
      expect(result.patterns.avgSpikePercent).toBe(300);
    });

    it('should filter by integrationId', async () => {
      mockPrismaService.alert.findMany.mockResolvedValue([]);
      mockPrismaService.alert.count.mockResolvedValue(0);

      await service.getViralHistory('org-1', { integrationId: 'int-1' });

      expect(mockPrismaService.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            integrationId: 'int-1',
          }),
        })
      );
    });
  });

  describe('analyzeViralPatterns', () => {
    it('should return empty patterns for no alerts', () => {
      const patterns = (service as any).analyzeViralPatterns([]);
      expect(patterns.topMetrics).toEqual([]);
      expect(patterns.avgSpikePercent).toBe(0);
      expect(patterns.totalViralEvents).toBe(0);
    });

    it('should calculate correct patterns', () => {
      const alerts = [
        { metric: 'reach', changePercent: 300 },
        { metric: 'reach', changePercent: 400 },
        { metric: 'views', changePercent: 250 },
      ];

      const patterns = (service as any).analyzeViralPatterns(alerts);
      expect(patterns.totalViralEvents).toBe(3);
      expect(patterns.avgSpikePercent).toBe(317);
      expect(patterns.topMetrics[0].metric).toBe('reach');
      expect(patterns.topMetrics[0].count).toBe(2);
    });
  });
});
