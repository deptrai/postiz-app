require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrg() {
  // Find org "axx"
  const org = await prisma.organization.findFirst({
    where: { name: 'axx' },
  });

  if (!org) {
    console.log('❌ Org "axx" not found');
    return;
  }

  console.log(`✅ Found org: ${org.name} (${org.id})`);
  console.log('');

  // Check integrations
  const integrations = await prisma.integration.findMany({
    where: { 
      organizationId: org.id,
      disabled: false,
    },
  });
  console.log(`Integrations: ${integrations.length}`);
  integrations.forEach(int => {
    console.log(`  - ${int.name} (${int.providerIdentifier})`);
  });
  console.log('');

  // Check playbooks
  const playbooks = await prisma.playbook.findMany({
    where: { 
      organizationId: org.id,
      deletedAt: null,
    },
    include: {
      variants: true,
    },
  });
  console.log(`Playbooks: ${playbooks.length}`);
  playbooks.forEach(pb => {
    console.log(`  - ${pb.name} (${pb.variants.length} variants)`);
  });
  console.log('');

  // Check experiments
  const experiments = await prisma.experiment.findMany({
    where: { organizationId: org.id },
  });
  console.log(`Experiments: ${experiments.length}`);

  await prisma.$disconnect();
}

checkOrg()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
