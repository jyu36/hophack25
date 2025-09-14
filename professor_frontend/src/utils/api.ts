import axios from "axios";

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: "http://localhost:8000", // FastAPI backend URL
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

export default api;
