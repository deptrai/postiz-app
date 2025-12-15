import { Test, TestingModule } from '@nestjs/testing';
import { AlertNotificationService } from './alert-notification.service';
import { NotificationService } from './notification.service';
import { AlertType, AlertSeverity } from '@prisma/client';

describe('AlertNotificationService', () => {
  let service: AlertNotificationService;
  let mockPrismaService: any;
  let mockNotificationService: any;

  beforeEach(async () => {
    mockPrismaService = {
      notificationPreferences: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
      userOrganization: {
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    mockNotificationService = {
      inAppNotification: jest.fn(),
      sendEmail: jest.fn(),
      hasEmailProvider: jest.fn().mockReturnValue(true),
    };

    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        AlertNotificationService,
        {
          provide: 'PrismaService',
          useValue: mockPrismaService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = testModule.get<AlertNotificationService>(AlertNotificationService);
    (service as any)._prismaService = mockPrismaService;
    (service as any)._notificationService = mockNotificationService;
  });

  describe('sendAlertNotification', () => {
    const mockAlert = {
      id: 'alert-1',
      organizationId: 'org-1',
      type: AlertType.KPI_DROP,
      severity: AlertSeverity.CRITICAL,
      title: 'Critical: Reach dropped 55%',
      message: 'Your reach has dropped significantly',
      metric: 'reach',
      currentValue: 450,
      previousValue: 1000,
      changePercent: -55,
    };

    it('should send in-app notification when enabled', async () => {
      mockPrismaService.notificationPreferences.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          emailEnabled: false,
          inAppEnabled: true,
          kpiDropEnabled: true,
          criticalEnabled: true,
        },
      ]);

      await service.sendAlertNotification(mockAlert);

      expect(mockNotificationService.inAppNotification).toHaveBeenCalled();
      expect(mockNotificationService.sendEmail).not.toHaveBeenCalled();
    });

    it('should send email notification when enabled', async () => {
      mockPrismaService.notificationPreferences.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          emailEnabled: true,
          inAppEnabled: false,
          kpiDropEnabled: true,
          criticalEnabled: true,
        },
      ]);

      mockPrismaService.user.findUnique.mockResolvedValue({
        email: 'test@example.com',
      });

      await service.sendAlertNotification(mockAlert);

      expect(mockNotificationService.sendEmail).toHaveBeenCalled();
    });

    it('should not send notification if alert type is disabled', async () => {
      mockPrismaService.notificationPreferences.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          emailEnabled: true,
          inAppEnabled: true,
          kpiDropEnabled: false, // KPI drop disabled
          criticalEnabled: true,
        },
      ]);

      await service.sendAlertNotification(mockAlert);

      expect(mockNotificationService.inAppNotification).not.toHaveBeenCalled();
      expect(mockNotificationService.sendEmail).not.toHaveBeenCalled();
    });

    it('should not send notification if severity is disabled', async () => {
      mockPrismaService.notificationPreferences.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          emailEnabled: true,
          inAppEnabled: true,
          kpiDropEnabled: true,
          criticalEnabled: false, // Critical disabled
        },
      ]);

      await service.sendAlertNotification(mockAlert);

      expect(mockNotificationService.inAppNotification).not.toHaveBeenCalled();
      expect(mockNotificationService.sendEmail).not.toHaveBeenCalled();
    });

    it('should send viral spike notification when enabled', async () => {
      const viralAlert = {
        ...mockAlert,
        type: AlertType.VIRAL_SPIKE,
        severity: AlertSeverity.INFO,
        title: 'Viral: Reach spiked 300%',
        changePercent: 300,
      };

      mockPrismaService.notificationPreferences.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          emailEnabled: true,
          inAppEnabled: true,
          viralSpikeEnabled: true,
          infoEnabled: true,
        },
      ]);

      mockPrismaService.user.findUnique.mockResolvedValue({
        email: 'test@example.com',
      });

      await service.sendAlertNotification(viralAlert);

      expect(mockNotificationService.inAppNotification).toHaveBeenCalled();
      expect(mockNotificationService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('getUserNotificationPreferences', () => {
    it('should return existing preferences', async () => {
      const mockPrefs = {
        id: 'pref-1',
        organizationId: 'org-1',
        userId: 'user-1',
        emailEnabled: true,
        inAppEnabled: true,
      };

      mockPrismaService.notificationPreferences.findUnique.mockResolvedValue(mockPrefs);

      const result = await service.getUserNotificationPreferences('org-1', 'user-1');

      expect(result).toEqual(mockPrefs);
    });

    it('should create default preferences if none exist', async () => {
      mockPrismaService.notificationPreferences.findUnique.mockResolvedValue(null);
      
      const defaultPrefs = {
        id: 'pref-new',
        organizationId: 'org-1',
        userId: 'user-1',
        emailEnabled: true,
        inAppEnabled: true,
      };
      
      mockPrismaService.notificationPreferences.create.mockResolvedValue(defaultPrefs);

      const result = await service.getUserNotificationPreferences('org-1', 'user-1');

      expect(mockPrismaService.notificationPreferences.create).toHaveBeenCalled();
      expect(result).toEqual(defaultPrefs);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should upsert preferences', async () => {
      const updatedPrefs = {
        id: 'pref-1',
        organizationId: 'org-1',
        userId: 'user-1',
        emailEnabled: false,
        inAppEnabled: true,
      };

      mockPrismaService.notificationPreferences.upsert.mockResolvedValue(updatedPrefs);

      const result = await service.updateNotificationPreferences('org-1', 'user-1', {
        emailEnabled: false,
      });

      expect(mockPrismaService.notificationPreferences.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId_userId: {
              organizationId: 'org-1',
              userId: 'user-1',
            },
          },
          update: { emailEnabled: false },
        })
      );
      expect(result).toEqual(updatedPrefs);
    });
  });

  describe('getNotificationPreferences', () => {
    it('should return preferences for all users in org', async () => {
      const mockPrefs = [
        { userId: 'user-1', emailEnabled: true },
        { userId: 'user-2', emailEnabled: false },
      ];

      mockPrismaService.notificationPreferences.findMany.mockResolvedValue(mockPrefs);

      const result = await service.getNotificationPreferences('org-1');

      expect(result).toEqual(mockPrefs);
    });

    it('should create default preferences if none exist', async () => {
      mockPrismaService.notificationPreferences.findMany.mockResolvedValue([]);
      mockPrismaService.userOrganization.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);

      const defaultPref = {
        organizationId: 'org-1',
        emailEnabled: true,
        inAppEnabled: true,
      };

      mockPrismaService.notificationPreferences.create.mockResolvedValue(defaultPref);

      const result = await service.getNotificationPreferences('org-1');

      expect(mockPrismaService.notificationPreferences.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('shouldSendNotification', () => {
    it('should return true when all conditions match', () => {
      const pref = {
        kpiDropEnabled: true,
        viralSpikeEnabled: true,
        criticalEnabled: true,
        warningEnabled: true,
        infoEnabled: true,
      };

      const alert = {
        type: AlertType.KPI_DROP,
        severity: AlertSeverity.CRITICAL,
      };

      const result = (service as any).shouldSendNotification(pref, alert);
      expect(result).toBe(true);
    });

    it('should return false when alert type is disabled', () => {
      const pref = {
        kpiDropEnabled: false,
        viralSpikeEnabled: true,
        criticalEnabled: true,
      };

      const alert = {
        type: AlertType.KPI_DROP,
        severity: AlertSeverity.CRITICAL,
      };

      const result = (service as any).shouldSendNotification(pref, alert);
      expect(result).toBe(false);
    });

    it('should return false when severity is disabled', () => {
      const pref = {
        kpiDropEnabled: true,
        viralSpikeEnabled: true,
        criticalEnabled: false,
        warningEnabled: true,
        infoEnabled: true,
      };

      const alert = {
        type: AlertType.KPI_DROP,
        severity: AlertSeverity.CRITICAL,
      };

      const result = (service as any).shouldSendNotification(pref, alert);
      expect(result).toBe(false);
    });
  });

  describe('formatEmailHtml', () => {
    it('should generate HTML email for KPI drop', () => {
      const alert = {
        type: AlertType.KPI_DROP,
        severity: AlertSeverity.CRITICAL,
        title: 'Critical: Reach dropped 55%',
        message: 'Your reach has dropped',
        metric: 'reach',
        currentValue: 450,
        previousValue: 1000,
        changePercent: -55,
      };

      const html = (service as any).formatEmailHtml(alert);

      expect(html).toContain('Critical: Reach dropped 55%');
      expect(html).toContain('450');
      expect(html).toContain('1K');
      expect(html).toContain('-55.0%');
    });

    it('should generate HTML email for viral spike', () => {
      const alert = {
        type: AlertType.VIRAL_SPIKE,
        severity: AlertSeverity.INFO,
        title: 'Viral: Reach spiked 300%',
        message: 'Your content is going viral',
        metric: 'reach',
        currentValue: 4000,
        previousValue: 1000,
        changePercent: 300,
      };

      const html = (service as any).formatEmailHtml(alert);

      expect(html).toContain('Viral: Reach spiked 300%');
      expect(html).toContain('4K');
      expect(html).toContain('+300.0%');
    });
  });

  describe('formatValue', () => {
    it('should format millions', () => {
      const result = (service as any).formatValue(1500000);
      expect(result).toBe('1.5M');
    });

    it('should format thousands', () => {
      const result = (service as any).formatValue(2500);
      expect(result).toBe('2.5K');
    });

    it('should format small numbers', () => {
      const result = (service as any).formatValue(123);
      expect(result).toBe('123');
    });
  });
});
