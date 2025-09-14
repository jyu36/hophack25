#!/usr/bin/env ts-node

/**
 * Simple API Endpoint Test Script
 * 
 * This script tests the assistant API endpoints with basic validation.
 * Run this after starting the server with: npm run dev
 * 
 * Usage: npm run test:api
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  response?: any;
}

async function runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
  try {
    const response = await testFn();
    return { name, passed: true, response };
  } catch (error: any) {
    return { 
      name, 
      passed: false, 
      error: error.message || 'Unknown error',
      response: error.response?.data
    };
  }
}

async function testHealthCheck(): Promise<any> {
  const response = await axios.get(`${API_BASE}/api/health`);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (response.data.status !== 'healthy') throw new Error('Service not healthy');
  return response.data;
}

async function testRootEndpoint(): Promise<any> {
  const response = await axios.get(`${API_BASE}/`);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.service) throw new Error('Missing service field');
  return response.data;
}

async function testStartConversation(): Promise<any> {
  const response = await axios.post(`${API_BASE}/api/conversations`, {
    useContext: true
  });
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.sessionId) throw new Error('Missing sessionId');
  if (!response.data.message) throw new Error('Missing message');
  return response.data;
}

async function testSendMessage(sessionId: string): Promise<any> {
  const response = await axios.post(`${API_BASE}/api/conversations/${sessionId}/messages`, {
    message: "Hello, this is a test message!"
  });
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.response) throw new Error('Missing response');
  return response.data;
}

async function testGetHistory(sessionId: string): Promise<any> {
  const response = await axios.get(`${API_BASE}/api/conversations/${sessionId}/history`);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!Array.isArray(response.data.messages)) throw new Error('Messages should be an array');
  return response.data;
}

async function testRefreshContext(sessionId: string): Promise<any> {
  const response = await axios.post(`${API_BASE}/api/conversations/${sessionId}/refresh`);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.message) throw new Error('Missing message');
  return response.data;
}

async function testClearConversation(sessionId: string): Promise<any> {
  const response = await axios.delete(`${API_BASE}/api/conversations/${sessionId}`);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.message) throw new Error('Missing message');
  return response.data;
}

async function testErrorHandling(): Promise<any> {
  try {
    await axios.get(`${API_BASE}/api/conversations/invalid-session/history`);
    throw new Error('Should have returned 404');
  } catch (error: any) {
    if (error.response?.status === 404) {
      return { status: 404, message: 'Correctly returned 404' };
    }
    throw error;
  }
}

async function runAllTests(): Promise<void> {
  console.log('🧪 Testing Assistant API Endpoints\n');
  console.log('=' .repeat(50));
  
  const results: TestResult[] = [];
  
  // Basic endpoint tests
  results.push(await runTest('Health Check', testHealthCheck));
  results.push(await runTest('Root Endpoint', testRootEndpoint));
  
  // Conversation flow tests
  const conversationResult = await runTest('Start Conversation', testStartConversation);
  results.push(conversationResult);
  
  if (conversationResult.passed && conversationResult.response?.sessionId) {
    const sessionId = conversationResult.response.sessionId;
    
    results.push(await runTest('Send Message', () => testSendMessage(sessionId)));
    results.push(await runTest('Get History', () => testGetHistory(sessionId)));
    results.push(await runTest('Refresh Context', () => testRefreshContext(sessionId)));
    results.push(await runTest('Clear Conversation', () => testClearConversation(sessionId)));
  }
  
  // Error handling tests
  results.push(await runTest('Error Handling (404)', testErrorHandling));
  
  // Print results
  console.log('\n📊 Test Results:');
  console.log('=' .repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.passed) passed++;
    else failed++;
  });
  
  console.log('\n' + '=' .repeat(50));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! API is working correctly.');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Check the server logs.`);
  }
  
  console.log('\n💡 Make sure the server is running: npm run dev');
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

export { runAllTests };
