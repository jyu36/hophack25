import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Edge,
  Node,
  NodeTypes,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  ReactFlowInstance,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import CustomNode from "./Node";
import NodeDetailsModal from "./NodeDetailsModal";
import {
  LineageData,
  LineageViewProps,
  LineageLayoutConfig,
  ResearchNode,
  NodeDetails,
  NodeStatus,
} from "../../types/research";
import { experimentService } from "../../services/experimentService";
import {
  processLineageData,
  calculateLineageLayout,
  DEFAULT_LINEAGE_CONFIG,
  createLineageNodeData,
} from "../../utils/lineageLayout";

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const LineageView: React.FC<LineageViewProps> = ({
  selectedNodeId,
  onNodeSelect,
  onNodeStatusChange,
  onCreateBranch,
  showControls = true,
  maxDepth = 5,
}) => {
  const [lineageData, setLineageData] = useState<LineageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ResearchNode | null>(null);
  const [nodeDetails, setNodeDetails] = useState<NodeDetails>({
    papers: [],
    solutions: [],
    isLoading: false,
  });
  const [layoutConfig, setLayoutConfig] = useState<LineageLayoutConfig>(
    DEFAULT_LINEAGE_CONFIG
  );
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  // Fetch lineage data
  const fetchLineageData = useCallback(async () => {
    if (!selectedNodeId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await experimentService.getNodeLineage(selectedNodeId);
      // Transform the data to match LineageData interface
      const transformedData: LineageData = {
        node: data.node,
        ancestors: data.ancestors,
        descendants: data.descendants,
        nodes: [], // Will be populated by processLineageData
        edges: data.lineageEdges.map(edge => ({
          id: edge.id?.toString() || `${edge.from_experiment_id}-${edge.to_experiment_id}`,
          source: edge.from_experiment_id,
          target: edge.to_experiment_id,
          type: edge.relationship_type
        })),
        lineageEdges: data.lineageEdges.map(edge => ({
          id: edge.id?.toString() || `${edge.from_experiment_id}-${edge.to_experiment_id}`,
          source: edge.from_experiment_id,
          target: edge.to_experiment_id,
          type: edge.relationship_type
        }))
      };
      setLineageData(transformedData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load lineage data"
      );
      console.error("Error fetching lineage data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedNodeId]);

  useEffect(() => {
    fetchLineageData();
  }, [fetchLineageData]);

  // Calculate layout
  const { nodes, edges, bounds } = useMemo(() => {
    if (!lineageData) {
      return {
        nodes: [],
        edges: [],
        bounds: { width: 0, height: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 },
      };
    }

    const lineageNodes = processLineageData(lineageData);

    // Filter nodes by maxDepth if specified
    const filteredNodes = maxDepth
      ? lineageNodes.filter(node => node.depth !== undefined && node.depth <= maxDepth)
      : lineageNodes;

    return calculateLineageLayout(
      filteredNodes,
      lineageData.lineageEdges,
      layoutConfig
    );
  }, [lineageData, layoutConfig, maxDepth]);

  // Enhanced nodes with lineage-specific styling
  const enhancedNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        ...createLineageNodeData(node.data),
        onNodeDoubleClick: handleNodeDoubleClick,
      },
    }));
  }, [nodes]);

  // Enhanced edges with lineage-specific styling
  const enhancedEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        strokeWidth: 3,
        stroke: "#4f46e5",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#4f46e5",
      },
      labelBgStyle: {
        fill: "#f3f4f6",
        fillOpacity: 0.9,
      },
      labelStyle: {
        fontSize: 12,
        fontWeight: 500,
        fill: "#374151",
      },
    }));
  }, [edges]);

  const handleNodeDoubleClick = async (node: ResearchNode) => {
    setSelectedNode(node);
    setNodeDetails({ papers: [], solutions: [], isLoading: true });

    try {
      const details = await experimentService.getNodeDetails(node.id);
      setNodeDetails(details);
    } catch (error) {
      setNodeDetails({
        papers: [],
        solutions: [],
        isLoading: false,
        error: "Failed to load node details",
      });
    }
  };

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      const numericId = parseInt(nodeId);
      if (onNodeSelect) {
        onNodeSelect(numericId);
      }
    },
    [onNodeSelect]
  );

  const handleNodeStatusChange = useCallback(
    async (nodeId: string, status: NodeStatus) => {
      const numericId = parseInt(nodeId);
      if (onNodeStatusChange) {
        await onNodeStatusChange(numericId, status);
        // Refresh lineage data to show updated status
        await fetchLineageData();
      }
    },
    [onNodeStatusChange, fetchLineageData]
  );

  const handleCreateBranch = useCallback(
    async (nodeId: string) => {
      const numericId = parseInt(nodeId);
      if (onCreateBranch) {
        await onCreateBranch(numericId);
        // Refresh lineage data to show new branch
        await fetchLineageData();
      }
    },
    [onCreateBranch, fetchLineageData]
  );

  const handleLayoutChange = useCallback((newConfig: Partial<LineageLayoutConfig>) => {
    setLayoutConfig((prev: LineageLayoutConfig) => ({ ...prev, ...newConfig }));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading experiment lineage...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchLineageData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!lineageData || enhancedNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🌳</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No lineage found
          </h3>
          <p className="text-gray-500">
            This experiment has no connected ancestors or descendants.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-50">
      {/* Lineage Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md p-4 space-y-2">
          <h4 className="font-medium text-gray-700">Layout Options</h4>

          {/* Direction Control */}
          <div>
            <label className="text-sm text-gray-600">Direction:</label>
            <select
              value={layoutConfig.direction}
              onChange={(e) =>
                handleLayoutChange({ direction: e.target.value as any })
              }
              className="ml-2 text-sm border rounded px-2 py-1"
            >
              <option value="TB">Top to Bottom</option>
              <option value="BT">Bottom to Top</option>
              <option value="LR">Left to Right</option>
              <option value="RL">Right to Left</option>
            </select>
          </div>

          {/* Spacing Controls */}
          <div>
            <label className="text-sm text-gray-600">H-Spacing:</label>
            <input
              type="range"
              min="50"
              max="300"
              value={layoutConfig.horizontalSpacing}
              onChange={(e) =>
                handleLayoutChange({
                  horizontalSpacing: parseInt(e.target.value),
                })
              }
              className="ml-2"
            />
            <span className="text-xs text-gray-500 ml-1">
              {layoutConfig.horizontalSpacing}px
            </span>
          </div>

          <div>
            <label className="text-sm text-gray-600">V-Spacing:</label>
            <input
              type="range"
              min="50"
              max="200"
              value={layoutConfig.verticalSpacing}
              onChange={(e) =>
                handleLayoutChange({
                  verticalSpacing: parseInt(e.target.value),
                })
              }
              className="ml-2"
            />
            <span className="text-xs text-gray-500 ml-1">
              {layoutConfig.verticalSpacing}px
            </span>
          </div>
        </div>
      )}

      {/* Lineage Stats */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md p-4">
        <h4 className="font-medium text-gray-700 mb-2">Lineage Overview</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Root:</span>
            <span className="font-medium text-blue-600">
              {lineageData.node.title}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ancestors:</span>
            <span className="font-medium">{lineageData.ancestors.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Descendants:</span>
            <span className="font-medium">
              {lineageData.descendants.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Nodes:</span>
            <span className="font-medium">{enhancedNodes.length}</span>
          </div>
        </div>
      </div>

      {/* ReactFlow Component */}
      <ReactFlow
        nodes={enhancedNodes}
        edges={enhancedEdges}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        onNodeClick={(_, node) => handleNodeClick(node.id)}
      >
        <Background />
      </ReactFlow>

      {/* Node Details Modal */}
      {selectedNode && (
        <NodeDetailsModal
          node={selectedNode}
          isOpen={true}
          onClose={() => setSelectedNode(null)}
          onStatusChange={handleNodeStatusChange}
          onCreateBranch={handleCreateBranch}
          nodeDetails={nodeDetails}
        />
      )}
    </div>
  );
};

export default LineageView;
