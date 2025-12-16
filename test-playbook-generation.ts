import { PrismaClient } from '@prisma/client';
import { PlaybookGeneratorService } from './libraries/nestjs-libraries/src/database/prisma/playbooks/playbook-generator.service';

const prisma = new PrismaClient();

async function testPlaybookGeneration() {
  console.log('🧪 Testing Playbook Generation...\n');

  // Get organization
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log('❌ No organization found');
    return;
  }

  console.log(`✅ Using organization: ${org.name} (${org.id})\n`);

  // Create service instance
  const generatorService = new PlaybookGeneratorService(prisma as any);

  // Generate playbooks
  console.log('🚀 Calling generatePlaybooks()...\n');
  const playbookIds = await generatorService.generatePlaybooks(org.id, {
    days: 30,
    minContentItems: 3,
  });

  console.log('\n📊 Result:');
  console.log(`- Playbooks generated: ${playbookIds.length}`);
  console.log(`- IDs: ${JSON.stringify(playbookIds, null, 2)}`);

  // List generated playbooks
  if (playbookIds.length > 0) {
    console.log('\n📋 Generated Playbooks:');
    const playbooks = await prisma.playbook.findMany({
      where: { id: { in: playbookIds } },
      include: {
        _count: { select: { sourceContent: true } }
      }
    });

    playbooks.forEach((pb, i) => {
      console.log(`\n${i + 1}. ${pb.name}`);
      console.log(`   Format: ${pb.format}`);
      console.log(`   Source content: ${pb._count.sourceContent} items`);
      console.log(`   Consistency score: ${pb.consistencyScore}%`);
    });
  }
}

testPlaybookGeneration()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n✅ Test completed');
  })
  .catch(async (e) => {
    console.error('\n❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
