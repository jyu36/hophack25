import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import ChatPanel from '../Chat/ChatPanel';
import GraphPanel from '../Graph/GraphPanel';
import { useChat } from '../../hooks/useChat';
import { useExperiments } from '../../hooks/useExperiments';
import { ExperimentSuggestion, NodeStatus } from '../../types/research';

interface AIChatResearchAssistantProps {
  initialSuggestions?: ExperimentSuggestion[];
  onBackToDashboard: () => void;
}

const AIChatResearchAssistant: React.FC<AIChatResearchAssistantProps> = ({
  initialSuggestions = [],
  onBackToDashboard,
}) => {
  const { messages, isLoading, sendMessage } = useChat(initialSuggestions);
  const {
    experiments,
    getExperimentsByStatus,
    updateExperimentStatus
  } = useExperiments();

  const handleAcceptSuggestion = (suggestion: ExperimentSuggestion) => {
    // Instead of using addExperiment, we'll use the API through useExperiments hook
    // This will be handled by the parent component
    console.log('Accept suggestion:', suggestion);
  };

  const handleDeclineSuggestion = (suggestion: ExperimentSuggestion) => {
    // Instead of using addExperiment, we'll use the API through useExperiments hook
    // This will be handled by the parent component
    console.log('Decline suggestion:', suggestion);
  };

  const acceptedCount = getExperimentsByStatus('accepted').length;
  const pendingCount = getExperimentsByStatus('pending').length;

  // Create relationships based on experiments data
  const relationships = experiments.map((exp, index) => ({
    source: exp.id,
    target: experiments[(index + 1) % experiments.length].id,
    type: 'related',
  }));

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToDashboard}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="text-gray-600" size={20} />
            </button>
            <Sparkles className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">AI Research Assistant</h1>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Accepted ({acceptedCount})</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>For Later ({pendingCount})</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          onAcceptSuggestion={handleAcceptSuggestion}
          onDeclineSuggestion={handleDeclineSuggestion}
        />
        <GraphPanel
          experiments={experiments}
          relationships={relationships}
        />
      </div>
    </div>
  );
};

export default AIChatResearchAssistant;
