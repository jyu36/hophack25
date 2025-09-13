import { useState, useEffect, useCallback, useMemo } from 'react';
import { Experiment, NodeStatus } from '../types/research';
import experimentService from '../services/experimentService';

export const useExperiments = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Cache experiments by status
  const experimentsByStatus = useMemo(() => {
    const cache = {
      all: experiments,
      past: experiments.filter(e => e.status === 'accepted'),
      planned: experiments.filter(e => e.status === 'planned'),
      deferred: experiments.filter(e => e.status === 'rejected')
    };
    return cache;
  }, [experiments]);

  // Fetch all experiments only if needed
  const fetchAllExperiments = useCallback(async () => {
    const now = Date.now();
    // Only fetch if it's been more than 5 seconds since last fetch
    if (now - lastFetchTime < 5000) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fetchedExperiments = await experimentService.getAllExperiments();
      setExperiments(fetchedExperiments);
      setLastFetchTime(now);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch experiments');
    } finally {
      setLoading(false);
    }
  }, [lastFetchTime]);

  // Fetch experiments based on active tab
  const fetchExperiments = useCallback(async (tab: 'all' | 'past' | 'planned' | 'deferred') => {
    await fetchAllExperiments();
    return experimentsByStatus[tab];
  }, [fetchAllExperiments, experimentsByStatus]);

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

  // Initial fetch
  useEffect(() => {
    fetchAllExperiments();
  }, [fetchAllExperiments]);

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