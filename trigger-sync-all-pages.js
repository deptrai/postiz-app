const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const dayjs = require('dayjs');

const prisma = new PrismaClient();
const organizationId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';

// Create BullMQ queue
const analyticsQueue = new Queue('analytics-ingest', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

async function triggerSyncForAllPages() {
  try {
    // Get all tracked integrations
    const tracked = await prisma.analyticsTrackedIntegration.findMany({
      where: { organizationId },
      include: {
        integration: {
          select: { id: true, name: true },
        },
      },
    });

    console.log(`Triggering sync for ${tracked.length} tracked pages...\n`);

    // Sync last 30 days for each integration
    const endDate = dayjs().format('YYYY-MM-DD');
    const startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

    let jobCount = 0;

    for (const track of tracked) {
      const integrationId = track.integrationId;
      const pageName = track.integration.name;

      console.log(`Syncing: ${pageName}`);

      let current = dayjs(startDate);
      const end = dayjs(endDate);

      while (current.isBefore(end) || current.isSame(end, 'day')) {
        const date = current.format('YYYY-MM-DD');
        const jobId = `analytics-sync-${organizationId}-${integrationId}-${date}`;

        await analyticsQueue.add(
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
              organizationId,
              integrationId,
              date,
              jobId,
              isBackfill: true,
            },
          },
          {
            jobId,
            removeOnComplete: true,
            removeOnFail: true,
          }
        );

        jobCount++;
        current = current.add(1, 'day');
      }
    }

    console.log(`\n✅ Queued ${jobCount} sync jobs for ${tracked.length} pages`);
    console.log(`Each page will sync 30 days of data`);

    await analyticsQueue.close();
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await analyticsQueue.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

triggerSyncForAllPages();
