import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsIngestionTask } from './analytics.ingestion.task';
import { BullMqClient } from '@gitroom/nestjs-libraries/bull-mq-transport-new/client';
import { DatabaseService } from '@gitroom/nestjs-libraries/database/prisma/database.service';
import dayjs from 'dayjs';

describe('AnalyticsIngestionTask', () => {
  let task: AnalyticsIngestionTask;
  let bullMqClient: jest.Mocked<BullMqClient>;
  let databaseService: jest.Mocked<DatabaseService>;

  beforeEach(async () => {
    const mockBullMqClient = {
      emit: jest.fn(),
      getQueue: jest.fn(),
    };

    const mockDatabaseService = {
      integration: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsIngestionTask,
        {
          provide: BullMqClient,
          useValue: mockBullMqClient,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    task = module.get<AnalyticsIngestionTask>(AnalyticsIngestionTask);
    bullMqClient = module.get(BullMqClient);
    databaseService = module.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(task).toBeDefined();
  });

  describe('handleDailyIngestion', () => {
    it('should enqueue jobs for all active Facebook integrations', async () => {
      const mockIntegrations = [
        {
          id: 'int-1',
          organizationId: 'org-1',
          name: 'Facebook Page 1',
        },
        {
          id: 'int-2',
          organizationId: 'org-1',
          name: 'Facebook Page 2',
        },
        {
          id: 'int-3',
          organizationId: 'org-2',
          name: 'Facebook Page 3',
        },
      ];

      databaseService.integration.findMany.mockResolvedValue(mockIntegrations as any);

      await task.handleDailyIngestion();

      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

      // Should call findMany with correct filters
      expect(databaseService.integration.findMany).toHaveBeenCalledWith({
        where: {
          type: 'facebook',
          disabled: false,
          deletedAt: null,
        },
        select: {
          id: true,
          organizationId: true,
          name: true,
        },
      });

      // Should emit 3 ingestion jobs + 1 aggregation job
      expect(bullMqClient.emit).toHaveBeenCalledTimes(4);

      // Verify ingestion jobs
      mockIntegrations.forEach((integration, index) => {
        const jobId = `analytics-ingest-${integration.organizationId}-${integration.id}-${yesterday}`;
        expect(bullMqClient.emit).toHaveBeenNthCalledWith(
          index + 1,
          'analytics-ingest',
          {
            id: jobId,
            options: {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
              removeOnComplete: true,
              removeOnFail: false,
            },
            payload: {
              organizationId: integration.organizationId,
              integrationId: integration.id,
              date: yesterday,
              jobId,
            },
          }
        );
      });

      // Verify aggregation job
      expect(bullMqClient.emit).toHaveBeenNthCalledWith(
        4,
        'analytics-aggregate',
        expect.objectContaining({
          id: `analytics-aggregate-${yesterday}`,
          options: expect.objectContaining({
            delay: 30 * 60 * 1000, // 30 minutes
            attempts: 2,
          }),
          payload: {
            date: yesterday,
            jobId: `analytics-aggregate-${yesterday}`,
          },
        })
      );
    });

    it('should handle no active integrations gracefully', async () => {
      databaseService.integration.findMany.mockResolvedValue([]);

      await task.handleDailyIngestion();

      // Should still emit aggregation job
      expect(bullMqClient.emit).toHaveBeenCalledTimes(1);
      expect(bullMqClient.emit).toHaveBeenCalledWith(
        'analytics-aggregate',
        expect.any(Object)
      );
    });

    it('should handle database errors gracefully', async () => {
      databaseService.integration.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Should not throw
      await expect(task.handleDailyIngestion()).resolves.not.toThrow();
    });
  });

  describe('triggerBackfill', () => {
    it('should enqueue jobs for date range', async () => {
      const startDate = '2024-12-01';
      const endDate = '2024-12-03';

      await task.triggerBackfill('org-1', 'int-1', startDate, endDate);

      // Should emit 3 jobs (Dec 1, Dec 2, Dec 3)
      expect(bullMqClient.emit).toHaveBeenCalledTimes(3);

      // Verify each job
      ['2024-12-01', '2024-12-02', '2024-12-03'].forEach((date, index) => {
        const jobId = `analytics-backfill-org-1-int-1-${date}`;
        expect(bullMqClient.emit).toHaveBeenNthCalledWith(
          index + 1,
          'analytics-ingest',
          {
            id: jobId,
            options: {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
              removeOnComplete: true,
              removeOnFail: false,
            },
            payload: {
              organizationId: 'org-1',
              integrationId: 'int-1',
              date,
              jobId,
              isBackfill: true,
            },
          }
        );
      });
    });

    it('should handle single day backfill', async () => {
      await task.triggerBackfill('org-1', 'int-1', '2024-12-13', '2024-12-13');

      expect(bullMqClient.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('job payload validation', () => {
    it('should include all required fields in ingestion payload', async () => {
      databaseService.integration.findMany.mockResolvedValue([
        {
          id: 'int-1',
          organizationId: 'org-1',
          name: 'Test Page',
        },
      ] as any);

      await task.handleDailyIngestion();

      const emitCall = bullMqClient.emit.mock.calls.find(
        (call) => call[0] === 'analytics-ingest'
      );
      const payload = emitCall?.[1]?.payload;

      expect(payload).toMatchObject({
        organizationId: expect.any(String),
        integrationId: expect.any(String),
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        jobId: expect.any(String),
      });
    });

    it('should configure retry policy correctly', async () => {
      databaseService.integration.findMany.mockResolvedValue([
        {
          id: 'int-1',
          organizationId: 'org-1',
          name: 'Test Page',
        },
      ] as any);

      await task.handleDailyIngestion();

      const emitCall = bullMqClient.emit.mock.calls.find(
        (call) => call[0] === 'analytics-ingest'
      );
      const options = emitCall?.[1]?.options;

      expect(options).toMatchObject({
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
    });
  });
});
