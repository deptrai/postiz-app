const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const organizationId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';

async function retroactiveTrack() {
  try {
    console.log('🔄 Starting retroactive tracking...\n');

    // Get all content
    const allContent = await prisma.analyticsContent.findMany({
      where: { organizationId },
      orderBy: { publishedAt: 'desc' },
      take: 16, // All existing content
    });

    console.log(`📊 Found ${allContent.length} content items`);

    // Get experiment
    const experiment = await prisma.experiment.findFirst({
      where: { organizationId },
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

    if (!experiment) {
      console.log('❌ No experiment found');
      return;
    }

    console.log(`🧪 Experiment: ${experiment.name}`);
    console.log(`📝 Variants: ${experiment.variants.length}`);

    let trackedCount = 0;

    // Manually track content to variants (distribute evenly)
    const variant1 = experiment.variants[0];
    const variant2 = experiment.variants[1];

    // Split content between variants
    const midpoint = Math.floor(allContent.length / 2);
    const content1 = allContent.slice(0, midpoint);
    const content2 = allContent.slice(midpoint);

    console.log(`\n📌 Tracking ${content1.length} items to ${variant1.variant.name}`);
    for (const content of content1) {
      // Check if already tracked
      const existing = await prisma.experimentTrackedContent.findFirst({
        where: {
          experimentVariantId: variant1.id,
          contentId: content.id,
        },
      });

      if (!existing) {
        await prisma.experimentTrackedContent.create({
          data: {
            experimentVariantId: variant1.id,
            contentId: content.id,
          },
        });
        trackedCount++;
        console.log(`  ✅ Tracked: ${content.id.substring(0, 8)}...`);
      }
    }

    console.log(`\n📌 Tracking ${content2.length} items to ${variant2.variant.name}`);
    for (const content of content2) {
      const existing = await prisma.experimentTrackedContent.findFirst({
        where: {
          experimentVariantId: variant2.id,
          contentId: content.id,
        },
      });

      if (!existing) {
        await prisma.experimentTrackedContent.create({
          data: {
            experimentVariantId: variant2.id,
            contentId: content.id,
          },
        });
        trackedCount++;
        console.log(`  ✅ Tracked: ${content.id.substring(0, 8)}...`);
      }
    }

    console.log(`\n✅ Tracked ${trackedCount} new content items`);

    // Now update metrics for each variant
    console.log('\n📊 Updating variant metrics...');
    
    for (const expVariant of experiment.variants) {
      // Get all tracked content for this variant
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

      if (trackedContents.length === 0) {
        continue;
      }

      // Calculate aggregate metrics
      let totalReach = 0;
      let totalEngagement = 0;
      let totalEngagementRate = 0;

      for (const tracked of trackedContents) {
        const content = tracked.content;
        const metrics = content.metrics || [];
        
        // Get latest metrics for each type
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
          const engagementRate = (engagement / reach) * 100;
          totalEngagementRate += engagementRate;
        }
      }

      const avgEngagementRate = trackedContents.length > 0
        ? totalEngagementRate / trackedContents.length
        : 0;

      // Update experiment variant
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

    console.log('\n🎉 Retroactive tracking complete!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

retroactiveTrack();
