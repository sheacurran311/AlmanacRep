import { server } from './app.js';
import { initializeDatabase } from '../config/initDb.js';
import { DatabaseManager } from '../config/database.js';
import { constants } from '../config/constants.js';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;
const SHUTDOWN_TIMEOUT = 10000;

const startServer = async () => {
  try {
    console.log(`[${new Date().toISOString()}] [SERVER] Starting server initialization...`);
    
    // Get ports from environment variables with enhanced validation
    const API_PORT = constants.INTERNAL_PORT;
    const EXTERNAL_PORT = constants.EXTERNAL_PORT;
    const DB_PORT = constants.DATABASE.PORT;
    
    // Enhanced configuration logging
    console.log(`[${new Date().toISOString()}] [SERVER] Configuration:`, {
      environment: process.env.NODE_ENV,
      internalPort: API_PORT,
      externalPort: EXTERNAL_PORT,
      dbPort: DB_PORT,
      host: '0.0.0.0',
      timestamp: new Date().toISOString()
    });

    // Enhanced database connection logging
    console.log(`[${new Date().toISOString()}] [DATABASE] Connecting to PostgreSQL:`, {
      host: process.env.PGHOST,
      port: DB_PORT,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      timestamp: new Date().toISOString()
    });

    // Try to connect to database with enhanced retry mechanism
    let connected = false;
    let retries = 0;

    while (!connected && retries < MAX_RETRIES) {
      try {
        const isConnected = await DatabaseManager.testConnection();
        if (isConnected) {
          connected = true;
          console.log(`[${new Date().toISOString()}] [DATABASE] Connection successful`, {
            retryAttempts: retries,
            timestamp: new Date().toISOString()
          });
          break;
        }
      } catch (error) {
        retries++;
        console.error(`[${new Date().toISOString()}] [DATABASE] Connection attempt ${retries} failed:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        if (retries < MAX_RETRIES) {
          console.log(`[${new Date().toISOString()}] [DATABASE] Retrying in ${RETRY_DELAY/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    if (!connected) {
      throw new Error('Failed to connect to database after multiple attempts');
    }

    // Initialize database with enhanced error handling
    try {
      await initializeDatabase();
      console.log(`[${new Date().toISOString()}] [DATABASE] Initialization completed`);
    } catch (dbError) {
      console.error(`[${new Date().toISOString()}] [DATABASE] Initialization failed:`, {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw dbError;
    }

    // Enhanced server startup with proper error handling
    const serverPromise = new Promise((resolve, reject) => {
      let serverStarted = false;
      
      const serverInstance = server.listen(API_PORT, '0.0.0.0', () => {
        serverStarted = true;
        console.log(`[${new Date().toISOString()}] [SERVER] Server is running:`, {
          internalPort: API_PORT,
          externalPort: EXTERNAL_PORT,
          environment: process.env.NODE_ENV,
          dbPort: DB_PORT,
          timestamp: new Date().toISOString()
        });
        resolve(serverInstance);
      });

      // Configure keep-alive settings
      serverInstance.keepAliveTimeout = 65000;
      serverInstance.headersTimeout = 66000;

      // Enhanced error handling for server
      serverInstance.on('error', (error: NodeJS.ErrnoException) => {
        const errorDetails = {
          code: error.code,
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        };

        if (!serverStarted) {
          if (error.code === 'EADDRINUSE') {
            console.error(`[${new Date().toISOString()}] [SERVER] Port ${API_PORT} is already in use`, errorDetails);
          } else {
            console.error(`[${new Date().toISOString()}] [SERVER] Failed to start server:`, errorDetails);
          }
          reject(error);
        } else {
          console.error(`[${new Date().toISOString()}] [SERVER] Server error:`, errorDetails);
        }
      });

      // Enhanced shutdown handler with proper cleanup
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
          console.error(`[${new Date().toISOString()}] [DATABASE] Error terminating connections:`, {
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          });
        }

        // Force shutdown after timeout
        setTimeout(() => {
          console.error(`[${new Date().toISOString()}] [SERVER] Could not close connections in time, forcing shutdown`);
          process.exit(1);
        }, SHUTDOWN_TIMEOUT);

        process.exit(0);
      };

      // Register shutdown handlers
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
    console.error(`[${new Date().toISOString()}] [SERVER] Fatal error:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// Start server with enhanced error handling
startServer().catch((error) => {
  console.error(`[${new Date().toISOString()}] [SERVER] Fatal error:`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

// Enhanced uncaught error handlers
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] [SERVER] Uncaught exception:`, {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] [SERVER] Unhandled rejection at:`, {
    promise,
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    timestamp: new Date().toISOString()
  });
});
