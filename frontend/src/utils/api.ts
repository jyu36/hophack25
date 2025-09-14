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

// Notes and Discussion Operations
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
export async function getGraphOverview(): Promise<APIGraphOverview> {
  const response = await api.get("/graph/overview");
  return response.data;
}

// ... rest of the existing code ...

export default api;
