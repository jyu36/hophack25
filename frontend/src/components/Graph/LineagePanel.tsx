import React, { useState, useCallback } from "react";
import { GitBranch, ArrowLeft, RefreshCw, Settings, Info } from "lucide-react";
import LineageView from "./LineageView";
import { Experiment, NodeStatus } from "../../types/research";
import { useExperiments } from "../../hooks/useExperiments";

interface LineagePanelProps {
  selectedNodeId: number | null;
  onBackToGraph?: () => void;
  onNodeSelect?: (nodeId: number) => void;
  experiments: Experiment[];
}

const LineagePanel: React.FC<LineagePanelProps> = ({
  selectedNodeId,
  onBackToGraph,
  onNodeSelect,
  experiments
}) => {
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [maxDepth, setMaxDepth] = useState(5);
  const [refreshKey, setRefreshKey] = useState(0);

  const { updateExperimentStatus } = useExperiments();

  const selectedExperiment = experiments.find(exp => exp.id === selectedNodeId);

  const handleNodeStatusChange = useCallback(
    async (nodeId: number, status: NodeStatus) => {
      try {
        const success = await updateExperimentStatus(nodeId, status);
        if (!success) {
          console.error("Failed to update experiment status");
        }
      } catch (error) {
        console.error("Error updating experiment status:", error);
      }
    },
    [updateExperimentStatus]
  );

  const handleCreateBranch = useCallback(async (nodeId: number) => {
    try {
      // This would typically create a new experiment branched from the selected one
      console.log("Creating branch from node:", nodeId);
      // The actual implementation would be handled by the experiment service
    } catch (error) {
      console.error("Error creating branch:", error);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleNodeSelect = useCallback((nodeId: number) => {
    if (onNodeSelect) {
      onNodeSelect(nodeId);
    }
  }, [onNodeSelect]);

  if (!selectedNodeId) {
    return (
      <div className="flex flex-col flex-1">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GitBranch size={20} className="text-purple-600" />
              <h2 className="font-semibold">Experiment Lineage</h2>
            </div>
            {onBackToGraph && (
              <button
                onClick={onBackToGraph}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Back to Graph</span>
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Select an experiment to view its lineage tree
          </p>
        </div>

        <div className="flex items-center justify-center flex-1 text-gray-500">
          <div className="text-center">
            <GitBranch size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium">No Experiment Selected</h3>
            <p className="text-sm max-w-md">
              Choose an experiment from the graph to explore its ancestry and descendants.
              The lineage view will show how experiments are connected through their relationships.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch size={20} className="text-purple-600" />
            <div>
              <h2 className="font-semibold">Experiment Lineage</h2>
              {selectedExperiment && (
                <p className="text-sm text-gray-600 truncate max-w-md">
                  {selectedExperiment.title}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title="Refresh lineage data"
            >
              <RefreshCw size={16} />
            </button>

            {/* Advanced Controls Toggle */}
            <button
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
              className={`p-2 rounded transition-colors ${
                showAdvancedControls
                  ? 'text-purple-600 bg-purple-100'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              }`}
              title="Advanced controls"
            >
              <Settings size={16} />
            </button>

            {/* Back to Graph Button */}
            {onBackToGraph && (
              <button
                onClick={onBackToGraph}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors px-2 py-1 rounded hover:bg-gray-200"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            )}
          </div>
        </div>

        {/* Advanced Controls */}
        {showAdvancedControls && (
          <div className="mt-4 p-3 bg-white rounded border space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center space-x-1">
              <Settings size={16} />
              <span>Lineage Controls</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Depth Control */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Maximum Depth
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 min-w-[3ch]">{maxDepth}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Limit how many generations to display
                </p>
              </div>

              {/* Info Panel */}
              <div className="flex items-start space-x-2 p-2 bg-blue-50 rounded">
                <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium">Lineage View Tips:</p>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    <li>Double-click nodes for details</li>
                    <li>Use controls to adjust layout</li>
                    <li>Scroll to zoom, drag to pan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lineage View */}
      <div className="flex-1 relative">
        <LineageView
          key={`lineage-${selectedNodeId}-${refreshKey}`}
          selectedNodeId={selectedNodeId}
          onNodeSelect={handleNodeSelect}
          onNodeStatusChange={handleNodeStatusChange}
          onCreateBranch={handleCreateBranch}
          showControls={!showAdvancedControls} // Hide built-in controls if advanced panel is open
          maxDepth={maxDepth}
        />
      </div>
    </div>
  );
};

export default LineagePanel;

