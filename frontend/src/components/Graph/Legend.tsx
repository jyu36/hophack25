import React from 'react';
import { Circle, ArrowRight, ChevronLeft } from 'lucide-react';

interface LegendProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Legend: React.FC<LegendProps> = ({ isCollapsed, onToggle }) => {
  const nodeStatuses = [
    { label: 'Accepted Experiments', color: 'bg-green-500', description: 'Successfully validated experiments' },
    { label: 'For Later', color: 'bg-yellow-500', description: 'Ideas to revisit later' },
  ];

  const nodeTypes = [
    { label: 'Hypothesis', icon: '🤔', description: 'Research questions to investigate' },
    { label: 'Experiment', icon: '🧪', description: 'Planned or ongoing experiments' },
    { label: 'Result', icon: '📊', description: 'Experimental outcomes' },
    { label: 'Analysis', icon: '📝', description: 'Data analysis and insights' },
  ];

  const connectionTypes = [
    { label: 'Leads To', icon: <ArrowRight className="text-gray-600" size={16} />, description: 'Sequential relationship' },
    { label: 'Supports', color: 'bg-green-500', description: 'Positive correlation' },
    { label: 'Refutes', color: 'bg-red-500', description: 'Negative correlation' },
  ];

  return (
    <div
      className={`absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200/50">
        <div className="flex items-center">
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100/50 rounded-full transition-colors"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-300 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
          {!isCollapsed && (
            <h4 className="text-sm font-medium text-gray-900 ml-2">
              Graph Legend
            </h4>
          )}
        </div>
      </div>

      {/* Legend Content */}
      {!isCollapsed && (
        <div className="p-4">
          {/* Node Status */}
          <div className="mb-4">
            <p className="text-xs text-gray-600 font-medium mb-2">Node Status</p>
            <div className="space-y-2">
              {nodeStatuses.map((status) => (
                <div key={status.label} className="flex items-center gap-2">
                  <Circle className={`h-3 w-3 ${status.color}`} />
                  <div>
                    <span className="text-xs text-gray-900">{status.label}</span>
                    <p className="text-xs text-gray-500">{status.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Node Types */}
          <div className="mb-4">
            <p className="text-xs text-gray-600 font-medium mb-2">Node Types</p>
            <div className="space-y-2">
              {nodeTypes.map((type) => (
                <div key={type.label} className="flex items-center gap-2">
                  <span className="text-sm w-4">{type.icon}</span>
                  <div>
                    <span className="text-xs text-gray-900">{type.label}</span>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connection Types */}
          <div>
            <p className="text-xs text-gray-600 font-medium mb-2">Connection Types</p>
            <div className="space-y-2">
              {connectionTypes.map((type) => (
                <div key={type.label} className="flex items-center gap-2">
                  {type.icon ? (
                    type.icon
                  ) : (
                    <div className={`h-0.5 w-4 ${type.color}`} />
                  )}
                  <div>
                    <span className="text-xs text-gray-900">{type.label}</span>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Legend;