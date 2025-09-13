import React from 'react';
import { LayoutGrid, Lightbulb, Network, Clock } from 'lucide-react';
import StatsCard from './StatsCard';

interface StatsOverviewProps {
  totalCount: number;
  acceptedCount: number;
  pendingCount: number;
  connectedCount: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalCount,
  acceptedCount,
  pendingCount,
  connectedCount,
}) => {
  return (
    <div className="rounded-lg bg-gray-50 p-6 shadow-xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

export default StatsOverview;
