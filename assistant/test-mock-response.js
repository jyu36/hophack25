// Test the mock response functionality directly
const { fileSearchService } = require('./dist/server/services/fileSearchService');

async function testMockResponse() {
  console.log('🧪 Testing Mock Response Functionality\n');

  try {
    // Step 1: Initialize the service
    console.log('1. Initializing file search service...');
    await fileSearchService.initializeAssistant();
    console.log('✅ File search service initialized\n');

    // Step 2: Test search (should return mock response)
    console.log('2. Testing search with mock response...');
    const searchResult = await fileSearchService.searchFiles('machine learning techniques');
    
    console.log('✅ Mock search result:');
    console.log(`   Query: ${searchResult.query}`);
    console.log(`   Results: ${searchResult.results.length} found`);
    console.log(`   Content preview: ${searchResult.results[0].content.substring(0, 200)}...`);
    console.log(`   Relevance score: ${searchResult.results[0].relevanceScore}`);

    // Step 3: Test another query
    console.log('\n3. Testing another query...');
    const searchResult2 = await fileSearchService.searchFiles('neural networks');
    
    console.log('✅ Mock search result 2:');
    console.log(`   Query: ${searchResult2.query}`);
    console.log(`   Results: ${searchResult2.results.length} found`);
    console.log(`   Content preview: ${searchResult2.results[0].content.substring(0, 200)}...`);

    // Step 4: Cleanup
    console.log('\n4. Cleaning up...');
    await fileSearchService.cleanup();
    console.log('✅ Cleanup completed');

    console.log('\n🎉 Mock response test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testMockResponse();
