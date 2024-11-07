import { server } from './app.js';
import { initializeDatabase } from '../config/initDb.js';
import { DatabaseManager } from '../config/database.js';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;
const SHUTDOWN_TIMEOUT = 10000;

const startServer = async () => {
  try {
    console.log(`[${new Date().toISOString()}] [SERVER] Starting server initialization...`);
    
    // Get ports from environment variables with fallbacks
    const API_PORT = parseInt(process.env.INTERNAL_PORT || '3001');
    const EXTERNAL_PORT = parseInt(process.env.PORT || '80');
    
    // Log PostgreSQL connection attempt
    console.log(`[${new Date().toISOString()}] [DATABASE] Connecting to PostgreSQL:
      Host: ${process.env.PGHOST}
      Port: ${process.env.PGPORT}
      Database: ${process.env.PGDATABASE}
      User: ${process.env.PGUSER}
    `);

    // Try to connect to database with retries
    let connected = false;
    let retries = 0;

    while (!connected && retries < MAX_RETRIES) {
      try {
        const isConnected = await DatabaseManager.testConnection();
        if (isConnected) {
          connected = true;
          console.log(`[${new Date().toISOString()}] [DATABASE] Connection successful`);
          break;
        }
      } catch (error) {
        retries++;
        console.error(`[${new Date().toISOString()}] [DATABASE] Connection attempt ${retries} failed:`, error);
        if (retries < MAX_RETRIES) {
          console.log(`[${new Date().toISOString()}] [DATABASE] Retrying in ${RETRY_DELAY/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    if (!connected) {
      throw new Error('Failed to connect to database after multiple attempts');
    }

    // Initialize database
    try {
      await initializeDatabase();
      console.log(`[${new Date().toISOString()}] [DATABASE] Initialization completed`);
    } catch (dbError) {
      console.error(`[${new Date().toISOString()}] [DATABASE] Initialization failed:`, dbError);
      throw dbError;
    }

    // Create server promise with proper error handling
    const serverPromise = new Promise((resolve, reject) => {
      let serverStarted = false;
      
      const serverInstance = server.listen(API_PORT, '0.0.0.0', () => {
        serverStarted = true;
        console.log(`[${new Date().toISOString()}] [SERVER] Server is running with configuration:`);
        console.log(`- Internal API port: ${API_PORT}`);
        console.log(`- External port: ${EXTERNAL_PORT}`);
        console.log(`- Environment: ${process.env.NODE_ENV}`);
        console.log(`- Database port: ${process.env.PGPORT}`);
        resolve(serverInstance);
      });

      // Set TCP keepalive
      serverInstance.keepAliveTimeout = 65000;
      serverInstance.headersTimeout = 66000;

      // Handle server errors
      serverInstance.on('error', (error: NodeJS.ErrnoException) => {
        if (!serverStarted) {
          if (error.code === 'EADDRINUSE') {
            console.error(`[${new Date().toISOString()}] [SERVER] Port ${API_PORT} is already in use`);
          } else {
            console.error(`[${new Date().toISOString()}] [SERVER] Failed to start server:`, error);
          }
          reject(error);
        } else {
          console.error(`[${new Date().toISOString()}] [SERVER] Server error:`, error);
        }
      });

      // Graceful shutdown handler
      const shutdown = async () => {
        console.log(`[${new Date().toISOString()}] [SERVER] Shutting down gracefully...`);
        
        // Close server first
        serverInstance.close(() => {
          console.log(`[${new Date().toISOString()}] [SERVER] Server closed`);
        });

        // Close database connections
        try {
          await DatabaseManager.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid()');
          console.log(`[${new Date().toISOString()}] [DATABASE] Active connections terminated`);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] [DATABASE] Error terminating connections:`, error);
        }

        // Force shutdown after timeout
        setTimeout(() => {
          console.error(`[${new Date().toISOString()}] [SERVER] Could not close connections in time, forcing shutdown`);
          process.exit(1);
        }, SHUTDOWN_TIMEOUT);

        process.exit(0);
      };

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    });

    // Wait for server to start with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Server startup timeout')), 30000);
    });

    // Race between server start and timeout
    return await Promise.race([serverPromise, timeoutPromise]);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [SERVER] Failed to start server:`, error);
    throw error;
  }
};

// Start server with error handling
startServer().catch((error) => {
  console.error(`[${new Date().toISOString()}] [SERVER] Fatal error:`, error);
  process.exit(1);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] [SERVER] Uncaught exception:`, error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] [SERVER] Unhandled rejection at:`, promise, 'reason:', reason);
});
