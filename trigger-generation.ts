import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function triggerGeneration() {
  console.log('🚀 Triggering playbook generation...\n');

  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log('❌ No organization found');
    return;
  }

  console.log(`Using org: ${org.name} (${org.id})\n`);

  // Manually execute the generation logic with debug
  const days = 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const endDate = new Date();

  console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);

  // Query content
  const content = await prisma.analyticsContent.findMany({
    where: {
      organizationId: org.id,
      publishedAt: {
        gte: startDate,
        lte: endDate,
      },
      deletedAt: null,
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
  });

  console.log(`✅ Found ${content.length} content items`);
  if (content.length > 0) {
    console.log('Sample:', content.slice(0, 2).map(c => ({
      id: c.externalContentId,
      type: c.contentType,
      published: c.publishedAt
    })));
  }

  // Query metrics
  const contentIds = content.map((c) => c.externalContentId);
  console.log(`\nQuerying metrics for ${contentIds.length} content IDs...`);

  const dailyMetrics = await prisma.analyticsDailyMetric.findMany({
    where: {
      organizationId: org.id,
      externalContentId: { in: contentIds },
      date: { gte: startDate, lte: endDate },
      deletedAt: null,
    },
  });

  console.log(`✅ Found ${dailyMetrics.length} daily metrics`);
  if (dailyMetrics.length > 0) {
    console.log('Sample:', dailyMetrics.slice(0, 2).map(m => ({
      contentId: m.externalContentId,
      reach: m.reach,
      reactions: m.reactions
    })));
  }

  // Group metrics
  const metricsByContent = new Map();
  for (const metric of dailyMetrics) {
    if (!metricsByContent.has(metric.externalContentId)) {
      metricsByContent.set(metric.externalContentId, []);
    }
    metricsByContent.get(metric.externalContentId).push(metric);
  }

  console.log(`\n✅ Grouped metrics for ${metricsByContent.size} unique content items`);

  // Calculate engagement
  const contentWithMetrics = content.map((item) => {
    const metrics = metricsByContent.get(item.externalContentId) || [];
    const totalReach = metrics.reduce((sum, m) => sum + (m.reach || 0), 0);
    const totalEngagement =
      metrics.reduce((sum, m) => sum + (m.reactions || 0), 0) +
      metrics.reduce((sum, m) => sum + (m.comments || 0), 0) +
      metrics.reduce((sum, m) => sum + (m.shares || 0), 0);
    const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

    return {
      ...item,
      totalReach,
      totalEngagement,
      engagementRate,
    };
  });

  const sorted = contentWithMetrics
    .filter((c) => c.totalReach > 0)
    .sort((a, b) => b.engagementRate - a.engagementRate);

  console.log(`\n✅ After filtering (totalReach > 0): ${sorted.length} items`);
  
  if (sorted.length > 0) {
    console.log('\nTop 3 by engagement:');
    sorted.slice(0, 3).forEach((c, i) => {
      console.log(`${i + 1}. ${c.externalContentId}`);
      console.log(`   Reach: ${c.totalReach}, Engagement: ${c.totalEngagement}`);
      console.log(`   Rate: ${c.engagementRate.toFixed(2)}%`);
    });
  }

  // Group by format
  const grouped = {};
  for (const item of sorted) {
    const format = item.contentType || 'post';
    if (!grouped[format]) {
      grouped[format] = [];
    }
    grouped[format].push(item);
  }

  console.log('\n📊 Grouped by format:');
  for (const [format, items] of Object.entries(grouped)) {
    console.log(`  ${format}: ${(items as any[]).length} items`);
  }

  console.log('\n✅ Generation logic traced successfully');
}

triggerGeneration()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
