import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from '@routes/auth';
import loyaltyRoutes from '@routes/loyalty';
import nftRoutes from '@routes/nft';
import arRoutes from '@routes/ar';
import analyticsRoutes from '@routes/analytics';
import { errorHandler } from '@middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/ar', arRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static files from the client build directory
app.use(express.static(path.join(__dirname, '../../dist/client')));

// Serve index.html for any non-API routes (client-side routing)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../../dist/client/index.html'));
  }
});

// Error handling
app.use(errorHandler);

export default app;
