const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugGeneration() {
  console.log('🔍 Debug: Tracing playbook generation logic...\n');

  // Get organization
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log('❌ No organization');
    return;
  }
  console.log(`✅ Org: ${org.name} (${org.id})\n`);

  // Setup dates
  const days = 30;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  console.log(`📅 Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

  // Query content
  const whereClause = {
    organizationId: org.id,
    publishedAt: {
      gte: startDate,
      lte: endDate,
    },
    deletedAt: null,
  };

  console.log('🔎 Query 1: AnalyticsContent');
  const content = await prisma.analyticsContent.findMany({
    where: whereClause,
  });
  console.log(`   Result: ${content.length} items`);
  
  if (content.length === 0) {
    console.log('   ❌ ISSUE FOUND: No content matching query');
    console.log('   Checking all content...');
    const allContent = await prisma.analyticsContent.findMany({
      where: { organizationId: org.id },
    });
    console.log(`   Total content in DB: ${allContent.length}`);
    if (allContent.length > 0) {
      console.log('   Sample dates:', allContent.map(c => ({ 
        id: c.externalContentId, 
        published: c.publishedAt 
      })));
    }
    return;
  }

  // Query metrics
  const contentIds = content.map(c => c.externalContentId);
  console.log(`\n🔎 Query 2: AnalyticsDailyMetric for ${contentIds.length} IDs`);
  
  const dailyMetrics = await prisma.analyticsDailyMetric.findMany({
    where: {
      organizationId: org.id,
      externalContentId: { in: contentIds },
      date: { gte: startDate, lte: endDate },
      deletedAt: null,
    },
  });
  console.log(`   Result: ${dailyMetrics.length} metrics`);

  if (dailyMetrics.length === 0) {
    console.log('   ❌ ISSUE FOUND: No metrics for content');
    console.log('   Checking all metrics...');
    const allMetrics = await prisma.analyticsDailyMetric.findMany({
      where: { 
        organizationId: org.id,
        externalContentId: { in: contentIds }
      },
    });
    console.log(`   Total metrics for these IDs: ${allMetrics.length}`);
    if (allMetrics.length > 0) {
      console.log('   Sample:', allMetrics.slice(0, 2).map(m => ({
        contentId: m.externalContentId,
        date: m.date,
        reach: m.reach
      })));
    }
    return;
  }

  // Group metrics
  console.log('\n🔎 Step 3: Grouping metrics by content');
  const metricsByContent = new Map();
  for (const metric of dailyMetrics) {
    if (!metricsByContent.has(metric.externalContentId)) {
      metricsByContent.set(metric.externalContentId, []);
    }
    metricsByContent.get(metric.externalContentId).push(metric);
  }
  console.log(`   Result: ${metricsByContent.size} content items with metrics`);

  // Calculate engagement
  console.log('\n🔎 Step 4: Calculating engagement');
  const contentWithMetrics = content.map(item => {
    const metrics = metricsByContent.get(item.externalContentId) || [];
    const totalReach = metrics.reduce((sum, m) => sum + (m.reach || 0), 0);
    const totalEngagement =
      metrics.reduce((sum, m) => sum + (m.reactions || 0), 0) +
      metrics.reduce((sum, m) => sum + (m.comments || 0), 0) +
      metrics.reduce((sum, m) => sum + (m.shares || 0), 0);
    const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

    return {
      id: item.externalContentId,
      type: item.contentType,
      totalReach,
      totalEngagement,
      engagementRate,
    };
  });

  const sorted = contentWithMetrics
    .filter(c => c.totalReach > 0)
    .sort((a, b) => b.engagementRate - a.engagementRate);

  console.log(`   Result: ${sorted.length} items with reach > 0`);
  
  if (sorted.length > 0) {
    console.log('\n   Top 3:');
    sorted.slice(0, 3).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.id}: reach=${c.totalReach}, engagement=${c.totalEngagement}, rate=${c.engagementRate.toFixed(2)}%`);
    });
  }

  // Group by format
  console.log('\n🔎 Step 5: Grouping by format');
  const grouped = {};
  for (const item of sorted) {
    const format = item.type || 'post';
    if (!grouped[format]) grouped[format] = [];
    grouped[format].push(item);
  }

  console.log('   Result:');
  for (const [format, items] of Object.entries(grouped)) {
    console.log(`   - ${format}: ${items.length} items (min required: 3)`);
    if (items.length >= 3) {
      console.log(`     ✅ Can generate playbook for ${format}`);
    } else {
      console.log(`     ❌ Not enough items (need 3)`);
    }
  }

  console.log('\n✅ Debug trace complete!');
  console.log('\nConclusion:');
  if (sorted.length >= 3) {
    console.log('✅ Data is sufficient for playbook generation');
    console.log('➡️  Service should work. Issue must be elsewhere.');
  } else {
    console.log(`❌ Only ${sorted.length} items found (need 3)`);
    console.log('➡️  This is why playbooks are empty');
  }
}

debugGeneration()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
