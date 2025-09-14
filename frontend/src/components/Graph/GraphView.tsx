import React, { useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Edge,
  Node,
  NodeTypes,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  MarkerType,
  ReactFlowInstance,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

import CustomNode from "./Node";
import NodeDetailsModal from "./NodeDetailsModal";
import { ResearchNode, NodeDetails, NodeStatus } from "../../types/research";

interface GraphViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  onNodeStatusChange: (nodeId: string, status: NodeStatus) => void;
  onCreateBranch: (nodeId: string) => void;
  onCreateEdge: (
    fromId: string,
    toId: string,
    type: string,
    label?: string
  ) => void;
  onDeleteEdge: (edgeId: string) => void;
  fetchNodeDetails: (nodeId: string) => Promise<NodeDetails>;
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

// Use dagre layout algorithm
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 150, // Increase vertical spacing between nodes
    nodesep: 100, // Increase horizontal spacing between nodes
    marginx: 50, // Add margin on the sides
    marginy: 50, // Add margin on top/bottom
  });

  // Set node sizes
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 100 });
  });

  // Add edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Get new node positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 125,
        y: nodeWithPosition.y - 50,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const GraphView: React.FC<GraphViewProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeStatusChange,
  onCreateBranch,
  fetchNodeDetails,
}) => {
  const [selectedNode, setSelectedNode] = useState<ResearchNode | null>(null);
  const [nodeDetails, setNodeDetails] = useState<NodeDetails>({
    papers: [],
    solutions: [],
    isLoading: false,
  });
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  // Apply layout
  const { nodes, edges } = getLayoutedElements(initialNodes, initialEdges);

  // Debug log to verify data
  console.log(
    "GraphView rendering with nodes:",
    nodes.length,
    "edges:",
    edges.length
  );

  // Custom edge styles
  const edgesWithStyle = edges.map((edge) => ({
    ...edge,
    type: "smoothstep",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
    },
    style: {
      stroke: "#94a3b8",
      strokeWidth: 2,
    },
  }));

  const handleNodeDoubleClick = async (node: ResearchNode) => {
    setSelectedNode(node);
    setNodeDetails({ papers: [], solutions: [], isLoading: true });

    try {
      const details = await fetchNodeDetails(node.id.toString());
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

  // Add onNodeDoubleClick to node data
  const nodesWithCallback = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onNodeDoubleClick: handleNodeDoubleClick,
    },
  }));

  return (
    <div className="relative w-full h-full bg-gray-50">
      <ReactFlow
        nodes={nodesWithCallback}
        edges={edgesWithStyle}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        preventScrolling={false}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
      >
        <Background />
      </ReactFlow>

      {selectedNode && (
        <NodeDetailsModal
          node={selectedNode}
          isOpen={true}
          onClose={() => setSelectedNode(null)}
          onStatusChange={onNodeStatusChange}
          onCreateBranch={onCreateBranch}
          nodeDetails={nodeDetails}
        />
      )}
    </div>
  );
};

export default GraphView;