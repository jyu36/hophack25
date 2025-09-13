# Assistant API Testing

This document explains how to test the Assistant API endpoints to ensure they're working correctly.

## Prerequisites

1. **Start the Assistant Server**:
   ```bash
   npm run dev
   ```

2. **Verify Server is Running**:
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"healthy","timestamp":"...","version":"1.0.0","uptime":...}`

## Test Scripts

### 1. Quick API Test (`npm run test:api`)

A simple test that validates all endpoints are working:

```bash
npm run test:api
```

**What it tests:**
- ✅ Health check endpoint
- ✅ Root endpoint  
- ✅ Start conversation
- ✅ Send message
- ✅ Get conversation history
- ✅ Refresh context
- ✅ Clear conversation
- ✅ Error handling (404 responses)

**Sample Output:**
```
🧪 Testing Assistant API Endpoints

==================================================
✅ PASS Health Check
✅ PASS Root Endpoint
✅ PASS Start Conversation
✅ PASS Send Message
✅ PASS Get History
✅ PASS Refresh Context
✅ PASS Clear Conversation
✅ PASS Error Handling (404)

==================================================
Total: 8 | Passed: 8 | Failed: 0

🎉 All tests passed! API is working correctly.
```

### 2. Comprehensive Demo Test (`npm run demo:api-test`)

A detailed test that simulates a complete conversation flow:

```bash
npm run demo:api-test
```

**What it tests:**
- All basic endpoints
- Multiple message exchanges
- Conversation flow simulation
- Error handling scenarios
- Response validation
- Performance timing

**Sample Output:**
```
🚀 Starting Assistant API Demo Tests

============================================================
📊 Testing Health Endpoints...
✅ Health Check - Uptime: 15s
✅ Root Endpoint - Version: 1.0.0

💬 Testing Conversation Flow...
✅ Start Conversation - Session: 76c52f46...
ℹ️  Assistant: "Hello! I'm your Research Assistant. I can help you manage your experimental work..."

✅ Send Message 1 - "Hello! Can you help me with my research?..."
ℹ️  Assistant: "Of course! I'd be happy to help you with your research..."

✅ Send Message 2 - "I'm working on a PCR optimization..."
ℹ️  Assistant: "PCR optimization is a crucial step in many molecular biology experiments..."

✅ Get Conversation History - 6 messages
ℹ️  Messages: 3 user, 3 assistant

✅ Refresh Context - Context refreshed successfully
✅ Clear Conversation - Conversation cleared successfully

⚠️  Testing Error Handling...
✅ Error Handling - Correctly returns 404 for invalid session
✅ Invalid Message Handling - Correctly returns 400 for empty message

============================================================
📋 Test Summary
============================================================
Total Tests: 10
✅ Passed: 10
❌ Failed: 0
Success Rate: 100.0%

🎉 All tests passed! The Assistant API is working correctly.
```

## Manual Testing

You can also test individual endpoints manually:

### 1. Health Check
```bash
curl http://localhost:3001/api/health
```

### 2. Start Conversation
```bash
curl -X POST http://localhost:3001/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"useContext": true}'
```

### 3. Send Message
```bash
# Replace SESSION_ID with actual session ID from previous response
curl -X POST http://localhost:3001/api/conversations/SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, can you help me?"}'
```

### 4. Get Conversation History
```bash
curl http://localhost:3001/api/conversations/SESSION_ID/history
```

### 5. Refresh Context
```bash
curl -X POST http://localhost:3001/api/conversations/SESSION_ID/refresh
```

### 6. Clear Conversation
```bash
curl -X DELETE http://localhost:3001/api/conversations/SESSION_ID
```

## Expected API Responses

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 123
}
```

### Start Conversation Response
```json
{
  "sessionId": "76c52f46-d776-4243-8a28-ac7b21f8ff97",
  "message": "Hello! I'm your Research Assistant...",
  "context": {
    "currentIteration": 0,
    "messageCount": 1,
    "lastToolCalls": []
  }
}
```

### Send Message Response
```json
{
  "response": "I'd be happy to help you with your research...",
  "context": {
    "currentIteration": 2,
    "messageCount": 3,
    "lastToolCalls": ["get_graph_overview"]
  },
  "actions": [
    "Retrieved graph overview",
    "Analyzed current experiments"
  ],
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

## Troubleshooting

### Server Not Running
```
❌ Health Check - Server not responding
```
**Solution**: Start the server with `npm run dev`

### API Key Issues
```
❌ Send Message 1 - Request failed
   Error: 401 Incorrect API key provided
```
**Solution**: Check your `.env` file has a valid `OPENAI_API_KEY`

### Backend Connection Issues
```
ℹ️  Error fetching graph context: Network Error: Unable to connect to backend API
```
**Solution**: This is expected if the backend isn't running. The assistant will still work with basic functionality.

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution**: Kill existing processes or change the port in `.env` file

## Test Coverage

The test scripts cover:

- ✅ **Health endpoints** - Server status and info
- ✅ **Conversation management** - Start, send, get history, clear
- ✅ **Context management** - Refresh context with latest data
- ✅ **Error handling** - Invalid requests, missing data
- ✅ **Response validation** - Correct data types and structure
- ✅ **Session management** - Unique session IDs, state persistence
- ✅ **Message flow** - Complete conversation simulation

## Continuous Integration

For CI/CD pipelines, use the simple test:

```bash
# Start server in background
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Run tests
npm run test:api

# Cleanup
kill $SERVER_PID
```

This ensures the API is working correctly before deployment.
