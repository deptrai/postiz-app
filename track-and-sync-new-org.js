require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function trackAndSync() {
  console.log('🔧 Tracking integration for org "axx"\n');

  const orgId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';

  // Get FB integration
  const integration = await prisma.integration.findFirst({
    where: {
      organizationId: orgId,
      providerIdentifier: 'facebook',
    },
  });

  if (!integration) {
    console.log('❌ No FB integration found');
    return;
  }

  console.log(`✅ Found integration: ${integration.name}`);
  console.log(`   Page ID: ${integration.internalId}`);
  console.log(`   Token: ${integration.token.substring(0, 30)}...`);

  // Check if already tracked
  const existing = await prisma.analyticsTrackedIntegration.findFirst({
    where: {
      integrationId: integration.id,
    },
  });

  if (existing) {
    console.log('✅ Already tracked for analytics');
  } else {
    await prisma.analyticsTrackedIntegration.create({
      data: {
        organizationId: orgId,
        integrationId: integration.id,
      },
    });
    console.log('✅ Added to analytics tracking');
  }

  // Now test the token with FB API
  console.log('\n📥 Testing token with FB Graph API...\n');
  
  const since = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60); // 7 days ago
  const until = Math.floor(Date.now() / 1000);
  
  const url = `https://graph.facebook.com/v20.0/${integration.internalId}/posts?fields=id,message,created_time&since=${since}&until=${until}&access_token=${integration.token}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ FB API Error:', data.error);
    } else {
      console.log(`✅ Token works! Found ${data.data?.length || 0} posts`);
      if (data.data && data.data.length > 0) {
        console.log('\nSample posts:');
        data.data.slice(0, 3).forEach(post => {
          console.log(`  - Post ID: ${post.id}`);
          console.log(`    Message: ${post.message?.substring(0, 50) || '(no message)'}...`);
          console.log(`    Created: ${post.created_time}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Fetch error:', error.message);
  }

  await prisma.$disconnect();
}

trackAndSync()
  .then(() => {
    console.log('\n✅ Complete');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
