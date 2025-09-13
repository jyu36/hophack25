import React from 'react';
import { Plus, Network, MessageCircle, Search, Upload } from 'lucide-react';

interface QuickActionsProps {
  onNewExperiment: () => void;
  onViewGraph: () => void;
  onUploadFile: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onNewExperiment,
  onViewGraph,
  onUploadFile,
}) => {
  const actions = [
    {
      icon: Plus,
      label: 'New Experiment',
      description: 'Start a new research experiment',
      onClick: onNewExperiment,
      variant: 'primary' as const,
    },
    {
      icon: Upload,
      label: 'Upload Document',
      description: 'Extract topics from document',
      onClick: onUploadFile,
      variant: 'primary' as const,
    },
    {
      icon: Network,
      label: 'View Graph',
      description: 'Visualize experiment relationships',
      onClick: onViewGraph,
      variant: 'secondary' as const,
    },
    {
      icon: MessageCircle,
      label: 'AI Chat',
      description: 'Get suggestions from AI',
      onClick: onNewExperiment,
      variant: 'secondary' as const,
    },
    {
      icon: Search,
      label: 'Search Experiments',
      description: 'Find specific experiments',
      onClick: () => {},
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={`flex items-center space-x-3 rounded-lg border p-4 text-left transition-colors ${
            action.variant === 'primary'
              ? 'border-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className={`rounded-lg p-2 ${
            action.variant === 'primary' ? 'bg-blue-600' : 'bg-gray-100'
          }`}>
            <action.icon
              className={`h-5 w-5 ${
                action.variant === 'primary' ? 'text-white' : 'text-gray-600'
              }`}
            />
          </div>
          <div>
            <h3 className={`font-medium ${
              action.variant === 'primary' ? 'text-blue-900' : 'text-gray-900'
            }`}>
              {action.label}
            </h3>
            <p className={`text-sm ${
              action.variant === 'primary' ? 'text-blue-700' : 'text-gray-500'
            }`}>
              {action.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;