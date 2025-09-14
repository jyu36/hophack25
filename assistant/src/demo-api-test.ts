#!/usr/bin/env ts-node

/**
 * Assistant API Demo Test Script
 * 
 * This script tests all the assistant API endpoints to ensure they're working correctly.
 * It simulates a complete conversation flow and tests all available endpoints.
 * 
 * Usage: npm run demo:api-test
 */

import axios, { AxiosResponse } from 'axios';
import { 
  StartConversationRequest, 
  SendMessageRequest, 
  StartConversationResponse,
  SendMessageResponse,
  ConversationHistory,
  HealthCheckResponse,
  RefreshContextResponse,
  ClearConversationResponse
} from './types/api';

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  conversations: `${API_BASE_URL}/api/conversations`,
  root: `${API_BASE_URL}/`
};

// Test data
const TEST_MESSAGES = [
  "Hello! Can you help me with my research?",
  "I'm working on a PCR optimization experiment. What should I consider?",
  "What experiments are currently in my research graph?",
  "Can you suggest some follow-up experiments?",
  "Thank you for your help!"
];

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const logTest = (testName: string, status: 'PASS' | 'FAIL', details?: string) => {
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${testName}${details ? ` - ${details}` : ''}`);
};

const logInfo = (message: string) => {
  console.log(`ℹ️  ${message}`);
};

const logError = (message: string, error?: any) => {
  console.log(`❌ ${message}`);
  if (error) {
    console.log(`   Error: ${error.message || error}`);
  }
};

// Test functions
async function testHealthEndpoint(): Promise<boolean> {
  try {
    const response: AxiosResponse<HealthCheckResponse> = await axios.get(API_ENDPOINTS.health);
    
    if (response.status === 200 && response.data.status === 'healthy') {
      logTest('Health Check', 'PASS', `Uptime: ${response.data.uptime}s`);
      return true;
    } else {
      logTest('Health Check', 'FAIL', `Unexpected response: ${response.data.status}`);
      return false;
    }
  } catch (error) {
    logTest('Health Check', 'FAIL', 'Server not responding');
    return false;
  }
}

async function testRootEndpoint(): Promise<boolean> {
  try {
    const response = await axios.get(API_ENDPOINTS.root);
    
    if (response.status === 200 && response.data.service === 'Research Assistant API') {
      logTest('Root Endpoint', 'PASS', `Version: ${response.data.version}`);
      return true;
    } else {
      logTest('Root Endpoint', 'FAIL', 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logTest('Root Endpoint', 'FAIL', 'Server not responding');
    return false;
  }
}

async function testStartConversation(): Promise<string | null> {
  try {
    const request: StartConversationRequest = {
      useContext: true
    };
    
    const response: AxiosResponse<StartConversationResponse> = await axios.post(
      API_ENDPOINTS.conversations, 
      request
    );
    
    if (response.status === 200 && response.data.sessionId && response.data.message) {
      logTest('Start Conversation', 'PASS', `Session: ${response.data.sessionId.substring(0, 8)}...`);
      logInfo(`   Assistant: "${response.data.message.substring(0, 100)}..."`);
      return response.data.sessionId;
    } else {
      logTest('Start Conversation', 'FAIL', 'Invalid response format');
      return null;
    }
  } catch (error) {
    logTest('Start Conversation', 'FAIL', 'Request failed');
    logError('Start Conversation Error', error);
    return null;
  }
}

async function testSendMessage(sessionId: string, message: string, messageIndex: number): Promise<boolean> {
  try {
    const request: SendMessageRequest = {
      message: message
    };
    
    const response: AxiosResponse<SendMessageResponse> = await axios.post(
      `${API_ENDPOINTS.conversations}/${sessionId}/messages`,
      request
    );
    
    if (response.status === 200 && response.data.response) {
      logTest(`Send Message ${messageIndex + 1}`, 'PASS', `"${message.substring(0, 30)}..."`);
      logInfo(`   Assistant: "${response.data.response.substring(0, 100)}..."`);
      
      if (response.data.actions && response.data.actions.length > 0) {
        logInfo(`   Actions: ${response.data.actions.join(', ')}`);
      }
      
      return true;
    } else {
      logTest(`Send Message ${messageIndex + 1}`, 'FAIL', 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest(`Send Message ${messageIndex + 1}`, 'FAIL', 'Request failed');
    logError(`Send Message ${messageIndex + 1} Error`, error);
    return false;
  }
}

async function testGetConversationHistory(sessionId: string): Promise<boolean> {
  try {
    const response: AxiosResponse<ConversationHistory> = await axios.get(
      `${API_ENDPOINTS.conversations}/${sessionId}/history`
    );
    
    if (response.status === 200 && response.data.messages && Array.isArray(response.data.messages)) {
      logTest('Get Conversation History', 'PASS', `${response.data.messages.length} messages`);
      
      // Log conversation summary
      const userMessages = response.data.messages.filter(m => m.role === 'user').length;
      const assistantMessages = response.data.messages.filter(m => m.role === 'assistant').length;
      logInfo(`   Messages: ${userMessages} user, ${assistantMessages} assistant`);
      
      return true;
    } else {
      logTest('Get Conversation History', 'FAIL', 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Get Conversation History', 'FAIL', 'Request failed');
    logError('Get Conversation History Error', error);
    return false;
  }
}

async function testRefreshContext(sessionId: string): Promise<boolean> {
  try {
    const response: AxiosResponse<RefreshContextResponse> = await axios.post(
      `${API_ENDPOINTS.conversations}/${sessionId}/refresh`
    );
    
    if (response.status === 200 && response.data.message) {
      logTest('Refresh Context', 'PASS', response.data.message);
      return true;
    } else {
      logTest('Refresh Context', 'FAIL', 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Refresh Context', 'FAIL', 'Request failed');
    logError('Refresh Context Error', error);
    return false;
  }
}

async function testClearConversation(sessionId: string): Promise<boolean> {
  try {
    const response: AxiosResponse<ClearConversationResponse> = await axios.delete(
      `${API_ENDPOINTS.conversations}/${sessionId}`
    );
    
    if (response.status === 200 && response.data.message) {
      logTest('Clear Conversation', 'PASS', response.data.message);
      return true;
    } else {
      logTest('Clear Conversation', 'FAIL', 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Clear Conversation', 'FAIL', 'Request failed');
    logError('Clear Conversation Error', error);
    return false;
  }
}

async function testErrorHandling(): Promise<boolean> {
  try {
    // Test invalid session ID
    await axios.get(`${API_ENDPOINTS.conversations}/invalid-session-id/history`);
    logTest('Error Handling', 'FAIL', 'Should have returned 404 for invalid session');
    return false;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      logTest('Error Handling', 'PASS', 'Correctly returns 404 for invalid session');
      return true;
    } else {
      logTest('Error Handling', 'FAIL', 'Unexpected error response');
      logError('Error Handling', error);
      return false;
    }
  }
}

async function testInvalidMessage(): Promise<boolean> {
  try {
    // Test empty message
    const request: SendMessageRequest = { message: '' };
    await axios.post(`${API_ENDPOINTS.conversations}/test-session/messages`, request);
    logTest('Invalid Message Handling', 'FAIL', 'Should have returned 400 for empty message');
    return false;
  } catch (error: any) {
    if (error.response && error.response.status === 400) {
      logTest('Invalid Message Handling', 'PASS', 'Correctly returns 400 for empty message');
      return true;
    } else {
      logTest('Invalid Message Handling', 'FAIL', 'Unexpected error response');
      logError('Invalid Message Handling', error);
      return false;
    }
  }
}

// Main test runner
async function runApiTests(): Promise<void> {
  console.log('🚀 Starting Assistant API Demo Tests\n');
  console.log('=' .repeat(60));
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  // Test 1: Health Check
  console.log('\n📊 Testing Health Endpoints...');
  results.total++;
  if (await testHealthEndpoint()) results.passed++; else results.failed++;
  
  results.total++;
  if (await testRootEndpoint()) results.passed++; else results.failed++;
  
  // Test 2: Conversation Flow
  console.log('\n💬 Testing Conversation Flow...');
  results.total++;
  const sessionId = await testStartConversation();
  if (sessionId) {
    results.passed++;
    
    // Test sending multiple messages
    for (let i = 0; i < TEST_MESSAGES.length; i++) {
      results.total++;
      if (await testSendMessage(sessionId, TEST_MESSAGES[i], i)) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Add delay between messages to simulate real usage
      await delay(1000);
    }
    
    // Test conversation history
    results.total++;
    if (await testGetConversationHistory(sessionId)) results.passed++; else results.failed++;
    
    // Test context refresh
    results.total++;
    if (await testRefreshContext(sessionId)) results.passed++; else results.failed++;
    
    // Test clear conversation
    results.total++;
    if (await testClearConversation(sessionId)) results.passed++; else results.failed++;
    
  } else {
    results.failed++;
  }
  
  // Test 3: Error Handling
  console.log('\n⚠️  Testing Error Handling...');
  results.total++;
  if (await testErrorHandling()) results.passed++; else results.failed++;
  
  results.total++;
  if (await testInvalidMessage()) results.passed++; else results.failed++;
  
  // Test Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 Test Summary');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! The Assistant API is working correctly.');
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) failed. Please check the server and try again.`);
  }
  
  console.log('\n💡 To run the assistant server: npm run dev');
  console.log('💡 To run this test: npm run demo:api-test');
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection', reason);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  runApiTests().catch((error) => {
    logError('Test Runner Error', error);
    process.exit(1);
  });
}

export { runApiTests };
