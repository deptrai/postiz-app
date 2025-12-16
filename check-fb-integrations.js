require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFBIntegrations() {
  console.log('🔍 Checking FB Integrations in Database\n');

  const orgId = '1eae1e52-b1e7-422b-afa5-e54f640353a7'; // Analytics Test Co

  // Get all FB integrations
  const integrations = await prisma.integration.findMany({
    where: {
      organizationId: orgId,
      providerIdentifier: 'facebook',
      disabled: false,
      deletedAt: null,
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`📱 Found ${integrations.length} Facebook integrations:\n`);

  for (const integration of integrations) {
    console.log(`\n═══════════════════════════════════════`);
    console.log(`Name: ${integration.name}`);
    console.log(`ID: ${integration.id}`);
    console.log(`Page ID: ${integration.internalId}`);
    console.log(`Token (first 50 chars): ${integration.token.substring(0, 50)}...`);
    console.log(`Token (last 20 chars): ...${integration.token.substring(integration.token.length - 20)}`);
    console.log(`Created: ${integration.createdAt}`);
    console.log(`Updated: ${integration.updatedAt || 'Never'}`);
    
    // Check if tracked for analytics
    const tracked = await prisma.analyticsTrackedIntegration.findFirst({
      where: {
        integrationId: integration.id,
      },
    });
    
    console.log(`Tracked for analytics: ${tracked ? '✅ Yes' : '❌ No'}`);
  }

  await prisma.$disconnect();
}

checkFBIntegrations()
  .then(() => {
    console.log('\n\n✅ Check complete');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
