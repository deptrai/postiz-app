const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function triggerAnalyticsSync() {
  const orgId = '1eae1e52-b1e7-422b-afa5-e54f640353a7'; // Analytics Test Co

  console.log('🚀 Triggering Analytics Sync for Analytics Test Co\n');

  // Get tracked integrations
  const tracked = await prisma.analyticsTrackedIntegration.findMany({
    where: {
      integration: {
        organizationId: orgId,
        providerIdentifier: 'facebook',
      },
    },
    include: {
      integration: true,
    },
  });

  console.log(`📊 Found ${tracked.length} tracked Facebook integrations:\n`);
  
  tracked.forEach(t => {
    console.log(`   - ${t.integration.name}`);
    console.log(`     Integration ID: ${t.integration.id}`);
    console.log(`     Page ID: ${t.integration.internalId}`);
    console.log(`     Token exists: ${!!t.integration.token}\n`);
  });

  console.log('═══════════════════════════════════════\n');
  console.log('📋 ANALYTICS SYNC EXPLANATION:\n');
  console.log('The analytics ingestion system works as follows:\n');
  console.log('1. CRON JOB: Runs daily at 2 AM');
  console.log('   - Triggers content ingestion (posts/reels/videos)');
  console.log('   - Triggers metrics ingestion (views/reach/engagement)');
  console.log('   - Stores in AnalyticsContent & AnalyticsMetric tables\n');
  
  console.log('2. MANUAL TRIGGER: Via analytics.ingestion.task.ts');
  console.log('   - triggerBackfill(orgId, integrationId, startDate, endDate)');
  console.log('   - Enqueues jobs to Redis/BullMQ queue');
  console.log('   - Workers process the queue asynchronously\n');

  console.log('3. CURRENT SITUATION:');
  console.log('   - Integrations are tracked ✓');
  console.log('   - But cron job has not run yet ❌');
  console.log('   - Need to trigger manual sync ⚠️\n');

  console.log('═══════════════════════════════════════\n');
  console.log('🔧 TO FIX:\n');
  console.log('Option 1: Wait for daily cron (runs at 2 AM)');
  console.log('Option 2: Trigger manual backfill via API/script');
  console.log('Option 3: Manually call analytics ingestion task\n');

  console.log('📝 MANUAL TRIGGER COMMAND:\n');
  console.log('The system needs to call the analytics ingestion task.');
  console.log('This requires access to the BullMQ queue and worker services.\n');

  console.log('Since this is a test environment, the recommended approach is:\n');
  console.log('1. Start the workers service (if not running)');
  console.log('2. Trigger backfill programmatically');
  console.log('3. Wait for jobs to process');
  console.log('4. Check database for new records\n');

  console.log('═══════════════════════════════════════\n');
  console.log('⚠️  IMPORTANT NOTE:\n');
  console.log('Analytics ingestion requires:');
  console.log('- Valid Facebook access tokens');
  console.log('- Facebook Graph API access');
  console.log('- Permission to read page insights');
  console.log('- Recent posts/videos to fetch metrics for\n');

  console.log('If Facebook pages have no recent posts, ');
  console.log('there will be no data to sync!\n');

  console.log('To check if pages have posts:');
  console.log('1. Visit Facebook pages');
  console.log('2. Verify posts exist in last 30 days');
  console.log('3. Ensure access tokens are valid\n');
}

triggerAnalyticsSync()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
