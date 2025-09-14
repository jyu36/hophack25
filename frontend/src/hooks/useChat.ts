import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, ExperimentSuggestion, FileAttachment } from '../types/research';
import { generateAIResponse } from '../services/mockAI';
import { uploadFile, FileUploadResponse } from '../services/fileUploadService';

export function useChat(initialSuggestions: ExperimentSuggestion[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hi! I\'m your AI research assistant. Share a research keyword or describe your project, and I\'ll suggest relevant experiments.',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle initial suggestions
  useEffect(() => {
    if (initialSuggestions && initialSuggestions.length > 0) {
      const suggestionsMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Based on your uploaded document, here are some suggested experiments:',
        suggestions: initialSuggestions,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, suggestionsMessage]);
    }
  }, [initialSuggestions]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    // Simulate AI response
    setIsLoading(true);
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const aiResponse = generateAIResponse(content);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.message,
        suggestions: aiResponse.suggestions,
        timestamp: new Date(),
      };

      addMessage(aiMessage);
    } catch (error) {
      console.error('Error generating AI response:', error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, there was an error generating a response. Please try again.',
        timestamp: new Date(),
      };

      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const sendFile = useCallback(async (file: File) => {
    // Create file attachment
    const fileAttachment: FileAttachment = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
    };

    // Add user message with file attachment
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `Uploaded file: ${file.name}`,
      attachments: [fileAttachment],
      timestamp: new Date(),
    };
    addMessage(userMessage);

    // Upload file to backend and get analysis
    setIsLoading(true);
    try {
      // Upload file to backend
      const uploadResponse: FileUploadResponse = await uploadFile(file);

      // Generate AI response based on backend analysis
      let aiResponse: { message: string; suggestions?: ExperimentSuggestion[] };

      if (uploadResponse.keywords && uploadResponse.keywords.length > 0) {
        // Use extracted keywords to generate suggestions
        const topKeywords = uploadResponse.keywords.slice(0, 5).join(', ');

        aiResponse = {
          message: `I've analyzed your file "${file.name}" and extracted ${uploadResponse.keywords.length} keywords: ${topKeywords}. Based on this content, here are some research suggestions:`,
          suggestions: [
            {
              title: "Keyword-Based Literature Review",
              description: `Search for papers related to: ${uploadResponse.keywords.slice(0, 3).join(', ')}`,
              type: "analysis",
              keywords: uploadResponse.keywords.slice(0, 5),
            },
            {
              title: "Content Analysis Experiment",
              description: `Design experiments based on the themes found in your document`,
              type: "experiment",
              keywords: uploadResponse.keywords.slice(0, 4),
            },
            {
              title: "Research Gap Analysis",
              description: `Identify research opportunities related to the extracted keywords`,
              type: "hypothesis",
              keywords: uploadResponse.keywords.slice(0, 3),
            }
          ]
        };
      } else {
        // Fallback if no keywords extracted
        aiResponse = {
          message: `I've received your file "${file.name}" but couldn't extract keywords from the content. This might be due to the file format or content type. Could you provide more details about what you'd like to research?`,
          suggestions: [
            {
              title: "Manual Keyword Input",
              description: "Please describe the main topics or keywords you're interested in",
              type: "analysis",
              keywords: ["manual input", "topic description"],
            }
          ]
        };
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.message,
        suggestions: aiResponse.suggestions,
        timestamp: new Date(),
      };

      addMessage(aiMessage);
    } catch (error) {
      console.error('Error processing file:', error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `Sorry, there was an error processing your file: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`,
        timestamp: new Date(),
      };

      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  return {
    messages,
    isLoading,
    sendMessage,
    sendFile,
  };
}

export default useChat;