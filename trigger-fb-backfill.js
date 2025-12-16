const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const Redis = require('ioredis');
const dayjs = require('dayjs');

const prisma = new PrismaClient();

async function triggerFBBackfill() {
  console.log('🚀 Triggering Facebook Analytics Backfill\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9';

  // Get tracked FB integrations
  const tracked = await prisma.analyticsTrackedIntegration.findMany({
    where: {
      organizationId: orgId,
      integration: {
        providerIdentifier: 'facebook',
        disabled: false,
        deletedAt: null,
      },
    },
    include: {
      integration: true,
    },
  });

  console.log(`📱 Tracked Integrations: ${tracked.length}\n`);

  if (tracked.length === 0) {
    console.log('❌ No tracked integrations found');
    return;
  }

  // Initialize BullMQ Queue
  const queue = new Queue('postiz-workers', {
    connection: new Redis(process.env.REDIS_URL || 'redis://localhost:6379'),
  });

  console.log('📋 Triggering backfill jobs...\n');

  // Backfill last 7 days (reduced for faster testing)
  const endDate = dayjs().format('YYYY-MM-DD');
  const startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

  console.log(`Date range: ${startDate} to ${endDate}\n`);

  for (const t of tracked) {
    const integration = t.integration;
    console.log(`\n🔄 ${integration.name}`);
    console.log(`   Integration ID: ${integration.id}`);
    console.log(`   Page ID: ${integration.internalId}`);

    let current = dayjs(startDate);
    const end = dayjs(endDate);
    let jobCount = 0;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      const date = current.format('YYYY-MM-DD');
      const jobId = `analytics-backfill-${orgId}-${integration.id}-${date}`;

      // Add job to BullMQ queue
      await queue.add(
        'analytics-ingest',
        {
          organizationId: orgId,
          integrationId: integration.id,
          date,
          jobId,
          isBackfill: true,
        },
        {
          jobId,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
      
      jobCount++;
      current = current.add(1, 'day');
    }

    console.log(`   ✅ Enqueued ${jobCount} content jobs`);

    // Also trigger metrics jobs (delayed)
    current = dayjs(startDate);
    let metricsCount = 0;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      const date = current.format('YYYY-MM-DD');
      const metricsJobId = `analytics-backfill-metrics-${orgId}-${integration.id}-${date}`;

      await queue.add(
        'analytics-ingest-metrics',
        {
          organizationId: orgId,
          integrationId: integration.id,
          date,
          jobId: metricsJobId,
          isBackfill: true,
        },
        {
          jobId: metricsJobId,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          delay: 30000, // 30 second delay
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
      
      metricsCount++;
      current = current.add(1, 'day');
    }

    console.log(`   ✅ Enqueued ${metricsCount} metrics jobs (delayed 30 sec)`);
  }

  await queue.close();

  console.log('\n═══════════════════════════════════════');
  console.log('🎉 Backfill Triggered!\n');
  console.log(`Total Jobs: ${tracked.length * 62} (31 content + 31 metrics per integration)`);
  console.log('\n⏳ Estimated Time: 5-10 minutes');
  console.log('\n📋 Monitor Progress:');
  console.log('1. Check workers logs');
  console.log('2. Query AnalyticsContent table');
  console.log('3. Verify real FB post IDs appear\n');
  console.log('💡 Once complete:');
  console.log('   node delete-sample-data.js');
  console.log('   node regenerate-playbooks-real-data.js');
}

triggerFBBackfill()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
