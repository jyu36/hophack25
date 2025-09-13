import React from 'react';
import { MessageCircle } from 'lucide-react';
import Message from './Message';
import ChatInput from './ChatInput';
import { ChatMessage, ExperimentSuggestion } from '../../types/research';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onAcceptSuggestion: (suggestion: ExperimentSuggestion) => void;
  onDeclineSuggestion: (suggestion: ExperimentSuggestion) => void;
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
  onSendMessage,
  onAcceptSuggestion,
  onDeclineSuggestion,
}) => {
  return (
    <div className="w-1/2 flex flex-col bg-white border-r">
      {/* Chat Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <MessageCircle size={20} className="text-blue-600" />
          <h2 className="font-semibold">Research Conversation</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Describe your research interests and I'll suggest relevant experiments
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <Message
            key={message.id}
            message={message}
            onSuggestionAccept={onAcceptSuggestion}
            onSuggestionDecline={onDeclineSuggestion}
          />
        ))}
      </div>

      {/* Input */}
      <ChatInput
        onSend={onSendMessage}
        isLoading={isLoading}
        suggestedKeywords={suggestedKeywords}
      />
    </div>
  );
};

export default ChatPanel;