import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import ChatPanel from "./Chat/ChatPanel";
import GraphPanel from "./Graph/GraphPanel";
import ResizableDivider from "./Common/ResizableDivider";
import { useChat } from "../hooks/useChat";
import { useExperiments } from "../hooks/useExperiments";
import { ExperimentSuggestion } from "../types/research";

interface AIChatResearchAssistantProps {
  initialSuggestions?: ExperimentSuggestion[];
}

const AIChatResearchAssistant: React.FC<AIChatResearchAssistantProps> = ({
  initialSuggestions = [],
}) => {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    sendFile,
    clearConversation,
  } = useChat(initialSuggestions);
  const {
    experiments,
    relationships,
    getExperimentsByStatus,
    updateExperimentStatus,
    refreshExperiments,
  } = useExperiments();

  // State for panel widths
  const [chatPanelWidth, setChatPanelWidth] = useState(400);

  const handleAcceptSuggestion = (suggestion: ExperimentSuggestion) => {
    // Instead of using addExperiment, we'll use the API through useExperiments hook
    // This will be handled by the parent component
    console.log("Accept suggestion:", suggestion);
  };

  const handleDeclineSuggestion = (suggestion: ExperimentSuggestion) => {
    // Instead of using addExperiment, we'll use the API through useExperiments hook
    // This will be handled by the parent component
    console.log("Decline suggestion:", suggestion);
  };

  const handleResize = (newWidth: number) => {
    setChatPanelWidth(newWidth);
  };

  const handleFileUpload = (file: File) => {
    console.log("File uploaded:", file.name, file.type, file.size);
    // Send file to chat for processing
    sendFile(file);
  };

  const handleNodeClick = (node: any) => {
    console.log("Node clicked:", node);
    // TODO: Open node details modal or navigate to node details
  };

  const handleNodeStatusChange = async (nodeId: number, status: string) => {
    try {
      // Update the experiment status via the API
      await updateExperimentStatus(nodeId, status as any);
      console.log(`Updated node ${nodeId} status to ${status}`);
      // Refresh graph data after status change
      setTimeout(() => {
        refreshExperiments();
      }, 500); // Small delay to allow backend to process
    } catch (error) {
      console.error("Failed to update node status:", error);
    }
  };

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
    // Refresh graph data after sending message
    setTimeout(() => {
      refreshExperiments();
    }, 1000); // Small delay to allow backend to process
  };

  const acceptedCount = getExperimentsByStatus("completed").length;
  const pendingCount = getExperimentsByStatus("planned").length;

  // Relationships are now provided by the useExperiments hook

  return (
    <div
      className="flex flex-col bg-gray-50"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">
              AI Research Assistant
            </h1>
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
        <div className="flex-shrink-0" style={{ width: `${chatPanelWidth}px` }}>
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            error={error}
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            onAcceptSuggestion={handleAcceptSuggestion}
            onDeclineSuggestion={handleDeclineSuggestion}
            onClearChat={clearConversation}
          />
        </div>

        <ResizableDivider
          onResize={handleResize}
          minWidth={300}
          maxWidth={800}
        />

        <div className="flex-1 min-w-0">
          <GraphPanel
            experiments={experiments}
            relationships={relationships}
            onNodeClick={handleNodeClick}
            onNodeStatusChange={handleNodeStatusChange}
            onRefresh={refreshExperiments}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default AIChatResearchAssistant;
