const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const organizationId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';
const experimentId = 'cmj8i8wws00019kuc62v5xuyt';

async function trackNewExperiment() {
  try {
    console.log('🔄 Auto-tracking content to new experiment...\n');

    // Get all content
    const allContent = await prisma.analyticsContent.findMany({
      where: { organizationId },
      orderBy: { publishedAt: 'desc' },
    });

    console.log(`📊 Found ${allContent.length} content items`);

    // Get experiment variants
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        variants: {
          include: {
            variant: {
              include: {
                playbook: true,
              },
            },
          },
        },
      },
    });

    console.log(`\n🧪 Experiment: ${experiment.name}`);
    console.log(`Variants: ${experiment.variants.length}`);
    experiment.variants.forEach(v => {
      console.log(`  - ${v.variant.name} (${v.variant.type})`);
    });

    // Distribute content based on posting time
    const variant1 = experiment.variants[0]; // Time Variation A
    const variant2 = experiment.variants[1]; // Time Variation B

    let tracked1 = 0;
    let tracked2 = 0;

    console.log('\n📌 Auto-tracking based on posting times...');

    for (const content of allContent) {
      if (!content.publishedAt) continue;

      const hour = new Date(content.publishedAt).getHours();
      
      // Time Variation A: morning posts (6-12)
      // Time Variation B: afternoon/evening posts (12-22)
      let targetVariant;
      
      if (hour >= 6 && hour < 12) {
        targetVariant = variant1;
      } else if (hour >= 12 && hour < 22) {
        targetVariant = variant2;
      } else {
        continue; // Skip night posts
      }

      // Check if already tracked
      const existing = await prisma.experimentTrackedContent.findFirst({
        where: {
          experimentVariantId: targetVariant.id,
          contentId: content.id,
        },
      });

      if (!existing) {
        await prisma.experimentTrackedContent.create({
          data: {
            experimentVariantId: targetVariant.id,
            contentId: content.id,
          },
        });

        if (targetVariant.id === variant1.id) {
          tracked1++;
        } else {
          tracked2++;
        }
        
        console.log(`  ✅ Tracked content (hour ${hour}) → ${targetVariant.variant.name}`);
      }
    }

    console.log(`\n✅ Tracked ${tracked1} items to ${variant1.variant.name}`);
    console.log(`✅ Tracked ${tracked2} items to ${variant2.variant.name}`);

    // Update metrics for each variant
    console.log('\n📊 Updating variant metrics...');
    
    for (const expVariant of experiment.variants) {
      const trackedContents = await prisma.experimentTrackedContent.findMany({
        where: {
          experimentVariantId: expVariant.id,
        },
        include: {
          content: {
            include: {
              metrics: true,
            },
          },
        },
      });

      let totalReach = 0;
      let totalEngagement = 0;
      let totalEngagementRate = 0;

      for (const tracked of trackedContents) {
        const metrics = tracked.content.metrics || [];
        
        let reach = 0;
        let likes = 0;
        let comments = 0;
        let shares = 0;

        for (const metric of metrics) {
          if (metric.metricType === 'reach') {
            reach = Math.max(reach, metric.metricValue);
          } else if (metric.metricType === 'likes') {
            likes = Math.max(likes, metric.metricValue);
          } else if (metric.metricType === 'comments') {
            comments = Math.max(comments, metric.metricValue);
          } else if (metric.metricType === 'shares') {
            shares = Math.max(shares, metric.metricValue);
          }
        }
        
        totalReach += reach;
        const engagement = likes + comments + shares;
        totalEngagement += engagement;
        
        if (reach > 0) {
          totalEngagementRate += (engagement / reach) * 100;
        }
      }

      const avgEngagementRate = trackedContents.length > 0
        ? totalEngagementRate / trackedContents.length
        : 0;

      await prisma.experimentVariant.update({
        where: { id: expVariant.id },
        data: {
          totalReach,
          totalEngagement,
          contentCount: trackedContents.length,
          avgEngagementRate,
        },
      });

      console.log(`  ✅ ${expVariant.variant.name}:`);
      console.log(`     Content: ${trackedContents.length}`);
      console.log(`     Reach: ${totalReach}`);
      console.log(`     Engagement: ${totalEngagement}`);
      console.log(`     Avg Rate: ${avgEngagementRate.toFixed(2)}%`);
    }

    console.log('\n🎉 Auto-tracking complete!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

trackNewExperiment();
