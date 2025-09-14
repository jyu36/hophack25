import { Router, Request, Response, NextFunction } from 'express';
import { ConversationService } from '../services/conversationService';
import { 
  StartConversationRequest, 
  SendMessageRequest
} from '../../types/api';
import { createCategoryLogger } from '../../logger';

const router = Router();
const logger = createCategoryLogger('CONVERSATIONS');
const conversationService = new ConversationService();

// POST /api/conversations - Start new conversation
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request: StartConversationRequest = req.body;
    
    logger.info('Starting conversation', { request });
    
    const response = await conversationService.startConversation(request);
    res.json(response);
  } catch (error) {
    logger.error('Error starting conversation', { error: error instanceof Error ? error.message : String(error) });
    next(error);
  }
});

// POST /api/conversations/:sessionId/messages - Send message
router.post('/:sessionId/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.sessionId;
    const request: SendMessageRequest = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Session ID is required',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    if (!request.message || request.message.trim().length === 0) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Message is required and cannot be empty',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Sending message', { sessionId, messageLength: request.message.length });
    
    const response = await conversationService.sendMessage(sessionId, request);
    res.json(response);
  } catch (error) {
    logger.error('Error sending message', { 
      sessionId: req.params.sessionId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    // Handle specific error cases
    if (error instanceof Error && (error as any).statusCode === 404) {
      return res.status(404).json({
        error: 'NotFound',
        message: error.message,
        statusCode: 404,
        timestamp: new Date().toISOString()
      });
    }
    
    next(error);
  }
});

// GET /api/conversations/:sessionId/history - Get conversation history
router.get('/:sessionId/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Session ID is required',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Getting conversation history', { sessionId });
    
    const response = await conversationService.getConversationHistory(sessionId);
    res.json(response);
  } catch (error) {
    logger.error('Error getting conversation history', { 
      sessionId: req.params.sessionId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    // Handle specific error cases
    if (error instanceof Error && (error as any).statusCode === 404) {
      return res.status(404).json({
        error: 'NotFound',
        message: error.message,
        statusCode: 404,
        timestamp: new Date().toISOString()
      });
    }
    
    next(error);
  }
});

// DELETE /api/conversations/:sessionId - Clear conversation
router.delete('/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Session ID is required',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Clearing conversation', { sessionId });
    
    const response = await conversationService.clearConversation(sessionId);
    res.json(response);
  } catch (error) {
    logger.error('Error clearing conversation', { 
      sessionId: req.params.sessionId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    // Handle specific error cases
    if (error instanceof Error && (error as any).statusCode === 404) {
      return res.status(404).json({
        error: 'NotFound',
        message: error.message,
        statusCode: 404,
        timestamp: new Date().toISOString()
      });
    }
    
    next(error);
  }
});

// POST /api/conversations/:sessionId/refresh - Refresh context
router.post('/:sessionId/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Session ID is required',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Refreshing context', { sessionId });
    
    const response = await conversationService.refreshContext(sessionId);
    res.json(response);
  } catch (error) {
    logger.error('Error refreshing context', { 
      sessionId: req.params.sessionId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    // Handle specific error cases
    if (error instanceof Error && (error as any).statusCode === 404) {
      return res.status(404).json({
        error: 'NotFound',
        message: error.message,
        statusCode: 404,
        timestamp: new Date().toISOString()
      });
    }
    
    next(error);
  }
});

export default router;
