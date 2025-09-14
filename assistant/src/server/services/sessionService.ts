import { v4 as uuidv4 } from 'uuid';
import { Session, SessionStore, ConversationContext } from '../../types/api';
import { createCategoryLogger } from '../../logger';

const logger = createCategoryLogger('SESSION');

export class SessionService {
  private sessions: SessionStore = {};

  createSession(useContext: boolean = true): Session {
    const sessionId = uuidv4();
    const now = new Date().toISOString();
    
    const session: Session = {
      id: sessionId,
      createdAt: now,
      lastActivity: now,
      context: {
        currentIteration: 0,
        messageCount: 0,
        lastToolCalls: []
      },
      messages: []
    };

    this.sessions[sessionId] = session;
    
    logger.info('Created new session', { sessionId, useContext });
    return session;
  }

  getSession(sessionId: string): Session | null {
    const session = this.sessions[sessionId];
    if (session) {
      // Update last activity
      session.lastActivity = new Date().toISOString();
    }
    return session || null;
  }

  updateSession(sessionId: string, updates: Partial<Session>): boolean {
    const session = this.sessions[sessionId];
    if (!session) {
      return false;
    }

    Object.assign(session, updates);
    session.lastActivity = new Date().toISOString();
    
    logger.debug('Updated session', { sessionId, updates });
    return true;
  }

  deleteSession(sessionId: string): boolean {
    if (this.sessions[sessionId]) {
      delete this.sessions[sessionId];
      logger.info('Deleted session', { sessionId });
      return true;
    }
    return false;
  }

  addMessage(sessionId: string, role: 'user' | 'assistant', content: string, actions?: string[]): boolean {
    const session = this.sessions[sessionId];
    if (!session) {
      return false;
    }

    const message = {
      role,
      content,
      timestamp: new Date().toISOString(),
      actions
    };

    session.messages.push(message);
    session.lastActivity = new Date().toISOString();
    
    logger.debug('Added message to session', { sessionId, role, contentLength: content.length });
    return true;
  }

  updateContext(sessionId: string, context: ConversationContext): boolean {
    const session = this.sessions[sessionId];
    if (!session) {
      return false;
    }

    session.context = context;
    session.lastActivity = new Date().toISOString();
    
    logger.debug('Updated session context', { sessionId, context });
    return true;
  }

  clearSession(sessionId: string): boolean {
    const session = this.sessions[sessionId];
    if (!session) {
      return false;
    }

    session.messages = [];
    session.context = {
      currentIteration: 0,
      messageCount: 0,
      lastToolCalls: []
    };
    session.lastActivity = new Date().toISOString();
    
    logger.info('Cleared session', { sessionId });
    return true;
  }

  getAllSessions(): Session[] {
    return Object.values(this.sessions);
  }

  cleanupExpiredSessions(maxAgeHours: number = 24): number {
    const now = new Date();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    let cleanedCount = 0;

    for (const [sessionId, session] of Object.entries(this.sessions)) {
      const lastActivity = new Date(session.lastActivity);
      if (now.getTime() - lastActivity.getTime() > maxAge) {
        delete this.sessions[sessionId];
        cleanedCount++;
        logger.info('Cleaned up expired session', { sessionId, lastActivity: session.lastActivity });
      }
    }

    if (cleanedCount > 0) {
      logger.info('Session cleanup completed', { cleanedCount, remainingSessions: Object.keys(this.sessions).length });
    }

    return cleanedCount;
  }
}
