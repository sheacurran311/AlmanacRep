import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import authRoutes from './routes/auth.js';
import loyaltyRoutes from './routes/loyalty.js';
import nftRoutes from './routes/nft.js';
import arRoutes from './routes/ar.js';
import analyticsRoutes from './routes/analytics.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Basic middleware
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers with proper CSP for development
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration with WebSocket support
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-tenant-id'],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/ar', arRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static files
const clientPath = path.join(__dirname, '../../dist/client');
app.use(express.static(clientPath));

// Handle client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Error handling
app.use(errorHandler);

export { app, server };
export default app;
