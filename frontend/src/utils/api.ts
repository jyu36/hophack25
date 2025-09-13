import axios from "axios";
import { ResearchNode } from "../types/research";
import {
  APIExperiment,
  APIExperimentRelationship,
  APIGraphOverview,
  APINodeInfo,
  apiToUIExperiment,
  uiToAPIExperiment,
} from "../types/api";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Graph and Node Operations
export async function getGraphOverview(): Promise<APIGraphOverview> {
  const response = await api.get("/graph/overview");
  return response.data;
}

export async function getNodeInfo(
  nodeId: number,
  withParents = true,
  withChildren = true
): Promise<APINodeInfo> {
  const response = await api.get(`/nodes/${nodeId}`, {
    params: { with_parents: withParents, with_children: withChildren },
  });
  return response.data;
}

export async function getAllNodes(concise = true): Promise<APIExperiment[]> {
  const response = await api.get("/nodes", {
    params: { concise },
  });
  return response.data;
}

export async function createNode(
  experiment: ResearchNode
): Promise<APIExperiment> {
  const apiExperiment = uiToAPIExperiment(experiment);
  const response = await api.post("/nodes", apiExperiment);
  return response.data;
}

export async function updateNode(
  nodeId: number,
  updates: Partial<ResearchNode>
): Promise<APIExperiment> {
  const apiUpdates = uiToAPIExperiment(updates as ResearchNode);
  const response = await api.patch(`/nodes/${nodeId}`, apiUpdates);
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
