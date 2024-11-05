import { server } from './app.js';
import { initializeDatabase } from '../config/initDb.js';
import { DatabaseManager } from '../config/database.js';

const startServer = async () => {
  try {
    console.log(`[${new Date().toISOString()}] [SERVER] Starting server initialization...`);
    
    // Test database connection first
    try {
      await DatabaseManager.query('SELECT NOW()');
      console.log(`[${new Date().toISOString()}] [DATABASE] Connection successful`);
    } catch (dbError) {
      console.error(`[${new Date().toISOString()}] [DATABASE] Connection failed:`, dbError);
      process.exit(1);
    }

    // Initialize database
    try {
      await initializeDatabase();
      console.log(`[${new Date().toISOString()}] [DATABASE] Initialization completed`);
    } catch (dbError) {
      console.error(`[${new Date().toISOString()}] [DATABASE] Initialization failed:`, dbError);
      process.exit(1);
    }

    const port = 3000;

    // Start server
    server.listen(port, '0.0.0.0', () => {
      console.log(`[${new Date().toISOString()}] [SERVER] Server is running at http://0.0.0.0:${port}`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[${new Date().toISOString()}] [SERVER] Port ${port} is already in use`);
        // Try to close any existing connections
        server.close(() => {
          console.log(`[${new Date().toISOString()}] [SERVER] Closed existing connections`);
          // Retry after a short delay
          setTimeout(() => {
            server.listen(port, '0.0.0.0');
          }, 1000);
        });
      } else {
        console.error(`[${new Date().toISOString()}] [SERVER] Error:`, error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] [SERVER] Failed to start server:`, error);
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] [EXCEPTION] Uncaught Exception:`, error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(`[${new Date().toISOString()}] [REJECTION] Unhandled Rejection:`, reason);
  process.exit(1);
});

startServer();
