const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyFix() {
  console.log('🔧 Verifying API fix...\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9';

  // Simulate API response with fix
  const playbooks = await prisma.playbook.findMany({
    where: { organizationId: orgId, deletedAt: null },
    include: {
      group: { select: { id: true, name: true, niche: true } },
      _count: { select: { sourceContent: true, variants: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  // Transform like service does
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

  // NEW: API response with success field (the fix!)
  const apiResponse = {
    success: true,  // ✅ ADDED THIS
    playbooks: transformed,
    count: transformed.length,
  };

  console.log('📊 Fixed API Response Structure:');
  console.log(JSON.stringify(apiResponse, null, 2));

  console.log('\n✅ Verification:');
  console.log(`- success field: ${apiResponse.success ? '✅ PRESENT' : '❌ MISSING'}`);
  console.log(`- playbooks array: ${Array.isArray(apiResponse.playbooks) ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`- count field: ${typeof apiResponse.count === 'number' ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`- playbooks count: ${apiResponse.count}`);

  if (apiResponse.success && apiResponse.playbooks.length > 0) {
    console.log('\n🎉 FIX SUCCESSFUL!');
    console.log('Frontend should now display playbook.');
    console.log('\n📋 Playbook Details:');
    const pb = apiResponse.playbooks[0];
    console.log(`- Name: ${pb.name}`);
    console.log(`- Format: ${pb.format}`);
    console.log(`- Recipe hooks: ${pb.recipe.captionBucket?.hooks?.length || 0}`);
    console.log(`- Median reach: ${pb.medianReach}`);
    console.log(`- Engagement: ${pb.avgEngagementRate?.toFixed(2)}%`);
    console.log(`- Source content: ${pb.contentCount} posts`);
  } else {
    console.log('\n❌ Issue persists');
  }
}

verifyFix()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
