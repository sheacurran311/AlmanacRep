import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import loyaltyRoutes from './routes/loyalty.js';
import nftRoutes from './routes/nft.js';
import arRoutes from './routes/ar.js';
import analyticsRoutes from './routes/analytics.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers with proper CSP for Replit
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "wss://*.repl.co", "https://*.repl.co"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const isReplit = Boolean(process.env.REPL_SLUG && process.env.REPL_OWNER);
const replitDomain = isReplit 
  ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  : undefined;

const allowedOrigins = ['http://localhost:3000', 'http://localhost:5000'];

if (replitDomain) {
  allowedOrigins.push(
    `https://${replitDomain}`,
    `wss://${replitDomain}`,
    `https://${replitDomain}:443`,
    `https://${replitDomain}:3000`,
    `https://${replitDomain}:5000`
  );
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Origin not allowed:', origin);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-tenant-id']
}));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/ar', arRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static files from the client build directory
const clientPath = path.join(__dirname, '../../dist/client');
app.use(express.static(clientPath));

// Handle client-side routing - serve index.html for all unmatched routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Error handling
app.use(errorHandler);

export default app;
