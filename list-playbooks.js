const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const organizationId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';

async function listPlaybooks() {
  const playbooks = await prisma.playbook.findMany({
    where: { organizationId },
    include: {
      variants: {
        where: { deletedAt: null },
      },
    },
  });

  console.log('Available Playbooks:\n');
  playbooks.forEach(pb => {
    console.log(`📚 ${pb.name} (${pb.id})`);
    console.log(`   Format: ${pb.format}`);
    console.log(`   Variants: ${pb.variants.length}`);
    pb.variants.forEach(v => console.log(`   - ${v.name} (${v.id}) [${v.type}]`));
    console.log('');
  });

  await prisma.$disconnect();
}

listPlaybooks();
