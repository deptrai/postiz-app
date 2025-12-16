const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Manually replicate PlaybookGeneratorService.generatePlaybooks() logic
async function generatePlaybooks() {
  console.log('🚀 Generating playbooks...\n');

  const org = await prisma.organization.findFirst();
  const days = 30;
  const minContentItems = 3;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const endDate = new Date();

  console.log(`Org: ${org.name}`);
  console.log(`Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

  // Get content
  const content = await prisma.analyticsContent.findMany({
    where: {
      organizationId: org.id,
      publishedAt: { gte: startDate, lte: endDate },
      deletedAt: null,
    },
  });

  // Get metrics
  const contentIds = content.map(c => c.externalContentId);
  const dailyMetrics = await prisma.analyticsDailyMetric.findMany({
    where: {
      organizationId: org.id,
      externalContentId: { in: contentIds },
      date: { gte: startDate, lte: endDate },
      deletedAt: null,
    },
  });

  // Group metrics
  const metricsByContent = new Map();
  for (const metric of dailyMetrics) {
    if (!metricsByContent.has(metric.externalContentId)) {
      metricsByContent.set(metric.externalContentId, []);
    }
    metricsByContent.get(metric.externalContentId).push(metric);
  }

  // Calculate engagement
  const contentWithMetrics = content.map(item => {
    const metrics = metricsByContent.get(item.externalContentId) || [];
    const totalReach = metrics.reduce((sum, m) => sum + (m.reach || 0), 0);
    const totalEngagement =
      metrics.reduce((sum, m) => sum + (m.reactions || 0), 0) +
      metrics.reduce((sum, m) => sum + (m.comments || 0), 0) +
      metrics.reduce((sum, m) => sum + (m.shares || 0), 0);
    const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

    return { ...item, metrics, totalReach, totalEngagement, engagementRate };
  });

  const sorted = contentWithMetrics
    .filter(c => c.totalReach > 0)
    .sort((a, b) => b.engagementRate - a.engagementRate);

  console.log(`Found ${sorted.length} content items with metrics\n`);

  // Group by format
  const grouped = {};
  for (const item of sorted) {
    const format = item.contentType || 'post';
    if (!grouped[format]) grouped[format] = [];
    grouped[format].push(item);
  }

  const playbookIds = [];

  // Generate playbook for each format
  for (const [format, contents] of Object.entries(grouped)) {
    if (contents.length < minContentItems) {
      console.log(`⏭️  Skipping ${format}: only ${contents.length} items (need ${minContentItems})`);
      continue;
    }

    console.log(`\n📝 Creating playbook for ${format} (${contents.length} items)...`);

    // Extract patterns (simplified)
    const hooks = [...new Set(
      contents.map(c => c.caption?.split('.')[0]).filter(Boolean).slice(0, 5)
    )];
    const hashtags = [...new Set(
      contents.flatMap(c => {
        try {
          return JSON.parse(c.hashtags || '[]');
        } catch {
          return [];
        }
      })
    )].slice(0, 10);

    // Calculate posting times
    const hours = contents.map(c => new Date(c.publishedAt).getHours());
    const hourCounts = {};
    hours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
    const bestHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => parseInt(h));

    const recipe = {
      format,
      captionBucket: {
        hooks,
        ctaPatterns: ['Learn more', 'Comment below', 'Tag a friend'],
      },
      hashtagBucket: hashtags,
      timeBucket: {
        bestHours,
        bestDays: [1, 3, 5], // Mon, Wed, Fri
      },
    };

    // Calculate evidence
    const totalReaches = contents.map(c => c.totalReach);
    const medianReach = totalReaches.sort((a, b) => a - b)[Math.floor(totalReaches.length / 2)];
    const avgEngagement = contents.reduce((sum, c) => sum + c.engagementRate, 0) / contents.length;

    const evidence = {
      contentCount: contents.length,
      medianReach,
      engagementRate: avgEngagement,
      topPerformers: contents.slice(0, 3).map(c => ({
        id: c.externalContentId,
        caption: c.caption?.substring(0, 50),
        reach: c.totalReach,
      })),
    };

    // Calculate consistency score (simplified)
    const consistencyScore = Math.min(95, 70 + (contents.length * 5));

    // Create playbook
    const playbook = await prisma.playbook.create({
      data: {
        name: `${format} Playbook - ${new Date().toISOString().split('T')[0]}`,
        organizationId: org.id,
        groupId: null,
        format,
        recipe,
        evidence,
        consistencyScore,
        sourceContent: {
          create: contents.map(c => ({
            contentId: c.id,
          })),
        },
      },
    });

    playbookIds.push(playbook.id);
    console.log(`   ✅ Created: ${playbook.name} (ID: ${playbook.id})`);
  }

  console.log(`\n🎉 Generated ${playbookIds.length} playbook(s)!`);
  return playbookIds;
}

generatePlaybooks()
  .then(async (ids) => {
    console.log('\n📚 Verifying playbooks in database...');
    const playbooks = await prisma.playbook.findMany({
      where: { id: { in: ids } },
      include: {
        _count: { select: { sourceContent: true } }
      }
    });
    console.log(`✅ Confirmed: ${playbooks.length} playbook(s) in database\n`);
    playbooks.forEach(p => {
      console.log(`- ${p.name}`);
      console.log(`  Format: ${p.format}, Sources: ${p._count.sourceContent}, Score: ${p.consistencyScore}%`);
    });
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
