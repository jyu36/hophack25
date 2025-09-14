import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createCategoryLogger } from '../logger';
import { ServerConfig } from '../types/api';

// Import middleware
import { createCorsMiddleware } from './middleware/cors';
import { requestLogging } from './middleware/logging';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import healthRoutes from './routes/health';
import conversationRoutes from './routes/conversations';
import summaryRoutes from './routes/summaries';

const logger = createCategoryLogger('SERVER');

// Server configuration
const config: ServerConfig = {
  port: parseInt(process.env.ASSISTANT_PORT || '3001'),
  host: process.env.ASSISTANT_HOST || 'localhost',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  graphApiBase: process.env.GRAPH_API_BASE || 'http://localhost:8000',
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests from this IP, please try again later.',
    statusCode: 429,
    timestamp: new Date().toISOString()
  }
});
app.use(limiter);

// CORS middleware
app.use(createCorsMiddleware(config));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogging);

// Health check route (before rate limiting for monitoring)
app.use('/api/health', healthRoutes);

// API routes
app.use('/api/conversations', conversationRoutes);
app.use('/api/summaries', summaryRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Research Assistant API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      conversations: '/api/conversations',
      summaries: '/api/summaries'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Validate required environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    if (!process.env.GRAPH_API_BASE) {
      logger.warn('GRAPH_API_BASE not set, using default: http://localhost:8000');
    }

    const server = app.listen(config.port, config.host, () => {
      logger.info('Assistant service started successfully', {
        port: config.port,
        host: config.host,
        corsOrigin: config.corsOrigin,
        graphApiBase: config.graphApiBase,
        logLevel: config.logLevel
      });
      
      console.log(`🚀 Assistant service running on http://${config.host}:${config.port}`);
      console.log(`📊 Health check: http://${config.host}:${config.port}/api/health`);
      console.log(`💬 Conversations: http://${config.host}:${config.port}/api/conversations`);
      console.log(`📋 Summaries: http://${config.host}:${config.port}/api/summaries`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
