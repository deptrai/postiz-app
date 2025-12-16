require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function manualSyncFixed() {
  const orgId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320'; // org "axx"
  
  console.log('🔄 Manual Sync for org "axx"\n');

  // Get tracked FB integrations
  const tracked = await prisma.analyticsTrackedIntegration.findMany({
    where: { organizationId: orgId },
    include: { integration: true },
  });

  console.log(`📱 Found ${tracked.length} tracked integrations\n`);

  let totalPosts = 0;

  for (const item of tracked) {
    const integration = item.integration;
    console.log(`\n🔍 Fetching data for: ${integration.name}`);
    
    // Fetch last 7 days
    const since = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    const until = Math.floor(Date.now() / 1000);
    
    const url = `https://graph.facebook.com/v20.0/${integration.internalId}/posts?fields=id,message,created_time&since=${since}&until=${until}&access_token=${integration.token}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        console.log(`   ❌ Error: ${data.error.message}`);
        continue;
      }
      
      const posts = data.data || [];
      console.log(`   ✅ Found ${posts.length} posts`);
      
      // Store each post
      for (const post of posts) {
        // Check if exists
        const existing = await prisma.analyticsContent.findFirst({
          where: {
            organizationId: orgId,
            integrationId: integration.id,
            externalContentId: post.id,
            deletedAt: null,
          },
        });

        if (existing) {
          // Update
          await prisma.analyticsContent.update({
            where: { id: existing.id },
            data: {
              caption: post.message || '',
              publishedAt: new Date(post.created_time),
            },
          });
          console.log(`      - Updated: ${post.id}`);
        } else {
          // Create
          await prisma.analyticsContent.create({
            data: {
              organizationId: orgId,
              integrationId: integration.id,
              externalContentId: post.id,
              contentType: 'post',
              caption: post.message || '',
              publishedAt: new Date(post.created_time),
            },
          });
          console.log(`      - Created: ${post.id}`);
        }
        
        totalPosts++;
      }
      
    } catch (error) {
      console.log(`   ❌ Fetch error: ${error.message}`);
    }
  }

  console.log(`\n\n✅ Sync Complete!`);
  console.log(`Total posts processed: ${totalPosts}`);
  
  // Check analytics content count
  const contentCount = await prisma.analyticsContent.count({
    where: { organizationId: orgId },
  });
  
  console.log(`📊 Analytics Content in DB: ${contentCount} posts`);

  await prisma.$disconnect();
}

manualSyncFixed()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
