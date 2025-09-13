import api from '../utils/api';
import { APIExperiment, apiToUIExperiment } from '../types/api';
import { Experiment, NodeStatus, NodeType } from '../types/research';

// Map UI status to API status
const mapUIStatusToAPIStatus = (uiStatus: NodeStatus): string => {
  switch (uiStatus) {
    case 'accepted':
      return 'completed';
    case 'planned':
      return 'planned';
    case 'rejected':
      return 'rejected';
    default:
      return 'in_progress';
  }
};

// Map API status to UI status
const mapAPIStatusToUIStatus = (apiStatus: string): NodeStatus => {
  switch (apiStatus) {
    case 'completed':
      return 'accepted';
    case 'planned':
      return 'planned';
    case 'in_progress':
      return 'pending';
    case 'rejected':
      return 'rejected';
    default:
      return 'pending';
  }
};

// Convert API node to ResearchNode
const convertToResearchNode = (node: any): Experiment => ({
  id: node.id.toString(),
  title: node.title,
  description: node.description || '',
  type: 'experiment' as NodeType,
  status: mapAPIStatusToUIStatus(node.status),
  level: 0,
  keywords: [],
  createdAt: node.created_at,
  aiGenerated: false
});

export const experimentService = {
  // Get all experiments
  async getAllExperiments(): Promise<Experiment[]> {
    try {
      const response = await api.get('/graph/overview');
      const { nodes } = response.data;
      return nodes.map(convertToResearchNode);
    } catch (error) {
      console.error('Error fetching all experiments:', error);
      throw error;
    }
  },

  // Get past (completed) experiments
  async getPastExperiments(): Promise<Experiment[]> {
    try {
      const { nodes } = await api.get('/graph/overview').then(res => res.data);
      return nodes
        .filter((node: any) => node.status === 'completed')
        .map(convertToResearchNode);
    } catch (error) {
      console.error('Error fetching past experiments:', error);
      throw error;
    }
  },

  // Get planned experiments
  async getPlannedExperiments(): Promise<Experiment[]> {
    try {
      const { nodes } = await api.get('/graph/overview').then(res => res.data);
      return nodes
        .filter((node: any) => node.status === 'planned')
        .map(convertToResearchNode);
    } catch (error) {
      console.error('Error fetching planned experiments:', error);
      throw error;
    }
  },

  // Get deferred (rejected) experiments
  async getDeferredExperiments(): Promise<Experiment[]> {
    try {
      const { nodes } = await api.get('/graph/overview').then(res => res.data);
      return nodes
        .filter((node: any) => node.status === 'rejected')
        .map(convertToResearchNode);
    } catch (error) {
      console.error('Error fetching deferred experiments:', error);
      throw error;
    }
  },

  // Update experiment status
  async updateExperimentStatus(experimentId: string, status: NodeStatus): Promise<Experiment> {
    try {
      const response = await api.patch(`/nodes/${experimentId}`, {
        status: mapUIStatusToAPIStatus(status)
      });
      return convertToResearchNode(response.data);
    } catch (error) {
      console.error('Error updating experiment status:', error);
      throw error;
    }
  }
};

export default experimentService;