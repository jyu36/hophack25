// API Type Definitions for Assistant Service

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: string[];
}

export interface ConversationContext {
  currentIteration: number;
  messageCount: number;
  lastToolCalls: string[];
}

export interface StartConversationRequest {
  sessionId?: string;
  useContext?: boolean;
}

export interface StartConversationResponse {
  sessionId: string;
  message: string;
  context: ConversationContext;
}

export interface SendMessageRequest {
  message: string;
  context?: ConversationContext;
  fileIds?: string[]; // OpenAI file IDs for uploaded files
}

export interface SendMessageResponse {
  response: string;
  context: ConversationContext;
  actions: string[];
  timestamp: string;
}

export interface ConversationHistory {
  sessionId: string;
  messages: ConversationMessage[];
  context: ConversationContext;
}

export interface RefreshContextResponse {
  message: string;
  context: ConversationContext;
}

export interface ClearConversationResponse {
  message: string;
  sessionId: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

// Session management types
export interface Session {
  id: string;
  createdAt: string;
  lastActivity: string;
  context: ConversationContext;
  messages: ConversationMessage[];
}

export interface SessionStore {
  [sessionId: string]: Session;
}

// Request/Response types for Express
export interface RequestWithSession extends Express.Request {
  sessionId?: string;
  session?: Session;
  params: { [key: string]: string };
  body: any;
}

// Environment configuration
export interface ServerConfig {
  port: number;
  host: string;
  corsOrigin: string;
  graphApiBase: string;
  logLevel: string;
}

// Summary types
export interface SummaryRequest {
  ignore_cache?: boolean;
}

export interface SummaryResponse {
  summary: string;
  generated_at: string;
  cache_hit: boolean;
  node_count: number;
  edge_count: number;
}

export interface GraphOverview {
  nodes: Array<{
    id: number;
    title: string;
    status: string;
    type: string;
    description: string;
    created_at: string;
    updated_at: string;
  }>;
  edges: Array<{
    id: number;
    from: number;
    to: number;
    type: string;
    label: string;
  }>;
}

// File upload types
export interface FileUploadRequest {
  file: File;
  purpose?: 'assistants' | 'fine-tune' | 'batch';
}

export interface FileUploadResponse {
  fileId: string;
  filename: string;
  size: number;
  purpose: string;
  created_at: string;
}

export interface FileInfo {
  fileId: string;
  filename: string;
  size: number;
  uploadedAt: string;
}
