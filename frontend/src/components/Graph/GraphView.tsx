import React, { useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  NodeTypes,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  MarkerType,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

import CustomNode from "./Node";
import NodeDetailsModal from "./NodeDetailsModal";
import { ResearchNode, NodeDetails } from "../../types/research";

interface GraphViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  onNodeStatusChange: (
    nodeId: string,
    status: "accepted" | "pending" | "rejected"
  ) => void;
  onCreateBranch: (nodeId: string) => void;
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
  dagreGraph.setGraph({ rankdir: direction });

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

  // Apply layout
  const { nodes, edges } = getLayoutedElements(initialNodes, initialEdges);

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
      const details = await fetchNodeDetails(node.id);
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
    <div className="h-full w-full bg-gray-50">
      <ReactFlow
        nodes={nodesWithCallback}
        edges={edgesWithStyle}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
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
