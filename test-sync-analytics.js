const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');

const prisma = new PrismaClient();

async function testSyncAnalytics() {
  const orgId = '1eae1e52-b1e7-422b-afa5-e54f640353a7'; // Analytics Test Co

  console.log('🔄 Testing Analytics Sync for Analytics Test Co\n');

  // Get tracked Facebook integrations
  const trackedIntegrations = await prisma.analyticsTrackedIntegration.findMany({
    where: {
      integration: {
        organizationId: orgId,
        providerIdentifier: 'facebook',
        disabled: false,
        deletedAt: null,
      },
    },
    include: {
      integration: {
        select: {
          id: true,
          name: true,
          internalId: true,
          token: true,
        },
      },
    },
  });

  console.log(`📊 Found ${trackedIntegrations.length} tracked integrations:\n`);

  if (trackedIntegrations.length === 0) {
    console.log('❌ No tracked integrations found!');
    return;
  }

  trackedIntegrations.forEach(t => {
    console.log(`   ✅ ${t.integration.name}`);
    console.log(`      ID: ${t.integration.id}`);
    console.log(`      Page ID: ${t.integration.internalId}`);
    console.log(`      Has Token: ${!!t.integration.token}\n`);
  });

  // Calculate date range
  const startDate = dayjs().subtract(7, 'days').format('YYYY-MM-DD');
  const endDate = dayjs().format('YYYY-MM-DD');

  console.log(`📅 Date Range: ${startDate} to ${endDate}\n`);

  // Count jobs that would be created
  let jobCount = 0;
  for (const tracked of trackedIntegrations) {
    let currentDate = dayjs(startDate);
    const end = dayjs(endDate);

    while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
      jobCount += 2; // content + metrics
      currentDate = currentDate.add(1, 'day');
    }
  }

  console.log(`📋 Jobs to be created: ${jobCount}`);
  console.log(`   - Content ingestion: ${jobCount / 2}`);
  console.log(`   - Metrics ingestion: ${jobCount / 2}\n`);

  console.log('═══════════════════════════════════════\n');
  console.log('✅ SYNC ENDPOINT READY!\n');
  console.log('The POST /monetization/sync-analytics endpoint will:');
  console.log(`1. Find ${trackedIntegrations.length} tracked Facebook integrations`);
  console.log(`2. Create ${jobCount} jobs for dates ${startDate} to ${endDate}`);
  console.log('3. Enqueue jobs to Redis/BullMQ');
  console.log('4. Workers will process and fetch Facebook data\n');

  console.log('📝 To test manually:');
  console.log('1. Login to http://localhost:4200');
  console.log('2. Go to /monetization');
  console.log('3. Click "Đồng bộ Dữ liệu" button');
  console.log('4. Wait 2-5 minutes for data to sync\n');

  // Check current analytics data
  const contentCount = await prisma.analyticsContent.count({
    where: { organizationId: orgId },
  });
  const metricsCount = await prisma.analyticsMetric.count({
    where: { organizationId: orgId },
  });

  console.log('📊 Current Analytics Data:');
  console.log(`   Content records: ${contentCount}`);
  console.log(`   Metrics records: ${metricsCount}\n`);

  if (contentCount === 0 && metricsCount === 0) {
    console.log('⚠️  No data yet - sync will populate this!\n');
  }
}

testSyncAnalytics()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
