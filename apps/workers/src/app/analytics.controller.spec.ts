import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('processIngestion', () => {
    it('should process ingestion job with valid payload', async () => {
      const payload = {
        organizationId: 'org-123',
        integrationId: 'int-456',
        date: '2024-12-13',
        jobId: 'job-789',
      };

      const result = await controller.processIngestion(payload);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.organizationId).toBe(payload.organizationId);
      expect(result.integrationId).toBe(payload.integrationId);
      expect(result.date).toBe(payload.date);
      expect(result.jobId).toBe(payload.jobId);
    });

    it('should process backfill ingestion job', async () => {
      const payload = {
        organizationId: 'org-123',
        integrationId: 'int-456',
        date: '2024-12-13',
        jobId: 'job-789',
        isBackfill: true,
      };

      const result = await controller.processIngestion(payload);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should include required log fields', async () => {
      const logSpy = jest.spyOn(controller['logger'], 'log');

      const payload = {
        organizationId: 'org-123',
        integrationId: 'int-456',
        date: '2024-12-13',
        jobId: 'job-789',
      };

      await controller.processIngestion(payload);

      // Verify logs include required fields: organizationId, integrationId, jobId, date
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('jobId: job-789')
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('org: org-123')
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('integration: int-456')
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('date: 2024-12-13')
      );
    });
  });

  describe('processAggregation', () => {
    it('should process aggregation job with valid payload', async () => {
      const payload = {
        date: '2024-12-13',
        jobId: 'agg-job-123',
      };

      const result = await controller.processAggregation(payload);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.date).toBe(payload.date);
      expect(result.jobId).toBe(payload.jobId);
    });

    it('should process org-specific aggregation', async () => {
      const payload = {
        date: '2024-12-13',
        jobId: 'agg-job-123',
        organizationId: 'org-456',
      };

      const result = await controller.processAggregation(payload);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should not throw on aggregation errors', async () => {
      const payload = {
        date: '2024-12-13',
        jobId: 'agg-job-123',
      };

      // Aggregation errors should be caught and logged, not thrown
      await expect(controller.processAggregation(payload)).resolves.toBeDefined();
    });
  });

  describe('error classification', () => {
    it('should classify token errors as permanent', () => {
      const errors = [
        new Error('Invalid token'),
        new Error('Token expired'),
        new Error('Permission denied'),
        new Error('Access denied'),
        { message: 'Unauthorized', statusCode: 401 },
        { message: 'Forbidden', statusCode: 403 },
        { message: 'Bad request', statusCode: 400 },
      ];

      errors.forEach((error) => {
        const errorType = controller['classifyError'](error);
        expect(errorType).toBe('permanent');
      });
    });

    it('should classify network errors as transient', () => {
      const errors = [
        new Error('Network timeout'),
        new Error('Connection refused'),
        { message: 'Internal server error', statusCode: 500 },
        { message: 'Service unavailable', statusCode: 503 },
        new Error('Socket hang up'),
      ];

      errors.forEach((error) => {
        const errorType = controller['classifyError'](error);
        expect(errorType).toBe('transient');
      });
    });
  });
});
