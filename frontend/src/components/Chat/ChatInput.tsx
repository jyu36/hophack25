import React, { useState, KeyboardEvent, ChangeEvent, useRef } from 'react';
import { Send, Paperclip, File, X } from 'lucide-react';
import Button from '../Common/Button';

interface ChatInputProps {
  onSend: (message: string) => void;
  onFileUpload?: (file: File) => void;
  isLoading?: boolean;
  suggestedKeywords?: string[];
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onFileUpload,
  isLoading = false,
  suggestedKeywords = [],
}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() || selectedFile) {
      // Send text message if there's text
      if (message.trim()) {
        onSend(message.trim());
      }

      // Send file if there's a selected file
      if (selectedFile && onFileUpload) {
        onFileUpload(selectedFile);
      }

      // Clear both message and file after sending
      setMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError('');

    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Check file type
    const allowedTypes = [
      '.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx', '.xls',
      '.ppt', '.pptx', '.rtf', '.odt', '.ods', '.odp'
    ];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      setError('Unsupported file type. Please upload PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, PPT, PPTX, RTF, or ODT files.');
      return;
    }

    setSelectedFile(file);
    // Don't send file immediately - wait for user to click send button
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      {/* File Upload Section */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <File className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-700">{selectedFile.name}</span>
              <span className="text-xs text-blue-500">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <button
              onClick={clearFile}
              className="text-blue-400 hover:text-blue-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex space-x-2 min-w-0">
        <input
          type="text"
          value={message}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe your research interests or ask about experiments..."
          className="flex-1 min-w-0 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          disabled={isLoading}
        />

        {/* File Upload Button */}
        <Button
          onClick={handleFileClick}
          disabled={isLoading}
          variant="secondary"
          size="sm"
          className="flex-shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || isLoading}
          isLoading={isLoading}
          className="flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx,.rtf,.odt,.ods,.odp"
      />

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