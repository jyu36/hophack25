import React from 'react';
import { Bot, User } from 'lucide-react';
import { ChatMessage, ExperimentSuggestion } from '../../types/research';
import SuggestionCard from './SuggestionCard';

interface MessageProps {
  message: ChatMessage;
  onSuggestionAccept: (suggestion: ExperimentSuggestion) => void;
  onSuggestionDecline: (suggestion: ExperimentSuggestion) => void;
}

const Message: React.FC<MessageProps> = ({
  message,
  onSuggestionAccept,
  onSuggestionDecline,
}) => {
  const isAI = message.type === 'ai';

  return (
    <div
      className={`flex ${isAI ? 'justify-start' : 'justify-end'} space-x-2`}
    >
      {isAI && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
          <Bot className="h-4 w-4 text-blue-600" />
        </div>
      )}

      <div className={`max-w-[85%] space-y-2 ${isAI ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg px-3 py-1.5 ${
            isAI
              ? 'bg-white text-gray-900 shadow-sm'
              : 'bg-blue-600 text-white'
          }`}
        >
          <p className="text-xs leading-relaxed">{message.content}</p>
        </div>

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="space-y-1.5">
            {message.suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={index}
                suggestion={suggestion}
                onAccept={onSuggestionAccept}
                onDecline={onSuggestionDecline}
              />
            ))}
          </div>
        )}
      </div>

      {!isAI && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
};

export default Message;