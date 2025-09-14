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
      // Simply set the session ID and return true
      // The calling code will handle fetching history
      assistantService.setSessionId(sessionId);
      return true;
    }
    return false;
  }
};
