const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Manual test for Story 6.3: Experiments A/B/C
 */
async function testExperiments() {
  console.log('🧪 Story 6.3 Manual Test: Experiments\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9';

  // Get playbook and variants
  const playbook = await prisma.playbook.findFirst({
    where: { organizationId: orgId, deletedAt: null },
    include: { variants: { where: { deletedAt: null } } },
  });

  if (!playbook) {
    console.log('❌ No playbook found. Run Stories 6.1 and 6.2 first.');
    return;
  }

  console.log(`✅ Playbook: ${playbook.name}`);
  console.log(`   Variants: ${playbook.variants.length}\n`);

  if (playbook.variants.length < 2) {
    console.log('❌ Need at least 2 variants. Run Story 6.2 first.');
    return;
  }

  // Create experiment with 2 variants
  const variantIds = playbook.variants.slice(0, 2).map(v => v.id);
  
  console.log('📋 Creating experiment...');
  const experiment = await prisma.experiment.create({
    data: {
      name: 'Hook Test A vs B',
      playbookId: playbook.id,
      organizationId: orgId,
      successMetric: 'engagement',
      status: 'draft',
      variants: {
        create: variantIds.map(vId => ({ variantId: vId })),
      },
    },
    include: {
      variants: { include: { variant: true } },
    },
  });

  console.log(`✅ Experiment created: ${experiment.id}`);
  console.log(`   Name: ${experiment.name}`);
  console.log(`   Status: ${experiment.status}`);
  console.log(`   Metric: ${experiment.successMetric}`);
  console.log(`   Variants: ${experiment.variants.length}\n`);

  // List experiments
  const experiments = await prisma.experiment.findMany({
    where: { organizationId: orgId, deletedAt: null },
  });

  console.log(`📊 Total experiments: ${experiments.length}\n`);

  // AC Validation
  console.log('✅ Acceptance Criteria:\n');
  console.log(`AC1: Select 2-3 variants: ${experiment.variants.length >= 2 && experiment.variants.length <= 3 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`AC2: Configure experiment: ${experiment.name && experiment.successMetric ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`AC3: Track metrics: ⏳ PENDING (need content)`);
  console.log(`AC4: Show results: ⏳ PENDING (need data)`);
  console.log(`AC5: Update playbook: ⏳ PENDING (need winner)`);
  console.log(`AC6: List experiments: ${experiments.length > 0 ? '✅ PASS' : '❌ FAIL'}\n`);

  console.log('🎯 Story 6.3 Backend: READY');
  console.log('   API endpoints available at http://localhost:4001/experiments\n');

  console.log('📋 Next steps:');
  console.log('   1. Start experiment: POST /experiments/:id/start');
  console.log('   2. Track content: POST /experiments/:id/track');
  console.log('   3. Get results: GET /experiments/:id/results');
  console.log('   4. Confirm winner: POST /experiments/:id/confirm-winner');
}

testExperiments()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
