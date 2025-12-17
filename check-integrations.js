const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkIntegrations() {
  console.log('🔍 Checking Facebook Integrations\n');

  const currentOrgId = '52bfeff3-3b18-47f4-8a18-f3bf9b964896'; // Test Company

  // Check ALL organizations
  const allOrgs = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  console.log(`📊 Total Organizations: ${allOrgs.length}\n`);
  allOrgs.forEach(org => {
    console.log(`   - ${org.name} (${org.id})`);
  });
  console.log('\n');

  // Check ALL integrations
  const allIntegrations = await prisma.integration.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      providerIdentifier: true,
      organizationId: true,
      disabled: false,
      internalId: true,
    },
  });

  console.log(`📱 Total Active Integrations: ${allIntegrations.length}\n`);

  // Filter Facebook integrations
  const fbIntegrations = allIntegrations.filter(i => 
    i.providerIdentifier?.toLowerCase().includes('facebook')
  );

  console.log(`🔵 Facebook Integrations: ${fbIntegrations.length}\n`);

  if (fbIntegrations.length === 0) {
    console.log('❌ NO FACEBOOK INTEGRATIONS FOUND IN DATABASE!\n');
    console.log('This explains why monetization has no data.\n');
    console.log('📋 To fix:');
    console.log('1. Go to Launches page');
    console.log('2. Click "Add Channel" or "Thêm kênh"');
    console.log('3. Connect Facebook Page(s)');
    console.log('4. Enable analytics tracking');
    console.log('5. Wait for cron job or trigger manual sync\n');
    return;
  }

  // Group by organization
  const byOrg = {};
  fbIntegrations.forEach(int => {
    if (!byOrg[int.organizationId]) {
      byOrg[int.organizationId] = [];
    }
    byOrg[int.organizationId].push(int);
  });

  Object.entries(byOrg).forEach(([orgId, ints]) => {
    const org = allOrgs.find(o => o.id === orgId);
    const isCurrent = orgId === currentOrgId;
    
    console.log(`${isCurrent ? '👉 ' : '   '}Organization: ${org?.name || 'Unknown'}`);
    console.log(`   Org ID: ${orgId}`);
    console.log(`   ${isCurrent ? '✅ CURRENT USER ORG' : '⚠️  Different org'}`);
    console.log(`   Facebook Pages: ${ints.length}`);
    
    ints.forEach((int, idx) => {
      console.log(`   ${idx + 1}. ${int.name}`);
      console.log(`      - ID: ${int.id}`);
      console.log(`      - Provider: ${int.providerIdentifier}`);
      console.log(`      - Page ID: ${int.internalId || 'N/A'}`);
    });
    console.log('');
  });

  // Check if current org has FB integrations
  const currentOrgFB = fbIntegrations.filter(i => i.organizationId === currentOrgId);
  
  if (currentOrgFB.length === 0) {
    console.log('⚠️  ISSUE IDENTIFIED:');
    console.log(`Current organization "Test Company" has NO Facebook integrations!`);
    console.log(`But ${fbIntegrations.length} Facebook page(s) found in OTHER organizations.\n`);
    console.log('📋 Options:');
    console.log('1. Switch to the organization that has Facebook pages');
    console.log('2. OR connect Facebook pages to current organization');
  } else {
    console.log('✅ Current organization HAS Facebook integrations');
    
    // Check analytics tracking
    const tracked = await prisma.analyticsTrackedIntegration.findMany({
      where: {
        integrationId: {
          in: currentOrgFB.map(i => i.id),
        },
      },
    });
    
    console.log(`\n📊 Analytics Tracking Status:`);
    console.log(`   Tracked integrations: ${tracked.length}/${currentOrgFB.length}`);
    
    if (tracked.length === 0) {
      console.log('\n❌ ANALYTICS NOT ENABLED!');
      console.log('This is why monetization has no data.\n');
      console.log('📋 To fix:');
      console.log('1. Enable analytics tracking for these integrations');
      console.log('2. Trigger manual analytics sync');
    }
    
    // Check analytics content
    const content = await prisma.analyticsContent.findMany({
      where: {
        organizationId: currentOrgId,
      },
      take: 5,
    });
    
    console.log(`\n📈 Analytics Content: ${content.length} records`);
    
    if (content.length === 0) {
      console.log('❌ No analytics data synced yet!\n');
    }
  }
}

checkIntegrations()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
