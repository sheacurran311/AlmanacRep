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
import campaignRoutes from './routes/campaigns.js';
import customerRoutes from './routes/customers.js';
import { errorHandler } from './middleware/errorHandler.js';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Basic middleware
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced security headers with WebSocket support
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "ws:",
        "wss:",
        "http:",
        "https:",
        process.env.NODE_ENV === 'development' ? [
          'ws://localhost:*',
          'wss://localhost:*',
          'http://localhost:*',
          'https://localhost:*',
          'ws://0.0.0.0:*',
          'wss://0.0.0.0:*',
          'http://0.0.0.0:*',
          'https://0.0.0.0:*'
        ] : []
      ].flat(),
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "data:", "https:"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enhanced CORS configuration with WebSocket support
const corsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'https://localhost:5173',
      'http://localhost:5000',
      'https://localhost:5000',
      'http://localhost:3001',
      'https://localhost:3001',
      'http://0.0.0.0:5173',
      'https://0.0.0.0:5173',
      'http://0.0.0.0:5000',
      'https://0.0.0.0:5000',
      'http://0.0.0.0:3001',
      'https://0.0.0.0:3001',
      'ws://localhost:5173',
      'wss://localhost:5173',
      'ws://0.0.0.0:5173',
      'wss://0.0.0.0:5173'
    ];

    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      const replitDomain = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
      allowedOrigins.push(replitDomain);
    }

    const isAllowed = allowedOrigins.some(allowedOrigin => 
      origin.startsWith(allowedOrigin) || allowedOrigin.startsWith(origin)
    );
    
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-tenant-id'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
};

app.use(cors(corsOptions));

// Create WebSocket server with enhanced error handling and reconnection
const wss = new WebSocketServer({ 
  server,
  clientTracking: true,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
});

// Implement WebSocket heartbeat mechanism
const heartbeatInterval = 30000;
const connectionTimeout = 120000;

setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive === false) {
      console.log('[WebSocket] Terminating inactive connection');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, heartbeatInterval);

// WebSocket connection handler with enhanced error recovery
wss.on('connection', (ws: any, _req: any) => {
  console.log(`[${new Date().toISOString()}] [WebSocket] New client connected`);
  
  ws.isAlive = true;
  ws.connectionTime = Date.now();

  // Set connection timeout
  ws.connectionTimeout = setTimeout(() => {
    if (ws.readyState === ws.OPEN) {
      console.log('[WebSocket] Connection timeout, closing...');
      ws.close();
    }
  }, connectionTimeout);

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('error', (err: Error) => {
    console.error(`[${new Date().toISOString()}] [WebSocket] Client error:`, err);
  });

  ws.on('close', () => {
    clearTimeout(ws.connectionTimeout);
    console.log(`[${new Date().toISOString()}] [WebSocket] Client disconnected`);
  });

  // Send initial connection success message
  ws.send(JSON.stringify({
    type: 'connection',
    status: 'connected',
    timestamp: new Date().toISOString()
  }));
});

// WebSocket upgrade handling with enhanced CORS support
server.on('upgrade', (request, socket, head) => {
  const origin = request.headers.origin;
  if (origin && corsOptions.origin) {
    corsOptions.origin(origin, (err, allowed) => {
      if (err || !allowed) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }
      
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/ar', arRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/customers', customerRoutes);

// Enhanced health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    websocketClients: wss.clients.size,
    uptime: process.uptime()
  });
});

// Static files and routing handler
if (process.env.NODE_ENV === 'development') {
  app.get('*', (_req, res) => {
    res.redirect(`http://localhost:${process.env.VITE_DEV_PORT || 5173}`);
  });
} else {
  app.use(express.static(path.join(__dirname, '../../dist/client')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/client/index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

export { app, server };
export default app;
