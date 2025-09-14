import React from 'react';
import { Bot, User, File, Download } from 'lucide-react';
import { ChatMessage, ExperimentSuggestion, FileAttachment } from '../../types/research';
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('csv') || fileType.includes('excel')) return '📊';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  return (
    <div
      className={`flex ${isAI ? 'justify-start' : 'justify-end'} ${isAI ? 'space-x-3' : 'space-x-reverse space-x-3'}`}
    >
      {/* AI Avatar - Left side */}
      {isAI && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
          <Bot className="h-4 w-4 text-blue-600" />
        </div>
      )}

      {/* Message Content */}
      <div className="max-w-[85%] space-y-2">
        <div
          className={`rounded-lg px-3 py-1.5 ${
            isAI
              ? 'bg-white text-gray-900 shadow-sm'
              : 'bg-blue-600 text-white'
          }`}
        >
          <p className="text-xs leading-relaxed">{message.content}</p>

          {/* File Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment: FileAttachment) => (
                <div
                  key={attachment.id}
                  className={`flex items-center space-x-2 p-2 rounded border ${
                    isAI
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-blue-500 border-blue-400'
                  }`}
                >
                  <span className="text-sm">{getFileIcon(attachment.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${
                      isAI ? 'text-gray-900' : 'text-white'
                    }`}>
                      {attachment.name}
                    </p>
                    <p className={`text-xs ${
                      isAI ? 'text-gray-500' : 'text-blue-100'
                    }`}>
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                  {attachment.url && (
                    <button
                      className={`p-1 rounded hover:bg-opacity-20 ${
                        isAI ? 'hover:bg-gray-400' : 'hover:bg-white'
                      }`}
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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

      {/* User Avatar - Right side */}
      {!isAI && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
};

export default Message;