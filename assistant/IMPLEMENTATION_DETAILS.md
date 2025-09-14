# Assistant Service Implementation Details

## Overview

The Assistant Service is a Node.js/TypeScript microservice that provides conversational AI capabilities for the research graph. It acts as a bridge between the frontend and the backend graph API, offering intelligent conversation management with persistent session state.

## Architecture

### Service Structure
```
assistant/
├── src/
│   ├── server/                 # HTTP server implementation
│   │   ├── index.ts           # Express server entry point
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API route handlers
│   │   └── services/          # Business logic services
│   ├── types/                 # TypeScript type definitions
│   ├── agent.ts              # Core AI agent implementation
│   ├── tools.ts              # Backend API tool wrappers
│   ├── prompts.ts            # AI prompt templates
│   ├── template.ts           # Template engine for context
│   ├── conversation.ts       # Conversation handler (CLI)
│   ├── logger.ts             # Logging utilities
│   └── demo*.ts              # Demo and test scripts
├── dist/                     # Compiled JavaScript output
├── .env                      # Environment configuration
└── package.json              # Dependencies and scripts
```

## Core Components

### 1. HTTP Server (`src/server/`)

#### Main Server (`index.ts`)
- **Express.js** application with middleware stack
- **Environment configuration** loading with dotenv-cli
- **Security middleware** (Helmet, CORS, Rate limiting)
- **Request logging** and error handling
- **Graceful shutdown** handling

**Key Features:**
- Port: 3001 (configurable via `ASSISTANT_PORT`)
- CORS enabled for frontend integration
- Rate limiting: 100 requests per 15 minutes per IP
- Request/response logging with Winston
- Health check endpoint for monitoring

#### Middleware (`src/server/middleware/`)

**CORS Middleware (`cors.ts`)**
```typescript
export const createCorsMiddleware = (config: ServerConfig) => {
  return cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
  });
};
```

**Request Logging (`logging.ts`)**
- Logs all incoming requests with method, URL, user agent, IP
- Tracks response status codes and duration
- Uses structured logging with Winston

**Error Handling (`errorHandler.ts`)**
- Centralized error handling for all routes
- 404 handler for unknown routes
- Structured error responses with timestamps
- Detailed error logging for debugging

#### Routes (`src/server/routes/`)

**Health Routes (`health.ts`)**
- `GET /api/health` - Service health check
- Returns uptime, version, and status information
- Used for monitoring and load balancer health checks

**Conversation Routes (`conversations.ts`)**
- `POST /api/conversations` - Start new conversation
- `POST /api/conversations/{sessionId}/messages` - Send message
- `GET /api/conversations/{sessionId}/history` - Get conversation history
- `DELETE /api/conversations/{sessionId}` - Clear conversation
- `POST /api/conversations/{sessionId}/refresh` - Refresh context

### 2. Services (`src/server/services/`)

#### Session Service (`sessionService.ts`)
Manages conversation sessions and state persistence.

**Key Features:**
- **In-memory session storage** (can be extended to database)
- **Session lifecycle management** (create, get, update, delete)
- **Message history tracking** with timestamps
- **Context state management** per session
- **Session cleanup** for expired sessions
- **Activity tracking** for session timeout

**Session Data Structure:**
```typescript
interface Session {
  id: string;                    // UUID session identifier
  createdAt: string;            // ISO timestamp
  lastActivity: string;         // Last activity timestamp
  context: ConversationContext; // AI context state
  messages: ConversationMessage[]; // Message history
}
```

#### Conversation Service (`conversationService.ts`)
Orchestrates AI conversations and manages the flow between sessions and the AI agent.

**Key Features:**
- **Agent integration** with the ResearchAssistant class
- **Context conversion** between AgentContext and ConversationContext
- **Message processing** with tool execution
- **Error handling** and graceful degradation
- **Action tracking** for user feedback

**Context Conversion:**
```typescript
// Converts between AI agent context and API context
const agentContextToConversationContext = (agentContext: AgentContext): ConversationContext => {
  return {
    currentIteration: agentContext.currentIteration,
    messageCount: agentContext.messages.length,
    lastToolCalls: agentContext.lastToolCalls
  };
};
```

