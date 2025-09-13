import React, { useState, useCallback } from 'react';
import { Network } from 'lucide-react';
import GraphView from './GraphView';
import Legend from './Legend';
import KeywordList from './KeywordList';
import { Experiment, NodeDetails } from '../../types/research';
import { experimentsToNodes } from '../../utils/helpers';

interface GraphPanelProps {
  experiments: Experiment[];
  relationships?: Array<{
    source: string;
    target: string;
    type: string;
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

  const nodes = experimentsToNodes(experiments);

  // Create edges
  const edges = relationships.map((rel, index) => ({
    id: `e${index}`,
    source: rel.source,
    target: rel.target,
    label: rel.type,
  }));

  const handleNodeStatusChange = useCallback((nodeId: string, status: 'accepted' | 'pending' | 'rejected') => {
    // TODO: Implement status change logic
    console.log('Change node status:', nodeId, status);
  }, []);

  const handleCreateBranch = useCallback((nodeId: string) => {
    // TODO: Implement branch creation logic
    console.log('Create branch from node:', nodeId);
  }, []);

  const fetchNodeDetails = useCallback(async (nodeId: string): Promise<NodeDetails> => {
    // TODO: Implement actual API call
    return {
      papers: [],
      solutions: [],
      isLoading: false,
    };
  }, []);

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
            <p className="text-sm">Start a conversation to get AI-suggested experiments!</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative">
          <GraphView
            nodes={nodes}
            edges={edges}
            onNodeStatusChange={handleNodeStatusChange}
            onCreateBranch={handleCreateBranch}
            fetchNodeDetails={fetchNodeDetails}
          />
          <Legend
            isCollapsed={isLegendCollapsed}
            onToggle={() => setIsLegendCollapsed(!isLegendCollapsed)}
          />
          <KeywordList
            keywords={extractedKeywords}
            onKeywordClick={onKeywordSelect}
            isCollapsed={isKeywordListCollapsed}
            onToggle={() => setIsKeywordListCollapsed(!isKeywordListCollapsed)}
          />
        </div>
      )}
    </div>
  );
};

export default GraphPanel;