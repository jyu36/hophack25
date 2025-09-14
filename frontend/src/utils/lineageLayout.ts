import { Node, Edge } from "reactflow";
import { LineageData, LineageNode, LineageLayoutConfig, ResearchNode } from "../types/research";
import { getStatusColor } from "./helpers";

export const DEFAULT_LINEAGE_CONFIG: LineageLayoutConfig = {
  nodeWidth: 280,
  nodeHeight: 120,
  horizontalSpacing: 150,
  verticalSpacing: 100,
  direction: 'TB'
};

export interface LineageLayoutResult {
  nodes: Node[];
  edges: Edge[];
  bounds: {
    width: number;
    height: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

/**
 * Convert lineage data to LineageNode format with generation and depth information
 */
export function processLineageData(data: LineageData): LineageNode[] {
  const { node: rootNode, ancestors, descendants } = data;
  const lineageNodes: LineageNode[] = [];

  // Process root node
  const rootLineageNode: LineageNode = {
    ...rootNode,
    depth: 0,
    generation: 0,
    isRoot: true,
    pathFromRoot: [rootNode.id]
  };
  lineageNodes.push(rootLineageNode);

  // Process ancestors (negative generations)
  const processAncestors = (nodes: ResearchNode[], generation: number, pathFromRoot: number[]) => {
    nodes.forEach(ancestor => {
      const ancestorNode: LineageNode = {
        ...ancestor,
        depth: Math.abs(generation),
        generation,
        isRoot: false,
        pathFromRoot: [...pathFromRoot, ancestor.id]
      };
      lineageNodes.push(ancestorNode);
    });
  };

  // Process descendants (positive generations)
  const processDescendants = (nodes: ResearchNode[], generation: number, pathFromRoot: number[]) => {
    nodes.forEach(descendant => {
      const descendantNode: LineageNode = {
        ...descendant,
        depth: generation,
        generation,
        isRoot: false,
        pathFromRoot: [...pathFromRoot, descendant.id]
      };
      lineageNodes.push(descendantNode);
    });
  };

  // Group ancestors and descendants by generation
  const ancestorsByGeneration = groupNodesByGeneration(ancestors, data.lineageEdges, rootNode.id, 'ancestors');
  const descendantsByGeneration = groupNodesByGeneration(descendants, data.lineageEdges, rootNode.id, 'descendants');

  // Process each generation
  Object.entries(ancestorsByGeneration).forEach(([gen, nodes]) => {
    const generation = -parseInt(gen);
    processAncestors(nodes, generation, [rootNode.id]);
  });

  Object.entries(descendantsByGeneration).forEach(([gen, nodes]) => {
    const generation = parseInt(gen);
    processDescendants(nodes, generation, [rootNode.id]);
  });

  return lineageNodes;
}

/**
 * Group nodes by their generation level from the root node
 */
function groupNodesByGeneration(
  nodes: ResearchNode[],
  edges: any[],
  rootNodeId: number,
  direction: 'ancestors' | 'descendants'
): Record<string, ResearchNode[]> {
  const nodesByGeneration: Record<string, ResearchNode[]> = {};
  const visited = new Set<number>();

  const assignGeneration = (nodeId: number, generation: number) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const genKey = generation.toString();
    if (!nodesByGeneration[genKey]) {
      nodesByGeneration[genKey] = [];
    }
    nodesByGeneration[genKey].push(node);

    // Find connected nodes for next generation
    if (direction === 'ancestors') {
      const parentEdges = edges.filter(e => e.to_experiment_id === nodeId);
      parentEdges.forEach(edge => {
        assignGeneration(edge.from_experiment_id, generation + 1);
      });
    } else {
      const childEdges = edges.filter(e => e.from_experiment_id === nodeId);
      childEdges.forEach(edge => {
        assignGeneration(edge.to_experiment_id, generation + 1);
      });
    }
  };

  // Start from nodes directly connected to root
  if (direction === 'ancestors') {
    const directParents = edges.filter(e => e.to_experiment_id === rootNodeId);
    directParents.forEach(edge => assignGeneration(edge.from_experiment_id, 1));
  } else {
    const directChildren = edges.filter(e => e.from_experiment_id === rootNodeId);
    directChildren.forEach(edge => assignGeneration(edge.to_experiment_id, 1));
  }

  return nodesByGeneration;
}

/**
 * Calculate positions for lineage nodes using a tree-based layout
 */
export function calculateLineageLayout(
  lineageNodes: LineageNode[],
  lineageEdges: any[],
  config: LineageLayoutConfig = DEFAULT_LINEAGE_CONFIG
): LineageLayoutResult {
  const { nodeWidth, nodeHeight, horizontalSpacing, verticalSpacing, direction } = config;

  // Group nodes by generation
  const nodesByGeneration: Record<number, LineageNode[]> = {};
  lineageNodes.forEach(node => {
    if (!nodesByGeneration[node.generation]) {
      nodesByGeneration[node.generation] = [];
    }
    nodesByGeneration[node.generation].push(node);
  });

  // Sort generations
  const generations = Object.keys(nodesByGeneration).map(Number).sort((a, b) => a - b);

  const reactFlowNodes: Node[] = [];
  const positions: Record<number, { x: number; y: number }> = {};

  // Calculate positions based on direction
  const isVertical = direction === 'TB' || direction === 'BT';
  const isReversed = direction === 'BT' || direction === 'RL';

  generations.forEach((generation, genIndex) => {
    const nodesInGeneration = nodesByGeneration[generation];
    const generationSize = nodesInGeneration.length;

    // Calculate generation position
    let generationPos: number;
    if (isVertical) {
      generationPos = isReversed
        ? (generations.length - genIndex - 1) * (nodeHeight + verticalSpacing)
        : genIndex * (nodeHeight + verticalSpacing);
    } else {
      generationPos = isReversed
        ? (generations.length - genIndex - 1) * (nodeWidth + horizontalSpacing)
        : genIndex * (nodeWidth + horizontalSpacing);
    }

    // Calculate positions for nodes in this generation
    const totalWidth = (generationSize - 1) * (nodeWidth + horizontalSpacing);
    const startOffset = -totalWidth / 2;

    nodesInGeneration.forEach((node, nodeIndex) => {
      const nodeOffset = startOffset + nodeIndex * (nodeWidth + horizontalSpacing);

      const position = isVertical
        ? { x: nodeOffset, y: generationPos }
        : { x: generationPos, y: nodeOffset };

      positions[node.id] = position;

      // Create ReactFlow node
      const reactFlowNode: Node = {
        id: node.id.toString(),
        type: 'custom',
        position,
        data: {
          ...node,
          isLineageRoot: node.isRoot,
          lineageGeneration: node.generation,
          lineageDepth: node.depth
        },
        style: {
          width: nodeWidth,
          height: nodeHeight,
        }
      };

      reactFlowNodes.push(reactFlowNode);
    });
  });

  // Create ReactFlow edges
  const reactFlowEdges: Edge[] = lineageEdges.map(edge => ({
    id: `lineage-edge-${edge.id}`,
    source: edge.from_experiment_id.toString(),
    target: edge.to_experiment_id.toString(),
    type: 'smoothstep',
    animated: false,
    style: {
      stroke: '#6b7280',
      strokeWidth: 2,
    },
    markerEnd: {
      type: 'arrowclosed' as any,
      width: 20,
      height: 20,
    },
    label: edge.label || edge.relationship_type,
    labelStyle: {
      fontSize: 12,
      fill: '#374151',
    }
  }));

  // Calculate bounds
  const allPositions = Object.values(positions);
  const bounds = {
    minX: Math.min(...allPositions.map(p => p.x)) - nodeWidth / 2,
    maxX: Math.max(...allPositions.map(p => p.x)) + nodeWidth / 2,
    minY: Math.min(...allPositions.map(p => p.y)) - nodeHeight / 2,
    maxY: Math.max(...allPositions.map(p => p.y)) + nodeHeight / 2,
    width: 0,
    height: 0
  };
  bounds.width = bounds.maxX - bounds.minX;
  bounds.height = bounds.maxY - bounds.minY;

  return {
    nodes: reactFlowNodes,
    edges: reactFlowEdges,
    bounds
  };
}

/**
 * Create a specialized node component for lineage view
 */
export function createLineageNodeData(node: LineageNode) {
  return {
    ...node,
    backgroundColor: node.isRoot ? '#dbeafe' : '#f9fafb',
    borderColor: node.isRoot ? '#2563eb' : getStatusColor(node.status),
    borderWidth: node.isRoot ? 3 : 2,
    showGeneration: true,
    showDepth: true,
  };
}

