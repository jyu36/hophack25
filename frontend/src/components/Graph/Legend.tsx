import React from "react";
import { Circle, ArrowRight, ChevronLeft } from "lucide-react";

interface LegendProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Legend: React.FC<LegendProps> = ({ isCollapsed, onToggle }) => {
  const nodeStatuses = [
    {
      label: "Accepted Experiments",
      color: "bg-green-500",
      description: "Successfully validated experiments",
    },
    {
      label: "For Later",
      color: "bg-yellow-500",
      description: "Ideas to revisit later",
    },
  ];

  const nodeTypes = [
    {
      label: "Hypothesis",
      icon: "🤔",
      description: "Research questions to investigate",
    },
    {
      label: "Experiment",
      icon: "🧪",
      description: "Planned or ongoing experiments",
    },
    { label: "Result", icon: "📊", description: "Experimental outcomes" },
    {
      label: "Analysis",
      icon: "📝",
      description: "Data analysis and insights",
    },
  ];

  const connectionTypes = [
    {
      label: "Leads To",
      icon: <ArrowRight className="text-gray-600" size={16} />,
      description: "Sequential relationship",
    },
    {
      label: "Supports",
      color: "bg-green-500",
      description: "Positive correlation",
    },
    {
      label: "Refutes",
      color: "bg-red-500",
      description: "Negative correlation",
    },
  ];

  return (
    <div
      className={`bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-300 overflow-hidden ${
        isCollapsed ? "w-12" : "w-80"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-300 ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
          {!isCollapsed && (
            <h4 className="text-sm font-medium text-gray-900">Graph Legend</h4>
          )}
        </div>
      </div>

      {/* Legend Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-6">
          {/* Node Status */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-3">
              Node Status
            </p>
            <div className="space-y-3">
              {nodeStatuses.map((status) => (
                <div key={status.label} className="flex items-start gap-3">
                  <Circle className={`h-4 w-4 mt-0.5 ${status.color}`} />
                  <div>
                    <span className="text-sm font-medium text-gray-900 block mb-0.5">
                      {status.label}
                    </span>
                    <p className="text-xs text-gray-600 leading-snug">
                      {status.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connection Types */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-3">
              Connection Types
            </p>
            <div className="space-y-3">
              {connectionTypes.map((type) => (
                <div key={type.label} className="flex items-start gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {type.icon ? (
                      type.icon
                    ) : (
                      <div className={`h-0.5 w-4 ${type.color}`} />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 block mb-0.5">
                      {type.label}
                    </span>
                    <p className="text-xs text-gray-600 leading-snug">
                      {type.description}
                    </p>
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
