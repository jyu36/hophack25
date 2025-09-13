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
      // past 只包含 accepted 和 rejected 的实验
      past: experiments.filter(e => e.status === 'accepted' || e.status === 'rejected'),
      // planned 只包含 planned 状态的实验
      planned: experiments.filter(e => e.status === 'planned'),
      // deferred 只包含 rejected 状态的实验
      deferred: experiments.filter(e => e.status === 'rejected')
    };
    console.log('Experiments by status:', cache);
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
      console.log('Fetched experiments:', fetchedExperiments);
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
    const filteredExperiments = experimentsByStatus[tab];
    console.log(`Filtered experiments for ${tab}:`, filteredExperiments);
    return filteredExperiments;
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
    const filtered = experiments.filter(exp => exp.status === status);
    console.log(`Experiments with status ${status}:`, filtered);
    return filtered;
  }, [experiments]);

  // Get counts
  const getCounts = useCallback(() => {
    const counts = {
      total: experiments.length,
      // 已完成的实验（accepted）
      accepted: experiments.filter(e => e.status === 'accepted').length,
      // 计划中的实验（planned）
      planned: experiments.filter(e => e.status === 'planned').length,
      // 已拒绝的实验（rejected）
      deferred: experiments.filter(e => e.status === 'rejected').length,
      // 过去的实验（accepted + rejected）
      past: experiments.filter(e => e.status === 'accepted' || e.status === 'rejected').length
    };
    console.log('Experiment counts:', counts);
    return counts;
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