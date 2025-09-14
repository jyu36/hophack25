const axios = require('axios');
const FormData = require('form-data');

const ASSISTANT_API_BASE = 'http://localhost:3001';

async function debugFileSearch() {
  console.log('🔍 Debugging File Search Integration\n');

  try {
    // Step 1: Check current files
    console.log('1. Checking current files...');
    const filesResponse = await axios.get(`${ASSISTANT_API_BASE}/api/files`);
    console.log(`   Found ${filesResponse.data.files.length} files:`);
    filesResponse.data.files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.filename} (${file.fileId})`);
    });

    // Step 2: Upload a new test file
    console.log('\n2. Uploading new test file...');
    const testContent = `
Research Paper: "Advanced Machine Learning Techniques for Drug Discovery"

Abstract:
This paper presents novel machine learning approaches for accelerating drug discovery processes. We introduce a new neural network architecture that combines graph convolutional networks with attention mechanisms to predict molecular properties and drug-target interactions.

Key Findings:
1. Our model achieves 94% accuracy in predicting drug-target binding affinity
2. The attention mechanism allows for interpretable predictions
3. Graph-based representation captures molecular structure effectively

Methodology:
- Dataset: 50,000 drug-target pairs from ChEMBL database
- Model: Graph Attention Network (GAT) with 3 layers
- Training: 80/10/10 train/validation/test split
- Optimization: Adam optimizer with learning rate 0.001

Results:
The proposed approach outperforms existing methods by 12% in accuracy and 25% in speed. The attention weights provide insights into which molecular features are most important for binding prediction.

Conclusion:
This work demonstrates the potential of graph neural networks in drug discovery, opening new avenues for computational drug design.
`;

    const formData = new FormData();
    formData.append('file', Buffer.from(testContent), {
      filename: 'debug-research-paper.txt',
      contentType: 'text/plain'
    });
    formData.append('purpose', 'assistants');

    const uploadResponse = await axios.post(`${ASSISTANT_API_BASE}/api/files/upload`, formData, {
      headers: formData.getHeaders()
    });

    console.log('✅ File uploaded successfully:');
    console.log(`   - File ID: ${uploadResponse.data.fileId}`);
    console.log(`   - Filename: ${uploadResponse.data.filename}`);

    // Step 3: Wait for processing
    console.log('\n3. Waiting for file processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4: Start conversation and test
    console.log('\n4. Testing conversation with file search...');
    const conversationResponse = await axios.post(`${ASSISTANT_API_BASE}/api/conversations`, {
      useContext: true
    });

    const sessionId = conversationResponse.data.sessionId;
    console.log(`   - Session ID: ${sessionId}`);

    // Step 5: Send a message that should trigger file search
    console.log('\n5. Sending search query...');
    const messageResponse = await axios.post(`${ASSISTANT_API_BASE}/api/conversations/${sessionId}/messages`, {
      message: 'Please search through the uploaded files to find information about machine learning techniques. Use the search_files tool.',
      fileIds: [uploadResponse.data.fileId]
    });

    console.log('✅ Response:');
    console.log(`   ${messageResponse.data.response}`);
    
    if (messageResponse.data.actions && messageResponse.data.actions.length > 0) {
      console.log(`\n   Actions taken: ${messageResponse.data.actions.join(', ')}`);
    }

    // Step 6: Test with a more specific query
    console.log('\n6. Testing with specific query...');
    const messageResponse2 = await axios.post(`${ASSISTANT_API_BASE}/api/conversations/${sessionId}/messages`, {
      message: 'What is the accuracy mentioned in the uploaded document? Please use search_files to find this information.',
      fileIds: [uploadResponse.data.fileId]
    });

    console.log('✅ Response:');
    console.log(`   ${messageResponse2.data.response}`);
    
    if (messageResponse2.data.actions && messageResponse2.data.actions.length > 0) {
      console.log(`\n   Actions taken: ${messageResponse2.data.actions.join(', ')}`);
    }

    // Step 7: Clean up
    console.log('\n7. Cleaning up...');
    try {
      await axios.delete(`${ASSISTANT_API_BASE}/api/files/${uploadResponse.data.fileId}`);
      console.log('✅ Test file deleted successfully');
    } catch (error) {
      console.log(`   ⚠️  Cleanup warning: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 Debug test completed!');

  } catch (error) {
    console.error('❌ Debug test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the debug test
debugFileSearch();
