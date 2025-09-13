import { useState, useEffect, useCallback } from 'react';
import { Experiment, NodeStatus } from '../types/research';
import experimentService from '../services/experimentService';

export const useExperiments = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch experiments based on active tab
  const fetchExperiments = useCallback(async (tab: 'all' | 'past' | 'planned' | 'deferred') => {
    setLoading(true);
    setError(null);
    try {
      let fetchedExperiments: Experiment[];
      switch (tab) {
        case 'all':
          fetchedExperiments = await experimentService.getAllExperiments();
          break;
        case 'past':
          fetchedExperiments = await experimentService.getPastExperiments();
          break;
        case 'planned':
          fetchedExperiments = await experimentService.getPlannedExperiments();
          break;
        case 'deferred':
          fetchedExperiments = await experimentService.getDeferredExperiments();
          break;
        default:
          fetchedExperiments = await experimentService.getAllExperiments();
      }
      setExperiments(fetchedExperiments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch experiments');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update experiment status
  const updateExperimentStatus = useCallback(async (experimentId: string, status: NodeStatus) => {
    try {
      const updatedExperiment = await experimentService.updateExperimentStatus(experimentId, status);
      setExperiments(prevExperiments =>
        prevExperiments.map(exp =>
          exp.id === experimentId ? updatedExperiment : exp
        )
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update experiment status');
      return false;
    }
  }, []);

  // Get experiments by status
  const getExperimentsByStatus = useCallback((status: NodeStatus) => {
    return experiments.filter(exp => exp.status === status);
  }, [experiments]);

  // Get counts
  const getCounts = useCallback(() => {
    return {
      total: experiments.length,
      accepted: experiments.filter(e => e.status === 'accepted').length,
      planned: experiments.filter(e => e.status === 'planned').length,
      deferred: experiments.filter(e => e.status === 'rejected').length,
    };
  }, [experiments]);

  return {
    experiments,
    loading,
    error,
    fetchExperiments,
    updateExperimentStatus,
    getExperimentsByStatus,
    getCounts,
  };
};

export default useExperiments;