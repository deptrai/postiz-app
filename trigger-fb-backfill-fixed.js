const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
const dayjs = require('dayjs');

const prisma = new PrismaClient();

async function triggerFBBackfill() {
  console.log('🚀 Triggering Facebook Analytics Backfill (Fixed)\n');

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

  // Connect to Redis using same pattern as BullMqClient
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  console.log('📋 Triggering backfill jobs...\n');

  // Backfill last 7 days
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

      // Emit event matching cron pattern
      const eventData = {
        pattern: 'analytics-ingest',
        data: {
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
            organizationId: orgId,
            integrationId: integration.id,
            date,
            jobId,
            isBackfill: true,
          },
        },
      };

      // Publish to Redis channel that workers listen to
      await redis.publish('postiz-workers', JSON.stringify(eventData));
      
      jobCount++;
      current = current.add(1, 'day');
    }

    console.log(`   ✅ Enqueued ${jobCount} content jobs`);

    // Trigger metrics jobs (delayed)
    current = dayjs(startDate);
    let metricsCount = 0;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      const date = current.format('YYYY-MM-DD');
      const metricsJobId = `analytics-backfill-metrics-${orgId}-${integration.id}-${date}`;

      const metricsEventData = {
        pattern: 'analytics-ingest-metrics',
        data: {
          id: metricsJobId,
          options: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            delay: 30000, // 30 second delay
            removeOnComplete: true,
            removeOnFail: false,
          },
          payload: {
            organizationId: orgId,
            integrationId: integration.id,
            date,
            jobId: metricsJobId,
            isBackfill: true,
          },
        },
      };

      await redis.publish('postiz-workers', JSON.stringify(metricsEventData));
      
      metricsCount++;
      current = current.add(1, 'day');
    }

    console.log(`   ✅ Enqueued ${metricsCount} metrics jobs (delayed 30 sec)`);
  }

  await redis.quit();

  console.log('\n═══════════════════════════════════════');
  console.log('🎉 Backfill Triggered!\n');
  console.log(`Total Jobs: ${tracked.length * 16} (8 content + 8 metrics per integration)`);
  console.log('\n⏳ Estimated Time: 2-5 minutes');
  console.log('\n📋 Monitor Progress:');
  console.log('   node check-backfill-progress.js\n');
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
