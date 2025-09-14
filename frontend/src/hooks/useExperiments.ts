import { useState, useCallback, useEffect } from 'react';
import { ResearchNode, NodeStatus, NodeType } from '../types/research';
import { experimentService } from '../services/experimentService';
import { CreateNodeRequest, UpdateNodeRequest } from '../types/api';

export function useExperiments() {
  const [experiments, setExperiments] = useState<ResearchNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load experiments on mount
  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const overview = await experimentService.getGraphOverview();
      // Convert API nodes to ResearchNode format
      const researchNodes = overview.nodes.map(node => ({
        ...node,
        type: node.type as NodeType,
        status: node.status as NodeStatus,
        level: 0,
        keywords: [],
        aiGenerated: false
      }));
      setExperiments(researchNodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load experiments');
      console.error('Error loading experiments:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addExperiment = useCallback(async (data: CreateNodeRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const newExperiment = await experimentService.createNode(data);
      setExperiments(prev => [...prev, newExperiment]);
      return newExperiment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add experiment');
      console.error('Error adding experiment:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateExperiment = useCallback(async (id: number, data: UpdateNodeRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedExperiment = await experimentService.updateNode(id, data);
      setExperiments(prev =>
        prev.map(exp => (exp.id === id ? updatedExperiment : exp))
      );
      return updatedExperiment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update experiment');
      console.error('Error updating experiment:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteExperiment = useCallback(async (id: number, force = false) => {
    setIsLoading(true);
    setError(null);
    try {
      await experimentService.deleteNode(id, force);
      setExperiments(prev => prev.filter(exp => exp.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete experiment');
      console.error('Error deleting experiment:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateExperimentStatus = useCallback(async (id: number, status: NodeStatus) => {
    return updateExperiment(id, { status });
  }, [updateExperiment]);

  const getExperimentsByStatus = useCallback((status: NodeStatus) => {
    return experiments.filter(exp => exp.status === status);
  }, [experiments]);

  const addExperimentRelation = useCallback(async (
    fromId: number,
    toId: number,
    relationshipType: string,
    label?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const edge = await experimentService.createEdge({
        from_experiment_id: fromId,
        to_experiment_id: toId,
        relationship_type: relationshipType,
        label
      });
      return edge;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add relation');
      console.error('Error adding relation:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addLiteratureReference = useCallback(async (
    experimentId: number,
    link: string,
    relationship = 'similar'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await experimentService.addLiterature(experimentId, link, relationship);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add literature reference');
      console.error('Error adding literature:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    experiments,
    isLoading,
    error,
    addExperiment,
    updateExperiment,
    deleteExperiment,
    updateExperimentStatus,
    getExperimentsByStatus,
    addExperimentRelation,
    addLiteratureReference,
    refreshExperiments: loadExperiments
  };
}