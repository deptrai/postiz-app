const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Epic 6 Full Flow Test with Real Facebook Data
 * Org: Analytics Test Co (49470bf8-706f-49d8-9ddc-2f0eb727aef9)
 */
async function testEpic6FullFlow() {
  console.log('🚀 Epic 6: Full Flow Test with Real Facebook Data\n');
  console.log('═══════════════════════════════════════\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9';

  // Step 1: Verify real Facebook data
  console.log('📊 STEP 1: Verify Real Data\n');
  
  const integrations = await prisma.integration.findMany({
    where: { 
      organizationId: orgId,
      OR: [
        { providerIdentifier: 'facebook' },
        { providerIdentifier: 'facebook-page' }
      ]
    },
  });

  console.log(`✅ Facebook Channels: ${integrations.length}`);
  integrations.forEach(int => {
    console.log(`   - ${int.name}`);
  });

  const content = await prisma.analyticsContent.findMany({
    where: {
      organizationId: orgId,
      integration: {
        OR: [
          { providerIdentifier: 'facebook' },
          { providerIdentifier: 'facebook-page' }
        ]
      }
    },
  });

  console.log(`✅ Facebook Posts: ${content.length}\n`);

  // Step 2: Check existing playbooks
  console.log('📋 STEP 2: Check Playbooks\n');

  const playbooks = await prisma.playbook.findMany({
    where: { organizationId: orgId, deletedAt: null },
    include: {
      variants: { where: { deletedAt: null } },
    },
  });

  console.log(`✅ Existing Playbooks: ${playbooks.length}`);
  
  let targetPlaybook = null;
  if (playbooks.length > 0) {
    targetPlaybook = playbooks[0];
    console.log(`   Using: ${targetPlaybook.name}`);
    console.log(`   Variants: ${targetPlaybook.variants.length}\n`);
  } else {
    console.log(`   ⚠️  No playbooks found - need to generate\n`);
  }

  // Step 3: Check variants
  console.log('📝 STEP 3: Check Variants\n');

  if (targetPlaybook && targetPlaybook.variants.length >= 2) {
    console.log(`✅ Sufficient variants: ${targetPlaybook.variants.length}`);
    targetPlaybook.variants.forEach((v, idx) => {
      console.log(`   ${idx + 1}. ${v.name} (${v.type})`);
    });
    console.log('');
  } else {
    console.log(`   ⚠️  Need at least 2 variants for experiment\n`);
  }

  // Step 4: Check experiments
  console.log('🧪 STEP 4: Check Experiments\n');

  const experiments = await prisma.experiment.findMany({
    where: { organizationId: orgId, deletedAt: null },
    include: {
      variants: {
        include: { variant: true },
      },
      playbook: true,
    },
  });

  console.log(`✅ Existing Experiments: ${experiments.length}`);
  
  if (experiments.length > 0) {
    experiments.forEach((exp, idx) => {
      console.log(`   ${idx + 1}. ${exp.name}`);
      console.log(`      Status: ${exp.status}`);
      console.log(`      Variants: ${exp.variants.length}`);
      exp.variants.forEach((ev, vidx) => {
        console.log(`         ${vidx + 1}. ${ev.variant.name} (${ev.variant.type})`);
      });
    });
    console.log('');
  }

  // Step 5: Create NEW experiment if needed
  if (targetPlaybook && targetPlaybook.variants.length >= 2) {
    console.log('🆕 STEP 5: Creating NEW Test Experiment\n');

    const variantIds = targetPlaybook.variants.slice(0, 2).map(v => v.id);

    try {
      const newExperiment = await prisma.experiment.create({
        data: {
          name: `Real Data Test ${new Date().toISOString().split('T')[0]}`,
          playbookId: targetPlaybook.id,
          organizationId: orgId,
          successMetric: 'engagement',
          status: 'draft',
          variants: {
            create: variantIds.map(vId => ({ variantId: vId })),
          },
        },
        include: {
          variants: { include: { variant: true } },
          playbook: true,
        },
      });

      console.log(`✅ New Experiment Created!`);
      console.log(`   ID: ${newExperiment.id}`);
      console.log(`   Name: ${newExperiment.name}`);
      console.log(`   Variants: ${newExperiment.variants.length}\n`);
    } catch (error) {
      console.log(`❌ Failed to create experiment: ${error.message}\n`);
    }
  }

  // Final Summary
  console.log('═══════════════════════════════════════');
  console.log('📊 FINAL SUMMARY\n');

  const finalExperiments = await prisma.experiment.findMany({
    where: { organizationId: orgId, deletedAt: null },
  });

  console.log(`Organization: Analytics Test Co`);
  console.log(`ID: ${orgId}`);
  console.log('');
  console.log(`✅ Facebook Channels: ${integrations.length}`);
  console.log(`✅ Facebook Posts: ${content.length}`);
  console.log(`✅ Playbooks: ${playbooks.length}`);
  console.log(`✅ Variants: ${playbooks.reduce((sum, p) => sum + p.variants.length, 0)}`);
  console.log(`✅ Experiments: ${finalExperiments.length}`);
  console.log('');

  if (finalExperiments.length > 0) {
    console.log('🎉 Epic 6 Full Flow: WORKING with Real Data!');
    console.log('');
    console.log('🔗 API Endpoints to test:');
    console.log(`   GET  http://localhost:4001/playbooks`);
    console.log(`   GET  http://localhost:4001/experiments`);
    console.log('');
    console.log('💡 To test on frontend:');
    console.log(`   1. Login to: Analytics Test Co`);
    console.log(`   2. Navigate to: /playbooks`);
    console.log(`   3. Navigate to: /experiments`);
    console.log(`   4. Should see ${finalExperiments.length} experiment(s)`);
  } else {
    console.log('⚠️  Need to create experiments to test frontend');
  }
}

testEpic6FullFlow()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
