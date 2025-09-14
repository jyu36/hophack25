const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const ASSISTANT_API_BASE = 'http://localhost:3001';

// Test data
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

async function testVectorSearch() {
  console.log('🧪 Testing Vector Search Integration\n');

  try {
    // Step 1: Upload a test file
    console.log('1. Uploading test file...');
    const formData = new FormData();
    formData.append('file', Buffer.from(testContent), {
      filename: 'research-paper.txt',
      contentType: 'text/plain'
    });
    formData.append('purpose', 'assistants');

    const uploadResponse = await axios.post(`${ASSISTANT_API_BASE}/api/files/upload`, formData, {
      headers: formData.getHeaders()
    });

    console.log('✅ File uploaded successfully:');
    console.log(`   - File ID: ${uploadResponse.data.fileId}`);
    console.log(`   - Filename: ${uploadResponse.data.filename}`);
    console.log(`   - Size: ${uploadResponse.data.size} bytes\n`);

    // Wait a moment for file to be processed
    console.log('2. Waiting for file processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Start a conversation and test file search
    console.log('3. Starting conversation with file search...');
    const conversationResponse = await axios.post(`${ASSISTANT_API_BASE}/api/conversations`, {
      useContext: true
    });

    const sessionId = conversationResponse.data.sessionId;
    console.log(`   - Session ID: ${sessionId}\n`);

    // Step 3: Send a message that should trigger file search
    console.log('4. Testing file search through conversation...');
    const searchQueries = [
      'What machine learning techniques are mentioned in the uploaded document?',
      'What is the accuracy of the proposed model?',
      'What dataset was used in this research?',
      'What are the key findings of this study?'
    ];

    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      console.log(`\n   Query ${i + 1}: "${query}"`);
      
      try {
        const messageResponse = await axios.post(`${ASSISTANT_API_BASE}/api/conversations/${sessionId}/messages`, {
          message: query,
          fileIds: [uploadResponse.data.fileId]
        });

        console.log(`   ✅ Response (${messageResponse.data.response.length} chars):`);
        console.log(`   ${messageResponse.data.response.substring(0, 200)}...`);
        
        if (messageResponse.data.actions && messageResponse.data.actions.length > 0) {
          console.log(`   Actions taken: ${messageResponse.data.actions.join(', ')}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }

    // Step 4: Test direct file search tool
    console.log('\n5. Testing direct file search tool...');
    try {
      const directSearchResponse = await axios.post(`${ASSISTANT_API_BASE}/api/conversations/${sessionId}/messages`, {
        message: 'Use the search_files tool to find information about neural networks in the uploaded files'
      });

      console.log('✅ Direct search response:');
      console.log(`   ${directSearchResponse.data.response.substring(0, 300)}...`);
      
      if (directSearchResponse.data.actions && directSearchResponse.data.actions.length > 0) {
        console.log(`   Actions taken: ${directSearchResponse.data.actions.join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ Direct search error: ${error.response?.data?.message || error.message}`);
    }

    // Step 5: Clean up
    console.log('\n6. Cleaning up...');
    try {
      await axios.delete(`${ASSISTANT_API_BASE}/api/files/${uploadResponse.data.fileId}`);
      console.log('✅ Test file deleted successfully');
    } catch (error) {
      console.log(`   ⚠️  Cleanup warning: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 Vector search test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testVectorSearch();
