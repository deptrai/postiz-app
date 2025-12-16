const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTrackedIntegrations() {
  console.log('🔍 Checking Tracked Integrations for Analytics Sync\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9'; // Analytics Test Co

  // Get FB integrations
  const fbIntegrations = await prisma.integration.findMany({
    where: {
      organizationId: orgId,
      providerIdentifier: 'facebook',
      disabled: false,
      deletedAt: null,
    },
  });

  console.log(`📱 Facebook Integrations: ${fbIntegrations.length}\n`);
  fbIntegrations.forEach(int => {
    console.log(`   ${int.name}`);
    console.log(`   - ID: ${int.id}`);
    console.log(`   - Page ID: ${int.internalId}`);
    console.log('');
  });

  // Check which are tracked
  const trackedIntegrations = await prisma.analyticsTrackedIntegration.findMany({
    where: {
      integrationId: {
        in: fbIntegrations.map(i => i.id),
      },
    },
    include: {
      integration: true,
    },
  });

  console.log(`📊 Tracked Integrations: ${trackedIntegrations.length}\n`);

  if (trackedIntegrations.length === 0) {
    console.log('❌ NO INTEGRATIONS ARE TRACKED FOR ANALYTICS!\n');
    console.log('This is why cron job doesn\'t fetch FB data.\n');
    console.log('📋 Action Required:');
    console.log('1. Add integrations to AnalyticsTrackedIntegration table');
    console.log('2. Trigger backfill to fetch historical data');
    console.log('3. Or wait for daily cron (2 AM) to sync automatically\n');
  } else {
    console.log('✅ Tracked integrations:\n');
    trackedIntegrations.forEach(t => {
      console.log(`   ${t.integration.name}`);
      console.log(`   - Integration ID: ${t.integrationId}`);
      console.log(`   - Tracked since: ${t.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
  }

  // Show untracked integrations
  const untrackedIds = fbIntegrations
    .filter(fb => !trackedIntegrations.some(t => t.integrationId === fb.id))
    .map(fb => fb.id);

  if (untrackedIds.length > 0) {
    console.log(`⚠️  Untracked Integrations: ${untrackedIds.length}\n`);
    
    const untracked = fbIntegrations.filter(fb => untrackedIds.includes(fb.id));
    untracked.forEach(fb => {
      console.log(`   ${fb.name}`);
      console.log(`   - ID: ${fb.id}`);
      console.log('');
    });

    console.log('💡 To track these integrations:');
    console.log('```sql');
    untracked.forEach(fb => {
      console.log(`INSERT INTO "AnalyticsTrackedIntegration" ("id", "organizationId", "integrationId", "createdAt", "updatedAt")`);
      console.log(`VALUES (gen_random_uuid(), '${orgId}', '${fb.id}', NOW(), NOW());`);
    });
    console.log('```\n');

    console.log('Or add via Prisma:');
    console.log('```javascript');
    console.log('await prisma.analyticsTrackedIntegration.createMany({');
    console.log('  data: [');
    untracked.forEach(fb => {
      console.log(`    { organizationId: '${orgId}', integrationId: '${fb.id}' },`);
    });
    console.log('  ],');
    console.log('});');
    console.log('```');
  }
}

checkTrackedIntegrations()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
