import axios from "axios";

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: "http://localhost:8000", // FastAPI backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Assistant API for summaries (runs on port 3001)
const assistantApi = axios.create({
  baseURL: "http://localhost:3001", // Assistant API URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Feedback Operations
export async function getFeedback(): Promise<{
  professor_feedback: string;
  last_updated: string;
}> {
  const response = await api.get("/feedback");
  return response.data;
}

export async function updateFeedback(
  feedback: string
): Promise<{ professor_feedback: string; last_updated: string }> {
  const response = await api.post("/feedback", null, {
    params: { professor_feedback: feedback },
  });
  return response.data;
}

export async function deleteFeedback(): Promise<{ success: boolean }> {
  const response = await api.delete("/feedback");
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

export default api;
