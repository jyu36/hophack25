import { ResearchAssistant, AgentContext } from '../../agent';
import { SessionService } from './sessionService';
import { 
  StartConversationRequest, 
  StartConversationResponse, 
  SendMessageRequest, 
  SendMessageResponse,
  ConversationHistory,
  RefreshContextResponse,
  ClearConversationResponse,
  ConversationContext
} from '../../types/api';
import { createCategoryLogger } from '../../logger';

const logger = createCategoryLogger('CONVERSATION');

// Helper functions to convert between context types
const agentContextToConversationContext = (agentContext: AgentContext): ConversationContext => {
  return {
    currentIteration: agentContext.currentIteration,
    messageCount: agentContext.messages.length,
    lastToolCalls: agentContext.lastToolCalls
  };
};

const conversationContextToAgentContext = (conversationContext: ConversationContext, messages: any[]): AgentContext => {
  return {
    currentIteration: conversationContext.currentIteration,
    lastToolCalls: conversationContext.lastToolCalls,
    messages: messages
  };
};

export class ConversationService {
  private assistant: ResearchAssistant;
  private sessionService: SessionService;

  constructor() {
    this.assistant = new ResearchAssistant();
    this.sessionService = new SessionService();
  }

  async startConversation(request: StartConversationRequest): Promise<StartConversationResponse> {
    try {
      logger.info('Starting new conversation', { request });

      // Create or get existing session
      let session;
      if (request.sessionId) {
        session = this.sessionService.getSession(request.sessionId);
        if (!session) {
          logger.warn('Session not found, creating new one', { sessionId: request.sessionId });
          session = this.sessionService.createSession(request.useContext ?? true);
        }
      } else {
        session = this.sessionService.createSession(request.useContext ?? true);
      }

      // Start conversation with assistant (default to contextual initialization)
      const { response, context } = await this.assistant.startConversation(request.useContext ?? true);

      // Convert AgentContext to ConversationContext
      const conversationContext = agentContextToConversationContext(context);

      // Update session with initial context
      this.sessionService.updateContext(session.id, conversationContext);

      // Add assistant's welcome message
      this.sessionService.addMessage(session.id, 'assistant', response);

      logger.info('Conversation started successfully', { sessionId: session.id });

      return {
        sessionId: session.id,
        message: response,
        context: conversationContext
      };
    } catch (error) {
      logger.error('Error starting conversation', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async sendMessage(sessionId: string, request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      logger.info('Processing message', { sessionId, messageLength: request.message.length });

      // Get session
      const session = this.sessionService.getSession(sessionId);
      if (!session) {
        const error = new Error(`Session ${sessionId} not found`);
        (error as any).statusCode = 404;
        throw error;
      }

      // Add user message to session
      this.sessionService.addMessage(sessionId, 'user', request.message);

      // Convert ConversationContext to AgentContext if provided
      const agentContext = request.context 
        ? conversationContextToAgentContext(request.context, session.messages)
        : undefined;

      // Process message with assistant (including file attachments)
      const { response, newContext, actions } = await this.assistant.processMessage(
        request.message, 
        agentContext,
        request.fileIds
      );

      // Convert AgentContext to ConversationContext
      const conversationContext = agentContextToConversationContext(newContext);

      // Update session context
      this.sessionService.updateContext(sessionId, conversationContext);

      // Add assistant response to session
      this.sessionService.addMessage(sessionId, 'assistant', response, actions);

      logger.info('Message processed successfully', { 
        sessionId, 
        actionsCount: actions.length,
        responseLength: response.length 
      });

      return {
        response,
        context: conversationContext,
        actions,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error processing message', { 
        sessionId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async getConversationHistory(sessionId: string): Promise<ConversationHistory> {
    try {
      logger.debug('Getting conversation history', { sessionId });

      const session = this.sessionService.getSession(sessionId);
      if (!session) {
        const error = new Error(`Session ${sessionId} not found`);
        (error as any).statusCode = 404;
        throw error;
      }

      return {
        sessionId: session.id,
        messages: session.messages,
        context: session.context
      };
    } catch (error) {
      logger.error('Error getting conversation history', { 
        sessionId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async clearConversation(sessionId: string): Promise<ClearConversationResponse> {
    try {
      logger.info('Clearing conversation', { sessionId });

      const success = this.sessionService.clearSession(sessionId);
      if (!success) {
        const error = new Error(`Session ${sessionId} not found`);
        (error as any).statusCode = 404;
        throw error;
      }

      return {
        message: 'Conversation cleared successfully',
        sessionId
      };
    } catch (error) {
      logger.error('Error clearing conversation', { 
        sessionId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async refreshContext(sessionId: string): Promise<RefreshContextResponse> {
    try {
      logger.info('Refreshing context', { sessionId });

      const session = this.sessionService.getSession(sessionId);
      if (!session) {
        const error = new Error(`Session ${sessionId} not found`);
        (error as any).statusCode = 404;
        throw error;
      }

      // Refresh context with latest graph data
      const refreshedPrompt = await this.assistant.refreshContext();
      
      // Update the system message in the context
      if (session.context && session.context.currentIteration > 0) {
        // If there's an existing conversation, we need to restart with fresh context
        const { response, context } = await this.assistant.startConversation(true);
        const conversationContext = agentContextToConversationContext(context);
        this.sessionService.updateContext(sessionId, conversationContext);
        
        // Add a system message about context refresh
        this.sessionService.addMessage(sessionId, 'assistant', 'Context refreshed with latest graph information');
        
        return {
          message: 'Context refreshed successfully',
          context: conversationContext
        };
      } else {
        // If no conversation yet, just update the context
        const { context } = await this.assistant.startConversation(true);
        const conversationContext = agentContextToConversationContext(context);
        this.sessionService.updateContext(sessionId, conversationContext);
        
        return {
          message: 'Context refreshed successfully',
          context: conversationContext
        };
      }
    } catch (error) {
      logger.error('Error refreshing context', { 
        sessionId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  getSessionService(): SessionService {
    return this.sessionService;
  }
}
