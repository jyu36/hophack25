import api from '../utils/api';
import { APIExperiment, apiToUIExperiment } from '../types/api';
import { Experiment, NodeStatus, NodeType } from '../types/research';

// Extract status value from backend response
const extractStatusValue = (status: any): string => {
  if (!status) return '';

  // Handle string format: "<ExperimentStatus.COMPLETED: 'completed'>"
  if (typeof status === 'string') {
    const match = status.match(/[A-Z_]+:\s*'([^']+)'/);
    if (match) {
      console.log('Extracted status from string:', match[1]);
      return match[1];
    }
    return status;
  }

  // Handle object format
  if (typeof status === 'object') {
    if ('value' in status) {
      console.log('Extracted status from object.value:', status.value);
      return status.value;
    }
    if ('toString' in status) {
      const str = status.toString();
      const match = str.match(/[A-Z_]+:\s*'([^']+)'/);
      if (match) {
        console.log('Extracted status from object.toString:', match[1]);
        return match[1];
      }
    }
  }

  console.log('Using status as is:', status);
  return String(status);
};

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
const mapAPIStatusToUIStatus = (apiStatus: any): NodeStatus => {
  const status = extractStatusValue(apiStatus).toLowerCase();
  console.log('Mapping API status to UI status:', { original: apiStatus, extracted: status });

  switch (status) {
    case 'completed':
      return 'accepted';
    case 'planned':
      return 'planned';
    case 'rejected':
      return 'rejected';
    case 'in_progress':
      return 'pending';
    default:
      console.warn('Unknown status:', status);
      return 'pending';
  }
};

// Convert API node to ResearchNode
const convertToResearchNode = (node: any): Experiment => {
  console.log('Converting node:', node);
  const status = mapAPIStatusToUIStatus(node.status);
  console.log('Mapped status:', status);

  return {
    id: node.id.toString(),
    title: node.title,
    description: node.description || '',
    type: node.type as NodeType || 'experiment',
    status,
    level: 0,
    keywords: [],
    createdAt: node.created_at,
    aiGenerated: false
  };
};

export const experimentService = {
  // Get all experiments
  async getAllExperiments(): Promise<Experiment[]> {
    try {
      console.log('Fetching all experiments...');
      const response = await api.get('/graph/overview');
      console.log('Response:', response.data);
      const { nodes } = response.data;
      const experiments = nodes.map(convertToResearchNode);
      console.log('Converted experiments:', experiments);
      return experiments;
    } catch (error) {
      console.error('Error fetching all experiments:', error);
      throw error;
    }
  },

  // Get past (completed) experiments
  async getPastExperiments(): Promise<Experiment[]> {
    try {
      console.log('Fetching past experiments...');
      const { nodes } = await api.get('/graph/overview').then(res => res.data);
      const experiments = nodes
        .filter((node: any) => {
          const status = extractStatusValue(node.status);
          console.log('Filtering node:', { node, extractedStatus: status });
          return status.toLowerCase() === 'completed';
        })
        .map(convertToResearchNode);
      console.log('Past experiments:', experiments);
      return experiments;
    } catch (error) {
      console.error('Error fetching past experiments:', error);
      throw error;
    }
  },

  // Get planned experiments
  async getPlannedExperiments(): Promise<Experiment[]> {
    try {
      console.log('Fetching planned experiments...');
      const { nodes } = await api.get('/graph/overview').then(res => res.data);
      const experiments = nodes
        .filter((node: any) => {
          const status = extractStatusValue(node.status);
          console.log('Filtering node:', { node, extractedStatus: status });
          return status.toLowerCase() === 'planned';
        })
        .map(convertToResearchNode);
      console.log('Planned experiments:', experiments);
      return experiments;
    } catch (error) {
      console.error('Error fetching planned experiments:', error);
      throw error;
    }
  },

  // Get deferred (rejected) experiments
  async getDeferredExperiments(): Promise<Experiment[]> {
    try {
      console.log('Fetching deferred experiments...');
      const { nodes } = await api.get('/graph/overview').then(res => res.data);
      const experiments = nodes
        .filter((node: any) => {
          const status = extractStatusValue(node.status);
          console.log('Filtering node:', { node, extractedStatus: status });
          return status.toLowerCase() === 'rejected';
        })
        .map(convertToResearchNode);
      console.log('Deferred experiments:', experiments);
      return experiments;
    } catch (error) {
      console.error('Error fetching deferred experiments:', error);
      throw error;
    }
  },

  // Update experiment status
  async updateExperimentStatus(experimentId: string, status: NodeStatus): Promise<Experiment> {
    try {
      console.log('Updating experiment status:', { experimentId, status });
      const response = await api.patch(`/nodes/${experimentId}`, {
        status: mapUIStatusToAPIStatus(status)
      });
      const experiment = convertToResearchNode(response.data);
      console.log('Updated experiment:', experiment);
      return experiment;
    } catch (error) {
      console.error('Error updating experiment status:', error);
      throw error;
    }
  }
};

export default experimentService;