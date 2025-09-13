import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, ExperimentSuggestion } from '../types/research';
import { generateAIResponse } from '../services/mockAI';

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

  return {
    messages,
    isLoading,
    sendMessage,
  };
}

export default useChat;