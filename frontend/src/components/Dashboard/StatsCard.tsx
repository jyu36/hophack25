import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description: string;
  trend: {
    value: number;
    label: string;
    positive?: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
}) => {
  return (
    <div className="rounded-lg bg-gray-50 p-4 shadow">
      <div className="flex items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div className="ml-3">
          <h3 className="text-xs font-medium text-gray-900">{title}</h3>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
          <span className={`text-xs ${trend.positive ? 'text-green-600' : 'text-gray-500'}`}>
            {trend.value} {trend.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
