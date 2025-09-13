import React, { useState } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import ChatPanel from './Chat/ChatPanel';
import GraphPanel from './Graph/GraphPanel';
import ResizableDivider from './Common/ResizableDivider';
import { useChat } from '../hooks/useChat';
import { useExperiments } from '../hooks/useExperiments';
import { ExperimentSuggestion } from '../types/research';

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
    relationships,
    addExperiment,
    getExperimentsByStatus
  } = useExperiments();

  // State for the chat panel width with a default of 1/3 of the screen
  const [chatWidth, setChatWidth] = useState(window.innerWidth / 3);

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
        {/* Chat Panel with dynamic width */}
        <div
          style={{ width: chatWidth }}
          className="flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-150"
        >
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            onAcceptSuggestion={handleAcceptSuggestion}
            onDeclineSuggestion={handleDeclineSuggestion}
          />
        </div>

        {/* Resizable Divider */}
        <ResizableDivider
          onResize={setChatWidth}
          minWidth={window.innerWidth * 0.2} // Minimum 20% of screen width
          maxWidth={window.innerWidth * 0.6} // Maximum 60% of screen width
        />

        {/* Graph Panel - takes remaining space */}
        <div className="flex-1 transition-all duration-150">
          <GraphPanel
            experiments={experiments}
            relationships={relationships}
          />
        </div>
      </div>
    </div>
  );
};

export default AIChatResearchAssistant;