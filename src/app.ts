import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import loyaltyRoutes from './routes/loyalty';
import nftRoutes from './routes/nft';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/nft', nftRoutes);

// Error handling
app.use(errorHandler);

export default app;
