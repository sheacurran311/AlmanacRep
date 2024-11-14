import express from 'express';
import { constants } from './config/constants';

const app = express();
const API_PORT = constants.PORTS.getAPIPort(); // Will now point to the correct internal port

const startServer = async () => {
  try {
    console.log(`[${new Date().toISOString()}] Starting server...`);

    // Log configuration
    console.log(`[${new Date().toISOString()}] Configuration:`, {
      environment: process.env.NODE_ENV,
      apiPort: API_PORT,
      externalPort: constants.PORTS.getExternalPort(),
      timestamp: new Date().toISOString(),
    });

    app.listen(API_PORT, '0.0.0.0', () => {
      console.log(`[${new Date().toISOString()}] Server is running on port ${API_PORT}`);
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error starting server:`, error);
    process.exit(1);
  }
};

// Start the server
startServer();