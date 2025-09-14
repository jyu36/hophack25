import { assistantService } from './assistantService';

const SESSION_KEY = 'assistant_session_id';

export const sessionService = {
  saveSession(sessionId: string) {
    localStorage.setItem(SESSION_KEY, sessionId);
  },

  getSession(): string | null {
    return localStorage.getItem(SESSION_KEY);
  },

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  },

  async restoreSession(): Promise<boolean> {
    const sessionId = this.getSession();
    if (sessionId) {
      try {
        assistantService.setSessionId(sessionId);
        // Verify the session is still valid by fetching history
        await assistantService.getHistory();
        return true;
      } catch (error) {
        console.error('Failed to restore session:', error);
        this.clearSession();
        return false;
      }
    }
    return false;
  }
};
