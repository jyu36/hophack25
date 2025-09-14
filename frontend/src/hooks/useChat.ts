import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, ExperimentSuggestion, FileAttachment, ConversationContext } from '../types/research';
import { uploadFile, FileUploadResponse } from '../services/fileUploadService';
import { assistantService } from '../services/assistantService';
import { sessionService } from '../services/sessionService';

export function useChat(initialSuggestions: ExperimentSuggestion[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<ConversationContext>({
    currentIteration: 0,
    messageCount: 0,
    lastToolCalls: []
  });

  // Initialize conversation when the hook is first used
  useEffect(() => {
    const initConversation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Try to restore existing session
        const restored = await sessionService.restoreSession();

        if (restored) {
          // Fetch conversation history
          const history = await assistantService.getHistory();
          setMessages(history.messages);
          setContext(history.context);
        } else {
          // Start new conversation
          const { message, sessionId } = await assistantService.startConversation();
          sessionService.saveSession(sessionId);

          const initialMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: message,
            timestamp: new Date().toISOString()
          };
          setMessages([initialMessage]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start conversation');
        console.error('Error starting conversation:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initConversation();
  }, []);

  // Handle initial suggestions
  useEffect(() => {
    if (initialSuggestions && initialSuggestions.length > 0) {
      const suggestionsMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Based on your uploaded document, here are some suggested experiments:',
        suggestions: initialSuggestions,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, suggestionsMessage]);
    }
  }, [initialSuggestions]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    addMessage(userMessage);

    // Send to assistant API
    setIsLoading(true);
    try {
      const response = await assistantService.sendMessage(content, context);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
        actions: response.actions
      };

      addMessage(assistantMessage);
      setContext(response.context);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error generating a response. Please try again.',
        timestamp: new Date().toISOString()
      };

      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, context]);

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
      role: 'user',
      content: `Uploaded file: ${file.name}`,
      attachments: [fileAttachment],
      timestamp: new Date().toISOString(),
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
        role: 'assistant',
        content: aiResponse.message,
        suggestions: aiResponse.suggestions,
        timestamp: new Date().toISOString(),
      };

      addMessage(aiMessage);
    } catch (error) {
      console.error('Error processing file:', error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, there was an error processing your file: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`,
        timestamp: new Date().toISOString(),
      };

      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const clearConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await assistantService.clearConversation();
      sessionService.clearSession();
      setMessages([]);
      setContext({
        currentIteration: 0,
        messageCount: 0,
        lastToolCalls: []
      });

      // Start a new conversation
      const { message, sessionId } = await assistantService.startConversation();
      sessionService.saveSession(sessionId);
      const initialMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessages([initialMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear conversation');
      console.error('Error clearing conversation:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendFile,
    clearConversation,
  };
}

export default useChat;