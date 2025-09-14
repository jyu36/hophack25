// Test the file search service directly without going through the agent
const { fileSearchService } = require('./dist/server/services/fileSearchService');

async function testFileSearchDirect() {
  console.log('🧪 Testing File Search Service Directly\n');

  try {
    // Step 1: Initialize the service
    console.log('1. Initializing file search service...');
    await fileSearchService.initializeAssistant();
    console.log('✅ File search service initialized\n');

    // Step 2: Get assistant info
    console.log('2. Getting assistant info...');
    const info = await fileSearchService.getAssistantInfo();
    console.log('✅ Assistant info:', info);

    // Step 3: Test search (this will fail if no files are attached)
    console.log('\n3. Testing search functionality...');
    try {
      const searchResult = await fileSearchService.searchFiles('machine learning techniques');
      console.log('✅ Search result:', searchResult);
    } catch (error) {
      console.log('⚠️  Search test failed (expected if no files attached):', error.message);
    }

    // Step 4: Cleanup
    console.log('\n4. Cleaning up...');
    await fileSearchService.cleanup();
    console.log('✅ Cleanup completed');

    console.log('\n🎉 Direct file search service test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testFileSearchDirect();
