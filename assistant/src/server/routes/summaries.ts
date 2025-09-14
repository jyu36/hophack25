import { Router, Request, Response, NextFunction } from 'express';
import { SummaryService } from '../services/summaryService';
import { SummaryRequest } from '../../types/api';
import { createCategoryLogger } from '../../logger';

const router = Router();
const logger = createCategoryLogger('SUMMARIES');
const summaryService = new SummaryService();

// GET /api/summaries/overview - Get project overview summary
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ignoreCache = req.query.ignore_cache === 'true';
    const request: SummaryRequest = { ignore_cache: ignoreCache };
    
    logger.info('Generating overview summary', { ignore_cache: ignoreCache });
    
    const response = await summaryService.generateOverviewSummary(request);
    res.json(response);
  } catch (error) {
    logger.error('Error generating overview summary', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    next(error);
  }
});

// GET /api/summaries/weekly - Get weekly summary of recent updates
router.get('/weekly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ignoreCache = req.query.ignore_cache === 'true';
    const request: SummaryRequest = { ignore_cache: ignoreCache };
    
    logger.info('Generating weekly summary', { ignore_cache: ignoreCache });
    
    const response = await summaryService.generateWeeklySummary(request);
    res.json(response);
  } catch (error) {
    logger.error('Error generating weekly summary', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    next(error);
  }
});

// GET /api/summaries/cache/stats - Get cache statistics (for debugging)
router.get('/cache/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Getting cache statistics');
    
    const stats = summaryService.getCacheStats();
    res.json({
      cache_stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting cache statistics', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    next(error);
  }
});

// DELETE /api/summaries/cache - Clear summary cache
router.delete('/cache', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Clearing summary cache');
    
    summaryService.clearCache();
    res.json({
      message: 'Summary cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error clearing summary cache', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    next(error);
  }
});

export default router;
