import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import loyaltyRoutes from './routes/loyalty';
import nftRoutes from './routes/nft';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/nft', nftRoutes);

// Serve static files only for non-API routes
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) {
    express.static('public')(req, res, next);
  } else {
    next();
  }
});

// Error handling
app.use(errorHandler);

export default app;
