import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: React.ReactNode;
  value: number;
  icon: LucideIcon;
  description: string;
  trend: {
    value: number;
    label: string;
    positive?: boolean;
  };
  titleClassName?: string; // Add this line
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  titleClassName,
}) => {
  return (
    <div className="rounded-lg bg-gray-50 p-4 shadow">
      <div className="flex items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div className="ml-3">
          <h3 className={`text-xs font-medium text-gray-900 mb-1 ${titleClassName}`}>{title}</h3>
          <p className="text-xl font-semibold text-gray-900 mb-0 leading-none">{value}</p>
          <span
            className={`text-xs ${
              trend.label === "planned"
                ? "text-yellow-600"
                : trend.positive
                ? "text-green-600"
                : "text-gray-500"
            }`}
          >
            {trend.value} {trend.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
