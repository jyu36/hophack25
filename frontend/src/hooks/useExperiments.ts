import { useState, useCallback } from 'react';
import { Experiment, ExperimentSuggestion, NodeStatus } from '../types/research';
import { mockExperiments, mockRelationships } from '../services/mockData';

export function useExperiments() {
  const [experiments, setExperiments] = useState<Experiment[]>(mockExperiments);
  const [relationships] = useState(mockRelationships);

  const addExperiment = useCallback((suggestion: ExperimentSuggestion, status: NodeStatus) => {
    const newExperiment: Experiment = {
      id: Date.now().toString(),
      title: suggestion.title,
      description: suggestion.description,
      type: suggestion.type,
      status: status,
      level: experiments.length > 0 ? Math.max(...experiments.map(e => e.level)) + 1 : 0,
      motivation: suggestion.motivation,
      expectations: suggestion.expectations,
      reasoning: suggestion.reasoning,
      keywords: suggestion.keywords,
      createdAt: new Date().toISOString(),
      aiGenerated: true,
    };

    setExperiments((prev) => [...prev, newExperiment]);
    return newExperiment;
  }, [experiments]);

  const updateExperiment = useCallback((id: string, updates: Partial<Experiment>) => {
    setExperiments((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
    );
  }, []);

  const deleteExperiment = useCallback((id: string) => {
    setExperiments((prev) => prev.filter((exp) => exp.id !== id));
  }, []);

  const getExperimentsByStatus = useCallback((status: NodeStatus) => {
    return experiments.filter((exp) => exp.status === status);
  }, [experiments]);

  return {
    experiments,
    relationships,
    addExperiment,
    updateExperiment,
    deleteExperiment,
    getExperimentsByStatus,
  };
}

export default useExperiments;