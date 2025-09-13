import React, { useState } from 'react';
import { LayoutGrid, Lightbulb, Network, Clock } from 'lucide-react';
import StatsCard from './StatsCard';
import RecentExperiments from './RecentExperiments';
import QuickActions from './QuickActions';
import TopicExtractor from '../TopicExtractor/TopicExtractor';
import { Experiment, ExperimentSuggestion } from '../../types/research';

interface DashboardProps {
  experiments: Experiment[];
  onNewExperiment: () => void;
  onViewGraph: () => void;
  onSuggestionsGenerated: (suggestions: ExperimentSuggestion[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  experiments,
  onNewExperiment,
  onViewGraph,
  onSuggestionsGenerated,
}) => {
  const [showTopicExtractor, setShowTopicExtractor] = useState(false);

  const acceptedCount = experiments.filter(e => e.status === 'accepted').length;
  const pendingCount = experiments.filter(e => e.status === 'pending').length;
  const totalCount = experiments.length;

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Research Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your research experiments and progress
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Experiments"
            value={totalCount}
            icon={LayoutGrid}
            description="All research experiments"
            trend={{ value: totalCount, label: 'total' }}
          />
          <StatsCard
            title="Accepted Experiments"
            value={acceptedCount}
            icon={Lightbulb}
            description="Successfully validated experiments"
            trend={{ value: acceptedCount, label: 'accepted', positive: true }}
          />
          <StatsCard
            title="Pending Review"
            value={pendingCount}
            icon={Clock}
            description="Experiments for later consideration"
            trend={{ value: pendingCount, label: 'pending' }}
          />
          <StatsCard
            title="Connected Ideas"
            value={experiments.length > 1 ? experiments.length - 1 : 0}
            icon={Network}
            description="Relationships between experiments"
            trend={{ value: experiments.length - 1, label: 'connections' }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Experiments */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Experiments</h2>
              <button
                onClick={onViewGraph}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>
            <RecentExperiments experiments={experiments.slice(0, 5)} />
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Quick Actions</h2>
            <QuickActions
              onNewExperiment={onNewExperiment}
              onViewGraph={onViewGraph}
              onUploadFile={() => setShowTopicExtractor(true)}
            />
          </div>
        </div>
      </div>

      {/* Topic Extractor Modal */}
      {showTopicExtractor && (
        <TopicExtractor
          onTopicsGenerated={(suggestions) => {
            onSuggestionsGenerated(suggestions);
            setShowTopicExtractor(false);
          }}
          onClose={() => setShowTopicExtractor(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;