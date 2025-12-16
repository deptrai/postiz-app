require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPlaybookService() {
  const orgId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320'; // org "axx"

  // Directly query playbooks like the service does
  const whereClause = {
    organizationId: orgId,
    deletedAt: null,
  };

  const playbooks = await prisma.playbook.findMany({
    where: whereClause,
    include: {
      group: {
        select: {
          id: true,
          name: true,
          niche: true,
        },
      },
      variants: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          type: true,
          recipe: true,
          description: true,
        },
      },
      _count: {
        select: {
          sourceContent: true,
          variants: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  console.log('📚 Playbooks found:', playbooks.length);
  console.log('');

  playbooks.forEach(pb => {
    console.log(`Playbook: ${pb.name}`);
    console.log(`  ID: ${pb.id}`);
    console.log(`  Format: ${pb.format}`);
    console.log(`  Consistency: ${pb.consistencyScore}`);
    console.log(`  Variants: ${pb.variants.length}`);
    pb.variants.forEach(v => {
      console.log(`    - ${v.name} (${v.type})`);
    });
    console.log('');
  });

  await prisma.$disconnect();
}

testPlaybookService()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
