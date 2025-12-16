const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');

const prisma = new PrismaClient();
const organizationId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';

async function trackAllFacebookPages() {
  try {
    // Get all Facebook integrations
    const integrations = await prisma.integration.findMany({
      where: {
        organizationId,
        providerIdentifier: 'facebook',
      },
    });

    console.log(`Found ${integrations.length} Facebook pages`);

    // Check which are already tracked
    const tracked = await prisma.analyticsTrackedIntegration.findMany({
      where: { organizationId },
      select: { integrationId: true },
    });

    const trackedIds = new Set(tracked.map(t => t.integrationId));
    console.log(`Already tracked: ${trackedIds.size} pages`);

    // Track untracked pages
    let addedCount = 0;
    for (const integration of integrations) {
      if (!trackedIds.has(integration.id)) {
        console.log(`Tracking: ${integration.name} (${integration.id})`);
        
        await prisma.analyticsTrackedIntegration.create({
          data: {
            organizationId,
            integrationId: integration.id,
          },
        });

        addedCount++;
      }
    }

    console.log(`\n✅ Successfully tracked ${addedCount} new pages`);
    console.log(`Total tracked pages: ${trackedIds.size + addedCount}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

trackAllFacebookPages();
