# Assistant API Documentation

## Overview

The Assistant API provides conversational AI capabilities for the research graph system. It enables real-time chat interactions with an AI assistant that can understand and manipulate the research graph through natural language.

**Base URL:** `http://localhost:3001`
**Content-Type:** `application/json`
**Authentication:** None (session-based)

## Quick Start

### 1. Start a Conversation
```javascript
const response = await fetch('http://localhost:3001/api/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ useContext: true })
})

const { sessionId, message } = await response.json();
console.log('Assistant:', message);
```

### 2. Send a Message
```javascript
const response = await fetch(`http://localhost:3001/api/conversations/${sessionId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello, can you help me with my research?' })
});

const { response: assistantMessage, actions } = await response.json();
console.log('Assistant:', assistantMessage);
console.log('Actions:', actions);
```

## API Endpoints

### Health Check

#### `GET /api/health`
Check if the service is running and healthy.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 123
}
```

**Status Codes:**
- `200` - Service is healthy
- `503` - Service is unhealthy

---

### Service Information

#### `GET /`
Get basic service information and available endpoints.

**Response:**
```json
{
  "service": "Research Assistant API",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "endpoints": {
    "health": "/api/health",
    "conversations": "/api/conversations"
  }
}
```

---

### Conversations

#### `POST /api/conversations`
Start a new conversation with the assistant.

**Request Body:**
```json
{
  "sessionId": "optional-existing-session-id",
  "useContext": true
}
```

**Parameters:**
- `sessionId` (optional) - Existing session ID to continue conversation
- `useContext` (optional) - Whether to load current graph context (default: true)

**Response:**
```json
{
  "sessionId": "76c52f46-d776-4243-8a28-ac7b21f8ff97",
  "message": "Hello! I'm your Research Assistant. I can help you manage your experimental work, answer questions about your research, and suggest new experiments. What would you like to work on today?",
  "context": {
    "currentIteration": 0,
    "messageCount": 1,
    "lastToolCalls": []
  }
}
```

**Status Codes:**
- `200` - Conversation started successfully
- `400` - Invalid request data
- `500` - Server error

---

#### `POST /api/conversations/{sessionId}/messages`
Send a message to the assistant.

**Path Parameters:**
- `sessionId` (required) - The conversation session ID

**Request Body:**
```json
{
  "message": "I'm working on a PCR optimization experiment. What should I consider?",
  "context": {
    "currentIteration": 0,
    "messageCount": 5,
    "lastToolCalls": []
  }
}
```

**Parameters:**
- `message` (required) - The user's message
- `context` (optional) - Current conversation context

**Response:**
```json
{
  "response": "For PCR optimization, you should consider several key factors: 1) Primer design and annealing temperature, 2) Template DNA quality and concentration, 3) Buffer composition and pH, 4) Cycling parameters. Would you like me to help you design specific experiments for any of these aspects?",
  "context": {
    "currentIteration": 2,
    "messageCount": 7,
    "lastToolCalls": ["get_graph_overview", "create_node"]
  },
  "actions": [
    "Retrieved current graph overview",
    "Created new experiment node for PCR optimization"
  ],
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

**Status Codes:**
- `200` - Message processed successfully
- `400` - Invalid request data or empty message
- `404` - Session not found
- `500` - Server error

---

#### `GET /api/conversations/{sessionId}/history`
Get the complete conversation history for a session.

**Path Parameters:**
- `sessionId` (required) - The conversation session ID

**Response:**
```json
{
  "sessionId": "76c52f46-d776-4243-8a28-ac7b21f8ff97",
  "messages": [
    {
      "role": "assistant",
      "content": "Hello! I'm your Research Assistant...",
      "timestamp": "2025-01-27T10:25:00.000Z"
    },
    {
      "role": "user",
      "content": "I'm working on a PCR optimization experiment...",
      "timestamp": "2025-01-27T10:25:30.000Z"
    },
    {
      "role": "assistant",
      "content": "For PCR optimization, you should consider...",
      "timestamp": "2025-01-27T10:25:35.000Z",
      "actions": ["Retrieved current graph overview"]
    }
  ],
  "context": {
    "currentIteration": 2,
    "messageCount": 3,
    "lastToolCalls": ["get_graph_overview"]
  }
}
```

**Status Codes:**
- `200` - History retrieved successfully
- `404` - Session not found
- `500` - Server error

---

#### `DELETE /api/conversations/{sessionId}`
Clear the conversation history and reset the context.

**Path Parameters:**
- `sessionId` (required) - The conversation session ID

**Response:**
```json
{
  "message": "Conversation cleared successfully",
  "sessionId": "76c52f46-d776-4243-8a28-ac7b21f8ff97"
}
```

**Status Codes:**
- `200` - Conversation cleared successfully
- `404` - Session not found
- `500` - Server error

---

#### `POST /api/conversations/{sessionId}/refresh`
Refresh the assistant's context with the latest graph data.

**Path Parameters:**
- `sessionId` (required) - The conversation session ID

**Response:**
```json
{
  "message": "Context refreshed successfully",
  "context": {
    "currentIteration": 0,
    "messageCount": 1,
    "lastToolCalls": []
  }
}
```

**Status Codes:**
- `200` - Context refreshed successfully
- `404` - Session not found
- `500` - Server error

---

## Data Types

### ConversationMessage
```typescript
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: string[];
}
```

### ConversationContext
```typescript
interface ConversationContext {
  currentIteration: number;
  messageCount: number;
  lastToolCalls: string[];
}
```

### StartConversationRequest
```typescript
interface StartConversationRequest {
  sessionId?: string;
  useContext?: boolean;
}
```

### SendMessageRequest
```typescript
interface SendMessageRequest {
  message: string;
  context?: ConversationContext;
}
```

### Error Response
```typescript
interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "BadRequest",
  "message": "Message is required and cannot be empty",
  "statusCode": 400,
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

