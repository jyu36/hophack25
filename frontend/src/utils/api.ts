import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
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

export default api;
