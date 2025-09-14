import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import Message from './Message';
import ChatInput from './ChatInput';
import ResizableHorizontalDivider from '../Common/ResizableHorizontalDivider';
import { ChatMessage, ExperimentSuggestion } from '../../types/research';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onFileUpload?: (file: File) => void;
  onAcceptSuggestion: (suggestion: ExperimentSuggestion) => void;
  onDeclineSuggestion: (suggestion: ExperimentSuggestion) => void;
  onClearChat?: () => void;
}

const suggestedKeywords = [
  'machine learning',
  'protein folding',
  'drug discovery',
  'data analysis',
  'optimization'
];

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  error,
  onSendMessage,
  onFileUpload,
  onAcceptSuggestion,
  onDeclineSuggestion,
  onClearChat,
}) => {
  const [messagesHeight, setMessagesHeight] = useState(window.innerHeight * 0.6); // Default 60% of window height

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle size={18} className="text-blue-600" />
            <h2 className="font-semibold text-sm">Research Conversation</h2>
          </div>
          {onClearChat && (
            <button
              onClick={onClearChat}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear Chat
            </button>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Describe your research interests and I'll suggest relevant experiments
        </p>
        {error && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Messages with adjustable height */}
      <div
        style={{ height: messagesHeight }}
        className="overflow-y-auto p-3 space-y-3 transition-all duration-150"
      >
        {messages.map(message => (
          <Message
            key={message.id}
            message={message}
            onSuggestionAccept={onAcceptSuggestion}
            onSuggestionDecline={onDeclineSuggestion}
          />
        ))}
      </div>

      {/* Resizable Divider */}
      <ResizableHorizontalDivider
        onResize={setMessagesHeight}
        minHeight={200} // Minimum height for messages area
        maxHeight={window.innerHeight * 0.8} // Maximum 80% of window height
      />

      {/* Input - Fixed height */}
      <div className="flex-shrink-0 w-full min-w-0">
        <ChatInput
          onSend={onSendMessage}
          onFileUpload={onFileUpload}
          isLoading={isLoading}
          suggestedKeywords={suggestedKeywords}
        />
      </div>
    </div>
  );
};

export default ChatPanel;