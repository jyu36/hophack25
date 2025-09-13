import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Experiment } from '../../types/research';
import ExperimentCard from '../Dashboard/ExperimentCard';

interface AllExperimentsProps {
  experiments: Experiment[];
  onBack: () => void;
}

const AllExperiments: React.FC<AllExperimentsProps> = ({ experiments, onBack }) => {
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');

  const sortedExperiments = [...experiments].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      // Sort by status: accepted first, then planned
      return a.status === b.status ? 0 : a.status === 'accepted' ? -1 : 1;
    }
  });

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">All Past Experiments</h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            View and manage all your past experiments
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
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setSortBy('status')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === 'status'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Status
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {experiments.length} experiments total
          </div>
        </div>

        {/* Experiments List */}
        <div className="space-y-4">
          {sortedExperiments.map((experiment) => (
            <ExperimentCard key={experiment.id} experiment={experiment} />
          ))}
        </div>

        {experiments.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-500">No experiments found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllExperiments;