### 3. AI Agent Integration (`src/agent.ts`)

#### ResearchAssistant Class
The core AI agent that handles conversation logic and tool execution.

**Key Features:**
- **OpenAI GPT-4 integration** with function calling
- **Tool execution** with backend API calls
- **Context management** with graph data
- **ReAct loop** for iterative reasoning
- **Error handling** and retry logic

**Configuration:**
```typescript
interface AgentConfig {
  model: string;           // OpenAI model (default: gpt-4o)
  maxIterations: number;   // Max tool execution iterations
  temperature: number;     // Response creativity (0.0-1.0)
  logLevel?: number;       // Logging verbosity
}
```

### 4. Backend API Tools (`src/tools.ts`)

#### Tool Wrappers
Each backend API endpoint is wrapped as a tool for the AI agent.

**Available Tools:**
- **Graph Reading**: `get_graph_overview`, `get_node`, `get_nodes`
- **Node Management**: `create_node`, `update_node`, `delete_node`
- **Edge Management**: `create_edge`, `update_edge`, `delete_edge`
- **Literature Management**: `add_literature`, `remove_literature`
- **Context Keywords**: `add_context_keyword`, `remove_context_keyword`

**Tool Structure:**
```typescript
export const getGraphOverview = {
  name: "get_graph_overview",
  description: "Get all nodes and edges to understand the research landscape.",
  schema: z.object({}),
  run: async () => (await axios.get(`${BASE}/graph/overview`)).data
};
```

### 5. Prompt System (`src/prompts.ts`)

#### Dynamic Context Generation
Generates contextual system prompts based on current graph state.

**Key Features:**
- **Graph context fetching** from backend API
- **Template rendering** with Nunjucks
- **Context refresh** capabilities
- **Fallback handling** when backend unavailable

**Context Templates:**
- `generateInitialContext()` - Creates context-aware system prompt
- `refreshContext()` - Updates context with latest graph data
- `SYSTEM_PROMPT` - Base system prompt for AI behavior

### 6. Type System (`src/types/api.ts`)

#### API Type Definitions
Comprehensive TypeScript types for all API interactions.

**Key Types:**
```typescript
// Core conversation types
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: string[];
}

interface ConversationContext {
  currentIteration: number;
  messageCount: number;
  lastToolCalls: string[];
}

// API request/response types
interface StartConversationRequest {
  sessionId?: string;
  useContext?: boolean;
}

interface SendMessageRequest {
  message: string;
  context?: ConversationContext;
}
```

## Data Flow

### 1. Conversation Initialization
```
Frontend → POST /api/conversations → ConversationService → ResearchAssistant → OpenAI
```

### 2. Message Processing
```
Frontend → POST /api/conversations/{id}/messages → ConversationService → ResearchAssistant → Tools → Backend API
```

### 3. Context Management
```
Frontend → POST /api/conversations/{id}/refresh → ConversationService → TemplateEngine → Backend API
```

## Configuration

### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...                    # Required: OpenAI API key
ASSISTANT_MODEL=gpt-4o                  # Optional: AI model
MAX_ITERATIONS=10                       # Optional: Max tool iterations

# Server Configuration
ASSISTANT_PORT=3001                     # Optional: Server port
ASSISTANT_HOST=localhost                # Optional: Server host
CORS_ORIGIN=http://localhost:3000       # Optional: CORS origin

# Backend API Configuration
GRAPH_API_BASE=http://127.0.0.1:8000   # Required: Backend API URL

