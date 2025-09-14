import express from 'express';
import { fileSearchService } from '../services/fileSearchService';
import { createCategoryLogger } from '../../logger';

const router = express.Router();
const logger = createCategoryLogger('FILE_SEARCH_ROUTES');

// Initialize file search service
router.post('/initialize', async (req, res) => {
  try {
    await fileSearchService.initializeAssistant();
    logger.info('File search service initialized via API');
    
    res.json({
      message: 'File search service initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to initialize file search service via API', {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to initialize file search service',
      statusCode: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// Get file search service status
router.get('/status', async (req, res) => {
  try {
    const info = await fileSearchService.getAssistantInfo();
    logger.info('File search service status requested', info);
    
    res.json({
      ...info,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get file search service status', {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to get file search service status',
      statusCode: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// Attach files to search assistant
router.post('/attach', async (req, res) => {
  try {
    const { fileIds } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds)) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'fileIds array is required',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    await fileSearchService.attachFiles(fileIds);
    logger.info('Files attached to search assistant via API', { fileIds });
    
    res.json({
      message: 'Files attached to search assistant successfully',
      fileIds,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to attach files to search assistant via API', {
      error: error instanceof Error ? error.message : String(error),
      fileIds: req.body.fileIds
    });
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to attach files to search assistant',
      statusCode: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// Test file search
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'query string is required',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    const result = await fileSearchService.searchFiles(query);
    logger.info('File search performed via API', { query, resultCount: result.results.length });
    
    res.json(result);
  } catch (error) {
    logger.error('Failed to perform file search via API', {
      error: error instanceof Error ? error.message : String(error),
      query: req.body.query
    });
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to perform file search',
      statusCode: 500,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
