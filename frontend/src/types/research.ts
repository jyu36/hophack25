export type NodeStatus = "completed" | "postponed" | "planned";
export type NodeType = "hypothesis" | "experiment" | "result" | "analysis";

export interface RelatedPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  year: number;
  citations: number;
}

export interface ResearchNode {
  id: number;
  title: string;
  description: string;
  type: NodeType;
  status: NodeStatus;
  level: number;
  parentId?: number;
  motivation?: string;
  expectations?: string;
  reasoning?: string;
  keywords: string[];
  relatedPapers?: RelatedPaper[];
  created_at: string;
  updated_at: string;
  aiGenerated: boolean;
  solutions?: ResearchNode[]; // Child nodes/solutions proposed by AI
  plannedDate?: string;
  priority?: number;
  goals?: string;
  methodology?: string;
  resources?: string;
  extra_data?: Record<string, any>;
}

// 为了保持兼容性，我们将 Experiment 定义为 ResearchNode 的别名
export type Experiment = ResearchNode;

export interface ExperimentSuggestion {
  title: string;
  description: string;
  type: NodeType;
  motivation?: string;
  expectations?: string;
  reasoning?: string;
  keywords: string[];
  relatedPapers?: RelatedPaper[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string; // For uploaded files
}

export interface ConversationContext {
  currentIteration: number;
  messageCount: number;
  lastToolCalls: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: ExperimentSuggestion[];
  attachments?: FileAttachment[];
  timestamp: string;
  actions?: string[];
}

export interface AssistantResponse {
  response: string;
  context: ConversationContext;
  actions?: string[];
  timestamp: string;
}

export interface ConversationHistory {
  sessionId: string;
  messages: ChatMessage[];
  context: ConversationContext;
}

export interface NodeDetails {
  papers: RelatedPaper[];
  solutions: ResearchNode[];
  isLoading: boolean;
  error?: string;
}

export interface AIResponse {
  message: string;
  suggestions: ExperimentSuggestion[];
}
