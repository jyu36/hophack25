import React from 'react';
import { LayoutGrid, Lightbulb, Network, Clock } from 'lucide-react';
import StatsCard from './StatsCard';

interface StatsGroupProps {
  totalCount: number;
  acceptedCount: number;
  pendingCount: number;
  connectedCount: number;
  onViewGraph: () => void;
}

const StatsGroup: React.FC<StatsGroupProps> = ({
  totalCount,
  acceptedCount,
  pendingCount,
  connectedCount,
  onViewGraph,
}) => {
  return (
    <div className="mb-8 rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Research Statistics</h2>
        <button
          onClick={onViewGraph}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          View Graphs
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          value={connectedCount}
          icon={Network}
          description="Relationships between experiments"
          trend={{ value: connectedCount, label: 'connections' }}
        />
      </div>
    </div>
  );
};

export default StatsGroup;