# Logging Configuration
LOG_LEVEL=0                            # Optional: Log level (0-3)
LOG_CONSOLE=true                       # Optional: Console logging
LOG_FILE=false                         # Optional: File logging
```

### Package.json Scripts
```json
{
  "dev": "dotenv -e .env -- ts-node src/server/index.ts",
  "prod": "npm run build && dotenv -e .env -- node dist/server/index.js",
  "test:api": "ts-node src/test-api-endpoints.ts",
  "demo:api-test": "dotenv -e .env -- ts-node src/demo-api-test.ts"
}
```

## Error Handling

### 1. API Errors
- **400 Bad Request** - Invalid request data
- **404 Not Found** - Session not found
- **500 Internal Server Error** - Server-side errors
- **503 Service Unavailable** - Backend API unavailable

### 2. Error Response Format
```typescript
interface ApiError {
  error: string;        // Error type
  message: string;      // Human-readable message
  statusCode: number;   // HTTP status code
  timestamp: string;    // ISO timestamp
}
```

### 3. Graceful Degradation
- **Backend unavailable** - Falls back to basic AI responses
- **OpenAI errors** - Returns error messages to user
- **Tool failures** - Continues conversation with available tools

## Logging

### Log Levels
- **0 DEBUG** - Detailed debugging information
- **1 INFO** - General information and flow
- **2 WARN** - Warning messages
- **3 ERROR** - Error messages only

### Log Categories
- **SERVER** - HTTP server events
- **CONVERSATIONS** - API endpoint calls
- **CONVERSATION** - Business logic events
- **SESSION** - Session management
- **AGENT** - AI agent operations
- **HTTP** - Request/response logging
- **TOOL** - Tool execution logging

### Log Format
```json
{
  "timestamp": "2025-01-27T10:30:00.000Z",
  "level": "info",
  "category": "CONVERSATION",
  "message": "Message processed successfully",
  "sessionId": "76c52f46-d776-4243-8a28-ac7b21f8ff97",
  "actionsCount": 2,
  "responseLength": 150
}
```

## Security

### 1. Input Validation
- **Request body validation** with Zod schemas
- **Session ID validation** for all session-based endpoints
- **Message content sanitization** (basic)

### 2. Rate Limiting
- **100 requests per 15 minutes** per IP address
- **Configurable limits** via environment variables
- **429 Too Many Requests** response for exceeded limits

### 3. CORS Configuration
- **Origin restriction** to specified frontend URL
- **Credential support** for session management
- **Method restriction** to required HTTP methods

## Performance

### 1. Session Management
- **In-memory storage** for fast access
- **Session cleanup** for memory management
- **Activity tracking** for timeout handling

### 2. API Calls
- **Axios HTTP client** with connection pooling
- **Timeout configuration** for backend calls
- **Retry logic** for failed requests

### 3. Logging
- **Structured logging** with Winston
- **Configurable log levels** for production
- **Console and file output** options

## Testing

### 1. Unit Tests
- **Service layer testing** for business logic
- **Mock implementations** for external dependencies
- **Type safety validation** with TypeScript

### 2. Integration Tests
- **API endpoint testing** with real HTTP calls
- **End-to-end conversation flow** testing
- **Error scenario testing** for edge cases

### 3. Test Scripts
- **`npm run test:api`** - Quick API validation
- **`npm run demo:api-test`** - Comprehensive testing
- **Manual testing** with curl commands

## Deployment

### 1. Development
```bash
npm run dev
```

### 2. Production
```bash
npm run build
npm run prod
```

### 3. Docker (Future)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["node", "dist/server/index.js"]
```

## Monitoring

### 1. Health Checks
- **`GET /api/health`** - Service health status
- **Uptime tracking** and version information
- **Dependency health** (OpenAI, Backend API)

### 2. Metrics
- **Request count** and response times
- **Session count** and activity
- **Error rates** and types
- **Tool execution** metrics

### 3. Logging
- **Structured logs** for analysis
- **Error tracking** and alerting
- **Performance monitoring** with timing data

## Future Enhancements

### 1. Persistence
- **Database integration** for session storage
- **Message history** persistence
- **User authentication** and authorization

### 2. Scalability
- **Horizontal scaling** with load balancers
- **Session clustering** for multi-instance deployment
- **Caching layer** for improved performance

### 3. Features
- **WebSocket support** for real-time chat
- **Streaming responses** for long operations
- **File upload** support for research documents
- **Multi-language** support for international users

This implementation provides a robust, scalable foundation for the Assistant Service that can be extended and enhanced as needed.
