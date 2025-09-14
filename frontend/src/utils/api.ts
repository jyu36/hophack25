import axios from "axios";
import { ResearchNode } from "../types/research";
import { GraphOverview, Edge as APIExperimentRelationship } from "../types/api";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Assistant API for summaries (runs on port 3001)
const assistantApi = axios.create({
  baseURL: process.env.REACT_APP_ASSISTANT_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

// Notes Operations
export async function getNotes(): Promise<{ last_meeting_notes: string }> {
  const response = await api.get("/notes");
  return response.data;
}

export async function updateNotes(
  notes: string
): Promise<{ success: boolean }> {
  const response = await api.post("/notes", null, {
    params: { last_meeting_notes: notes },
  });
  return response.data;
}

// Discussion Operations
export async function getDiscussion(): Promise<{ discussion_points: string }> {
  const response = await api.get("/discussion");
  return response.data;
}

export async function updateDiscussion(
  points: string
): Promise<{ success: boolean }> {
  const response = await api.post("/discussion", null, {
    params: { discussion_points: points },
  });
  return response.data;
}

// Graph and Node Operations
export async function getGraphOverview(): Promise<GraphOverview> {
  const response = await api.get("/graph/overview");
  return response.data;
}

export async function getNodeInfo(
  nodeId: number,
  withParents = true,
  withChildren = true
): Promise<{
  node: ResearchNode;
  parents: ResearchNode[];
  children: ResearchNode[];
}> {
  const response = await api.get(`/nodes/${nodeId}`, {
    params: { with_parents: withParents, with_children: withChildren },
  });
  return response.data;
}

// Feedback Operations
export async function getFeedback(): Promise<{ professor_feedback: string }> {
  const response = await api.get("/feedback");
  return response.data;
}

export async function updateFeedback(
  feedback: string
): Promise<{ success: boolean }> {
  const response = await api.post("/feedback", null, {
    params: { professor_feedback: feedback },
  });
  return response.data;
}

export async function deleteFeedback(): Promise<{ success: boolean }> {
  const response = await api.delete("/feedback");
  return response.data;
}

export async function getAllNodes(concise = true): Promise<ResearchNode[]> {
  const response = await api.get("/nodes", {
    params: { concise },
  });
  return response.data;
}

export async function createNode(
  experiment: ResearchNode
): Promise<ResearchNode> {
  const response = await api.post("/nodes", experiment);
  return response.data;
}

export async function updateNode(
  nodeId: number,
  updates: Partial<ResearchNode>
): Promise<ResearchNode> {
  const response = await api.patch(`/nodes/${nodeId}`, updates);
  return response.data;
}

export async function deleteNode(
  nodeId: number,
  forceDelete = false
): Promise<{ success: boolean }> {
  const response = await api.delete(`/nodes/${nodeId}`, {
    params: { force_delete: forceDelete },
  });
  return response.data;
}

// Edge Operations
export async function createEdge(edge: {
  from_experiment_id: number;
  to_experiment_id: number;
  relationship_type: string;
  label?: string;
}): Promise<APIExperimentRelationship> {
  const response = await api.post("/edges", edge);
  return response.data;
}

export async function updateEdge(
  edgeId: number,
  updates: Partial<APIExperimentRelationship>
): Promise<APIExperimentRelationship> {
  const response = await api.patch(`/edges/${edgeId}`, updates);
  return response.data;
}

export async function deleteEdge(
  edgeId: number
): Promise<{ success: boolean }> {
  const response = await api.delete(`/edges/${edgeId}`);
  return response.data;
}

// Context Keywords
export async function getContextKeywords(): Promise<string[]> {
  const response = await api.get("/context-keywords");
  return response.data;
}

export async function addContextKeyword(
  keyword: string
): Promise<{ success: boolean }> {
  const response = await api.post("/context-keywords", null, {
    params: { keyword },
  });
  return response.data;
}

export async function deleteContextKeyword(
  keyword: string
): Promise<{ success: boolean }> {
  const response = await api.delete(`/context-keywords/${keyword}`);
  return response.data;
}

// Literature References
export async function getNodeLiterature(nodeId: number): Promise<string[]> {
  const response = await api.get(`/nodes/${nodeId}/literature`);
  return response.data;
}

export async function addLiterature(
  nodeId: number,
  link: string
): Promise<{ success: boolean }> {
  const response = await api.post(`/nodes/${nodeId}/literature`, null, {
    params: { link },
  });
  return response.data;
}

export async function deleteLiterature(
  nodeId: number,
  link: string
): Promise<{ success: boolean }> {
  const response = await api.delete(
    `/nodes/${nodeId}/literature/${encodeURIComponent(link)}`
  );
  return response.data;
}

// Summary Operations
export interface SummaryResponse {
  summary: string;
  generated_at: string;
  cache_hit: boolean;
  node_count: number;
  edge_count: number;
}

export async function getOverviewSummary(
  ignoreCache = false
): Promise<SummaryResponse> {
  const response = await assistantApi.get("/api/summaries/overview", {
    params: { ignore_cache: ignoreCache },
  });
  return response.data;
}

export async function getWeeklySummary(
  ignoreCache = false
): Promise<SummaryResponse> {
  const response = await assistantApi.get("/api/summaries/weekly", {
    params: { ignore_cache: ignoreCache },
  });
  return response.data;
}

export async function getSummaryCacheStats(): Promise<{
  cache_stats: {
    size: number;
    entries: Array<{
      key: string;
      age: number;
      expiresIn: number;
    }>;
  };
  timestamp: string;
}> {
  const response = await assistantApi.get("/api/summaries/cache/stats");
  return response.data;
}

export async function clearSummaryCache(): Promise<{
  message: string;
  timestamp: string;
}> {
  const response = await assistantApi.delete("/api/summaries/cache");
  return response.data;
}

// Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    // Extract detailed error information
    const errorDetails = error.response?.data?.detail || {};

    // Handle validation errors
    if (error.response?.status === 422) {
      const validationError = {
        message: errorDetails.message || "Validation Error",
        errors: errorDetails.validation_errors || {},
        suggestions: errorDetails.reprompt_guidance || {},
      };
      throw validationError;
    }

    // Handle other errors
    throw {
      status: error.response?.status,
      message: errorDetails.message || error.message,
      action: errorDetails.action_required,
      details: errorDetails,
    };
  }
);

export default api;