#### 404 Not Found
```json
{
  "error": "NotFound",
  "message": "Session 76c52f46-d776-4243-8a28-ac7b21f8ff97 not found",
  "statusCode": 404,
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

#### 429 Too Many Requests
```json
{
  "error": "TooManyRequests",
  "message": "Too many requests from this IP, please try again later.",
  "statusCode": 429,
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

#### 500 Internal Server Error
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred",
  "statusCode": 500,
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

## Frontend Integration Examples

### React Hook Example
```typescript
import { useState, useCallback } from 'react';

interface UseAssistantReturn {
  sessionId: string | null;
  messages: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  startConversation: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => Promise<void>;
}

export function useAssistant(): UseAssistantReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useContext: true })
      });

      if (!response.ok) throw new Error('Failed to start conversation');

      const data = await response.json();
      setSessionId(data.sessionId);
      setMessages([{
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch(`http://localhost:3001/api/conversations/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        actions: data.actions
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const clearConversation = useCallback(async () => {
    if (!sessionId) return;

    try {
      await fetch(`http://localhost:3001/api/conversations/${sessionId}`, {
        method: 'DELETE'
      });
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [sessionId]);

  return {
    sessionId,
    messages,
    isLoading,
    error,
    startConversation,
    sendMessage,
    clearConversation
  };
}
```

### Vue.js Composable Example
```typescript
import { ref, computed } from 'vue';

export function useAssistant() {
  const sessionId = ref<string | null>(null);
  const messages = ref<ConversationMessage[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const startConversation = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch('http://localhost:3001/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useContext: true })
      });

      const data = await response.json();
      sessionId.value = data.sessionId;
      messages.value = [{
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      }];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      isLoading.value = false;
    }
  };

  const sendMessage = async (message: string) => {
    if (!sessionId.value) return;

    isLoading.value = true;
    error.value = null;

    // Add user message
    messages.value.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(`http://localhost:3001/api/conversations/${sessionId.value}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      messages.value.push({
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        actions: data.actions
      });
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    sessionId: computed(() => sessionId.value),
    messages: computed(() => messages.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    startConversation,
    sendMessage
  };
}
```

### Vanilla JavaScript Example
```javascript
class AssistantAPI {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.sessionId = null;
  }

  async startConversation() {
    const response = await fetch(`${this.baseURL}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useContext: true })
    });

    const data = await response.json();
    this.sessionId = data.sessionId;
    return data;
  }

  async sendMessage(message) {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(`${this.baseURL}/api/conversations/${this.sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    return response.json();
  }

  async getHistory() {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(`${this.baseURL}/api/conversations/${this.sessionId}/history`);
    return response.json();
  }

  async clearConversation() {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(`${this.baseURL}/api/conversations/${this.sessionId}`, {
      method: 'DELETE'
    });

    this.sessionId = null;
    return response.json();
  }
}

// Usage
const assistant = new AssistantAPI();
await assistant.startConversation();
const response = await assistant.sendMessage('Hello!');
console.log(response.response);
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **100 requests per 15 minutes** per IP address
- **429 Too Many Requests** response when limit exceeded
- **Retry-After header** indicates when to retry

## CORS Configuration

The API is configured for frontend integration:
- **Origin:** `http://localhost:3000` (configurable)
- **Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Headers:** Content-Type, Authorization, X-Session-ID
- **Credentials:** Supported

## WebSocket Support (Future)

WebSocket support is planned for real-time chat functionality:
- **Endpoint:** `ws://localhost:3001/ws`
- **Events:** message, typing, actions, error
- **Authentication:** Session-based

## Testing

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Start Conversation
```bash
curl -X POST http://localhost:3001/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"useContext": true}'
```

### Send Message
```bash
curl -X POST http://localhost:3001/api/conversations/SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, can you help me?"}'
```

## Support

For technical support or questions about the API:
- **Documentation:** See `IMPLEMENTATION_DETAILS.md`
- **Testing:** Use `npm run test:api` for validation
- **Logs:** Check server logs for debugging information
