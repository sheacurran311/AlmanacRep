import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import authRoutes from '../routes/auth.js';
import healthRoutes from '../routes/healthRoutes.js';
import loyaltyRoutes from './routes/loyalty.js';
import nftRoutes from './routes/nft.js';
import arRoutes from './routes/ar.js';
import analyticsRoutes from './routes/analytics.js';
import campaignRoutes from './routes/campaigns.js';
import customerRoutes from './routes/customers.js';
import { errorHandler } from './middleware/errorHandler.js';
import net from 'net';

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
        ...(process.env.NODE_ENV === 'development' ? [
          'ws://localhost:*',
          'wss://localhost:*',
          'http://localhost:*',
          'https://localhost:*',
          'ws://0.0.0.0:*',
          'wss://0.0.0.0:*',
          'http://0.0.0.0:*',
          'https://0.0.0.0:*'
        ] : [])
      ],
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
      allowedOrigins.push(replitDomain.replace('https:', 'wss:'));
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

// Implement WebSocket heartbeat mechanism with enhanced error handling
const heartbeatInterval = 30000;
const connectionTimeout = 120000;

const heartbeat = setInterval(() => {
  wss.clients.forEach((ws: WebSocket & { isAlive?: boolean }) => {
    if (ws.isAlive === false) {
      console.log('[WebSocket] Terminating inactive connection');
      return ws.terminate();
    }
    ws.isAlive = false;
    try {
      ws.ping();
    } catch (error) {
      console.error('[WebSocket] Ping error:', error);
      ws.terminate();
    }
  });
}, heartbeatInterval);

wss.on('close', () => {
  clearInterval(heartbeat);
});

// WebSocket connection handler with enhanced error recovery
wss.on('connection', (ws: WebSocket & { 
  isAlive?: boolean, 
  connectionTime?: number, 
  pingCount?: number, 
  maxPingRetries?: number, 
  connectionTimeout?: NodeJS.Timeout 
}, req: IncomingMessage) => {
  console.log(`[${new Date().toISOString()}] [WebSocket] New client connected from ${req.socket.remoteAddress}`);
  
  ws.isAlive = true;
  ws.connectionTime = Date.now();
  ws.pingCount = 0;
  ws.maxPingRetries = 3;

  // Set connection timeout
  ws.connectionTimeout = setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Connection timeout, closing...');
      ws.close(1000, 'Connection timeout');
    }
  }, connectionTimeout);

  // Enhanced ping/pong handling
  ws.on('pong', () => {
    ws.isAlive = true;
    ws.pingCount = 0;
  });

  ws.on('ping', () => {
    try {
      ws.pong();
    } catch (error) {
      console.error('[WebSocket] Pong error:', error);
    }
  });

  ws.on('error', (err: Error) => {
    console.error(`[${new Date().toISOString()}] [WebSocket] Client error:`, err);
    ws.terminate();
  });

  ws.on('close', (code: number, reason: string) => {
    clearTimeout(ws.connectionTimeout);
    console.log(`[${new Date().toISOString()}] [WebSocket] Client disconnected:`, {
      code,
      reason: reason.toString(),
      duration: Date.now() - (ws.connectionTime || 0)
    });
  });

  // Send initial connection success message with session info
  try {
    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      timestamp: new Date().toISOString(),
      config: {
        heartbeatInterval,
        connectionTimeout
      }
    }));
  } catch (error) {
    console.error('[WebSocket] Error sending welcome message:', error);
  }
});

// Enhanced WebSocket upgrade handling with better error handling
server.on('upgrade', (request: IncomingMessage, socket: net.Socket, head: Buffer) => {
  const origin = request.headers.origin;
  
  if (origin && corsOptions.origin) {
    corsOptions.origin(origin, (err, allowed) => {
      if (err || !allowed) {
        console.error('[WebSocket] Unauthorized upgrade attempt:', {
          origin,
          address: socket.remoteAddress,
          timestamp: new Date().toISOString()
        });
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }
      
      try {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } catch (error) {
        console.error('[WebSocket] Upgrade error:', error);
        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        socket.destroy();
      }
    });
  } else {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
  }
});

// API Routes with health check routes added first
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/ar', arRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/customers', customerRoutes);

// Static files and routing handler should come after API routes
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
