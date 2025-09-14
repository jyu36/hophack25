export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface CreateNodeRequest {
  title: string;
  description?: string;
  motivation?: string;
  expectations?: string;
  status?: 'planned' | 'completed' | 'postponed';
  hypothesis?: string;
  result?: string;
  extra_data?: Record<string, any>;
}

export interface UpdateNodeRequest extends Partial<CreateNodeRequest> {}

export interface Edge {
  id: number;
  from_experiment_id: number;
  to_experiment_id: number;
  relationship_type: string;
  label?: string;
  extra_data?: Record<string, any>;
  created_at: string;
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
  edges: Edge[];
}

export interface LiteratureReference {
  id: string;
  title: string;
  year: number;
  venue: string;
  doi: string;
  url: string;
  relationship: string;
  confidence: number;
  verified: Record<string, string>;
  summary: string;
}

export interface AddLiteratureResponse {
  success: boolean;
  id: number;
  openalex_id: string;
}

export interface DeleteResponse {
  success: boolean;
  deleted_node_id?: number;
  deleted_edge_id?: number;
}