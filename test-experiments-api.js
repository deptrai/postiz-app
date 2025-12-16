const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testExperimentsAPI() {
  console.log('🧪 Testing Experiments API with Real Data\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9'; // Analytics Test Co
  
  console.log(`Organization: Analytics Test Co`);
  console.log(`ID: ${orgId}\n`);

  // Get experiments
  const experiments = await prisma.experiment.findMany({
    where: {
      organizationId: orgId,
      deletedAt: null,
    },
    include: {
      variants: {
        include: {
          variant: true,
        },
      },
      playbook: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`✅ Experiments found: ${experiments.length}\n`);

  experiments.forEach((exp, idx) => {
    console.log(`${idx + 1}. ${exp.name}`);
    console.log(`   ID: ${exp.id}`);
    console.log(`   Status: ${exp.status}`);
    console.log(`   Metric: ${exp.successMetric}`);
    console.log(`   Playbook: ${exp.playbook?.name || 'N/A'}`);
    console.log(`   Variants: ${exp.variants.length}`);
    
    exp.variants.forEach((ev, vidx) => {
      console.log(`      ${vidx + 1}. ${ev.variant.name} (${ev.variant.type})`);
      console.log(`         Reach: ${ev.totalReach}`);
      console.log(`         Engagement: ${ev.totalEngagement}`);
      console.log(`         Avg Rate: ${ev.avgEngagementRate?.toFixed(2)}%`);
      console.log(`         Content: ${ev.contentCount}`);
    });
    
    console.log(`   Created: ${exp.createdAt.toISOString().split('T')[0]}`);
    if (exp.startDate) {
      console.log(`   Started: ${exp.startDate.toISOString().split('T')[0]}`);
    }
    if (exp.endDate) {
      console.log(`   Ended: ${exp.endDate.toISOString().split('T')[0]}`);
    }
    console.log('');
  });

  // Expected API response format
  console.log('📋 Expected API Response:\n');
  console.log(JSON.stringify({
    success: true,
    experiments: experiments.map(exp => ({
      id: exp.id,
      name: exp.name,
      status: exp.status,
      successMetric: exp.successMetric,
      startDate: exp.startDate,
      endDate: exp.endDate,
      winnerId: exp.winnerId,
      createdAt: exp.createdAt,
      playbook: exp.playbook ? {
        id: exp.playbook.id,
        name: exp.playbook.name,
      } : null,
      variants: exp.variants.map(ev => ({
        id: ev.id,
        variantId: ev.variantId,
        label: `Variant ${ev.variant.type}`,
        contentCount: ev.contentCount,
        totalReach: ev.totalReach,
        totalEngagement: ev.totalEngagement,
        avgEngagementRate: ev.avgEngagementRate,
        winRate: ev.winRate,
        variant: {
          id: ev.variant.id,
          name: ev.variant.name,
          type: ev.variant.type,
        },
      })),
    })),
    count: experiments.length,
  }, null, 2));
}

testExperimentsAPI()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
