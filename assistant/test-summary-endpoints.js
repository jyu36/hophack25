#!/usr/bin/env node

/**
 * Simple test script for the summary endpoints
 * Run this after starting the assistant server to test the new endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testSummaryEndpoints() {
  console.log('🧪 Testing Summary Endpoints\n');

  try {
    // Test 1: Overview Summary
    console.log('1. Testing Overview Summary...');
    const overviewResponse = await axios.get(`${BASE_URL}/api/summaries/overview`);
    console.log('✅ Overview Summary Response:');
    console.log(`   - Generated at: ${overviewResponse.data.generated_at}`);
    console.log(`   - Cache hit: ${overviewResponse.data.cache_hit}`);
    console.log(`   - Node count: ${overviewResponse.data.node_count}`);
    console.log(`   - Edge count: ${overviewResponse.data.edge_count}`);
    console.log(`   - Summary length: ${overviewResponse.data.summary.length} characters`);
    console.log('   - Summary:\n');
    console.log(overviewResponse.data.summary);
    console.log('\n');

    // Test 2: Weekly Summary
    console.log('2. Testing Weekly Summary...');
    const weeklyResponse = await axios.get(`${BASE_URL}/api/summaries/weekly`);
    console.log('✅ Weekly Summary Response:');
    console.log(`   - Generated at: ${weeklyResponse.data.generated_at}`);
    console.log(`   - Cache hit: ${weeklyResponse.data.cache_hit}`);
    console.log(`   - Node count: ${weeklyResponse.data.node_count}`);
    console.log(`   - Edge count: ${weeklyResponse.data.edge_count}`);
    console.log(`   - Summary length: ${weeklyResponse.data.summary.length} characters`);
    console.log('   - Summary:\n');
    console.log(weeklyResponse.data.summary);
    console.log('\n');

    // Test 3: Cache Stats
    console.log('3. Testing Cache Stats...');
    const cacheStatsResponse = await axios.get(`${BASE_URL}/api/summaries/cache/stats`);
    console.log('✅ Cache Stats Response:');
    console.log(`   - Cache size: ${cacheStatsResponse.data.cache_stats.size}`);
    console.log(`   - Cache entries: ${cacheStatsResponse.data.cache_stats.entries.length}\n`);

    // Test 4: Test with ignore_cache=true
    console.log('4. Testing with ignore_cache=true...');
    const overviewNoCacheResponse = await axios.get(`${BASE_URL}/api/summaries/overview?ignore_cache=true`);
    console.log('✅ Overview Summary (No Cache) Response:');
    console.log(`   - Cache hit: ${overviewNoCacheResponse.data.cache_hit}`);
    console.log(`   - Node count: ${overviewNoCacheResponse.data.node_count}\n`);

    // Test 5: Clear Cache
    console.log('5. Testing Cache Clear...');
    const clearCacheResponse = await axios.delete(`${BASE_URL}/api/summaries/cache`);
    console.log('✅ Cache Clear Response:');
    console.log(`   - Message: ${clearCacheResponse.data.message}\n`);

    console.log('🎉 All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the tests
testSummaryEndpoints();
