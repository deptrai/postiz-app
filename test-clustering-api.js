const fetch = require('node-fetch');

const organizationId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';

async function testClusteringAPI() {
  try {
    console.log('🧪 Testing Theme Clustering API\n');

    // Call clustering endpoint
    console.log('📡 Calling POST /themes/cluster...');
    
    const response = await fetch('http://localhost:4001/themes/cluster', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': organizationId,
      },
      body: JSON.stringify({
        minClusterSize: 3,
        similarityThreshold: 0.3,
        maxClusters: 20,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ API Error (${response.status}):`, error);
      return;
    }

    const result = await response.json();
    
    console.log('\n✅ Clustering completed!');
    console.log(`   Themes created: ${result.themesCreated}`);
    console.log(`   Content clustered: ${result.contentClustered}`);

    if (result.themes && result.themes.length > 0) {
      console.log('\n📚 Themes:');
      result.themes.forEach((theme, i) => {
        console.log(`\n${i + 1}. ${theme.name}`);
        console.log(`   ID: ${theme.id}`);
        console.log(`   Keywords: ${JSON.stringify(theme.keywords).substring(0, 100)}...`);
        console.log(`   Content count: ${theme.contentCount}`);
      });
    }

    // Now get list of themes
    console.log('\n\n📡 Calling GET /themes...');
    
    const listResponse = await fetch('http://localhost:4001/themes', {
      headers: {
        'x-org-id': organizationId,
      },
    });

    if (!listResponse.ok) {
      console.error(`❌ API Error (${listResponse.status})`);
      return;
    }

    const listResult = await listResponse.json();
    
    console.log(`\n✅ Retrieved ${listResult.count} themes`);
    
    if (listResult.themes && listResult.themes.length > 0) {
      console.log('\n📊 Theme Summary:');
      listResult.themes.forEach((theme, i) => {
        console.log(`\n${i + 1}. ${theme.name}`);
        console.log(`   Content: ${theme.contentCount}`);
        console.log(`   Avg Reach: ${theme.avgReach.toFixed(0)}`);
        console.log(`   Avg Engagement: ${theme.avgEngagement.toFixed(0)}`);
      });
    }

    console.log('\n\n🎉 Story 7.1 Implementation Complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testClusteringAPI();
