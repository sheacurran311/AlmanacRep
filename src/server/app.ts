import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import { WebSocketServer } from 'ws';
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

// CORS configuration
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-tenant-id'],
  credentials: true
};

app.use(cors(corsOptions));

// WebSocket server setup with enhanced configuration
const wss = new WebSocketServer({ 
  server,
  path: '/_hmr',
  perMessageDeflate: false,
  clientTracking: true,
  handleProtocols: (protocols) => {
    if (protocols.includes('vite-hmr')) return 'vite-hmr';
    return '';
  }
});

// Enhanced WebSocket error handling
wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected from:', req.socket.remoteAddress);
  
  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
    }
  }, 30000);

  ws.on('pong', () => {
    // Client responded to ping
    ws.isAlive = true;
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      ws.send(JSON.stringify({ type: 'connected' }));
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    clearInterval(pingInterval);
    console.log('WebSocket client disconnected');
  });
});

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
