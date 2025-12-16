const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const organizationId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';

async function createExperiment() {
  try {
    console.log('🧪 Creating new experiment...\n');

    // Playbook with 5 variants
    const playbookId = 'cmj80gkaq00032gsw42m4dr55';
    
    // Select Time Variation A and B for this experiment
    const variantIds = [
      'cmj80y8jr00032gcxfegrtphd', // Time Variation A
      'cmj80y8jt00092gcx5qgg2io7'  // Time Variation B
    ];

    // Create experiment
    const experiment = await prisma.experiment.create({
      data: {
        name: 'Best Time To Post Test',
        organizationId,
        playbookId,
        status: 'active',
        successMetric: 'reach',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    });

    console.log(`✅ Created experiment: ${experiment.name} (${experiment.id})`);

    // Create experiment variants
    for (const variantId of variantIds) {
      await prisma.experimentVariant.create({
        data: {
          experimentId: experiment.id,
          variantId,
          totalReach: 0,
          totalEngagement: 0,
          contentCount: 0,
          avgEngagementRate: 0,
          winRate: 0,
        },
      });
      console.log(`✅ Added variant: ${variantId}`);
    }

    console.log('\n🎉 Experiment created successfully!');
    console.log(`\nExperiment Details:`);
    console.log(`- Name: ${experiment.name}`);
    console.log(`- ID: ${experiment.id}`);
    console.log(`- Playbook: ${playbookId}`);
    console.log(`- Variants: ${variantIds.length}`);
    console.log(`- Status: ${experiment.status}`);
    console.log(`- Success Metric: ${experiment.successMetric}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createExperiment();
