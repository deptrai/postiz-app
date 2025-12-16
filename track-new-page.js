require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function trackPage() {
  const orgId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';
  const intId = 'cmj7dcjzy0001jqfpgb58iifi';

  await prisma.analyticsTrackedIntegration.upsert({
    where: {
      organizationId_integrationId: {
        organizationId: orgId,
        integrationId: intId,
      },
    },
    update: {
      isActive: true,
    },
    create: {
      organizationId: orgId,
      integrationId: intId,
      isActive: true,
    },
  });

  console.log('✅ Added Phim Cách Nhiệt Tận Nơi to tracking');

  const tracked = await prisma.analyticsTrackedIntegration.count({
    where: { organizationId: orgId },
  });

  console.log(`📊 Total tracked pages: ${tracked}`);

  await prisma.$disconnect();
}

trackPage()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
