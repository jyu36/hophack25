// Test the file search service status directly
const { fileSearchService } = require('./dist/server/services/fileSearchService');

async function testFileSearchStatus() {
  console.log('🔍 Testing File Search Service Status\n');

  try {
    // Step 1: Check if service is initialized
    console.log('1. Checking file search service status...');
    const info = await fileSearchService.getAssistantInfo();
    console.log('✅ Assistant info:', info);

    // Step 2: Test search with no files
    console.log('\n2. Testing search with no files...');
    try {
      const searchResult = await fileSearchService.searchFiles('test query');
      console.log('✅ Search result:', searchResult);
    } catch (error) {
      console.log('❌ Search failed:', error.message);
    }

    // Step 3: Test attaching files
    console.log('\n3. Testing file attachment...');
    try {
      // Use one of the existing file IDs from the previous test
      const testFileId = 'file-Lm6q9McQDUmG4pz6LamNga'; // This should exist from the previous test
      await fileSearchService.attachFiles([testFileId]);
      console.log('✅ Files attached successfully');
      
      // Check status again
      const infoAfter = await fileSearchService.getAssistantInfo();
      console.log('✅ Assistant info after attachment:', infoAfter);
      
      // Test search again
      console.log('\n4. Testing search after file attachment...');
      const searchResultAfter = await fileSearchService.searchFiles('machine learning techniques');
      console.log('✅ Search result after attachment:', searchResultAfter);
      
    } catch (error) {
      console.log('❌ File attachment failed:', error.message);
    }

    console.log('\n🎉 File search status test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testFileSearchStatus();
