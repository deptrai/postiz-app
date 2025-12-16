const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');

const prisma = new PrismaClient();
const organizationId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';

// Create queue to trigger job
const queue = new Queue('retroactive-tracking', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

async function triggerRetroactiveTracking() {
  try {
    console.log('🔄 Triggering retroactive tracking...\n');

    // Get all content
    const allContent = await prisma.analyticsContent.findMany({
      where: { organizationId },
      select: { id: true },
    });

    console.log(`📊 Found ${allContent.length} content items`);

    // Get experiments
    const experiments = await prisma.experiment.findMany({
      where: { organizationId },
      include: {
        variants: {
          include: {
            trackedContent: true,
          },
        },
      },
    });

    console.log(`🧪 Found ${experiments.length} experiments`);
    
    experiments.forEach(exp => {
      const totalTracked = exp.variants.reduce((sum, v) => sum + v.trackedContent.length, 0);
      console.log(`  - ${exp.name}: ${totalTracked} tracked content`);
    });

    // Queue retroactive tracking job
    await queue.add(
      'retroactive-track',
      {
        id: `retroactive-${organizationId}-${Date.now()}`,
        options: {
          attempts: 1,
        },
        payload: {
          organizationId,
        },
      },
      {
        jobId: `retroactive-${organizationId}`,
      }
    );

    console.log('\n✅ Retroactive tracking job queued');
    console.log('⏳ Wait 10 seconds for processing...');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check results
    const experimentsAfter = await prisma.experiment.findMany({
      where: { organizationId },
      include: {
        variants: {
          include: {
            trackedContent: true,
            variant: { select: { name: true } },
          },
        },
      },
    });

    console.log('\n📈 Results after tracking:');
    for (const exp of experimentsAfter) {
      console.log(`\n🧪 Experiment: ${exp.name}`);
      for (const v of exp.variants) {
        console.log(`  📊 ${v.variant.name}:`);
        console.log(`     - Tracked: ${v.trackedContent.length} items`);
        console.log(`     - Reach: ${v.totalReach}`);
        console.log(`     - Engagement: ${v.totalEngagement}`);
        console.log(`     - Avg Rate: ${v.avgEngagementRate.toFixed(2)}%`);
      }
    }

    await queue.close();
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await queue.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

triggerRetroactiveTracking();
