import cors from "cors";
import { ServerConfig } from "../../types/api";

export const createCorsMiddleware = (config: ServerConfig) => {
  // Allow multiple origins for different frontend ports
  const allowedOrigins = [
    "http://localhost:3000", // Main frontend
    "http://localhost:3003", // Professor frontend
    config.corsOrigin,
  ].filter((origin, index, self) => self.indexOf(origin) === index); // Remove duplicates

  return cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Session-ID"],
    optionsSuccessStatus: 200,
  });
};
