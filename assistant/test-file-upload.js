#!/usr/bin/env node

/**
 * Test script for file upload endpoints
 * Run this after starting the assistant server to test file upload functionality
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';

async function testFileUpload() {
  console.log('🧪 Testing File Upload Endpoints\n');

  try {
    // Create a test file
    const testContent = `# Test Research Document

This is a test document for the research assistant.

## Key Findings
- Finding 1: Important discovery
- Finding 2: Another important discovery

## Methodology
We used advanced techniques to analyze the data.

## Results
The results show significant improvements in performance.
`;

    const testFilePath = path.join(__dirname, 'test-research-doc.txt');
    fs.writeFileSync(testFilePath, testContent);

    console.log('1. Testing File Upload...');
    
    // Test file upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), 'test-research-doc.txt');
    formData.append('purpose', 'assistants');

    const uploadResponse = await axios.post(`${BASE_URL}/api/files/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('✅ File Upload Response:');
    console.log(`   - File ID: ${uploadResponse.data.fileId}`);
    console.log(`   - Filename: ${uploadResponse.data.filename}`);
    console.log(`   - Size: ${uploadResponse.data.size} bytes`);
    console.log(`   - Purpose: ${uploadResponse.data.purpose}`);
    console.log(`   - Created: ${uploadResponse.data.created_at}\n`);

    const fileId = uploadResponse.data.fileId;

    // Test getting file info
    console.log('2. Testing Get File Info...');
    const fileInfoResponse = await axios.get(`${BASE_URL}/api/files/${fileId}`);
    console.log('✅ File Info Response:');
    console.log(`   - File ID: ${fileInfoResponse.data.fileId}`);
    console.log(`   - Filename: ${fileInfoResponse.data.filename}`);
    console.log(`   - Size: ${fileInfoResponse.data.size} bytes`);
    console.log(`   - Uploaded: ${fileInfoResponse.data.uploadedAt}\n`);

    // Test listing files
    console.log('3. Testing List Files...');
    const listResponse = await axios.get(`${BASE_URL}/api/files`);
    console.log('✅ List Files Response:');
    console.log(`   - File count: ${listResponse.data.files.length}`);
    listResponse.data.files.forEach((file, index) => {
      console.log(`   - File ${index + 1}: ${file.filename} (${file.fileId})`);
    });
    console.log('');

    // Test conversation with file attachment
    console.log('4. Testing Conversation with File Attachment...');
    
    // Start a conversation
    const startResponse = await axios.post(`${BASE_URL}/api/conversations`, {
      useContext: true
    });
    const sessionId = startResponse.data.sessionId;
    console.log(`   - Started conversation: ${sessionId}`);

    // Send message with file attachment
    const messageResponse = await axios.post(`${BASE_URL}/api/conversations/${sessionId}/messages`, {
      message: 'Please analyze the uploaded research document and suggest some experiments based on the findings.',
      fileIds: [fileId]
    });

    console.log('✅ Conversation with File Response:');
    console.log(`   - Response length: ${messageResponse.data.response.length} characters`);
    console.log(`   - Actions: ${messageResponse.data.actions.length} actions taken`);
    console.log(`   - Response preview: ${messageResponse.data.response.substring(0, 200)}...\n`);

    // Test file deletion
    console.log('5. Testing File Deletion...');
    const deleteResponse = await axios.delete(`${BASE_URL}/api/files/${fileId}`);
    console.log('✅ File Deletion Response:');
    console.log(`   - Message: ${deleteResponse.data.message}`);
    console.log(`   - File ID: ${deleteResponse.data.fileId}\n`);

    // Clean up test file
    fs.unlinkSync(testFilePath);

    console.log('🎉 All file upload tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the tests
testFileUpload();