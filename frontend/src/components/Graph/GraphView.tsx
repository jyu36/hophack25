import React, { useState, useCallback } from "react";
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
  ReactFlowInstance,
} from "reactflow";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Hand } from "lucide-react";
import dagre from "dagre";
import "reactflow/dist/style.css";

import CustomNode from './Node';
import NodeDetailsModal from './NodeDetailsModal';
import { ResearchNode, NodeDetails, NodeStatus } from '../../types/research';

interface GraphViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  onNodeStatusChange: (nodeId: string, status: NodeStatus) => void;
  onCreateBranch: (nodeId: string) => void;
  fetchNodeDetails: (nodeId: string) => Promise<NodeDetails>;
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

// Custom Zoom Controls Component
const CustomZoomControls: React.FC<{ 
  reactFlowInstance: ReactFlowInstance | null;
  isPanMode: boolean;
  onPanModeToggle: () => void;
}> = ({ reactFlowInstance, isPanMode, onPanModeToggle }) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  const updateZoomLevel = useCallback(() => {
    if (reactFlowInstance) {
      setZoomLevel(reactFlowInstance.getZoom());
    }
  }, [reactFlowInstance]);

  const handleZoomIn = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
      updateZoomLevel();
    }
  }, [reactFlowInstance, updateZoomLevel]);

  const handleZoomOut = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
      updateZoomLevel();
    }
  }, [reactFlowInstance, updateZoomLevel]);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.1 });
      updateZoomLevel();
    }
  }, [reactFlowInstance, updateZoomLevel]);

  const handleResetView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
      setZoomLevel(1);
    }
  }, [reactFlowInstance]);

  const handleZoomSlider = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (reactFlowInstance) {
      const newZoom = parseFloat(event.target.value);
      const viewport = reactFlowInstance.getViewport();
      reactFlowInstance.setViewport({ ...viewport, zoom: newZoom });
      setZoomLevel(newZoom);
    }
  }, [reactFlowInstance]);

  const handlePanModeToggle = useCallback(() => {
    onPanModeToggle();
  }, [onPanModeToggle]);

  // Update zoom level when ReactFlow instance changes
  React.useEffect(() => {
    if (reactFlowInstance) {
      updateZoomLevel();
    }
  }, [reactFlowInstance, updateZoomLevel]);

  // Debug log to verify component is rendering
  console.log('CustomZoomControls rendering, reactFlowInstance:', !!reactFlowInstance);

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 flex flex-col space-y-2 z-50">
      <div className="flex flex-col space-y-1">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom In (Ctrl + Plus)"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom Out (Ctrl + Minus)"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleFitView}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Fit View (Ctrl + 0)"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Reset View"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={handlePanModeToggle}
          className={`p-2 rounded transition-colors ${
            isPanMode ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
          }`}
          title="Toggle Pan Mode (Space)"
        >
          <Hand size={16} />
        </button>
      </div>

      <div className="border-t border-gray-200 pt-2">
        <div className="px-2 py-1 text-xs text-gray-600 text-center mb-2">
          {Math.round(zoomLevel * 100)}%
        </div>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={zoomLevel}
          onChange={handleZoomSlider}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          title="Zoom Level"
        />
      </div>
    </div>
  );
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
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isPanMode, setIsPanMode] = useState(false);

  // Apply layout
  const { nodes, edges } = getLayoutedElements(initialNodes, initialEdges);
  
  // Debug log to verify data
  console.log('GraphView rendering with nodes:', nodes.length, 'edges:', edges.length);

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

  // Keyboard shortcuts for zoom and pan
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!reactFlowInstance) return;

    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case '=':
        case '+':
          event.preventDefault();
          reactFlowInstance.zoomIn();
          break;
        case '-':
          event.preventDefault();
          reactFlowInstance.zoomOut();
          break;
        case '0':
          event.preventDefault();
          reactFlowInstance.fitView({ padding: 0.1 });
          break;
      }
    } else if (event.key === ' ') {
      event.preventDefault();
      setIsPanMode(!isPanMode);
    }
  }, [reactFlowInstance, isPanMode]);

  // Add keyboard event listeners
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Add onNodeDoubleClick to node data
  const nodesWithCallback = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onNodeDoubleClick: handleNodeDoubleClick,
    },
  }));

  return (
    <div className="h-full w-full bg-gray-50 relative">
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
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
        panOnDrag={!isPanMode}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        preventScrolling={false}
        nodesDraggable={!isPanMode}
        nodesConnectable={!isPanMode}
        elementsSelectable={!isPanMode}
      >
        <Background />
        <Controls />
      </ReactFlow>
      <CustomZoomControls 
        reactFlowInstance={reactFlowInstance} 
        isPanMode={isPanMode}
        onPanModeToggle={() => setIsPanMode(!isPanMode)}
      />

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