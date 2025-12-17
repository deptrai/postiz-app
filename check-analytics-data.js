const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAnalyticsData() {
  const orgId = '1eae1e52-b1e7-422b-afa5-e54f640353a7'; // Analytics Test Co

  console.log('🔍 Checking Analytics Data for Analytics Test Co\n');

  // Check tracked integrations
  const tracked = await prisma.analyticsTrackedIntegration.findMany({
    where: {
      integration: {
        organizationId: orgId,
      },
    },
    include: {
      integration: {
        select: {
          id: true,
          name: true,
          providerIdentifier: true,
        },
      },
    },
  });

  console.log(`📊 Analytics Tracking Status: ${tracked.length} integrations tracked\n`);
  
  if (tracked.length === 0) {
    console.log('❌ NO INTEGRATIONS ARE BEING TRACKED FOR ANALYTICS!\n');
    console.log('This is why there is no data.\n');
  } else {
    tracked.forEach(t => {
      console.log(`   ✅ ${t.integration.name} (${t.integration.providerIdentifier})`);
    });
    console.log('');
  }

  // Check analytics content
  const content = await prisma.analyticsContent.findMany({
    where: {
      organizationId: orgId,
    },
    take: 5,
    orderBy: {
      publishedAt: 'desc',
    },
  });

  console.log(`📝 Analytics Content: ${content.length} records (showing 5 most recent)\n`);
  
  if (content.length === 0) {
    console.log('❌ NO ANALYTICS CONTENT DATA!\n');
  } else {
    content.forEach((c, idx) => {
      console.log(`   ${idx + 1}. ${c.contentType} - ${c.externalContentId}`);
      console.log(`      Published: ${c.publishedAt.toISOString().split('T')[0]}`);
    });
    console.log('');
  }

  // Check analytics metrics
  const metrics = await prisma.analyticsMetric.findMany({
    where: {
      organizationId: orgId,
    },
    take: 5,
  });

  console.log(`📈 Analytics Metrics: ${metrics.length} records (showing 5)\n`);
  
  if (metrics.length === 0) {
    console.log('❌ NO ANALYTICS METRICS DATA!\n');
  } else {
    metrics.forEach((m, idx) => {
      console.log(`   ${idx + 1}. ${m.metricType}: ${m.metricValue}`);
    });
    console.log('');
  }

  // Total counts
  const contentCount = await prisma.analyticsContent.count({
    where: { organizationId: orgId },
  });
  const metricsCount = await prisma.analyticsMetric.count({
    where: { organizationId: orgId },
  });

  console.log('═══════════════════════════════════════\n');
  console.log('📊 TOTALS:\n');
  console.log(`   Total Content: ${contentCount}`);
  console.log(`   Total Metrics: ${metricsCount}`);
  console.log(`   Tracked Integrations: ${tracked.length}\n`);

  // Diagnosis
  if (tracked.length === 0) {
    console.log('🔧 FIX REQUIRED:\n');
    console.log('1. Enable analytics tracking for Facebook integrations');
    console.log('2. Add integrations to AnalyticsTrackedIntegration table');
    console.log('3. Trigger manual analytics sync/backfill\n');
  } else if (contentCount === 0) {
    console.log('🔧 FIX REQUIRED:\n');
    console.log('1. Analytics tracking is enabled');
    console.log('2. But no data has been synced yet');
    console.log('3. Need to trigger analytics ingestion job\n');
  } else {
    console.log('✅ Analytics data exists!');
    console.log('   Should be showing in monetization dashboard\n');
  }
}

checkAnalyticsData()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
