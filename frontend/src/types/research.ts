export type NodeStatus = 'accepted' | 'pending' | 'rejected';
export type NodeType = 'hypothesis' | 'experiment' | 'result' | 'analysis';

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
  id: string;
  title: string;
  description: string;
  type: NodeType;
  status: NodeStatus;
  level: number;
  parentId?: string;
  motivation?: string;
  expectations?: string;
  reasoning?: string;
  keywords: string[];
  relatedPapers?: RelatedPaper[];
  createdAt: string;
  aiGenerated: boolean;
  solutions?: ResearchNode[]; // Child nodes/solutions proposed by AI
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

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  suggestions?: ExperimentSuggestion[];
  timestamp: Date;
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