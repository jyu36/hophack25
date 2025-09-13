import React from 'react';
import { Experiment } from '../../types/research';
import ExperimentCard from './ExperimentCard';

interface RecentExperimentsProps {
  experiments: Experiment[];
}

const RecentExperiments: React.FC<RecentExperimentsProps> = ({ experiments }) => {
  if (experiments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No experiments yet. Start by adding one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {experiments.map((experiment) => (
        <ExperimentCard key={experiment.id} experiment={experiment} />
      ))}
    </div>
  );
};

export default RecentExperiments;