import React, { useState, useCallback, useMemo } from "react";
import { Spin, Alert } from "antd";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  MiniMap,
  Panel,
  NodeTypes,
  MarkerType,
  Position,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

import ExperimentNode from "./ExperimentNode";
import { ResearchNode } from "../../types/research";
import { Edge as APIEdge } from "../../types/api";

interface GraphPanelProps {
  experiments: ResearchNode[];
  relationships: APIEdge[];
  extractedKeywords?: string[];
  onKeywordSelect?: (keyword: string) => void;
  onNodeClick?: (node: ResearchNode) => void;
  onNodeStatusChange?: (nodeId: number, status: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

// Custom node types
const nodeTypes: NodeTypes = {
  experiment: ExperimentNode,
};

// Dagre layout configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 280;
const nodeHeight = 80;

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
) => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 120, // Increased vertical spacing for better top-to-bottom flow
    nodesep: 60, // Increased horizontal spacing between nodes
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // Set connection points for top-to-bottom flow
    node.targetPosition = Position.Top; // Connections come from top
    node.sourcePosition = Position.Bottom; // Connections go to bottom

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

const GraphPanel: React.FC<GraphPanelProps> = ({
  experiments,
  relationships,
  extractedKeywords = [],
  onKeywordSelect,
  onNodeClick,
  onNodeStatusChange,
  onRefresh,
  isLoading = false,
  error = null,
}) => {
  const [showMiniMap, setShowMiniMap] = useState(true);

  // Convert experiments to ReactFlow nodes (without positioning - Dagre will handle that)
  const initialNodes: Node[] = useMemo(() => {
    if (!experiments || !Array.isArray(experiments)) {
      return [];
    }

    return experiments.map((experiment, index) => ({
      id: experiment.id ? experiment.id.toString() : `experiment-${index}`,
      type: "experiment",
      position: { x: 0, y: 0 }, // Initial position, will be overridden by Dagre
      data: {
        experiment,
        onNodeClick,
        onNodeStatusChange,
      },
      sourcePosition: Position.Bottom, // Connections go out from bottom
      targetPosition: Position.Top, // Connections come in from top
    }));
  }, [experiments, onNodeClick, onNodeStatusChange]);

  // Convert relationships to ReactFlow edges
  const initialEdges: Edge[] = useMemo(() => {
    if (!relationships || !Array.isArray(relationships)) {
      return [];
    }

    return relationships
      .filter((rel) => {
        // Check if relationship has valid IDs
        if (!rel.from_experiment_id || !rel.to_experiment_id) {
          return false;
        }

        // Only include edges where both nodes are visible
        const fromNodeExists = initialNodes.some(
          (node) => node.id === rel.from_experiment_id.toString()
        );
        const toNodeExists = initialNodes.some(
          (node) => node.id === rel.to_experiment_id.toString()
        );
        return fromNodeExists && toNodeExists;
      })
      .map((relationship) => {
        // Get styling based on relationship type
        const getEdgeStyle = (type: string) => {
          switch (type) {
            case "leads_to":
              return { stroke: "#52c41a", strokeWidth: 3 };
            case "supports":
              return { stroke: "#1890ff", strokeWidth: 2 };
            case "refutes":
              return { stroke: "#ff4d4f", strokeWidth: 2 };
            case "requires":
              return {
                stroke: "#fa8c16",
                strokeWidth: 2,
                strokeDasharray: "5,5",
              };
            case "related":
              return { stroke: "#722ed1", strokeWidth: 2 };
            default:
              return { stroke: "#1890ff", strokeWidth: 2 };
          }
        };

        return {
          id: relationship.id
            ? relationship.id.toString()
            : `edge-${Math.random()}`,
          source: relationship.from_experiment_id.toString(),
          target: relationship.to_experiment_id.toString(),
          sourceHandle: "bottom", // Explicitly connect from bottom of source node
          targetHandle: "top", // Explicitly connect to top of target node
          label: relationship.label,
          style: getEdgeStyle(relationship.relationship_type || "default"),
          labelStyle: {
            fontSize: 12,
            fontWeight: 500,
          },
          labelBgStyle: {
            fill: "rgba(255, 255, 255, 0.8)",
            fillOpacity: 0.8,
          },
          animated: relationship.relationship_type === "leads_to",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: getEdgeStyle(relationship.relationship_type || "default")
              .stroke,
          },
        };
      });
  }, [relationships, initialNodes]);

  // Apply Dagre layout to nodes and edges
  const { nodes, edges } = useMemo(() => {
    if (initialNodes.length === 0) {
      return { nodes: [], edges: [] };
    }
    return getLayoutedElements(initialNodes, initialEdges, "TB");
  }, [initialNodes, initialEdges]);

  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes and edges when props change
  React.useEffect(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);

  React.useEffect(() => {
    setEdges(edges);
  }, [edges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <Alert
          message="Error Loading Graph"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            style: { strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          }}
        >
          <Background color="#f0f0f0" gap={20} />

          <Controls />

          {showMiniMap && <MiniMap />}
        </ReactFlow>

        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <Spin size="large" tip="Loading experiments..." />
          </div>
        )}
      </ReactFlowProvider>
    </div>
  );
};

export default GraphPanel;
