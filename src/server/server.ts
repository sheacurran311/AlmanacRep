import { server } from './app.js';
import { initializeDatabase } from '../config/initDb.js';
import { DatabaseManager } from '../config/database.js';
import { PortManager } from '../utils/portManager.js';

const startServer = async () => {
  try {
    console.log(`[${new Date().toISOString()}] [SERVER] Starting server initialization...`);

    // Initialize database first
    await initializeDatabase();
    await DatabaseManager.initialize();

    // Setup ports with fallback mechanism
    const { apiPort } = await PortManager.setupPorts();

    // Enhanced server startup with proper error handling
    const httpServer = server.listen(apiPort, '0.0.0.0', () => {
      console.log(`[${new Date().toISOString()}] [SERVER] Server is running on port ${apiPort}`);
    });

    // Handle server errors
    httpServer.on('error', (error: Error) => {
      console.error(`[${new Date().toISOString()}] [SERVER] Server error:`, error);
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log(`[${new Date().toISOString()}] [SERVER] Shutting down gracefully...`);
      await DatabaseManager.close();
      httpServer.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] [SERVER] Fatal error:`, error);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error(`[${new Date().toISOString()}] [SERVER] Fatal error:`, error);
  process.exit(1);
});
