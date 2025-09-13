import axios from 'axios';
import { Experiment, ExperimentSuggestion } from '../types/research';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getExperiments() {
  const response = await api.get<Experiment[]>('/experiments');
  return response.data;
}

export async function createExperiment(experiment: Omit<Experiment, 'id' | 'createdAt'>) {
  const response = await api.post<Experiment>('/experiments', experiment);
  return response.data;
}

export async function updateExperiment(id: string, updates: Partial<Experiment>) {
  const response = await api.patch<Experiment>(`/experiments/${id}`, updates);
  return response.data;
}

export async function deleteExperiment(id: string) {
  await api.delete(`/experiments/${id}`);
}

export async function getExperimentSuggestions(query: string) {
  const response = await api.post<ExperimentSuggestion[]>('/suggestions', { query });
  return response.data;
}

// Add error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error
    console.error('API Error:', error);

    // Rethrow error with more context
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
    }
    throw error;
  }
);
