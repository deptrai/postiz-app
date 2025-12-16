require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');

const prisma = new PrismaClient();

async function fetchFBContent(pageId, accessToken, date) {
  console.log(`\n📥 Fetching content for ${date}...`);
  
  const since = dayjs(date).unix();
  const until = dayjs(date).add(1, 'day').unix();
  
  const postsUrl = `https://graph.facebook.com/v20.0/${pageId}/posts?fields=id,message,created_time&since=${since}&until=${until}&access_token=${accessToken}`;
  
  const response = await fetch(postsUrl);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FB API error: ${errorText}`);
  }
  
  const data = await response.json();
  console.log(`   Found ${data.data?.length || 0} posts`);
  
  return data.data || [];
}

async function manualFBFetch() {
  console.log('🚀 Manual Facebook Data Fetch\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9';

  const fbIntegrations = await prisma.integration.findMany({
    where: {
      organizationId: orgId,
      providerIdentifier: 'facebook',
    },
  });

  console.log(`📱 FB Integrations: ${fbIntegrations.length}\n`);

  // Fetch last 7 days
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
  }

  for (const integration of fbIntegrations) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 ${integration.name}`);
    console.log(`   Page ID: ${integration.internalId}`);

    let totalPosts = 0;

    for (const date of dates) {
      try {
        const posts = await fetchFBContent(
          integration.internalId,
          integration.token,
          date
        );

        if (posts.length > 0) {
          console.log(`\n   ✅ ${date}: ${posts.length} posts`);

          for (const post of posts) {
            // Store in database using correct unique constraint
            await prisma.analyticsContent.upsert({
              where: {
                organizationId_integrationId_externalContentId_deletedAt: {
                  organizationId: orgId,
                  integrationId: integration.id,
                  externalContentId: post.id,
                  deletedAt: null,
                },
              },
              create: {
                organizationId: orgId,
                integrationId: integration.id,
                externalContentId: post.id,
                contentType: 'post',
                caption: post.message || '',
                hashtags: '',
                publishedAt: new Date(post.created_time),
              },
              update: {
                caption: post.message || '',
                publishedAt: new Date(post.created_time),
              },
            });

            console.log(`      - ${post.id}: ${post.message?.substring(0, 50) || 'No message'}...`);
            totalPosts++;
          }
        }
      } catch (error) {
        console.log(`   ❌ ${date}: ${error.message}`);
      }
    }

    console.log(`\n   📊 Total stored: ${totalPosts} posts`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('\n🎉 Manual fetch complete!\n');

  // Verify
  const realContent = await prisma.analyticsContent.findMany({
    where: {
      organizationId: orgId,
      NOT: {
        externalContentId: {
          startsWith: 'fb_post_',
        },
      },
    },
  });

  console.log(`✅ Real FB content in database: ${realContent.length} posts\n`);

  if (realContent.length > 0) {
    console.log('Sample posts:');
    realContent.slice(0, 3).forEach((post, idx) => {
      console.log(`\n${idx + 1}. ${post.externalContentId}`);
      console.log(`   Caption: ${post.caption.substring(0, 60)}...`);
      console.log(`   Published: ${post.publishedAt.toISOString().split('T')[0]}`);
    });

    console.log('\n📋 Next steps:');
    console.log('1. Delete sample data: node delete-sample-data.js');
    console.log('2. Regenerate playbooks: node regenerate-playbooks-real-data.js');
  }
}

manualFBFetch()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
