const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFBAnalyticsReal() {
  console.log('🔍 Checking if Facebook Analytics are REAL or SAMPLE\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9'; // Analytics Test Co

  // Get FB integrations
  const fbIntegrations = await prisma.integration.findMany({
    where: {
      organizationId: orgId,
      OR: [
        { providerIdentifier: 'facebook' },
        { providerIdentifier: 'facebook-page' }
      ]
    },
  });

  console.log(`📱 Facebook Integrations: ${fbIntegrations.length}\n`);
  fbIntegrations.forEach(int => {
    console.log(`   ${int.name}`);
    console.log(`   - ID: ${int.id}`);
    console.log(`   - Provider: ${int.providerIdentifier}`);
    console.log(`   - Internalid: ${int.internalId || 'N/A'}`);
    console.log('');
  });

  // Get analytics content for FB integrations
  const fbContent = await prisma.analyticsContent.findMany({
    where: {
      organizationId: orgId,
      integration: {
        OR: [
          { providerIdentifier: 'facebook' },
          { providerIdentifier: 'facebook-page' }
        ]
      }
    },
    include: {
      integration: true,
      metrics: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
  });

  console.log(`📊 Analytics Content from FB: ${fbContent.length} posts\n`);

  if (fbContent.length === 0) {
    console.log('❌ NO FACEBOOK ANALYTICS DATA FOUND!\n');
    console.log('Possible reasons:');
    console.log('1. Analytics sync has not been triggered');
    console.log('2. FB pages have no posts');
    console.log('3. Analytics fetch service needs to be run');
    console.log('\n💡 Need to trigger analytics sync for FB pages');
    return;
  }

  // Analyze each post
  fbContent.forEach((content, idx) => {
    console.log(`${idx + 1}. Post: ${content.externalContentId}`);
    console.log(`   Integration: ${content.integration.name}`);
    console.log(`   Type: ${content.contentType}`);
    console.log(`   Published: ${content.publishedAt.toISOString().split('T')[0]}`);
    console.log(`   Caption: ${content.caption?.substring(0, 60)}...`);
    console.log(`   Metrics: ${content.metrics.length} records`);
    
    // Check if this looks like real FB data
    const hasRealFBId = content.externalContentId.includes('_') || content.externalContentId.length > 15;
    const hasMetrics = content.metrics.length > 0;
    
    console.log(`   🔎 Looks real? ${hasRealFBId ? '✅ YES' : '❌ NO (sample data)'}`);
    
    if (content.metrics.length > 0) {
      console.log(`   Sample metrics:`);
      content.metrics.slice(0, 3).forEach(m => {
        console.log(`      - ${m.metricType}: ${m.metricValue}`);
      });
    }
    console.log('');
  });

  // Verdict
  console.log('═══════════════════════════════════════\n');
  console.log('🔎 Analysis:\n');
  
  const samplePosts = fbContent.filter(c => 
    c.externalContentId.startsWith('ext_post_') ||
    c.externalContentId.length < 10
  );

  const realPosts = fbContent.filter(c => 
    !c.externalContentId.startsWith('ext_post_') &&
    c.externalContentId.length >= 10
  );

  console.log(`Sample/Seed Posts: ${samplePosts.length}`);
  console.log(`Real FB Posts: ${realPosts.length}\n`);

  if (samplePosts.length > 0) {
    console.log('⚠️  SAMPLE DATA DETECTED!');
    console.log('   These posts have fake IDs like "ext_post_1"');
    console.log('   This is seed/sample data, NOT from Facebook API\n');
  }

  if (realPosts.length === 0) {
    console.log('❌ NO REAL FACEBOOK DATA!');
    console.log('\n📋 Action Required:');
    console.log('1. Find analytics sync service');
    console.log('2. Trigger analytics fetch for 3 FB pages');
    console.log('3. Verify real FB post IDs appear in database');
    console.log('4. Delete sample playbooks');
    console.log('5. Regenerate playbooks from real data');
  } else {
    console.log('✅ REAL FACEBOOK DATA FOUND!');
    console.log(`   ${realPosts.length} posts from actual FB API`);
  }
}

checkFBAnalyticsReal()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
