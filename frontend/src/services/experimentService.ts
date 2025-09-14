import {
  CreateNodeRequest,
  UpdateNodeRequest,
  Edge,
  GraphOverview,
  LiteratureReference,
  AddLiteratureResponse,
  DeleteResponse
} from '../types/api';
import { ResearchNode, NodeDetails } from '../types/research';
import { withRetry } from '../utils/retry';

const RETRY_OPTIONS = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  shouldRetry: (error: any) => {
    // Retry on network errors and 5xx server errors
    if (error.name === 'TypeError' || error.name === 'NetworkError') return true;
    if (error.response?.status >= 500) return true;
    return false;
  }
};

const API_BASE_URL = 'http://127.0.0.1:8000';

class ExperimentService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    customRetryOptions?: typeof RETRY_OPTIONS
  ): Promise<T> {
    return withRetry(
      async () => {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        return this.handleResponse<T>(response);
      },
      customRetryOptions || RETRY_OPTIONS
    );
  }

  // Node operations
  async createNode(data: CreateNodeRequest): Promise<ResearchNode> {
    return this.makeRequest<ResearchNode>(`${API_BASE_URL}/nodes`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getNode(nodeId: number, withParents = true, withChildren = true): Promise<{
    node: ResearchNode;
    parents: ResearchNode[];
    children: ResearchNode[];
  }> {
    return this.makeRequest(
      `${API_BASE_URL}/nodes/${nodeId}?with_parents=${withParents}&with_children=${withChildren}`
    );
  }

  async updateNode(nodeId: number, data: UpdateNodeRequest): Promise<ResearchNode> {
    return this.makeRequest<ResearchNode>(`${API_BASE_URL}/nodes/${nodeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteNode(nodeId: number, forceDelete = false): Promise<DeleteResponse> {
    return this.makeRequest<DeleteResponse>(
      `${API_BASE_URL}/nodes/${nodeId}?force_delete=${forceDelete}`,
      { method: 'DELETE' }
    );
  }

  // Graph operations
  async getGraphOverview(): Promise<GraphOverview> {
    return this.makeRequest<GraphOverview>(`${API_BASE_URL}/graph/overview`);
  }

  // Edge operations
  async createEdge(data: {
    from_experiment_id: number;
    to_experiment_id: number;
    relationship_type: string;
    label?: string;
    extra_data?: Record<string, any>;
  }): Promise<Edge> {
    return this.makeRequest<Edge>(`${API_BASE_URL}/edges`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateEdge(
    edgeId: number,
    data: {
      relationship_type?: string;
      label?: string;
      extra_data?: Record<string, any>;
    }
  ): Promise<Edge> {
    return this.makeRequest<Edge>(`${API_BASE_URL}/edges/${edgeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteEdge(edgeId: number): Promise<DeleteResponse> {
    return this.makeRequest<DeleteResponse>(`${API_BASE_URL}/edges/${edgeId}`, {
      method: 'DELETE'
    });
  }

  // Literature operations
  async addLiterature(nodeId: number, link: string, relationship = 'similar'): Promise<AddLiteratureResponse> {
    return this.makeRequest<AddLiteratureResponse>(
      `${API_BASE_URL}/nodes/${nodeId}/literature?link=${encodeURIComponent(link)}&relationship=${relationship}`,
      { method: 'POST' }
    );
  }

  async getNodeLiterature(nodeId: number): Promise<LiteratureReference[]> {
    return this.makeRequest<LiteratureReference[]>(`${API_BASE_URL}/nodes/${nodeId}/literature`);
  }

  async getSuggestedLiterature(
    nodeId: number,
    ignoreCache = false,
    relationship = 'auto'
  ): Promise<LiteratureReference> {
    return this.makeRequest<LiteratureReference>(
      `${API_BASE_URL}/nodes/${nodeId}/literature/suggested?ignore_cache=${ignoreCache}&relationship=${relationship}`
    );
  }

  async deleteLiterature(nodeId: number, link: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(
      `${API_BASE_URL}/nodes/${nodeId}/literature/${encodeURIComponent(link)}`,
      { method: 'DELETE' }
    );
  }

  // Additional methods for graph functionality
  async getNodeDetails(nodeId: number): Promise<NodeDetails> {
    return this.makeRequest<NodeDetails>(`${API_BASE_URL}/nodes/${nodeId}/details`);
  }

  async createBranch(nodeId: number): Promise<ResearchNode> {
    return this.makeRequest<ResearchNode>(`${API_BASE_URL}/nodes/${nodeId}/branch`, {
      method: 'POST'
    });
  }
}

// Create a singleton instance
export const experimentService = new ExperimentService();