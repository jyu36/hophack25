import React, { useState, useCallback } from "react";
import { Network, GitBranch } from "lucide-react";
import GraphView from "./GraphView";
import LineagePanel from "./LineagePanel";
import Legend from "./Legend";
import KeywordList from "./KeywordList";
import { Experiment, NodeDetails, NodeStatus } from "../../types/research";
import { useExperiments } from "../../hooks/useExperiments";
import { experimentService } from "../../services/experimentService";
import { experimentsToNodes } from "../../utils/helpers";

interface GraphPanelProps {
  experiments: Experiment[];
  relationships?: Array<{
    id: number;
    from: number;
    to: number;
    type: string;
    label?: string;
  }>;
  extractedKeywords?: Array<{
    text: string;
    isUsed: boolean;
    timestamp: Date;
  }>;
  onKeywordSelect?: (keyword: string) => void;
}

const GraphPanel: React.FC<GraphPanelProps> = ({
  experiments,
  relationships = [],
  extractedKeywords = [],
  onKeywordSelect = () => {},
}) => {
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  const [isKeywordListCollapsed, setIsKeywordListCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'lineage'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

  console.log("GraphPanel received experiments:", experiments);
  console.log("GraphPanel received relationships:", relationships);

  const nodes = experimentsToNodes(experiments);
  console.log("Converted nodes:", nodes);

  // Create edges from valid relationships
  const edges = relationships
    .filter((rel) => rel && rel.from && rel.to) // Filter out invalid relationships
    .map((rel) => ({
      id: String(rel.id || ""),
      source: String(rel.from),
      target: String(rel.to),
      label: rel.type || "",
      data: { label: rel.label || "" },
    }));

  console.log("Created edges:", edges);

  const { updateExperimentStatus } = useExperiments();

  const handleNodeStatusChange = useCallback(
    async (nodeId: string, status: NodeStatus) => {
      try {
        const success = await updateExperimentStatus(Number(nodeId), status);
        if (!success) {
          console.error("Failed to update experiment status");
        }
      } catch (error) {
        console.error("Error updating experiment status:", error);
      }
    },
    [updateExperimentStatus]
  );

  const handleCreateEdge = useCallback(
    async (fromId: string, toId: string, type: string, label?: string) => {
      try {
        const edge = await experimentService.createEdge({
          from_experiment_id: parseInt(fromId),
          to_experiment_id: parseInt(toId),
          relationship_type: type,
          label
        });
        console.log("Created edge:", edge);
      } catch (error) {
        console.error("Error creating edge:", error);
      }
    },
    []
  );

  const handleDeleteEdge = useCallback(async (edgeId: string) => {
    try {
      const success = await experimentService.deleteEdge(parseInt(edgeId));
      if (success) {
        console.log("Edge deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting edge:", error);
    }
  }, []);

  const handleCreateBranch = useCallback(async (nodeId: string) => {
    try {
      const newExperiment = await experimentService.createBranch(Number(nodeId));
      console.log("Created branch experiment:", newExperiment);
    } catch (error) {
      console.error("Error creating branch:", error);
    }
  }, []);

  const fetchNodeDetails = useCallback(
    async (nodeId: string): Promise<NodeDetails> => {
      try {
        return await experimentService.getNodeDetails(Number(nodeId));
      } catch (error) {
        console.error("Error fetching node details:", error);
        return {
          papers: [],
          solutions: [],
          isLoading: false,
          error: "Failed to load node details",
        };
      }
    },
    []
  );

  const handleNodeSelect = useCallback((nodeId: number) => {
    setSelectedNodeId(nodeId);
    if (viewMode === 'graph') {
      setViewMode('lineage');
    }
  }, [viewMode]);

  const handleBackToGraph = useCallback(() => {
    setViewMode('graph');
    setSelectedNodeId(null);
  }, []);

  return (
    <div className="flex flex-col flex-1">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {viewMode === 'graph' ? (
              <>
                <Network size={20} className="text-green-600" />
                <h2 className="font-semibold">Research Graph</h2>
              </>
            ) : (
              <>
                <GitBranch size={20} className="text-purple-600" />
                <h2 className="font-semibold">Experiment Lineage</h2>
              </>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 space-x-1 bg-white border rounded-lg">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'graph'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Network size={16} className="inline mr-1" />
              Graph
            </button>
            <button
              onClick={() => setViewMode('lineage')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'lineage'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              disabled={!selectedNodeId}
            >
              <GitBranch size={16} className="inline mr-1" />
              Lineage
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {viewMode === 'graph'
            ? 'Visual representation of your research experiments'
            : 'Ancestry and descendant tree for selected experiment'
          }
        </p>
      </div>

      {experiments.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-gray-500">
          <div className="text-center">
            <Network size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium">No experiments yet</h3>
            <p className="text-sm">
              Start a conversation to get AI-suggested experiments!
            </p>
          </div>
        </div>
      ) : viewMode === 'lineage' ? (
        <LineagePanel
          selectedNodeId={selectedNodeId}
          onBackToGraph={handleBackToGraph}
          onNodeSelect={handleNodeSelect}
          experiments={experiments}
        />
      ) : (
        <div className="relative flex-1">
          <GraphView
            nodes={nodes}
            edges={edges}
            onNodeStatusChange={handleNodeStatusChange}
            onCreateBranch={handleCreateBranch}
            onCreateEdge={handleCreateEdge}
            onDeleteEdge={handleDeleteEdge}
            fetchNodeDetails={fetchNodeDetails}
            onNodeSelect={handleNodeSelect}
          />
          <div
            className="fixed flex flex-col right-4"
            style={{ top: "5rem", width: "240px" }}
          >
            <div className="mb-4">
              <Legend
                isCollapsed={isLegendCollapsed}
                onToggle={() => setIsLegendCollapsed(!isLegendCollapsed)}
              />
            </div>
            <div style={{ marginTop: "calc(100vh - 32rem)" }}>
              <KeywordList
                keywords={extractedKeywords}
                onKeywordClick={onKeywordSelect}
                isCollapsed={isKeywordListCollapsed}
                onToggle={() =>
                  setIsKeywordListCollapsed(!isKeywordListCollapsed)
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphPanel;
