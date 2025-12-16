require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNewFBPage() {
  console.log('🔍 Checking for Page ID: 725524993931090\n');

  // Get integration with this page ID
  const integration = await prisma.integration.findFirst({
    where: {
      internalId: '725524993931090',
      providerIdentifier: 'facebook',
    },
  });

  if (integration) {
    console.log('✅ Found integration!');
    console.log(`Name: ${integration.name}`);
    console.log(`ID: ${integration.id}`);
    console.log(`Organization ID: ${integration.organizationId}`);
    console.log(`Token (first 50): ${integration.token.substring(0, 50)}...`);
    console.log(`Created: ${integration.createdAt}`);
    console.log(`Updated: ${integration.updatedAt}`);
    
    // Check if tracked
    const tracked = await prisma.analyticsTrackedIntegration.findFirst({
      where: { integrationId: integration.id },
    });
    console.log(`Tracked: ${tracked ? '✅ Yes' : '❌ No'}`);
    
    // If not tracked, add it
    if (!tracked) {
      await prisma.analyticsTrackedIntegration.create({
        data: {
          organizationId: integration.organizationId,
          integrationId: integration.id,
        },
      });
      console.log('✅ Added to tracked integrations');
    }
  } else {
    console.log('❌ Integration not found with Page ID: 725524993931090');
    
    // Show all FB integrations
    const all = await prisma.integration.findMany({
      where: { providerIdentifier: 'facebook' },
      select: {
        name: true,
        internalId: true,
        organizationId: true,
        createdAt: true,
      },
    });
    
    console.log('\n📱 All FB integrations:');
    all.forEach(i => {
      console.log(`- ${i.name} (Page ID: ${i.internalId}, Org: ${i.organizationId})`);
    });
  }

  await prisma.$disconnect();
}

checkNewFBPage()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
