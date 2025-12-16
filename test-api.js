const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAPI() {
  console.log('🧪 Testing PlaybookService.getPlaybooks()...\n');

  const org = await prisma.organization.findFirst();
  
  // Replicate PlaybookService.getPlaybooks() logic
  const playbooks = await prisma.playbook.findMany({
    where: {
      organizationId: org.id,
      deletedAt: null,
    },
    include: {
      group: {
        select: { id: true, name: true, niche: true }
      },
      _count: {
        select: {
          sourceContent: true,
          variants: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`✅ Found ${playbooks.length} playbook(s)\n`);

  // Transform to match frontend interface
  const transformed = playbooks.map(playbook => ({
    id: playbook.id,
    name: playbook.name,
    format: playbook.format,
    recipe: playbook.recipe,
    medianReach: playbook.evidence?.medianReach || null,
    medianViews: playbook.evidence?.medianReach || null,
    avgEngagementRate: playbook.evidence?.engagementRate || null,
    consistencyScore: playbook.consistencyScore,
    contentCount: playbook.evidence?.contentCount || playbook._count.sourceContent,
    createdAt: playbook.createdAt.toISOString(),
    group: playbook.group,
  }));

  console.log('📊 API Response:');
  console.log(JSON.stringify(transformed, null, 2));

  console.log('\n✅ API test complete');
}

testAPI()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
