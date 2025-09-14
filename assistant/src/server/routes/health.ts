import { Router, Request, Response } from 'express';
import { HealthCheckResponse } from '../../types/api';
import { createCategoryLogger } from '../../logger';

const router = Router();
const logger = createCategoryLogger('HEALTH');

const startTime = Date.now();

router.get('/', (req: Request, res: Response) => {
  try {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    const healthResponse: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime
    };

    logger.debug('Health check requested', { uptime });
    res.json(healthResponse);
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : String(error) });
    
    const healthResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: 0
    };

    res.status(503).json(healthResponse);
  }
});

export default router;
