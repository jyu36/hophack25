import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Experiment } from '../../types/research';
import FutureExperimentCard from './FutureExperimentCard';

interface AllFutureExperimentsProps {
  experiments: Experiment[];
  onBack: () => void;
  onNewExperiment: () => void;
}

const AllFutureExperiments: React.FC<AllFutureExperimentsProps> = ({
  experiments,
  onBack,
  onNewExperiment
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

  const sortedExperiments = [...experiments].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.plannedDate || b.createdAt).getTime() - new Date(a.plannedDate || a.createdAt).getTime();
    } else {
      // Sort by priority (if implemented)
      return (b.priority || 0) - (a.priority || 0);
    }
  });

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Future Experiments</h1>
            </div>
            <button
              onClick={onNewExperiment}
              className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Experiment
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Plan and manage your upcoming experiments
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">Sort by:</span>
            <div className="flex rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => setSortBy('date')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === 'date'
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Planned Date
              </button>
              <button
                onClick={() => setSortBy('priority')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === 'priority'
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Priority
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {experiments.length} planned experiments
          </div>
        </div>

        {/* Experiments List */}
        <div className="space-y-4">
          {sortedExperiments.map((experiment) => (
            <FutureExperimentCard key={experiment.id} experiment={experiment} />
          ))}
        </div>

        {experiments.length === 0 && (
          <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No future experiments planned</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating your first future experiment
            </p>
            <button
              onClick={onNewExperiment}
              className="mt-4 inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Experiment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllFutureExperiments;
