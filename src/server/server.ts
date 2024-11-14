import { server } from './app.js';
import { initializeDatabase } from '../config/initDb.js';
import { DatabaseManager } from '../config/database.js';
import { constants } from '../config/constants.js';

const startServer = async () => {
  try {
    console.log(`[${new Date().toISOString()}] [SERVER] Starting server initialization...`);

    // Get ports from environment variables
    const API_PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

    // Enhanced server startup with proper error handling
    server.listen(API_PORT, '0.0.0.0', () => {
      console.log(`[${new Date().toISOString()}] [SERVER] Server is running on port ${API_PORT}`);
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] [SERVER] Fatal error:`, error);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error(`[${new Date().toISOString()}] [SERVER] Fatal error:`, error);
  process.exit(1);
});
