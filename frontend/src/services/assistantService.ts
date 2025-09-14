import { AssistantResponse, ChatMessage, ConversationContext, ConversationHistory } from '../types/research';

const API_BASE_URL = 'http://localhost:3001/api';

export interface StartConversationRequest {
  sessionId?: string;
  useContext?: boolean;
}

export interface SendMessageRequest {
  message: string;
  context?: ConversationContext;
}

export class AssistantService {
  private sessionId: string | null = null;

  async startConversation(options: StartConversationRequest = { useContext: true }): Promise<{ sessionId: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error(`Failed to start conversation: ${response.statusText}`);
    }

    const data = await response.json();
    this.sessionId = data.sessionId;
    return data;
  }

  async sendMessage(message: string, context?: ConversationContext): Promise<AssistantResponse> {
    if (!this.sessionId) {
      throw new Error('No active session. Call startConversation first.');
    }

    const response = await fetch(`${API_BASE_URL}/conversations/${this.sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context })
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  }

  async getHistory(): Promise<ConversationHistory> {
    if (!this.sessionId) {
      throw new Error('No active session. Call startConversation first.');
    }

    const response = await fetch(`${API_BASE_URL}/conversations/${this.sessionId}/history`);

    if (!response.ok) {
      throw new Error(`Failed to get conversation history: ${response.statusText}`);
    }

    return response.json();
  }

  async clearConversation(): Promise<void> {
    if (!this.sessionId) {
      throw new Error('No active session. Call startConversation first.');
    }

    const response = await fetch(`${API_BASE_URL}/conversations/${this.sessionId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to clear conversation: ${response.statusText}`);
    }

    this.sessionId = null;
  }

  async refreshContext(): Promise<{ message: string; context: ConversationContext }> {
    if (!this.sessionId) {
      throw new Error('No active session. Call startConversation first.');
    }

    const response = await fetch(`${API_BASE_URL}/conversations/${this.sessionId}/refresh`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh context: ${response.statusText}`);
    }

    return response.json();
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }
}

// Create a singleton instance
export const assistantService = new AssistantService();
