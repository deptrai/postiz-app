const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function trackFBIntegrations() {
  console.log('🔧 Tracking Facebook Integrations for Analytics Sync\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9';

  // Get FB integrations
  const fbIntegrations = await prisma.integration.findMany({
    where: {
      organizationId: orgId,
      providerIdentifier: 'facebook',
      disabled: false,
      deletedAt: null,
    },
  });

  console.log(`📱 Found ${fbIntegrations.length} FB integrations\n`);

  // Track them
  const tracked = await prisma.analyticsTrackedIntegration.createMany({
    data: fbIntegrations.map(fb => ({
      organizationId: orgId,
      integrationId: fb.id,
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Tracked ${tracked.count} integrations\n`);

  fbIntegrations.forEach(fb => {
    console.log(`   ✅ ${fb.name}`);
    console.log(`      ID: ${fb.id}`);
    console.log(`      Page ID: ${fb.internalId}`);
    console.log('');
  });

  console.log('🎉 FB integrations now tracked for analytics sync!');
  console.log('\n📋 Next Steps:');
  console.log('1. Trigger backfill to fetch historical data');
  console.log('2. Wait for data sync to complete');
  console.log('3. Delete sample playbooks');
  console.log('4. Regenerate playbooks from real FB data');
}

trackFBIntegrations()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
