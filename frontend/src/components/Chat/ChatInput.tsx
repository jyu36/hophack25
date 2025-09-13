import React, { useState, KeyboardEvent, ChangeEvent } from 'react';
import { Send } from 'lucide-react';
import Button from '../Common/Button';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  suggestedKeywords?: string[];
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading = false,
  suggestedKeywords = [],
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-gray-50 p-4">
      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe your research interests or ask about experiments..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          isLoading={isLoading}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {suggestedKeywords.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-gray-600">Try these keywords:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedKeywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => setMessage(keyword)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInput;