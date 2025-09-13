import React from 'react';
import { Sparkles } from 'lucide-react';
import ChatPanel from './Chat/ChatPanel';
import GraphPanel from './Graph/GraphPanel';
import { useChat } from '../hooks/useChat';
import { useExperiments } from '../hooks/useExperiments';
import { ExperimentSuggestion } from '../types/research';

interface AIChatResearchAssistantProps {
  initialSuggestions?: ExperimentSuggestion[];
}

const AIChatResearchAssistant: React.FC<AIChatResearchAssistantProps> = ({
  initialSuggestions = [],
}) => {
  const { messages, isLoading, sendMessage } = useChat(initialSuggestions);
  const {
    experiments,
    relationships,
    addExperiment,
    getExperimentsByStatus
  } = useExperiments();

  const handleAcceptSuggestion = (suggestion: ExperimentSuggestion) => {
    addExperiment(suggestion, 'accepted');
  };

  const handleDeclineSuggestion = (suggestion: ExperimentSuggestion) => {
    addExperiment(suggestion, 'pending');
  };

  const acceptedCount = getExperimentsByStatus('accepted').length;
  const pendingCount = getExperimentsByStatus('pending').length;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
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