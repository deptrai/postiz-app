const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRealData() {
  console.log('🔍 Checking for real Facebook analytics data...\n');

  const org = await prisma.organization.findFirst();
  console.log(`Organization: ${org.name} (${org.id})\n`);

  // Check all integrations
  const integrations = await prisma.integration.findMany({
    where: { organizationId: org.id }
  });

  console.log(`📱 Integrations: ${integrations.length} found`);
  integrations.forEach(int => {
    console.log(`   - ${int.name} (${int.providerIdentifier})`);
    console.log(`     Type: ${int.type}, ID: ${int.id}`);
  });

  // Check all analytics content
  console.log(`\n📄 Analytics Content:`);
  const allContent = await prisma.analyticsContent.findMany({
    where: { organizationId: org.id },
    include: {
      integration: true
    }
  });

  console.log(`   Total: ${allContent.length} content items\n`);

  // Group by integration
  const byIntegration = {};
  allContent.forEach(c => {
    const intName = c.integration.name;
    if (!byIntegration[intName]) byIntegration[intName] = [];
    byIntegration[intName].push(c);
  });

  for (const [intName, items] of Object.entries(byIntegration)) {
    console.log(`   ${intName}:`);
    console.log(`   - ${items.length} posts`);
    console.log(`   - Sample IDs: ${items.slice(0, 3).map(c => c.externalContentId).join(', ')}`);
    console.log(`   - Date range: ${items[0]?.publishedAt?.toISOString().split('T')[0]} to ${items[items.length-1]?.publishedAt?.toISOString().split('T')[0]}`);
    console.log('');
  }

  // Check metrics
  console.log(`📊 Analytics Metrics:`);
  const allMetrics = await prisma.analyticsDailyMetric.findMany({
    where: { organizationId: org.id }
  });

  console.log(`   Total: ${allMetrics.length} metric records`);

  // Identify mock vs real data
  console.log(`\n🔎 Data Classification:`);
  const mockIntegration = integrations.find(i => i.name === 'Mock Social Platform');
  const realIntegrations = integrations.filter(i => i.name !== 'Mock Social Platform');

  if (mockIntegration) {
    const mockContent = allContent.filter(c => c.integrationId === mockIntegration.id);
    console.log(`   🧪 Mock data: ${mockContent.length} posts (from sample script)`);
  }

  if (realIntegrations.length > 0) {
    const realContent = allContent.filter(c => c.integrationId !== mockIntegration?.id);
    console.log(`   ✅ Real data: ${realContent.length} posts (from actual integrations)`);
    
    if (realContent.length > 0) {
      console.log(`\n   Real data breakdown:`);
      realIntegrations.forEach(int => {
        const count = realContent.filter(c => c.integrationId === int.id).length;
        if (count > 0) {
          console.log(`   - ${int.name}: ${count} posts`);
        }
      });
    }
  } else {
    console.log(`   ⚠️  No real integrations found (only mock)`);
  }

  // Recommendation
  console.log(`\n💡 Recommendation:`);
  const hasRealData = allContent.some(c => c.integrationId !== mockIntegration?.id);
  
  if (hasRealData) {
    console.log(`   ✅ Use real Facebook/social data for playbook generation`);
    console.log(`   ➡️  Delete mock data or filter it out`);
  } else {
    console.log(`   ⚠️  No real analytics data available`);
    console.log(`   ➡️  Need to:`);
    console.log(`      1. Connect Facebook/social integrations`);
    console.log(`      2. Sync analytics data`);
    console.log(`      3. Or: Use mock data for development/testing`);
  }
}

checkRealData()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
