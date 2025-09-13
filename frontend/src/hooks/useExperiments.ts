import { useState, useEffect, useCallback, useMemo } from 'react';
import { Experiment, NodeStatus } from '../types/research';
import experimentService from '../services/experimentService';

export const useExperiments = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [filteredExperiments, setFilteredExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Cache experiments by status
  const experimentsByStatus = useMemo(() => {
    const cache = {
      // 所有实验
      all: experiments,
      // past 只显示已完成（绿色）和已推迟（红色）的实验
      past: experiments.filter(e => e.status === 'accepted' || e.status === 'rejected'),
      // planned 只显示计划中（黄色）的实验
      planned: experiments.filter(e => e.status === 'planned'),
      // postponed 只显示已推迟（红色）的实验
      postponed: experiments.filter(e => e.status === 'rejected')
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
  const fetchExperiments = useCallback(async (tab: 'all' | 'past' | 'planned' | 'postponed') => {
    await fetchAllExperiments();
    const filtered = experimentsByStatus[tab];
    setFilteredExperiments(filtered);
    console.log(`Filtered experiments for ${tab}:`, filtered);
    return filtered;
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
      // 已完成的实验（绿色）
      accepted: experiments.filter(e => e.status === 'accepted').length,
      // 计划中的实验（黄色）
      planned: experiments.filter(e => e.status === 'planned').length,
      // 已推迟的实验（红色）
      postponed: experiments.filter(e => e.status === 'rejected').length,
      // 过去的实验（绿色 + 红色）
      past: experiments.filter(e => e.status === 'accepted' || e.status === 'rejected').length
    };
    console.log('Experiment counts:', counts);
    return counts;
  }, [experiments]);

  // Initial fetch
  useEffect(() => {
    fetchAllExperiments();
  }, [fetchAllExperiments]);

  // Update filtered experiments when experiments change
  useEffect(() => {
    setFilteredExperiments(experiments);
  }, [experiments]);

  return {
    experiments: filteredExperiments,
    loading,
    error,
    fetchExperiments,
    updateExperimentStatus,
    getExperimentsByStatus,
    getCounts,
  };
};

export default useExperiments;