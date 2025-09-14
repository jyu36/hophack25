import React, { useState, useCallback } from "react";
import { Network } from "lucide-react";
import GraphView from "./GraphView";
import Legend from "./Legend";
import KeywordList from "./KeywordList";
import { Experiment, NodeDetails, NodeStatus } from "../../types/research";
import { useExperiments } from "../../hooks/useExperiments";
import experimentService from "../../services/experimentService";
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

  const handleCreateEdge = useCallback(
    async (fromId: string, toId: string, type: string, label?: string) => {
      try {
        const edge = await experimentService.createEdge(
          parseInt(fromId),
          parseInt(toId),
          type,
          label
        );
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
      const newExperiment = await experimentService.createBranch(nodeId);
      console.log("Created branch experiment:", newExperiment);
    } catch (error) {
      console.error("Error creating branch:", error);
    }
  }, []);

  const fetchNodeDetails = useCallback(
    async (nodeId: string): Promise<NodeDetails> => {
      try {
        return await experimentService.getNodeDetails(nodeId);
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

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <Network size={20} className="text-green-600" />
          <h2 className="font-semibold">Research Graph</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Visual representation of your research experiments
        </p>
      </div>

      {experiments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Network size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No experiments yet</h3>
            <p className="text-sm">
              Start a conversation to get AI-suggested experiments!
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative">
          <GraphView
            nodes={nodes}
            edges={edges}
            onNodeStatusChange={handleNodeStatusChange}
            onCreateBranch={handleCreateBranch}
            onCreateEdge={handleCreateEdge}
            onDeleteEdge={handleDeleteEdge}
            fetchNodeDetails={fetchNodeDetails}
          />
          <div
            className="fixed right-4 flex flex-col"
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
