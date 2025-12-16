const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAPILogic() {
  console.log('🧪 Testing PlaybookService.getPlaybooks() logic...\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9';
  const filters = {};

  // Replicate service logic
  const whereClause = {
    organizationId: orgId,
    deletedAt: null,
  };

  if (filters.groupId) {
    whereClause.groupId = filters.groupId;
  }

  if (filters.format) {
    whereClause.format = filters.format;
  }

  console.log('WHERE clause:', JSON.stringify(whereClause, null, 2));

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
    take: filters.limit || 50,
    skip: filters.offset || 0,
  });

  console.log(`\n✅ Query returned: ${playbooks.length} playbooks\n`);

  if (playbooks.length > 0) {
    // Transform to match frontend
    const transformed = playbooks.map((playbook) => ({
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

    console.log('📊 API Response (would be sent to frontend):');
    console.log(JSON.stringify({
      playbooks: transformed,
      count: transformed.length
    }, null, 2));
  } else {
    console.log('❌ NO PLAYBOOKS FOUND');
    
    // Debug: Check without filters
    const allPlaybooks = await prisma.playbook.findMany({
      where: { organizationId: orgId }
    });
    console.log(`\nDebug: Total playbooks for org (no filters): ${allPlaybooks.length}`);
    if (allPlaybooks.length > 0) {
      allPlaybooks.forEach(p => {
        console.log(`- ${p.name}: deletedAt=${p.deletedAt}`);
      });
    }
  }
}

testAPILogic()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
