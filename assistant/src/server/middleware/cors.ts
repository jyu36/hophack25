import cors from 'cors';
import { ServerConfig } from '../../types/api';

export const createCorsMiddleware = (config: ServerConfig) => {
  return cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
    optionsSuccessStatus: 200
  });
};
